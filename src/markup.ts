export interface Span { from: number; to: number }
export interface Parsed { text: string; highlights: Span[]; hidden: Span[]; sourceHighlights: Span[] }

/** UTF-16 offsets match DOM and CodeMirror; pairs never cross a line. */
export function parse(source: string): Parsed {
  const hidden: Span[] = [], sourceHighlights: Span[] = [];
  let start = 0;
  for (const line of source.split('\n')) {
    const delimiters: number[] = [];
    for (let i = 0; i < line.length;) {
      if (line.startsWith('\\^^', i)) {
        hidden.push({ from: start + i, to: start + i + 1 }); i += 3;
      } else if (line.startsWith('^^', i)) {
        delimiters.push(start + i); i += 2;
      } else i++;
    }
    for (let i = 0; i + 1 < delimiters.length; i += 2) {
      const from = delimiters[i], to = delimiters[i + 1];
      if (to === from + 2) continue;
      hidden.push({ from, to: from + 2 }, { from: to, to: to + 2 });
      sourceHighlights.push({ from: from + 2, to });
    }
    start += line.length + 1;
  }
  hidden.sort((a, b) => a.from - b.from);
  const map = (offset: number) => offset - hidden.reduce((n, s) => n + Math.max(0, Math.min(offset, s.to) - s.from), 0);
  let text = '', cursor = 0;
  for (const span of hidden) { text += source.slice(cursor, span.from); cursor = span.to; }
  text += source.slice(cursor);
  return { text, hidden, sourceHighlights, highlights: sourceHighlights.map(s => ({ from: map(s.from), to: map(s.to) })) };
}

export function wrapSelection(text: string): string {
  return text.split(/(\r?\n)/).map(part => part.trim() ? `^^${part}^^` : part).join('');
}

export const specialLanguages = new Set(['mermaid', 'math', 'dataview', 'dataviewjs', 'tasks', 'query', 'base', 'with-html']);
export interface CodeBlock { from: number; to: number; language: string }
/** Ordinary top-level fences; special processors retain ownership. */
export function codeBlocks(text: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  let active: { fence: string; from: number; language: string } | undefined;
  let offset = 0;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (active) {
      const close = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(line);
      if (close && close[1][0] === active.fence[0] && close[1].length >= active.fence.length) {
        if (!specialLanguages.has(active.language)) blocks.push({ from: active.from, to: offset, language: active.language });
        active = undefined;
      }
    } else {
      const open = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
      if (open && !(open[1][0] === '`' && open[2].includes('`'))) {
        active = { fence: open[1], from: offset + raw.length + 1, language: open[2].trim().split(/\s/)[0].toLowerCase() };
      }
    }
    offset += raw.length + 1;
  }
  if (active && !specialLanguages.has(active.language)) blocks.push({ from: active.from, to: text.length, language: active.language });
  return blocks;
}
