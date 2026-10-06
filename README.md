# Code Emphasis

[中文说明](#中文说明)

A small Obsidian plugin for highlighting fragments of code with `^^text^^`.
Code and personal comments share one style. No HTML, annotation types, or language detection.

## Usage

````markdown
```c
^^// Initialize before starting^^
if (^^status^^ == READY) {
    ^^Start()^^;
}
```
````

Select text inside one ordinary fenced code block, then run **Code Emphasis: Highlight selected text** from the command palette. Bind your own hotkey in Obsidian settings if desired.

- The command only wraps the selection; it does not toggle or interpret existing markers.
- A multiline selection wraps each nonblank line separately. Whitespace and empty lines are retained.
- No selection, selections outside a fence, and selections spanning fences do nothing.
- Edit delimiters directly to remove highlighting, or use normal Undo after the command.
- Markers pair left to right on each line. Multiple fragments are supported; nesting is not.
- Unclosed markers and empty pairs (`^^^^`) remain literal.
- Backslashes are always ordinary code characters, never escapes: `\^^fff^^` highlights only `fff` and copies as `\fff`. Paired literal `^^` on one line are interpreted as markup; there is no escape syntax.

## Views and copying

| View | Behavior |
| --- | --- |
| Source mode | Editable literal markers |
| Live Preview | Editable markers, with highlighted contents |
| Reading view | Markers hidden, highlighted contents |
| Reading view Copy code button | Copies content without valid markers; preserves comments, indentation and line breaks |
| Normal editor copy | Copies exactly the selected source, including markers |

The original fence language stays unchanged. Unmarked text keeps its syntax colors; marked text uses the configured font color, or retains its original color when the font override is off. The plugin does not classify comments or attempt to make code compilable.

Ordinary fenced blocks are processed automatically. Special blocks (Mermaid, math, Dataview, Tasks, query, Bases) and legacy `with-html` are excluded. The editor command and Live Preview currently support top-level backtick/tilde fences (up to three leading spaces), not fences nested in lists or blockquotes. Reading view works on ordinary rendered `pre > code` elements.

## Settings

- **Language**: Follow Obsidian (default), 中文, or English. Changes apply immediately to settings, command names and notices. Auto uses Chinese for Chinese locales and English otherwise.
- **Font color**: enabled by default, `#FF0000`. Turn off to preserve original text/syntax colors, not make text invisible.
- **Background color**: off by default. Enable to choose a solid background color.
- Each color toggle can be turned off independently. Chosen colors are remembered while off; both may be off at once. Copying still removes valid markers.
- **Restore defaults** resets language and both color controls. There is no settings preview.

## Breaking change from 1.x

Version 2 uses plugin ID `code-emphasis` and name **Code Emphasis**. The GitHub repository remains the same. Disable/uninstall the old `obsidian-codeblock-with-html` plugin and install this version in `.obsidian/plugins/code-emphasis/`.

There is no legacy HTML renderer or automatic migration. Existing notes are never rewritten automatically. Replace old `<font>` tags with `^^` and change `with-html` fences to a normal language yourself. Back up notes before manual conversion.

## Install and develop

For manual installation, copy `main.js`, `manifest.json`, and `styles.css` into your vault's `.obsidian/plugins/code-emphasis/` directory, then enable Code Emphasis.

Development requires Node.js 22.13+ (or Node.js 24):

```sh
npm ci
npm run check
npm run dev
```

`npm run check` runs official Obsidian ESLint rules, parser/DOM tests, TypeScript checks, production build, and release-file validation. Build configuration and the dependency lockfile live at the repository root. Compiled `main.js` is intentionally ignored by Git.

Push a numeric tag matching `manifest.json` (for example `2.0.0`) to run the release workflow. It validates versions, creates production assets, generates build provenance and attaches all three installation files to a GitHub Release. A source commit alone does not publish a release or submit a community-directory entry.

Runtime code uses no Node.js/Electron APIs. Desktop Sandbox verification and automated tests are described in `TESTING.md`; mobile-device verification remains a separate step.

## 中文说明

只有一个命令：**高亮所选文本**。选中代码块内的文字后执行，得到 `^^内容^^`。多行选择逐行包裹，空白行跳过；没有选区不操作。不会自动取消或合并高亮，删除标记请直接编辑，误操作可撤销。

代码和注释完全相同，例如 `^^// 注释内容^^`、`^^# 注释内容^^`，无需识别语言或注释符号。普通代码块自动生效，不使用 `with-html`。

源码模式保留标记；实时预览保留标记并高亮内容；阅读模式隐藏标记。阅读模式的“复制代码”去除有效标记，保留注释、缩进和换行。编辑器普通复制仍保留原始文本。

设置提供“跟随 Obsidian（默认）／中文／English”，切换立即生效。字体颜色默认红色 `#FF0000`，背景默认无；两者可独立关闭，并保留已选颜色。字体颜色关闭表示使用原有文字颜色，不是隐藏文字。没有预览，支持恢复默认。

反斜杠始终原样保留，不再用于转义。`\^^fff^^` 只高亮 `fff`，复制得到 `\fff`；成对的字面量 `^^` 会被当作标记，目前不提供转义语法。

新版不兼容旧 HTML 格式，不自动修改旧笔记。插件 ID 已改为 `code-emphasis`，请禁用旧插件后安装新版。

MIT license.
