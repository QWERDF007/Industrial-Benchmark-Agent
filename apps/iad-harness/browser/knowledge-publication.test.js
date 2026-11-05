import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {build} from 'esbuild';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {PythonBridge,createIadHttpHandler} from '../lib/server/index.js';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('published batches preserve the open knowledge version and unsaved review', {timeout:90000},async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-knowledge-publication-'));
 const bridge=new PythonBridge({cwd:path.resolve(app,'../..'),dbPath:path.join(root,'test.db')});
 execFileSync(bridge.pythonPath,['-c',`from pathlib import Path
from PIL import Image,ImageDraw
import sys
p=Path(sys.argv[1]);(p/'images').mkdir();(p/'labels').mkdir()
for i in range(4):
 im=Image.new('RGB',(120,80),'blue');ImageDraw.Draw(im).rectangle((i*9+5,10,i*9+12,20),fill='white');im.save(p/'images'/f'part-{i}.png')`,root]);
 const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';
import {KnowledgePage} from './src/client/components/KnowledgePage.tsx';import {Workspace,WorkspaceContext} from './src/client/workspace.tsx';import {workbenchStyles} from './src/client/styles.ts';
const workspace=new Workspace({});workspace.openLocation({pageId:'industrial-knowledge',datasetId:window.fixture.dataset.dataset_id,job:window.fixture.job.run_id,tab:'results'});
createRoot(document.getElementById('root')).render(<WorkspaceContext.Provider value={workspace}><style>{workbenchStyles}</style><main className="iad-workbench"><KnowledgePage dataset={window.fixture.dataset} refreshRevision={0}/></main></WorkspaceContext.Provider>);`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
 const api=createIadHttpHandler(bridge);let fixture,learned=0,release,held=false;const gate=new Promise(resolve=>release=resolve);
 const server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/model/tokenize'){for await(const chunk of req){}res.setHeader('Content-Type','application/json');res.end(JSON.stringify({count:1000,max_model_len:262144}));return;}
  if(pathname==='/model/v1/chat/completions'){
   let body='';for await(const chunk of req)body+=chunk;const value=JSON.parse(body),prompt=value.messages[0].content[0].text;
   if(learned){held=true;await gate;}
   let result;
   if(value.response_format.json_schema.name==='KnowledgeObservations'){
    const scope=JSON.parse(prompt.split('冻结观察请求：')[1]);
    result=Object.fromEntries(scope.sources.map(source=>[source.source_key,Object.fromEntries(scope.checks.map(check=>[check.check_key,{status:'supports',description:'新图保留可见蓝色主体',position_analysis:'主体区域',illumination_analysis:'均匀照明',normal_explanation:'可见正常变化',evidence_ids:source.raw_evidence_keys,suspects:[]}]))]));
   }else{
    learned++;
    const evidence=value.messages[0].content.filter(item=>item.type==='text'&&item.text.startsWith('视觉证据：')).map(item=>JSON.parse(item.text.slice(5)));
    const parent=JSON.parse(prompt.split('冻结父版本候选：')[1].split('\n')[0]);
    result={summary:'可见蓝色主体',checks:[{title:'蓝色主体',subject:'面板',location:'全图',criterion:'主体为蓝色，保留实际表面变化',allowed_variations:[],support_evidence_ids:evidence.filter(item=>item.representation==='raw').map(item=>item.evidence_id),counter_evidence_ids:[],limitations:[],status:'supported'}],suspects:[],limitations:[],revisions:(parent.checks||[]).map(check=>({previous_check_id:check.check_id,current_check_titles:['蓝色主体'],reason:'保留原可见判据'}))};
   }
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]}));return;
  }
  if(pathname==='/browser.js'){res.setHeader('Content-Type','application/javascript');res.end(bundle.outputFiles[0].contents);return;}
  if(pathname==='/'){res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<meta charset="utf-8"><div id="root"></div><script>window.fixture='+JSON.stringify(fixture)+'</script><script src="/browser.js"></script>');return;}
  await api(req,res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 const names=['LIVE_VLM_ENDPOINT','LIVE_VLM_MODEL','LIVE_VLM_CAPACITY_MODE'];const previous=Object.fromEntries(names.map(name=>[name,process.env[name]]));
 process.env.LIVE_VLM_ENDPOINT=base+'/model/v1';process.env.LIVE_VLM_MODEL='publication-model';process.env.LIVE_VLM_CAPACITY_MODE='vllm_tokenize';
 const read=async route=>{const r=await fetch(base+'/api/iad/'+route);assert.equal(r.status,200,await r.clone().text());return r.json();};
 const post=async(route,body)=>{const r=await fetch(base+'/api/iad/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return r.json();};
 let driver;
 try{
  const dataset=await post('datasets/import',{name:'分批发布',format:'labelme',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
  let job=await post('analysis/start',{analysis_kind:'knowledge',dataset_ids:[dataset.dataset_id],batch_size:2,mining_prompt:{objective:'观察真实主体',directions:[],instruction:'联合观察图像并保留真实引用。\n{{response_schema}}'}});
  for(let i=0;i<300;i++){job=await read('analysis/status/'+job.run_id);if(job.completed===2&&held)break;await delay(30);}
  assert.equal(job.completed,2,JSON.stringify(job.errors));assert.ok(held);assert.equal(job.status,'RUNNING');
  const firstVersion=job.knowledge_version_id;fixture={dataset,job};
  const options=new firefox.Options().addArguments('-headless').setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  await driver.manage().window().setRect({width:1600,height:1100});await driver.get(base);
  const element=selector=>driver.wait(until.elementLocated(By.css(selector)),10000);
  await(await element('button[data-view-entry]')).click();const note=await element('#review-note');await note.sendKeys('保留尚未提交的复核依据');
  const evidenceBefore=await(await element('[data-evidence-role="support"] img')).getAttribute('src');assert.ok(evidenceBefore.includes(firstVersion));
  release();
  for(let i=0;i<300;i++){job=await read('analysis/status/'+job.run_id);if(!['RUNNING','PENDING'].includes(job.status))break;await delay(30);}
  assert.equal(job.status,'COMPLETED',JSON.stringify(job.errors));assert.equal(job.completed,4);assert.notEqual(job.knowledge_version_id,firstVersion);
  await driver.wait(async()=>/已完成/.test(await(await element('tr[data-pick-job="'+job.run_id+'"]')).getText()),10000);
  assert.equal((await driver.findElements(By.css('dialog[aria-label="知识条目详情"][open]'))).length,1,'后台发布不能关闭正在阅读的旧版本');
  assert.equal(await(await element('#review-note')).getAttribute('value'),'保留尚未提交的复核依据');
  assert.equal(await(await element('[data-evidence-role="support"] img')).getAttribute('src'),evidenceBefore,'正在查看的证据必须固定在打开时的版本');
  await(await element('#close-detail')).click();await(await element('button[data-view-entry]')).click();
  await driver.wait(async()=>(await(await element('[data-evidence-role="support"] img')).getAttribute('src')).includes(job.knowledge_version_id),10000);
  assert.equal(await(await element('#review-note')).getAttribute('value'),'','重新打开查看最新版本，不继承另一版本的未提交备注');
 }finally{
  release();await driver?.quit();bridge.destroy();await new Promise(resolve=>server.close(resolve));
  for(const name of names)if(previous[name]===undefined)delete process.env[name];else process.env[name]=previous[name];
  await fs.rm(root,{recursive:true,force:true});
 }
});
