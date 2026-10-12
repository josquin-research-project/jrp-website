const test = require('node:test');
const assert = require('node:assert/strict');
const {prepareData, patch} = require('../_includes/scripts/signum-congruentiae.js');

test('SC rendering labels preserve staff columns, placement, visibility and brackets', () => {
  const data = '**kern\t**text\t**kern\n' +
    '!LO:TX:a:color=transparent:t=[sc]\t!\t!LO:TX:Z=8:t=[[sc]]\n' +
    '1c\tNe\t1r\n!LO:TX:b:t=[sc-below]\t!\t!\n*-\t*-\t*-\n';
  const prepared = prepareData('score', data);
  assert.equal(prepared, data.replace(':t=[sc]', ':type=jrp-sc-up jrp-sc-target-L3F1:t=[sc]')
    .replace(':t=[[sc]]', ':type=jrp-sc-up jrp-sc-reserve jrp-sc-target-L3F3:t=[[segno|150%]]')
    .replace(':t=[sc-below]', ':type=jrp-sc-down jrp-sc-reserve:t=[segno|150%]'));
  assert.equal(prepareData('score', prepared), prepared);
});

test('ordinary symbols, prose and global comments are untouched', () => {
  const data = '!LO:TX:a:t=[segno]\n!LO:TX:a:t=See [sc] here\n!!LO:TX:a:t=[sc]\n';
  assert.equal(prepareData('score', data), data);
});

test('existing direction types are retained', () => {
  assert.equal(prepareData('score', '!LO:TX:a:type=editorial:t=[sc]'),
    '!LO:TX:a:type=editorial jrp-sc-up jrp-sc-reserve:t=[segno|150%]');
});

function drawing(symbols) {
  const styles = [];
  const spans = symbols.map(({text, down}) => ({
    textContent: text, attrs: {'font-family': 'Leipzig', 'font-size': '720px'}, down,
    setAttribute(key, value) { this.attrs[key] = value; },
    getAttribute(key) { return this.attrs[key] || null; },
  }));
  const directions = spans.map(span => ({
    attrs: {},
    classList: {contains(name) { return name === 'jrp-sc-down' && Boolean(span.down); }},
    querySelectorAll() { return [span]; },
    querySelector() { return span; },
    getAttribute(key) { return this.attrs[key] || null; },
    setAttribute(key, value) { this.attrs[key] = value; },
  }));
  const svg = {
    ownerDocument: {createElementNS() {
      return {attrs: {}, setAttribute(key, value) { this.attrs[key] = value; }};
    }},
    querySelectorAll() { return directions; },
    querySelector() { return styles[0] || null; },
    insertBefore(style) { styles.push(style); },
  };
  return {container: {querySelectorAll() { return [svg]; }}, spans, styles, directions};
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

test('clearance scales with the score and does not accumulate on redraw', () => {
  const d = drawing([{text: '\uE047'}, {text: '\uE047', down: true}]);
  d.spans[1].attrs['font-size'] = '800px';
  d.directions[0].attrs.transform = 'translate(20,30)';
  patch(d.container);
  assert.equal(d.directions[0].attrs.transform, 'translate(20,30) translate(0,-90)');
  assert.equal(d.directions[1].attrs.transform, ' translate(0,100)');
  patch(d.container);
  assert.equal(d.directions[0].attrs.transform, 'translate(20,30) translate(0,-90)');
  assert.equal(d.directions[1].attrs.transform, ' translate(0,100)');
});

test('attachments skip null events, comments and barlines in their own spine', () => {
  const data = '**kern\t**kern\n!LO:TX:a:t=[sc]\t!\n.\t4e\n=1\t=1\n!\t!\n1c\t.\n';
  assert.match(prepareData('score', data), /jrp-sc-target-L6F1/);
});

test('historical ink centers on attached noteheads and rests without accumulating', () => {
  for (const [width, expected] of [[291, 42.9], [90, -57.6]]) {
    const d = drawing([{text: '\uE047'}]);
    const direction = d.directions[0];
    direction.attrs.class = 'dir jrp-sc-up jrp-sc-target-L87F5';
    const matrix = {inverse() { return this; }};
    direction.getCTM = () => matrix;
    d.spans[0].getCTM = () => matrix;
    d.spans[0].getStartPositionOfChar = () => ({x: 1000, y: 600});
    const shape = {getBBox: () => ({x: 1000, y: 700, width, height: 100}),
      getCTM: () => matrix};
    const svg = d.container.querySelectorAll()[0];
    const originalQuery = svg.querySelector;
    svg.querySelector = selector => selector === '[id="note-L87F5"]' && width === 291
      ? {querySelector: () => shape}
      : selector === '[id="rest-L87F5"]' && width === 90
        ? {...shape, querySelector: () => null} : originalQuery();
    svg.createSVGPoint = () => ({x: 0, y: 0, matrixTransform() { return {...this}; }});
    patch(d.container);
    assert.equal(direction.attrs['data-jrp-sc-centered'], 'true');
    const shift = Number(direction.attrs.transform.match(/translate\(([^,]+),0\)/)[1]);
    assert.ok(Math.abs(shift - expected) < 1e-9);
    assert.match(direction.attrs.transform, /translate\(0,-90\)/);
    const transform = direction.attrs.transform;
    patch(d.container);
    assert.equal(direction.attrs.transform, transform);
  }
});

test('taller layout placeholders restore the displayed size and clearance once', () => {
  const d = drawing([{text: '\uE047'}]);
  d.spans[0].attrs['font-size'] = '1079px'; // Verovio rounds its percentage-sized placeholder.
  d.directions[0].classList = {contains: name => name === 'jrp-sc-reserve'};
  patch(d.container);
  assert.equal(d.spans[0].attrs['font-size'], '720px');
  assert.equal(d.directions[0].attrs.transform, ' translate(0,-90)');
  patch(d.container);
  assert.equal(d.spans[0].attrs['font-size'], '720px');
  assert.equal(d.directions[0].attrs.transform, ' translate(0,-90)');
});


test('SC glyphs and editorial brackets are upright, including on redraw', () => {
  const d = drawing([{text: '\uE047'}]);
  const bracket = {attrs: {'font-style':'italic'}, setAttribute(key,value) { this.attrs[key]=value; }};
  const original = d.directions[0].querySelectorAll;
  d.directions[0].querySelectorAll = selector => selector === 'text, tspan'
    ? [bracket, ...d.spans] : original();
  patch(d.container);
  assert.equal(bracket.attrs['font-style'], 'normal');
  assert.equal(d.spans[0].attrs['font-style'], 'normal');
  patch(d.container);
  assert.equal(bracket.attrs['font-style'], 'normal');
});
