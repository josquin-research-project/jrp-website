const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const query = {composer:'Jos', genre:'Mass', voice:'4', pitch:'c d e and e f g', interval:'+2 +2 +2 +2', rhythm:'2. 4 2 2 1'};

function source(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
    .replace(/\{% include metadata\/(?:works|composers).json %\}/g, '[]')
    .replace(/\{%[^%]*%\}/g, '').replace(/<\/?script>/g, '');
}

function setup(page = 'results', search = '') {
  const elements = {};
  const state = {copied:null, redirected:null, canonical:null, token:null, requests:0};
  const c = vm.createContext({URL, URLSearchParams, Date, console,
    JRP_SEARCH_API:'https://api.example/api/search',
    window:{location:{search, origin:'https://www.josqu.in', replace(url){state.redirected=url;}}, history:{replaceState(_,__,url){state.canonical=url;}}},
    sessionStorage:{QUERY:JSON.stringify({pitch:'stale'})}, localStorage:{},
    navigator:{clipboard:{async writeText(url){state.copied=url;}}},
    document:{body:{style:{}}, addEventListener(){}, getElementById(id){return elements[id] ||= {hidden:true,focus(){this.focused=true;},select(){this.selected=true;}};}}
  });
  vm.runInContext(source('_includes/scripts/search-verification.js'), c);
  vm.runInContext(source(page === 'form' ? 'search/scripts-local.html' : 'search-results/scripts-local.html'), c);
  c.consumeJrpSearchToken = () => '';
  c.takeJrpSearchToken = () => 'verified-token';
  c.storeJrpSearchToken = token => {state.token=token;};
  c.requestJrpSearch = async () => {state.requests++; return {};};
  return {c, elements, state};
}

test('links preserve every query field and plus sign, without tokens or PDF tickets', () => {
  const {c} = setup();
  const url = c.jrpSearchUrl({...query, token:'private', highlightPdf:'secret-ticket', requestTime:123});
  assert.ok(url.startsWith('/search-results/?'));
  assert.deepEqual(Object.fromEntries(new URL(url, 'https://www.josqu.in').searchParams), query);
  assert.ok(url.includes('%2B2'));
  assert.doesNotMatch(url, /private|secret|requestTime/);
});

test('All defaults are omitted while real filters such as Ballade are retained', () => {
  const {c} = setup();
  assert.equal(c.jrpSearchUrl({composer:'All Composers', genre:'All Genres', voice:'All Voices', pitch:'c'}), '/search-results/?pitch=c');
  assert.equal(c.jrpSearchParams({genre:'Ballade'}).get('genre'), 'Ballade');
  assert.equal(c.cleanFilterValue('Ballade'), 'Ballade');
});

test('form submissions put the full query in the address and transfer verification separately', () => {
  const {c, elements, state} = setup('form');
  for (const [id,key] of Object.entries({pitch:'pitch',interval:'interval',rhythm:'rhythm',composers:'composer',genres:'genre',voices:'voice'})) elements[id]={value:query[key]};
  c.doSearch();
  assert.equal(c.window.location.href, c.jrpSearchUrl(query));
  assert.equal(state.token, 'verified-token');
  assert.doesNotMatch(c.window.location.href, /token/);
});

test('a shared URL overrides stale session data; explicit empty queries also override it', () => {
  const {c} = setup('results', '?'+new URLSearchParams(query));
  const actual = c.readSearchQuery();
  for (const key of Object.keys(query)) assert.equal(actual[key], query[key]);
  c.window.location.search = '?pitch=';
  assert.equal(c.readSearchQuery().pitch, '');
});

test('old session-only result pages receive canonical links and populated revise links', () => {
  const {c, elements, state} = setup();
  c.updateSearchLinks(c.readSearchQuery());
  assert.equal(state.canonical, '/search-results/?pitch=stale');
  assert.equal(elements['search-revise'].href, '/search/?pitch=stale');
  assert.equal(elements['copy-search-link'].hidden, false);
});

test('opening shared results without verification preserves the query and never sends a search', async () => {
  const {c, state} = setup();
  await c.runSearch(query);
  assert.equal(state.redirected, c.jrpSearchUrl(query, '/search/'));
  assert.equal(state.requests, 0);
});

test('copy uses a complete URL, with a selectable fallback if clipboard access fails', async () => {
  const {c, elements, state} = setup();
  vm.runInContext('QUERY='+JSON.stringify(query), c);
  await c.copySearchLink();
  assert.equal(state.copied, 'https://www.josqu.in'+c.jrpSearchUrl(query));
  assert.equal(elements['search-share-status'].textContent, 'Search link copied.');
  c.navigator.clipboard.writeText = async () => {throw Error('unavailable');};
  await c.copySearchLink();
  assert.equal(elements['search-share-url'].value, state.copied);
  assert.equal(elements['search-share-url'].selected, true);
  assert.equal(elements['search-share-url'].hidden, false);
});
