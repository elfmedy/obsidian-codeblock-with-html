import { MarkdownRenderChild, Plugin, PluginSettingTab, Setting, Notice, type Command, type SettingDefinitionItem } from 'obsidian';
import { codeBlocks, parse, specialLanguages, wrapSelection } from './markup';
import { decorateCode, renderCode } from './render';
import { emphasisField } from './editor';
import { t } from './i18n';

import { defaults, readSettings, type Settings, type Language } from './settings';
export default class CodeEmphasis extends Plugin {
  settings: Settings = { ...defaults };
  private highlightCommand?: Command;
  private copyButtons = new Map<HTMLButtonElement, boolean>();
  text(key: Parameters<typeof t>[1]): string { return t(this.settings.language, key); }
  private styledDocuments = new Set<Document>();
  private renderedBlocks = new Set<MarkdownRenderChild>();
  async onload(): Promise<void> {
    this.settings = readSettings(await this.loadData());
    this.applyStyle(document);
    this.registerEvent(this.app.workspace.on('window-open', win => this.applyStyle(win.doc)));
    this.register(() => { this.styledDocuments.forEach(doc => { doc.body.removeClass('code-emphasis-font', 'code-emphasis-background'); doc.body.setCssProps({ '--code-emphasis-font-color': '', '--code-emphasis-background-color': '' }); }); this.styledDocuments.clear(); });
    this.register(() => { for (const child of this.renderedBlocks) child.unload(); this.renderedBlocks.clear(); });
    this.addSettingTab(new EmphasisSettings(this));
    this.registerEditorExtension(emphasisField);
    this.highlightCommand = this.addCommand({
      id: 'highlight-selection', name: this.text('command'),
      editorCheckCallback: (checking, editor) => {
        const selection = editor.getSelection();
        const from = editor.posToOffset(editor.getCursor('from')), to = editor.posToOffset(editor.getCursor('to'));
        const valid = selection.trim().length > 0 && codeBlocks(editor.getValue()).some(b => from >= b.from && to <= b.to);
        if (valid && !checking) editor.replaceSelection(wrapSelection(selection));
        return valid;
      },
    });
    this.registerMarkdownPostProcessor((el, ctx) => {
      for (const code of Array.from(el.querySelectorAll<HTMLElement>('pre > code'))) {
        const language = Array.from(code.classList).find(c => c.startsWith('language-'))?.slice(9).toLowerCase() ?? '';
        if (specialLanguages.has(language) || !code.textContent?.includes('^^') || code.dataset.codeEmphasis) continue;
        const pre = code.parentElement;
        if (!pre) continue;
        code.dataset.codeEmphasis = 'true'; this.applyStyle(code.ownerDocument);
        const source = code.textContent;
        const parsed = parse(source);
        const clean = renderCode(code), child = new MarkdownRenderChild(pre);
        ctx.addChild(child);
        // Obsidian may finish asynchronous syntax highlighting after postprocessing.
        // Reapply clean-text ranges if the host replaces our spans; never parse twice.
        const observer = new MutationObserver(() => {
          if (code.textContent === clean && parsed.highlights.length && !code.querySelector('.code-emphasis-mark')) {
            decorateCode(code, parsed.highlights);
          }
        });
        observer.observe(code, { childList: true, subtree: true });
        this.renderedBlocks.add(child);
        child.register(() => {
          observer.disconnect(); this.renderedBlocks.delete(child);
          delete code.dataset.codeEmphasis;
          code.setText(source);
        });
        let button = pre.querySelector<HTMLButtonElement>('button.copy-code-button');
        const ownButton = !button;
        if (!button) button = pre.createEl('button', { cls: 'copy-code-button', text: this.text('copy') });
        button.setAttribute('aria-label', this.text('copy'));
        this.copyButtons.set(button, ownButton);
        const copyButton = button;
        child.register(() => this.copyButtons.delete(copyButton));
        child.registerDomEvent(button, 'click', event => {
          event.preventDefault(); event.stopImmediatePropagation();
          void code.ownerDocument.defaultView?.navigator.clipboard.writeText(clean).then(() => {
            new Notice(this.text('copied'));
          }).catch(() => { new Notice(this.text('copyFailed')); });
        }, { capture: true });
      }
    }, 100);
  }
  applyStyle(doc: Document): void {
    this.styledDocuments.add(doc);
    doc.body.toggleClass('code-emphasis-font', this.settings.fontEnabled);
    doc.body.toggleClass('code-emphasis-background', this.settings.backgroundEnabled);
    doc.body.setCssProps({ '--code-emphasis-font-color': this.settings.fontColor, '--code-emphasis-background-color': this.settings.backgroundColor });
  }
  async saveSettings(patch: Partial<Settings>): Promise<void> {
    this.settings = readSettings({ ...this.settings, ...patch });
    this.styledDocuments.forEach(doc => this.applyStyle(doc));
    if (this.highlightCommand) this.highlightCommand.name = `${this.manifest.name}: ${this.text('command')}`;
    this.copyButtons.forEach((own, button) => {
      button.setAttribute('aria-label', this.text('copy'));
      if (own) button.setText(this.text('copy'));
    });
    await this.saveData(this.settings);
  }
}
class EmphasisSettings extends PluginSettingTab {
  constructor(private plugin: CodeEmphasis) { super(plugin.app, plugin); }
  getSettingDefinitions(): SettingDefinitionItem[] {
    const text = (key: Parameters<typeof t>[1]) => this.plugin.text(key);
    return [
      { name: text('language'), render: setting => {
        setting.addDropdown(dropdown => dropdown.addOptions({ auto: text('auto'), zh: '中文', en: 'English' })
          .setValue(this.plugin.settings.language).onChange(async value => {
            await this.plugin.saveSettings({ language: value as Language }); this.update();
          }));
      } },
      { name: text('fontColor'), desc: text('fontDescription'), render: setting => { this.renderColor(setting, 'font'); } },
      { name: text('backgroundColor'), desc: text('backgroundDescription'), render: setting => { this.renderColor(setting, 'background'); } },
      { name: text('reset'), desc: text('resetDescription'), render: setting => {
        setting.addButton(button => button.setButtonText(text('reset')).onClick(async () => {
          await this.plugin.saveSettings({ ...defaults }); this.update();
        }));
      } },
    ];
  }
  private renderColor(setting: Setting, kind: 'font' | 'background'): void {
    const enabledKey = kind === 'font' ? 'fontEnabled' : 'backgroundEnabled';
    const colorKey = kind === 'font' ? 'fontColor' : 'backgroundColor';
    setting.addToggle(toggle => {
      toggle.setTooltip(this.plugin.text('customColor')).setValue(this.plugin.settings[enabledKey]).onChange(async value => {
        await this.plugin.saveSettings({ [enabledKey]: value }); this.update();
      });
    }).addColorPicker(picker => {
      picker.setValue(this.plugin.settings[colorKey]).setDisabled(!this.plugin.settings[enabledKey]).onChange(async color => {
        await this.plugin.saveSettings({ [colorKey]: color });
      });
    });
  }
}
