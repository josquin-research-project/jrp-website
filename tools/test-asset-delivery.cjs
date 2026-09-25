const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('_includes/scripts/asset-delivery.js','utf8');
const index = JSON.parse(fs.readFileSync('_includes/metadata/cloudflare-assets.json'));
function delivery(fetch, data = index) {
 const context = {fetch, Response, AbortController, setTimeout, clearTimeout};
 vm.createContext(context); vm.runInContext(code, context);
 return context.createAssetDelivery('https://assets.example/jrp', data, ['https://data.josqu.in/', 'https://data2.josqu.in/']);
}
test('successful R2 read does not contact legacy servers', async () => {
 const seen=[]; const d=delivery(async url=>{seen.push(url);return new Response('**kern\n*-',{headers:{'Content-Type':'text/plain'}})});
 assert.equal(await (await d.fetch('https://data.josqu.in/Agr1001a.krn')).text(),'**kern\n*-');
 assert.deepEqual(seen,['https://assets.example/jrp/mirror-assets/Agr1001a.krn']);
});
test('404, HTML error and network failure follow ordered fallback', async () => {
 const seen=[]; const d=delivery(async url=>{seen.push(url);if(seen.length===1) return new Response('',{status:404});if(seen.length===2) return new Response('<html>',{headers:{'Content-Type':'text/html'}});return new Response('score')});
 assert.equal(await (await d.fetch('https://data.josqu.in/Agr1001a.mei')).text(),'score');
 assert.deepEqual(seen,['https://assets.example/jrp/mirror-assets/Agr1001a.mei','https://data.josqu.in/Agr1001a.mei','https://data2.josqu.in/Agr1001a.mei']);
 const n=delivery(async url=>{if(url.startsWith('https://assets.')) throw new TypeError('network');return new Response('fallback')});
 assert.equal(await (await n.fetch('https://data.josqu.in/Agr1001a.mei')).text(),'fallback');
});
test('repository PDFs map to uploaded keys, then original repository',()=>{
 const d=delivery(); const source='https://cdn.jsdelivr.net/gh/benory/jrp-scores-backup@main/scores/Agr/Agr1001a-edit.pdf';
 assert.deepEqual(Array.from(d.candidates(source)),['https://assets.example/jrp/pdfs/Agr/Agr1001a-edit.pdf',source]);
});
test('held PDFs cannot become fallback candidates',()=>{
 const d=delivery();assert.equal(d.candidates(index.blocked[0]).length,0);
 assert.equal(d.candidates('#unavailable-score').length,0);
 assert.equal(index.pdfs['Agr1004b-no_edit.pdf'],null);
});
test('media retries once per source and does not restart paused playback',()=>{
 const d=delivery(); let play=0;const media={paused:true,load(){},play(){play++;return Promise.resolve()}};
 d.media(media,'https://data.josqu.in/Agr1001a.mp3');assert.match(media.src,/assets.example/);
 media.onerror();assert.equal(media.src,'https://data.josqu.in/Agr1001a.mp3');media.onerror();assert.equal(media.src,'https://data2.josqu.in/Agr1001a.mp3');media.onerror();assert.equal(play,0);
});
test('unrelated URLs are unchanged',()=>{assert.deepEqual(Array.from(delivery().candidates('https://example.com/text.txt')),['https://example.com/text.txt'])});
test('1520s GitHub tree URLs resolve to R2 originals with raw GitHub fallback',()=>{
 const data={sources:{'https://raw.githubusercontent.com/benory/1520s-project-scores/main/humdrum/Any/example.krn':'originals/humdrum/Any/example.krn'},blocked:[]};
 assert.deepEqual(Array.from(delivery(undefined,data).candidates('https://github.com/benory/1520s-project-scores/tree/main/humdrum/Any/example.krn')),['https://assets.example/jrp/originals/humdrum/Any/example.krn','https://raw.githubusercontent.com/benory/1520s-project-scores/main/humdrum/Any/example.krn']);
});
test('an already-cancelled request never starts a fallback',async()=>{
 let count=0; const d=delivery(async()=>{count++;return new Response('score')}); const c=new AbortController();c.abort();
 await assert.rejects(d.fetch('https://data.josqu.in/Agr1001a.krn',{signal:c.signal})); assert.equal(count,0);
});
