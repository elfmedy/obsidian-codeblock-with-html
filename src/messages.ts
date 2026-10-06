const en = {
  command: 'Highlight selected text', language: 'Language', auto: 'Follow Obsidian',
  fontColor: 'Font color', backgroundColor: 'Background color', customColor: 'Custom color',
  fontDescription: 'Turn off to keep the original text colors.',
  backgroundDescription: 'Turn off for no background. Your chosen color is remembered.',
  reset: 'Restore defaults', resetDescription: 'Follow Obsidian, red text, no background.',
  copy: 'Copy code', copied: 'Copied', copyFailed: 'Could not copy code',
};
const zh: typeof en = {
  command: '高亮所选文本', language: '界面语言', auto: '跟随 Obsidian',
  fontColor: '字体颜色', backgroundColor: '背景颜色', customColor: '自定义颜色',
  fontDescription: '关闭表示无自定义字体颜色，保留原有文字颜色。',
  backgroundDescription: '关闭表示无背景色；已选颜色会保留。',
  reset: '恢复默认', resetDescription: '跟随 Obsidian、红色字体、无背景色。',
  copy: '复制代码', copied: '已复制', copyFailed: '无法复制代码',
};
export function messageFor(language: string, key: keyof typeof en): string { return (language.startsWith('zh') ? zh : en)[key]; }
