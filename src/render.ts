import { parse, type Span } from './markup';

/** Preserve syntax token elements and never interpret user text as HTML. */
export function renderCode(code: HTMLElement): string {
  const source = code.textContent ?? '', parsed = parse(source);
  decorateCode(code, parsed.sourceHighlights, parsed.hidden);
  return parsed.text;
}

export function decorateCode(code: HTMLElement, highlights: Span[], hidden: Span[] = []): void {
  const doc = code.ownerDocument;
  const walker = doc.createTreeWalker(code, 4), nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  let offset = 0;
  for (const node of nodes) {
    const value = node.data, end = offset + value.length, cuts = new Set([offset, end]);
    for (const s of [...hidden, ...highlights]) {
      if (s.from > offset && s.from < end) cuts.add(s.from);
      if (s.to > offset && s.to < end) cuts.add(s.to);
    }
    const points = [...cuts].sort((a, b) => a - b), fragment = doc.createDocumentFragment();
    for (let i = 0; i + 1 < points.length; i++) {
      const from = points[i], to = points[i + 1];
      if (hidden.some(s => from >= s.from && to <= s.to)) continue;
      const text = doc.createTextNode(value.slice(from - offset, to - offset));
      if (highlights.some(s => from >= s.from && to <= s.to)) {
        const mark = doc.createElement('span');
        mark.className = 'code-emphasis-mark'; mark.append(text); fragment.append(mark);
      } else fragment.append(text);
    }
    node.replaceWith(fragment); offset = end;
  }
}
