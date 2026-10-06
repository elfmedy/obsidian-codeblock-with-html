import { StateField, type EditorState } from '@codemirror/state';
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view';
import { editorLivePreviewField } from 'obsidian';
import { codeBlocks, parse } from './markup';
import { isEditingHighlight } from './selection';

export const emphasisField = StateField.define<DecorationSet>({
  create: state => decorate(state),
  update: (value, transaction) => transaction.docChanged || transaction.selection || transaction.reconfigured || transaction.startState.field(editorLivePreviewField, false) !== transaction.state.field(editorLivePreviewField, false) ? decorate(transaction.state) : value,
  provide: field => EditorView.decorations.from(field),
});
function decorate(state: EditorState): DecorationSet {
  if (!state.field(editorLivePreviewField, false)) return Decoration.none;
  const text = state.doc.toString();
  const ranges = codeBlocks(text).flatMap(block => parse(text.slice(block.from, block.to)).sourceHighlights.flatMap(s => {
    const from = block.from + s.from, to = block.from + s.to;
    const mark = Decoration.mark({ class: 'code-emphasis-mark' }).range(from, to);
    if (isEditingHighlight({ from, to }, state.selection.ranges)) return [mark];
    return [
      Decoration.replace({}).range(from - 2, from), mark,
      Decoration.replace({}).range(to, to + 2),
    ];
  }));
  return Decoration.set(ranges, true);
}
