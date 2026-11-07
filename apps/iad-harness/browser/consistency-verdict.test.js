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
   const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=JSON.parse(Buffer.concat(chunks));modelCalls++;
   const frozen=JSON.parse(body.messages[0].content[0].text.split('冻结图组：')[1]);
   const assessments=Object.entries(frozen.candidates).map(([candidate_id,member])=>{
    const source=Object.values(frozen.sources).find(source=>source.sample_id===candidate_id);
    const encoded=JSON.stringify(source);
    const verdict=encoded.includes('equivalent.png')?'EQUIVALENT':'MATERIAL';
    const conclusion=encoded.includes('different.png')?'标注类别不同':encoded.includes('shifted.png')?'标注位置偏移':'未发现标注差异';
    return {candidate_id,verdict,categories:conclusion==='标注类别不同'?['类别不一致']:conclusion==='标注位置偏移'?['位置差异']:[],conclusion,explanation:verdict==='EQUIVALENT'?'两侧均有5个类别15的标注，位置与覆盖范围对应，无漏标或多标。':encoded.includes('different.png')?'对应标注的类别值从15变为18。':'标注框左边界向右偏移4像素。',findings:verdict==='MATERIAL'?[conclusion]:[]};
   });
   const references=Object.entries(frozen.candidates).map(([candidate_id,member])=>({candidate_id,comparison:{result_id:member.comparison.result_id,evidence_id:member.comparison.evidence_id}}));
   const result={assessments,overall:{verdict:'MATERIAL',text:'标注类别和位置不同',references},conclusions:[{text:'本组分别存在标注类别改变与标注框左边界偏移。',references}],limitations:[]};
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]}));return;
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
  const started=await bridge.execute('consistency_group_analyze',{request:{...reference,request_id:'verdict-regression'}});
  let analysis;
  for(let i=0;i<300;i++){analysis=await bridge.execute('consistency_group_analysis',reference);if(!['RUNNING','PENDING'].includes(analysis.status))break;await new Promise(r=>setTimeout(r,30));}
  assert.equal(analysis.status,'COMPLETED',JSON.stringify(analysis));assert.ok(modelCalls);assert.equal(analysis.result.overall.verdict,'MATERIAL');
  const item=gallery.items[0];
  fixture={queryId:report.page.query_id,conflict:{id:item.group_id,type:'标注待核对',types:item.conflict_categories,filename:'anchor.png',url:'',fullUrl:'',sourceWidth:945,sourceHeight:678,memberCount:item.member_count,review:'pending',model:{status:'conflict',modelType:'存在实质差异'},rawItem:item}};
  const options=new firefox.Options().addArguments('-headless').setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  await driver.manage().window().setRect({width:1600,height:1100});await driver.get(base);
  const element=selector=>driver.wait(until.elementLocated(By.css(selector)),10000);
  await element('[data-dc="candidate"]');
  for(const [name,verdict] of [['equivalent','未发现标注差异'],['different','标注类别不同'],['shifted','标注位置偏移']]){
   const members=await bridge.execute('consistency_gallery_members',reference);
   const index=members.items.findIndex(m=>m.image.sample.relative_path.includes(name));
   assert.ok(index>=0,name);await(await element('[data-dc="candidate"][data-id="'+index+'"]')).click();
   await driver.wait(async()=>(await(await driver.findElements(By.css('.dc-photo-filename')))[1].getText()).includes(name),5000);
   await driver.wait(async()=>await(await element('.dc-conclusion-panel .dc-verdict-value')).getText()===verdict,5000,'当前候选必须展示模型实际写出的结论，不能用图组文案或二分类标签代替');
   assert.equal(await(await element('.dc-fact-panel h3')).getText(),'判定结论');
  }
  execFileSync(bridge.pythonPath,['-c',`import sqlite3,json,sys
c=sqlite3.connect(sys.argv[1]);raw=c.execute('SELECT payload_json FROM job_runs WHERE job_id=?',(sys.argv[2],)).fetchone()[0];p=json.loads(raw)
for result in [p['group_analysis'],*[batch['result'] for batch in p['group_analysis_batches']]]:
 result['overall']['text']='类别或位置不同'
 for item in result['assessments']:item['conclusion']='缺少或多出标注'
c.execute('UPDATE job_runs SET payload_json=? WHERE job_id=?',(json.dumps(p),sys.argv[2]));c.commit()`,path.join(root,'test.db'),started.run_id]);
  await driver.navigate().refresh();
  await driver.wait(async()=>(await(await element('.dc-conclusion-panel .dc-verdict-value')).getText()).includes('或'),5000);
  await(await element('[data-dc="reanalyze"]')).click();
  await driver.wait(async()=>{
   const view=await bridge.execute('consistency_group_analysis',reference);
   return view.run_id!==started.run_id&&view.status==='COMPLETED';
  },10000,'重新分析必须在原图组上保存并显示新的模型输出');
  await driver.wait(async()=>!(await(await element('.dc-conclusion-panel .dc-verdict-value')).getText()).includes('或'),5000);
  assert.equal(modelCalls,2,'历史备选答案必须实际重新请求模型，不得通过前端改字或直接复用旧回答');
  const historical=execFileSync(bridge.pythonPath,['-c',`import sqlite3,json,sys
c=sqlite3.connect(sys.argv[1]);print(json.loads(c.execute('SELECT payload_json FROM job_runs WHERE job_id=?',(sys.argv[2],)).fetchone()[0])['group_analysis']['overall']['text'])`,path.join(root,'test.db'),started.run_id],{encoding:'utf8'}).trim();
  assert.equal(historical,'类别或位置不同');
 }finally{await driver?.quit();bridge.destroy();await new Promise(resolve=>server.close(resolve));for(const [k,v] of Object.entries(previous))if(v===undefined)delete process.env[k];else process.env[k]=v;await fs.rm(root,{recursive:true,force:true});}
});
