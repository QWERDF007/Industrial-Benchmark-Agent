import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {PythonBridge,createIadHttpHandler} from '../lib/server/index.js';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('mixed exploration is preserved on refresh and directions feed the next mining request', {timeout:90000}, async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-exploration-browser-'));
 const bridge=new PythonBridge({cwd:path.resolve(app,'../..'),dbPath:path.join(root,'test.db')});
 execFileSync(bridge.pythonPath,[path.join(app,'test/fixtures/knowledge_dataset.py'),root]);
 const bundle=await build({stdin:{contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';import {apply} from './src/client/index.ts';
 const entries=[],mains=new Map(),listeners=new Set();let panel=null;
 const layout={panelInfo:{getSnapshot:()=>({activePanelId:panel}),subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}},selectPanel:id=>{panel=id;listeners.forEach(f=>f())}};
 apply({layout,slots:{inject:(_,f)=>f(),register:(o,c)=>{if(o.name==='main')mains.set(o.key,c);else if(o.name==='sidebar.panellist')entries.push({...o,c});}}});
 function App(){const[id,setId]=React.useState(panel||entries[0].id);React.useEffect(()=>layout.panelInfo.subscribe(()=>setId(panel)),[]);const Page=mains.get(id);return <><nav aria-label="主导航">{entries.map(e=><button key={e.id} onClick={()=>layout.selectPanel(e.id)}>{e.label}</button>)}</nav>{Page&&<Page/>}</>};createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
 const api=createIadHttpHandler(bridge),generated=[];
 const server=http.createServer(async(req,res)=>{
  if(req.url.startsWith('/model/')){
   let text='';for await(const c of req)text+=c;const b=JSON.parse(text);let answer;
   if(req.url==='/model/tokenize')answer={count:3000,max_model_len:32768};
   else{
    generated.push(b);const ids=b.messages[0].content.filter(v=>v.type==='text'&&v.text.startsWith('视觉证据：')).map(v=>JSON.parse(v.text.slice(5)).evidence_id);
    answer=b.response_format.json_schema.name==='DirectionDraft'?{summary:'两组样例提出方向',directions:[{title:'孔位与背景对照',instruction:'结合孔位比较背景遮挡与反光',applies_to:'both',rationale:'两组存在可观察差异',evidence_ids:ids,limitations:['合成图']}],limitations:[]}
    :{summary:'孔内背景知识',checks:[{title:'孔内背景',subject:'孔',location:'主体',criterion:'可见背景',allowed_variations:[],limitations:[],status:'provisional',support_evidence_ids:ids,counter_evidence_ids:[]}],suspects:[],limitations:[]};
   }
   res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(req.url==='/model/tokenize'?answer:{choices:[{finish_reason:'stop',message:{content:JSON.stringify(answer)}}]}));
  }else if(req.url==='/browser.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(bundle.outputFiles[0].contents);}
  else if(new URL(req.url,'http://localhost').pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<div id="root"></div><script src="/browser.js"></script>');}
  else await api(req,res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 const keys=['LIVE_VLM_ENDPOINT','LIVE_VLM_MODEL','LIVE_VLM_CAPACITY_MODE'];const previous=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 process.env.LIVE_VLM_ENDPOINT=base+'/model/v1';process.env.LIVE_VLM_MODEL='test-mllm';process.env.LIVE_VLM_CAPACITY_MODE='vllm_tokenize';
 let driver;
 try{
  const response=await fetch(base+'/api/iad/datasets/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({format:'labelme',name:'方向探索浏览器',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')})});assert.equal(response.status,200);const dataset=await response.json();
  const options=new firefox.Options().addArguments('-headless');if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  const el=css=>driver.wait(until.elementLocated(By.css(css)),8000);
  const click=async text=>{await(await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${text}']`)),8000)).click();};
  const count=async(label,value)=>{const input=await el(`input[aria-label='${label}图像数量']`);await input.clear();await input.sendKeys(value);};
  await driver.get(base);await click('方向探索');await el('[data-page="industrial-exploration"]');
  await count('良品','2');await count('异常','1');await click('选取良品图像');await click('选取异常图像');
  await driver.wait(async()=>await(await el('button.iad-primary')).isEnabled(),8000);
  await driver.navigate().refresh();
  assert.equal(await(await el('input[aria-label="良品图像数量"]')).getAttribute('value'),'2');
  assert.equal(await(await el('input[aria-label="异常图像数量"]')).getAttribute('value'),'1');
  await click('开始方向探索');await driver.wait(async()=>(await driver.findElements(By.xpath('//h3[contains(.,"孔位与背景对照")]'))).length===1,10000);
  assert.equal(generated.length,1);assert.equal(generated[0].messages[0].content.filter(v=>v.type==='image_url').length,3);
  await click('用于良品知识挖掘');await el('summary[data-action="mining-directions"]');await(await el('summary[data-action="mining-directions"]')).click();
  const choice=await el('input[aria-label="启用探索方向 孔位与背景对照"]');assert.equal(await choice.isSelected(),false);await choice.click();await click('保存方向');
  await driver.wait(async()=>{const p=await(await fetch(base+`/api/iad/knowledge/prompt?dataset_id=${dataset.dataset_id}&kind=normal`)).json();return p.configuration.directions.some(v=>v.origin==='explored'&&v.enabled);},8000);
  await driver.manage().window().setRect({width:500,height:900});assert.equal(await driver.executeScript('return document.documentElement.scrollWidth>innerWidth'),false);await driver.manage().window().setRect({width:1440,height:1000});
  const mining=await el('input[aria-label="挖掘图像数量"]');await mining.clear();await mining.sendKeys('2');await click('按数量选择');
  const start=await el('button[data-action="knowledge-group-run"]');await driver.wait(()=>start.isEnabled(),8000);await start.click();
  await driver.wait(()=>generated.length===2,10000);assert.ok(generated[1].messages[0].content[0].text.includes('结合孔位比较背景遮挡与反光'));
 }finally{
  await driver?.quit();bridge.destroy();await new Promise(resolve=>server.close(resolve));for(const k of keys)if(previous[k]===undefined)delete process.env[k];else process.env[k]=previous[k];await fs.rm(root,{recursive:true,force:true});
 }
});
