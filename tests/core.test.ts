import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { parse, codeBlocks, wrapSelection } from '../src/markup';
import { decorateCode, renderCode } from '../src/render';
import { messageFor } from '../src/messages';
import { defaults, readSettings, resolveLanguage } from '../src/settings';
import { isEditingHighlight } from '../src/selection';
test('Live Preview reveals only fragments intersecting a cursor or selection', () => {
  const first = { from: 12, to: 15 }, second = { from: 22, to: 25 };
  assert.equal(isEditingHighlight(first, [{ from: 0, to: 0 }]), false);
  for (const pos of [10, 11, 12, 14, 15, 16, 17]) assert.equal(isEditingHighlight(first, [{ from: pos, to: pos }]), true);
  assert.equal(isEditingHighlight(second, [{ from: 13, to: 13 }]), false);
  assert.equal(isEditingHighlight(first, [{ from: 0, to: 10 }]), false);
  assert.equal(isEditingHighlight(first, [{ from: 0, to: 11 }]), true);
  assert.equal(isEditingHighlight(first, [{ from: 17, to: 30 }]), false);
  assert.equal(isEditingHighlight(second, [{ from: 13, to: 23 }]), true);
  assert.equal(isEditingHighlight(second, [{ from: 0, to: 0 }, { from: 24, to: 24 }]), true);
});
test('Chinese locales follow Obsidian; other locales fall back to English', () => {
  assert.equal(messageFor('zh', 'command'), '高亮所选文本');
  assert.equal(messageFor('zh-TW', 'fontColor'), '字体颜色');
  assert.equal(messageFor('en', 'command'), 'Highlight selected text');
  assert.equal(messageFor('de', 'reset'), 'Restore defaults');
});
test('language override and defaults are independent of the host locale', () => {
  assert.equal(resolveLanguage('auto', 'zh'), 'zh');
  assert.equal(resolveLanguage('en', 'zh'), 'en');
  assert.equal(resolveLanguage('zh', 'en'), 'zh');
  assert.deepEqual(readSettings(undefined), defaults);
  assert.equal(defaults.fontColor, '#ff0000');
  assert.equal(defaults.fontEnabled, true);
  assert.equal(defaults.backgroundEnabled, false);
});
test('none preserves chosen colors and settings reject malformed values', () => {
  const saved = { ...defaults, fontEnabled: false, backgroundEnabled: false, fontColor: '#abcdef' };
  assert.deepEqual(readSettings(saved), saved);
  assert.deepEqual(readSettings({ language: 'invalid', fontEnabled: 'false', fontColor: 'red; color: black', backgroundColor: null }), defaults);
  assert.deepEqual(readSettings({ color: '#e5b94f' }), defaults);
});
test('multiple fragments and Unicode offsets', () => {
  const result = parse('调用 ^^状态😀^^ + ^^Start()^^;');
  assert.equal(result.text, '调用 状态😀 + Start();');
  assert.deepEqual(result.highlights.map(s => result.text.slice(s.from, s.to)), ['状态😀', 'Start()']);
});
test('copy preserves comments, whitespace and CRLF', () => {
  assert.equal(parse('  ^^// note^^\r\n\t^^# note^^\r\n\r\n^^Start()^^;').text, '  // note\r\n\t# note\r\n\r\nStart();');
});
test('unclosed and empty pairs remain literal and never cross lines', () => {
  for (const source of ['^^open\nclose^^', '^^^^', '^^']) assert.equal(parse(source).text, source);
  assert.equal(parse('^^one^^ ^^unclosed').text, 'one ^^unclosed');
});
test('backslashes never escape markers or disappear when copying', () => {
  for (const original of ['\\fff', 'C:\\fff', '\\\\fff', '\\fff\\', '\\^^']) {
    const marked = original.replace('fff', wrapSelection('fff'));
    const result = parse(marked);
    assert.equal(result.text, original);
    assert.equal(result.highlights.length, original.includes('fff') ? 1 : 0);
    if (result.highlights.length) assert.equal(result.text.slice(result.highlights[0].from, result.highlights[0].to), 'fff');
  }
});
test('wrap nonblank selected lines without interpreting existing markup', () => {
  assert.equal(wrapSelection('  // note\r\n\t\r\nStart();\r\n'), '^^  // note^^\r\n\t\r\n^^Start();^^\r\n');
  assert.equal(wrapSelection('^^x^^'), '^^^^x^^^^');
});
test('fences exclude special processors and outside text', () => {
  const source = 'outside\n```c\nfoo\n```\n~~~python\nbar\n~~~\n```mermaid\ngraph TD\n```';
  assert.deepEqual(codeBlocks(source).map(b => source.slice(b.from, b.to)), ['foo\n', 'bar\n']);
});
test('long fences contain shorter literal fences', () => {
  const source = '````text\n```\n^^x^^\n````';
  assert.equal(codeBlocks(source).length, 1);
  assert.equal(source.slice(codeBlocks(source)[0].from, codeBlocks(source)[0].to), '```\n^^x^^\n');
});
test('DOM handles split token markers and literal HTML safely', () => {
  const dom = new JSDOM('<pre><code><span class="token">^</span>^a &lt;b&gt;^<span class="token">^</span> + ^^two^^</code></pre>');
  const code = dom.window.document.querySelector('code')!;
  assert.equal(renderCode(code), 'a <b> + two');
  assert.equal(code.textContent, 'a <b> + two');
  assert.equal(code.querySelector('b'), null);
  assert.equal(code.querySelectorAll('.token').length, 2);
  assert.equal([...code.querySelectorAll('.code-emphasis-mark')].map(e => e.textContent).join(''), 'a <b>two');
});
test('reapply clean offsets after asynchronous host syntax highlighting', () => {
  const dom = new JSDOM('<pre><code></code></pre>');
  const code = dom.window.document.querySelector('code')!;
  const source = '\\^^Start()^^';
  const parsed = parse(source);
  code.textContent = source;
  renderCode(code);
  // Simulate the host replacing our spans with newly highlighted clean text.
  code.textContent = '\\';
  const token = dom.window.document.createElement('span');
  token.className = 'token function'; token.textContent = 'Start';
  code.append(token, '()');
  decorateCode(code, parsed.highlights);
  assert.equal(code.textContent, '\\Start()');
  assert.equal([...code.querySelectorAll('.code-emphasis-mark')].map(e => e.textContent).join(''), 'Start()');
  assert.equal(code.querySelector('.token')?.textContent, 'Start');
});
