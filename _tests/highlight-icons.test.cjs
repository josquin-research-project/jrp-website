const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ URL, JRP_SEARCH_API: 'https://search.example/api/search', document: { addEventListener() {} } });
vm.runInContext(fs.readFileSync(path.join(root, '_includes/scripts/search-verification.js'), 'utf8'), context);

test('both icons use signed highlighted URLs and descriptive accessible labels', () => {
  const html = context.highlightedSearchPdfLink({ highlightPdf: '/api/highlight-pdf?ticket=plain', highlightPdfEdited: '/api/highlight-pdf?ticket=edited' });
  assert.match(html, /class="file"/);
  assert.match(html, /class="file-ed"/);
  assert.match(html, /ticket=plain/);
  assert.match(html, /ticket=edited/);
  assert.match(html, /aria-label="Highlighted score with editorial accidentals"/);
  assert.doesNotMatch(html, />Highlighted PDF</);
});

test('invalid or absent highlighted URLs never fall back to unhighlighted PDFs', () => {
  assert.equal(context.highlightedSearchPdfLink({}), '');
  assert.equal(context.highlightedSearchPdfLink({ highlightPdf: 'https://evil.example/api/highlight-pdf?ticket=x', highlightPdfEdited: '/api/search?ticket=x' }), '');
});

test('highlighted scores column immediately follows match locations', () => {
  const scripts = fs.readFileSync(path.join(root, 'search-results/scripts-local.html'), 'utf8');
  const header = scripts.slice(scripts.indexOf('function printSearchTableHeader()'), scripts.indexOf('function getSearchWork('));
  assert.ok(header.indexOf('Highlighted Scores') > header.indexOf('Match Locations'));
  assert.ok(header.indexOf('Highlighted Scores') < header.indexOf('Composer'));
});
