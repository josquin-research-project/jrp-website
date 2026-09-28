const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const code = fs.readFileSync('_includes/scripts/search-verification.js', 'utf8');
function setup(mode = 'success') {
  let count = 0;
  const callbacks = new Map();
  const removed = [], requests = [];
  const api = {
    render(holder, options) { const id = count++; callbacks.set(id, options); return id; },
    execute(id) { const cb = callbacks.get(id); mode === 'success' ? cb.callback('token-' + id) : cb['error-callback'](); },
    remove(id) { removed.push(id); }
  };
  const context = vm.createContext({
    window: {turnstile: api}, JRP_SEARCH_SITEKEY: 'test-key', JRP_SEARCH_API: 'https://search.example/api/search',
    URLSearchParams, AbortController, setTimeout, clearTimeout,
    document: { createElement() { return {remove() {}}; } },
    fetch: async (url, options) => {requests.push({url, options}); return {ok:true,json:async()=>({matchcount:32})};}
  });
  vm.runInContext(code, context);
  return {run: context.requestJrpSearch, container:{appendChild(){}}, requests, removed};
}
test('each search gets a fresh token, sent only in a POST body', async () => {
  const s=setup();
  for (let i=0;i<2;i++) assert.equal((await s.run(new URLSearchParams({pitch:'c d e'}),s.container)).matchcount,32);
  assert.deepEqual(s.removed,[0,1]);
  s.requests.forEach(({url,options},i)=>{
    assert.equal(url,'https://search.example/api/search');assert.equal(options.method,'POST');
    assert.equal(options.body.get('cf-turnstile-response'),'token-'+i);
    assert.equal(options.body.get('pitch'),'c d e');assert.equal(options.credentials,'omit');
  });
});
test('failed verification never calls the search API and cleans up the widget', async () => {
  const s=setup('fail');await assert.rejects(s.run(new URLSearchParams({pitch:'c'}),s.container),/Verification failed/);
  assert.equal(s.requests.length,0);assert.deepEqual(s.removed,[0]);
});
