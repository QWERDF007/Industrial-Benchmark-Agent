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
test('candidate conclusion uses its model statement without substituting a category or group summary',{timeout:90000},async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-consistency-verdict-'));
 const bridge=new PythonBridge({cwd:path.resolve(app,'../..'),dbPath:path.join(root,'test.db')});
 execFileSync(bridge.pythonPath,['-c',`import json,sys
from pathlib import Path
from PIL import Image,ImageDraw
p=Path(sys.argv[1]);(p/'images').mkdir();(p/'labels').mkdir()
for name,width,label in [('anchor',945,'15'),('equivalent',945,'15'),('different',945,'18'),('shifted',945,'15')]:
 im=Image.new('RGB',(width,678),'#197fe5');ImageDraw.Draw(im).rectangle((40,60,70,600),fill='#47c3ea')
 if name=='equivalent':im.putpixel((0,0),(1,2,3))
 im.save(p/'images'/f'{name}.png')
 (p/'labels'/f'{name}.json').write_text(json.dumps({'imageWidth':width,'imageHeight':678,'shapes':[{'label':label,'shape_type':'rectangle','points':[[40+i+(4 if name=='shifted' else 0),60+i*100],[50+i,90+i*100]]} for i in range(5)]}))`,root]);
 const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';
import {ConsistencyConflictDialog} from './src/client/components/ConsistencyConflictDialog.tsx';
import {workbenchStyles} from './src/client/styles.ts';
async function main(){const result=window.fixture;createRoot(document.getElementById('root')).render(<div className="iad-workbench"><style>{workbenchStyles}</style><ConsistencyConflictDialog conflict={result.conflict} items={[result.conflict]} queryId={result.queryId} onSelect={()=>{}} onClose={()=>{}} onReviewed={()=>{}}/></div>)}main();`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
 const api=createIadHttpHandler(bridge);let fixture,modelCalls=0;
 const server=http.createServer(async(req,res)=>{
  if(req.url==='/tokenize'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({count:1000,max_model_len:262144}));return;}
  if(req.url==='/v1/chat/completions'){
   modelCalls++;res.writeHead(500);res.end('Historical result reads must not invoke a model');return;
  }
  if(req.url==='/browser.js'){res.setHeader('Content-Type','application/javascript');res.end(bundle.outputFiles[0].contents);return;}
  if(req.url==='/'){res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<meta charset="utf-8"><div id="root"></div><script>window.fixture='+JSON.stringify(fixture)+'</script><script src="/browser.js"></script>');return;}
  await api(req,res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 const values={LIVE_VLM_ENDPOINT:base+'/v1',LIVE_VLM_MODEL:'verdict-fixture',LIVE_VLM_CAPACITY_MODE:'vllm_tokenize'};
 const previous=Object.fromEntries(Object.keys(values).map(k=>[k,process.env[k]]));Object.assign(process.env,values);
 let driver;
 try{
  const dataset=await bridge.execute('dataset_import',{format:'labelme',name:'一致性判定',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
  execFileSync(bridge.pythonPath,['-c',`import sys
from pathlib import Path
from tests.feature_fixtures import configure_test_encoder
from iad_core.storage.database import Database
configure_test_encoder(Database(sys.argv[1]),Path(sys.argv[2]))`,path.join(root,'test.db'),root],{env:{...process.env,PYTHONPATH:path.resolve(app,'../../python')+':'+path.resolve(app,'../..')}});
  for(const name of ['equivalent','different','shifted']){
   const pair=await bridge.execute('consistency_compare',{sample_a:dataset.dataset_id+':anchor.png',sample_b:dataset.dataset_id+':'+name+'.png'});
   assert.equal(pair.verification.relation,name==='equivalent'?'NEAR_CANDIDATE':'EXACT');
  }
  const report=await bridge.execute('consistency_report',{selection:{kind:'scope',subjects:{kind:'all_registered'},mode:'combined'}});
  const gallery=await bridge.execute('consistency_gallery',{query_id:report.page.query_id,kind:'conflicts'});assert.equal(gallery.total,1);
  const reference={query_id:report.page.query_id,kind:'conflicts',group_id:gallery.items[0].group_id};
  execFileSync(bridge.pythonPath,['-c',`import sys,json
from iad_core.storage.database import Database
from tests.consistency_history import save_group_history
save_group_history(Database(sys.argv[1]),json.loads(sys.argv[2]),{'equivalent.png':'一致','different.png':'类别不一致','shifted.png':'位置差异'})`,path.join(root,'test.db'),JSON.stringify(reference)],{env:{...process.env,PYTHONPATH:path.resolve(app,'../../python')+':'+path.resolve(app,'../..')}});
  const analysis=await bridge.execute('consistency_group_analysis',reference);
  assert.equal(analysis.status,'COMPLETED',JSON.stringify(analysis));assert.equal(modelCalls,0);assert.equal(analysis.result.overall.verdict,'MATERIAL');
  const item=gallery.items[0];
  fixture={queryId:report.page.query_id,conflict:{id:item.group_id,type:'标注待核对',types:item.conflict_categories,filename:'anchor.png',url:'',fullUrl:'',sourceWidth:945,sourceHeight:678,memberCount:item.member_count,review:'pending',model:{status:'conflict',modelType:'存在实质差异'},rawItem:item}};
  const options=new firefox.Options().addArguments('-headless').setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  await driver.manage().window().setRect({width:1600,height:1100});await driver.get(base);
  const element=selector=>driver.wait(until.elementLocated(By.css(selector)),10000);
  await element('[data-dc="candidate"]');
  assert.equal((await driver.findElements(By.css('[data-dc="reanalyze"]'))).length,0,'图像弹窗不提供单独重新分析入口');
  for(const [name,verdict] of [['equivalent','一致'],['different','类别不一致'],['shifted','位置差异']]){
   const members=await bridge.execute('consistency_gallery_members',reference);
   const index=members.items.findIndex(m=>m.image.sample.relative_path.includes(name));
   assert.ok(index>=0,name);await(await element('[data-dc="candidate"][data-id="'+index+'"]')).click();
   await driver.wait(async()=>(await(await driver.findElements(By.css('.dc-photo-filename')))[1].getText()).includes(name),5000);
   await driver.wait(async()=>await(await element('.dc-conclusion-panel .dc-verdict-value')).getText()===verdict,5000,'当前候选必须展示模型实际写出的结论，不能用图组文案或二分类标签代替');
   assert.equal(await(await element('.dc-fact-panel h3')).getText(),'判定结论');
  }
 }finally{await driver?.quit();bridge.destroy();await new Promise(resolve=>server.close(resolve));for(const [k,v] of Object.entries(previous))if(v===undefined)delete process.env[k];else process.env[k]=v;await fs.rm(root,{recursive:true,force:true});}
});
