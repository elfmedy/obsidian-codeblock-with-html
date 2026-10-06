# Code Emphasis

[English](README.md)

在 Obsidian 代码块中标记重点，方便阅读和复习。

![实时预览中的代码高亮](images/live-preview.png)

## 如何高亮

1. 在代码块中选中文字。
2. 打开命令面板，执行 **Code Emphasis：高亮所选文本**。
3. 也可以在 **设置 → 快捷键** 中为命令绑定快捷键。

你也可以手动输入标记：

```text
^^// 必须先初始化^^
if (^^status^^ == READY) {
    ^^Start()^^;
}
```

选择多行时，每个非空行分别添加高亮。取消高亮时，删除两侧的 `^^`；刚添加后也可以直接撤销。

## 显示与复制

- **实时预览：** 平时隐藏标记；光标进入高亮或选区与高亮相交时，只展开对应片段的标记，方便编辑。
- **阅读模式：** 只显示高亮，不显示标记。
- **源码模式：** 始终显示原始标记。
- **复制代码：** 阅读模式的复制按钮去掉标记，保留注释、缩进和反斜杠。编辑器普通复制保留选中的源码。

代码与注释使用同一种样式。反斜杠不转义标记：`\^^fff^^` 显示和复制后都是 `\fff`。高亮不能跨行或嵌套；未闭合的标记按原文显示，成对的字面量 `^^` 会被当作标记。

## 设置

- **界面语言：** 跟随 Obsidian（默认）、中文或 English。
- **字体颜色：** 默认红色。关闭后保留原有文字颜色。
- **背景颜色：** 默认关闭，开启后可选色。

两种颜色可独立关闭。“恢复默认”重置所有设置。

## 安装

需要 **Obsidian 1.13 或更新版本**。

**BRAT：** 添加 `elfmedy/code-emphasis`，然后启用 Code Emphasis。

**手动安装：** 从[最新 Release](https://github.com/elfmedy/code-emphasis/releases/latest) 下载 `main.js`、`manifest.json`、`styles.css`，放入库的 `.obsidian/plugins/code-emphasis/` 目录，然后启用插件。

高亮命令目前支持普通的顶层围栏代码块；Mermaid 等特殊代码块不处理。

[从旧 HTML 插件迁移](docs/MIGRATION.md) · [开发文档](docs/DEVELOPMENT.md) · [MIT 许可证](LICENSE)
