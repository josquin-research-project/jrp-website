import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assetCandidates,firstAvailable} from './asset-check-sources.mjs';
const base='https://assets.test/jrp/';
const old='https://data.test/';
const routing={base,index:{},servers:[old]};
test('R2 first, legacy only if needed',async()=>{
 const urls=assetCandidates(old+'A.mp3',routing), seen=[];
 assert.deepEqual(urls,[base+'mirror-assets/A.mp3',old+'A.mp3']);
 assert.equal(await firstAvailable(urls,async u=>{seen.push(u);return true;}),urls[0]);
 assert.equal(seen.length,1);
 assert.equal(await firstAvailable(urls,async u=>u===urls[1]),urls[1]);
});
test('explicit mappings support permanent folder changes',()=>{
 assert.equal(assetCandidates(old+'A.mp3',{...routing,index:{sources:{[old+'A.mp3']:'audio/A.mp3'}}})[0],base+'audio/A.mp3');
});
test('held PDFs stay excluded; repaired PDFs exclude blank originals',()=>{
 const source=old+'A.pdf';
 assert.deepEqual(assetCandidates(source,{...routing,index:{pdfs:{'A.pdf':null}}}),[]);
 assert.deepEqual(assetCandidates(source,{...routing,index:{pdfs:{'A.pdf':'pdfs/A.pdf'},blocked:[source]}}),[base+'pdfs/A.pdf']);
});
test('uncertain outages fail scan, confirmed missing does not',async()=>{
 await assert.rejects(firstAvailable(['a','b'],async u=>{if(u==='a')throw Error('offline');return false;}),/offline/);
 assert.equal(await firstAvailable(['a'],async()=>false),null);
 assert.equal(await firstAvailable(['a','b'],async u=>{if(u==='a')throw Error('offline');return true;}),'b');
});
