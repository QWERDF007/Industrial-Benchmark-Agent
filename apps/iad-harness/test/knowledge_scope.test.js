import {observationMatrix} from './fixtures/knowledge-observations.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {PythonBridge,createIadHttpHandler} from '../lib/server/index.js';

test('continuous workbench range: 43 frozen images in groups of 20 / 20 / 3',{timeout:60000},async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-continuous-range-'));
 let bridge=new PythonBridge({dbPath:path.join(root,'test.db')});
 execFileSync(bridge.pythonPath,[fileURLToPath(new URL('fixtures/knowledge_scope_dataset.py',import.meta.url)),root]);
 const generations=[];
 const model=http.createServer(async(req,res)=>{
  let text='';for await(const chunk of req)text+=chunk;const body=JSON.parse(text);res.setHeader('Content-Type','application/json');
  if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:32768}));return;}
  generations.push(body);const content=body.messages[0].content,prompt=content[0].text;
  const images=content.filter(item=>item.type==='text'&&item.text.startsWith('视觉证据：')).map(item=>JSON.parse(item.text.slice(5)));
  let result;
  if(body.response_format.json_schema.name==='KnowledgeObservations'){
   const scope=JSON.parse(prompt.split('冻结观察请求：')[1].split('\n请根据图像')[0]);
   result=observationMatrix(scope,source=>({status:'supports',description:'结构可见',position_analysis:'主体',illumination_analysis:'均匀',normal_explanation:'允许亮度变化',evidence_ids:source.raw_evidence_keys,suspects:[]}));
  }else{
   const previous=JSON.parse(prompt.split('冻结父版本候选：')[1].split('\n')[0]);
   result={summary:'可见主体结构',checks:[{title:'结构',subject:'主体',location:'中部',criterion:'存在完整轮廓',allowed_variations:[],support_evidence_ids:images.map(image=>image.evidence_id),counter_evidence_ids:[],limitations:[],status:'supported'}],suspects:[],limitations:[],revisions:previous.checks.map(check=>({previous_check_id:check.check_id,current_check_titles:['结构'],reason:'同一判据的新增证据'}))};
  }
  res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]}));
 });
 await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));
 const env={LIVE_VLM_ENDPOINT:`http://127.0.0.1:${model.address().port}/v1`,LIVE_VLM_MODEL:'range-test-model',LIVE_VLM_CAPACITY_MODE:'vllm_tokenize',IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES:'2'};
 const previous=Object.fromEntries(Object.keys(env).map(key=>[key,process.env[key]]));Object.assign(process.env,env);
 let handler=createIadHttpHandler(bridge);const server=http.createServer((req,res)=>handler(req,res));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/api/iad`;
 const api=async(url,body)=>{const response=await fetch(base+url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});assert.equal(response.status,200,await response.clone().text());return response.json();};
 try{
  const dataset=await api('/datasets/import',{format:'labelme',name:'连续范围',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
  const scope=await api('/knowledge/scopes/open',{dataset_id:dataset.dataset_id,kind:'normal',objective:'每次20张，持续挖掘全部43张良品'});
  assert.equal(scope.total,43);assert.equal(scope.observed,0);assert.equal(generations.length,0);
  let preset=null;const runs=[],versions=[];
  for(const count of [20,20,3]){
   const page=await api('/knowledge/sources?'+new URLSearchParams({dataset_id:dataset.dataset_id,kind:'normal',scope_run_id:scope.scope_run_id,page_size:'20'}));assert.equal(page.items.length,count);
   let job=await api(`/knowledge/scopes/${scope.scope_run_id}/start`,{kind:'normal',image_count:count,images:page.items.map(item=>item.sample_id),knowledge_preset:preset?[preset]:[]});
   while(['PENDING','RUNNING'].includes(job.status)){await delay(20);job=await api(`/knowledge/status/${job.run_id}`);}
   assert.equal(job.status,'COMPLETED',JSON.stringify(job.errors));runs.push(job.run_id);
   const version=(await api('/knowledge?'+new URLSearchParams({version_id:job.knowledge_version_id}))).knowledge;
   assert.equal(version.parent_version_id,preset);assert.equal(version.scope_run_id,scope.scope_run_id);assert.equal(version.observed_source_ids.length,count);versions.push(version.version_id);preset=version.version_id;
   const progress=await api(`/knowledge/scopes/${scope.scope_run_id}`);assert.equal(progress.current_version_id,preset);
   if(count===20&&versions.length===1){assert.equal(progress.observed,20);assert.equal(progress.remaining,23);await fs.copyFile(path.join(root,'images/part-00.png'),path.join(root,'images/added.png'));await api(`/datasets/${dataset.dataset_id}/rescan`,{});
    const beforeRestart=generations.length;bridge.destroy();bridge=new PythonBridge({dbPath:path.join(root,'test.db')});handler=createIadHttpHandler(bridge);
    const restored=await api(`/knowledge/scopes/${scope.scope_run_id}`);assert.equal(restored.observed,20);assert.equal(restored.remaining,23);assert.equal(restored.current_version_id,preset);assert.equal(generations.length,beforeRestart,'Restart restores references without starting a model');
   }
  }
  const progress=await api(`/knowledge/scopes/${scope.scope_run_id}`);assert.equal(progress.total,43);assert.equal(progress.observed,43);assert.equal(progress.remaining,0);assert.deepEqual(progress.run_ids,runs);assert.deepEqual(progress.version_ids,versions);
  assert.ok(generations.every(body=>body.messages[0].content.filter(item=>item.type==='image_url').length<=20));
  const beforeStop=generations.length;await api(`/knowledge/scopes/${scope.scope_run_id}/stop`,{});assert.equal((await api(`/knowledge/scopes/${scope.scope_run_id}`)).status,'STOPPED');assert.equal(generations.length,beforeStop);
  const actor='scope-test-session';
  const firstActorScope=await bridge.execute('knowledge_scope_open',{request:{dataset_id:dataset.dataset_id,kind:'normal',objective:'第一个连续任务'},origin_session_id:actor});
  await api(`/knowledge/scopes/${firstActorScope.scope_run_id}/stop`,{});
  const secondActorScope=await bridge.execute('knowledge_scope_open',{request:{dataset_id:dataset.dataset_id,kind:'normal',objective:'第二个连续任务'},origin_session_id:actor});
  await assert.rejects(bridge.execute('knowledge_scope_resume',{scope_run_id:firstActorScope.scope_run_id,origin_session_id:actor}),/活动连续范围/,'One session cannot silently bind learning to a different active scope');
  assert.equal((await api(`/knowledge/scopes/${firstActorScope.scope_run_id}`)).status,'STOPPED');
  assert.equal((await api(`/knowledge/scopes/${secondActorScope.scope_run_id}`)).status,'ACTIVE');
 }finally{bridge.destroy();await new Promise(resolve=>server.close(resolve));await new Promise(resolve=>model.close(resolve));for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}await fs.rm(root,{recursive:true,force:true});}
});
