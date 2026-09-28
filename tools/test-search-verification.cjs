const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const code = fs.readFileSync('_includes/scripts/search-verification.js','utf8');
function setup() {
  let options, resets=0;
  const storage=new Map(), requests=[], elements={'search-verification':{},'search-verification-status':{textContent:''}};
  const context=vm.createContext({
    window:{turnstile:{render(holder, opts){options=opts;return 'widget';},reset(){resets++;}}},
    document:{getElementById:id=>elements[id],addEventListener(){}},
    sessionStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k),removeItem:k=>storage.delete(k)},
    JRP_SEARCH_SITEKEY:'key',JRP_SEARCH_API:'https://search.example/api/search',
    URLSearchParams,AbortController,setTimeout,clearTimeout,
    fetch:async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>({matchcount:32})};}
  });
  vm.runInContext(code,context);
  return {context,requests,elements,get options(){return options;},get resets(){return resets;}};
}
test('form renders verification before submission and consumes tokens once',async()=>{
  const s=setup(), c=s.context;
  await c.initializeJrpSearchVerification();
  assert.equal(s.options.appearance,'always');
  assert.equal(s.options.execution,undefined);
  assert.equal(c.takeJrpSearchToken(),'');
  s.options.callback('verified-token');
  const token=c.takeJrpSearchToken();
  assert.equal(token,'verified-token');assert.equal(c.takeJrpSearchToken(),'');
  c.storeJrpSearchToken(token);assert.equal(c.consumeJrpSearchToken(),token);assert.equal(c.consumeJrpSearchToken(),'');
  assert.equal((await c.requestJrpSearch(new URLSearchParams({pitch:'c d e'}),token)).matchcount,32);
  assert.equal(s.requests[0].url,'https://search.example/api/search');
  assert.equal(s.requests[0].options.method,'POST');
  assert.equal(s.requests[0].options.body.get('cf-turnstile-response'),token);
  c.resetJrpSearchVerification();assert.equal(s.resets,1);
});
test('expiry clears form token and unverified requests never reach API',async()=>{
  const s=setup(),c=s.context;await c.initializeJrpSearchVerification();
  s.options.callback('token');s.options['expired-callback']();assert.equal(c.takeJrpSearchToken(),'');
  await assert.rejects(c.requestJrpSearch(new URLSearchParams({pitch:'c'}),''),/complete verification/);
  assert.equal(s.requests.length,0);
});
