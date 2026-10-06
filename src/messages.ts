const en = {
  command: 'Highlight selected text', color: 'Highlight color',
  colorDescription: 'One background color for all highlighted code and comments.',
  reset: 'Restore default', preview: 'Preview', example: '// Your note',
  copy: 'Copy code', copied: 'Copied', copyFailed: 'Could not copy code',
};
const zh: typeof en = {
  command: '高亮所选文本', color: '高亮颜色', colorDescription: '所有高亮代码和注释使用同一种背景颜色。',
  reset: '恢复默认', preview: '预览', example: '// 你的注释',
  copy: '复制代码', copied: '已复制', copyFailed: '无法复制代码',
};
export function messageFor(language: string, key: keyof typeof en): string { return (language.startsWith('zh') ? zh : en)[key]; }
