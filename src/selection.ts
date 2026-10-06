import type { Span } from './markup';

/** Includes the delimiters so arrow keys and selections can edit either boundary. */
export function isEditingHighlight(content: Span, selections: readonly Span[]): boolean {
  const start = content.from - 2, end = content.to + 2;
  return selections.some(range => range.from === range.to
    ? range.from >= start && range.from <= end
    : range.from < end && range.to > start);
}
