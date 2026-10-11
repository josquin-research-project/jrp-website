const test = require('node:test');
const assert = require('node:assert/strict');
const {prepareData, patch} = require('../_includes/scripts/signum-congruentiae.js');

test('SC rendering labels preserve staff columns, placement, visibility and brackets', () => {
  const data = '**kern\t**text\t**kern\n' +
    '!LO:TX:a:color=transparent:t=[sc]\t!\t!LO:TX:Z=8:t=[[sc]]\n' +
    '1c\tNe\t1r\n!LO:TX:b:t=[sc-below]\t!\t!\n*-\t*-\t*-\n';
  const prepared = prepareData('score', data);
  assert.equal(prepared, data.replace(':t=[sc]', ':type=jrp-sc-up:t=[sc]')
    .replace(':t=[[sc]]', ':type=jrp-sc-up:t=[[segno]]')
    .replace(':t=[sc-below]', ':type=jrp-sc-down:t=[segno]'));
  assert.equal(prepareData('score', prepared), prepared);
});

test('ordinary symbols, prose and global comments are untouched', () => {
  const data = '!LO:TX:a:t=[segno]\n!LO:TX:a:t=See [sc] here\n!!LO:TX:a:t=[sc]\n';
  assert.equal(prepareData('score', data), data);
});

test('existing direction types are retained', () => {
  assert.equal(prepareData('score', '!LO:TX:a:type=editorial:t=[sc]'),
    '!LO:TX:a:type=editorial jrp-sc-up:t=[segno]');
});

function drawing(symbols) {
  const styles = [];
  const spans = symbols.map(({text, down}) => ({
    textContent: text, attrs: {'font-family': 'Leipzig', 'font-size': '720px'}, down,
    setAttribute(key, value) { this.attrs[key] = value; },
  }));
  const svg = {
    ownerDocument: {createElementNS() {
      return {attrs: {}, setAttribute(key, value) { this.attrs[key] = value; }};
    }},
    querySelectorAll() { return spans.map(span => ({
      classList: {contains() { return Boolean(span.down); }},
      querySelectorAll() { return [span]; },
    })); },
    querySelector() { return styles[0] || null; },
    insertBefore(style) { styles.push(style); },
  };
  return {container: {querySelectorAll() { return [svg]; }}, spans, styles};
}

test('SC placeholders receive an embedded font; native glyphs and size survive', () => {
  const d = drawing([{text: '\uE047'}, {text: '', down: true}, {text: '\uEA00'}]);
  patch(d.container);
  assert.deepEqual(d.spans.map(s => s.textContent), ['\uEA00', '\uEA01', '\uEA00']);
  assert.deepEqual(d.spans.map(s => s.attrs['font-family']),
    ['JRP Historical Signs', 'JRP Historical Signs', 'Leipzig']);
  assert.ok(d.spans.every(s => s.attrs['font-size'] === '720px'));
  assert.equal(d.styles.length, 1);
  assert.match(d.styles[0].textContent, /data:font\/woff2;base64,/);
  patch(d.container);
  assert.equal(d.styles.length, 1);
});

test('native-only scores receive no fallback font', () => {
  const d = drawing([{text: '\uEA00'}]);
  patch(d.container);
  assert.equal(d.styles.length, 0);
});
