const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../_includes/scripts/signum-congruentiae.js');

function worker() {
  const calls = [];
  const toolkit = {
    getHumdrum: () => '**kern\n!!!filter: processed',
    getMEI: () => '<dir type="jrp-sc-up" staff="2"><symbol glyph.name="mensuralSignumUp" /></dir>',
    setOptions: options => calls.push(['options', options]),
    loadData: mei => {calls.push(['mei', mei]); return true;},
    getPageCount: () => 2,
    renderToSVG: page => `<svg data-page="${page}">native</svg>`,
  };
  const methods = {vrvToolkit:toolkit, page:1,
    renderData(options, data, page, force) {
      calls.push(['upstream', options, data, page, force]);
      this.page = page || 1;
      return '<svg>ordinary</svg>';
    }};
  const context = {JRPsignum:core, importScripts(){}, methods,
    verovio:{module:{onRuntimeInitialized(){}}}};
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, '../scripts/signum-congruentiae-worker.js'), 'utf8')
    .replace(/^---\n---\n/, '');
  vm.runInContext(source, context);
  context.verovio.module.onRuntimeInitialized();
  return {methods,calls};
}

test('font worker retains filtered Humdrum, attachment and page selection', () => {
  const {methods,calls} = worker();
  const data = '**kern\n!LO:TX:type=jrp-sc-up:t=[sc]\n1c\n*-';
  assert.equal(methods.renderData({scale:35}, data, 2), '<svg data-page="2">native</svg>');
  assert.equal(calls.filter(c => c[0] === 'upstream').length, 1);
  assert.equal(calls[0][2], data);
  assert.equal(calls[0][1].scale, 35);
  const mei = calls.find(c => c[0] === 'mei')[1];
  assert.match(mei, /staff="2"/);
  assert.match(mei, /glyph.num="U\+EA00"/);
  assert.equal(methods.humdrumOutput, '**kern\n!!!filter: processed');
  assert.equal(methods.pageCount, 2);
});

test('scores without SC directions use the upstream renderer unchanged', () => {
  const {methods,calls} = worker();
  const options = {scale:35};
  const data = '**kern\n!LO:TX:a:t=[segno]\n1c\n*-';
  assert.equal(methods.renderData(options, data, 1, true), '<svg>ordinary</svg>');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], options);
  assert.equal(calls[0][2], data);
});

test('the worker interface settles superseded requests and drains the render queue', () => {
  let listener;
  const context = {vrvInterface:function(){}, Worker:class {
    constructor(url) {assert.equal(url, '/scripts/signum-congruentiae-worker.js');}
    addEventListener(type, callback) {assert.equal(type, 'message');listener=callback;}
  }};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../_includes/scripts/signum-worker-interface.js'),'utf8'),context);
  const client = new context.vrvInterface();let ready=false,drained=0,settled=[];
  client.createWorkerInterface(()=>{ready=true;});
  client.handleWaitingRenderData=()=>{drained++;};
  listener({data:{method:'ready'}});assert.equal(ready,true);assert.equal(client.initialized,true);
  for(let index=0;index<2;index++)client.promises[index]={method:'renderData',deferred:{
    resolve:value=>settled.push([index,'resolve',value]),reject:()=>settled.push([index,'reject'])}};
  client.renderDataPending=2;
  listener({data:{method:'renderData',idx:1,success:true,result:'svg'}});
  assert.deepEqual(settled,[[0,'reject'],[1,'resolve','svg']]);
  assert.equal(client.renderDataPending,0);assert.equal(drained,1);
  assert.equal(Object.keys(client.promises).length,0);
});
