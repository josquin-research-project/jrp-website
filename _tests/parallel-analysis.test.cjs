const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const script = fs.readFileSync('analysis/parallel/scripts-local.html','utf8').replace(/<\/?script>/g,'');
const hit = attack => ({attack,kind:'fifths',quality:'P5 → P5',voices:['Superius','Tenor'],measure:'8',offset:'0',excerpt:'jrp/analysis/parallel/example.html',notes:[{pitch:'D5',measure:'7'},{pitch:'G3',measure:'7'},{pitch:'C5',measure:'8'},{pitch:'F3',measure:'8'}]});
async function page(fail=false) {
 const els = new Map();
 const get = id => {
  if(!els.has(id))els.set(id,{value:'',hidden:false,innerHTML:'',textContent:'',events:{},addEventListener(t,f){this.events[t]=f},scrollIntoView(){}});
  return els.get(id);
 };
 const report={works:{Agr3028:{id:'Agr3028',title:'<unsafe>',hits:[hit('soft'),hit('hard')],unresolvedMatchesSkipped:0}},failures:{}};
 const context={document:{getElementById:get},window:{},location:{search:'?composer=Agr&work=Agr3028'},localStorage:{},URLSearchParams,fetch:async url=>({ok:!fail,json:async()=>url.endsWith('/data.json')?report:[{COMPOSER_ID:'Agr','Display Long':'Agricola'}]})};
 vm.runInNewContext(script,context);await new Promise(setImmediate);
 return {get,context};
}
test('deep link restores work and escapes score titles',async()=>{
 const {get}=await page();assert.equal(get('work').value,'Agr3028');assert.match(get('status').textContent,/2 matches/);assert.match(get('rows').innerHTML,/&lt;unsafe&gt;/);assert.doesNotMatch(get('rows').innerHTML,/<unsafe>/);
});
test('attack filters and score excerpts use published assets',async()=>{
 const {get}=await page();get('attack').value='soft';get('attack').onchange();assert.match(get('status').textContent,/1 match/);
 get('rows').events.click({target:{closest:()=>({dataset:{work:'Agr3028',hit:'0'}})}});
 assert.equal(get('score').src,'https://assets.1520s-project.org/jrp/analysis/parallel/example.html');assert.equal(get('full-score').href,'/work/?id=Agr3028');assert.equal(get('detail').hidden,false);
});
test('failed fetch shows an error instead of zero matches',async()=>{
 const {get}=await page(true);assert.equal(get('status').textContent,'Analysis unavailable');
});
