const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const common = read('_includes/scripts/scripts-common.js');
const baseHelper = common.slice(common.indexOf('function getBaseWorkId('), common.indexOf('function splitComposerIds('));

test('repertoire suffix counts distinct sources and respects work and version IDs', () => {
  const context = vm.createContext({ COMMENTARY: [
    { WORK_ID: 'Ano1001', Source: 'Jena 32', 'Fols./pp./no.': 'fol. 1' },
    { WORK_ID: 'Ano1001', Source: 'Jena 32', 'Fols./pp./no.': 'fol. 2' },
    { WORK_ID: 'Ano1001b', Source: 'Another source' },
    { WORK_ID: 'Ano3238.1', Source: 'Petrucci, Odhecaton (1501)' },
    { WORK_ID: 'Ano2001', Source: '<A & B>' },
  ] });
  vm.runInContext(read('_includes/scripts/references.js'), context);
  const suffix = id => context.formatRepertoireSourceSuffix(id);
  assert.equal(suffix('Ano1001'), ' (Jena 32)');
  assert.equal(suffix('Ano1001a'), ' (Jena 32)');
  assert.equal(suffix('Ano1001b'), '');
  assert.equal(suffix('Ano3238'), '');
  assert.equal(suffix('Ano3238.2'), '');
  assert.equal(suffix('Ano3238.1'), ' (Petrucci, <i>Odhecaton</i>, 1501)');
  assert.equal(suffix('Ano2001'), ' (&lt;A &amp; B&gt;)');
  assert.equal(suffix('Agr9999'), '');
});

test('repertoire suffix displays migrated single sources but omits multiple sources', () => {
  const context = vm.createContext({ COMMENTARY: JSON.parse(read('_includes/metadata/commentary.json')) });
  vm.runInContext(read('_includes/scripts/references.js'), context);
  assert.equal(context.formatRepertoireSourceSuffix('Ano2073'), ' (Munich 41)');
  assert.equal(context.formatRepertoireSourceSuffix('Ano1001'), ' (Jena 32)');
  assert.equal(context.formatRepertoireSourceSuffix('Agr3028'), '');
});

function setup(works, commentary) {
  const element = { innerHTML: '' };
  const context = vm.createContext({
    WORKS: works, COMMENTARY: commentary,
    document: { getElementById: () => element },
  });
  vm.runInContext(baseHelper + read('_includes/scripts/references.js'), context);
  return id => { context.DisplayWorkCommentary(id); return element.innerHTML; };
}

test('movement pages combine shared and exact entries without sibling leakage', () => {
  const display = setup([
    { WORK_ID: 'Agr1004a', Title: 'Mass', Subtitle: 'Kyrie' },
    { WORK_ID: 'Agr1004b', Title: 'Mass', Subtitle: 'Gloria' },
  ], [
    { WORK_ID: 'Agr1004', Source: 'Shared manuscript' },
    { WORK_ID: 'Agr1004a', Source: 'Kyrie manuscript' },
    { WORK_ID: 'Agr1004b', Source: 'Gloria manuscript' },
    { WORK_ID: 'Agr1005', Source: 'Unrelated manuscript' },
  ]);
  const kyrie = display('Agr1004a');
  assert.match(kyrie, /Shared manuscript/);
  assert.match(kyrie, /Kyrie manuscript/);
  assert.doesNotMatch(kyrie, /Gloria manuscript|Unrelated manuscript/);
  const complete = display('Agr1004');
  assert.match(complete, /Shared manuscript/);
  assert.doesNotMatch(complete, /Kyrie manuscript|Gloria manuscript/);
});

test('seven-character entries reach versions; exact version entries remain specific', () => {
  const display = setup(['Ano3238', 'Ano3238.1', 'Ano3238.2'].map(WORK_ID => ({ WORK_ID })), [
    { WORK_ID: 'Ano3238', Source: 'Shared' },
    { WORK_ID: 'Ano3238.1', Source: 'Version one only' },
  ]);
  assert.match(display('Ano3238.1'), /Shared/);
  assert.match(display('Ano3238.1'), /Version one only/);
  assert.doesNotMatch(display('Ano3238.2'), /Version one only/);
  assert.doesNotMatch(display('Ano3238'), /Version one only/);
});

test('migrated sources render for anonymous works, complete masses, and existing commentary', () => {
  const display = setup(JSON.parse(read('_includes/metadata/works.json')),
    JSON.parse(read('_includes/metadata/commentary.json')));
  assert.match(display('Ano2073'), /Munich 41/);
  assert.match(display('Ano2073'), /https:\/\/www.diamm.ac.uk\/sources\//);
  for (const id of ['Ano1001', 'Ano1001a', 'Ano1001e']) {
    assert.equal((display(id).match(/Jena 32/g) || []).length, 1);
  }
  assert.match(display('Agr3028'), /Petrucci, <i>Odhecaton<\/i>\s+\(1501\)/);
  assert.match(display('Agr3028'), /no\. 96/);
  assert.match(display('Agr3028'), /Titled &quot;Robert&quot;/);
  assert.equal(display('Agr1004a'), '');
});
