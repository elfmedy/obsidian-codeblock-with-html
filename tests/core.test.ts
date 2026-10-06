import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { parse, codeBlocks, wrapSelection } from '../src/markup';
import { decorateCode, renderCode } from '../src/render';
import { messageFor } from '../src/messages';
test('Chinese locales follow Obsidian; other locales fall back to English', () => {
  assert.equal(messageFor('zh', 'command'), '高亮所选文本');
  assert.equal(messageFor('zh-TW', 'color'), '高亮颜色');
  assert.equal(messageFor('en', 'command'), 'Highlight selected text');
  assert.equal(messageFor('de', 'reset'), 'Restore default');
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
test('escape only literal delimiters', () => {
  assert.equal(parse('\\^^literal\\^^ ^^yes^^ C:\\path').text, '^^literal^^ yes C:\\path');
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
  const source = '\\^^literal\\^^ ^^Start()^^';
  const parsed = parse(source);
  code.textContent = source;
  renderCode(code);
  // Simulate the host replacing our spans with newly highlighted clean text.
  code.textContent = '^^literal^^ ';
  const token = dom.window.document.createElement('span');
  token.className = 'token function'; token.textContent = 'Start';
  code.append(token, '()');
  decorateCode(code, parsed.highlights);
  assert.equal(code.textContent, '^^literal^^ Start()');
  assert.equal([...code.querySelectorAll('.code-emphasis-mark')].map(e => e.textContent).join(''), 'Start()');
  assert.equal(code.querySelector('.token')?.textContent, 'Start');
});
