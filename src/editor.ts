import { StateField, type EditorState } from '@codemirror/state';
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view';
import { editorLivePreviewField } from 'obsidian';
import { codeBlocks, parse } from './markup';

export const emphasisField = StateField.define<DecorationSet>({
  create: state => decorate(state),
  update: (value, transaction) => transaction.docChanged || transaction.reconfigured || transaction.startState.field(editorLivePreviewField, false) !== transaction.state.field(editorLivePreviewField, false) ? decorate(transaction.state) : value,
  provide: field => EditorView.decorations.from(field),
});
function decorate(state: EditorState): DecorationSet {
  if (!state.field(editorLivePreviewField, false)) return Decoration.none;
  const text = state.doc.toString();
  const ranges = codeBlocks(text).flatMap(block => parse(text.slice(block.from, block.to)).sourceHighlights.map(s =>
    Decoration.mark({ class: 'code-emphasis-mark' }).range(block.from + s.from, block.from + s.to)));
  return Decoration.set(ranges, true);
}
