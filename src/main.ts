import { MarkdownRenderChild, Plugin, PluginSettingTab, Setting, Notice, type SettingDefinitionItem } from 'obsidian';
import { codeBlocks, parse, specialLanguages, wrapSelection } from './markup';
import { decorateCode, renderCode } from './render';
import { emphasisField } from './editor';
import { t } from './i18n';

const DEFAULT_COLOR = '#e5b94f';
interface Settings { color: string }
export default class CodeEmphasis extends Plugin {
  settings: Settings = { color: DEFAULT_COLOR };
  private styledDocuments = new Set<Document>();
  private renderedBlocks = new Set<MarkdownRenderChild>();
  async onload(): Promise<void> {
    const saved: unknown = await this.loadData();
    if (saved && typeof saved === 'object' && 'color' in saved && typeof saved.color === 'string' && /^#[\da-f]{6}$/i.test(saved.color)) this.settings.color = saved.color;
    this.applyStyle(document);
    this.registerEvent(this.app.workspace.on('window-open', win => this.applyStyle(win.doc)));
    this.register(() => { this.styledDocuments.forEach(doc => doc.body.setCssProps({ '--code-emphasis-color': '' })); this.styledDocuments.clear(); });
    this.register(() => { for (const child of this.renderedBlocks) child.unload(); this.renderedBlocks.clear(); });
    this.addSettingTab(new EmphasisSettings(this));
    this.registerEditorExtension(emphasisField);
    this.addCommand({
      id: 'highlight-selection', name: t('command'),
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
        if (!button) button = pre.createEl('button', { cls: 'copy-code-button', text: t('copy') });
        button.setAttribute('aria-label', t('copy'));
        child.registerDomEvent(button, 'click', event => {
          event.preventDefault(); event.stopImmediatePropagation();
          void code.ownerDocument.defaultView?.navigator.clipboard.writeText(clean).then(() => {
            new Notice(t('copied'));
          }).catch(() => { new Notice(t('copyFailed')); });
        }, { capture: true });
      }
    }, 100);
  }
  applyStyle(doc: Document): void {
    this.styledDocuments.add(doc);
    doc.body.setCssProps({ '--code-emphasis-color': this.settings.color });
  }
  async setColor(color: string): Promise<void> {
    this.settings.color = /^#[\da-f]{6}$/i.test(color) ? color : DEFAULT_COLOR;
    this.styledDocuments.forEach(doc => this.applyStyle(doc));
    await this.saveData(this.settings);
  }
}
class EmphasisSettings extends PluginSettingTab {
  constructor(private plugin: CodeEmphasis) { super(plugin.app, plugin); }
  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      { name: t('color'), desc: t('colorDescription'), render: setting => { this.renderColor(setting); } },
      { name: t('preview'), render: setting => { this.renderPreview(setting.settingEl); } },
    ];
  }
  private renderColor(setting: Setting): void {
    setting
      .addColorPicker(picker => picker.setValue(this.plugin.settings.color).onChange(async value => { await this.plugin.setColor(value); }))
      .addButton(button => button.setButtonText(t('reset')).onClick(async () => {
        await this.plugin.setColor(DEFAULT_COLOR);
        this.update();
      }));
  }
  private renderPreview(container: HTMLElement): void {
    const preview = container.createEl('pre', { cls: 'code-emphasis-preview' }).createEl('code');
    preview.createSpan({ cls: 'code-emphasis-mark', text: t('example') }); preview.appendText('\n');
    preview.createSpan({ cls: 'code-emphasis-mark', text: 'Start()' }); preview.appendText(';');
  }
}
