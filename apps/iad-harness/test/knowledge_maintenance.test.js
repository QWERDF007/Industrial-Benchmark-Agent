import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {PythonBridge,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';

test('human maintenance deletes terminal jobs without erasing knowledge and removes checks in a new version', {timeout:30000}, async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-knowledge-maintenance-'));
 execFileSync(resolvePythonPath(),[fileURLToPath(new URL('fixtures/knowledge_dataset.py',import.meta.url)),root]);
 let hold=false,entered,release;let generations=0;
 const model=http.createServer(async(req,res)=>{
  let raw='';for await(const c of req)raw+=c;const body=JSON.parse(raw);res.setHeader('Content-Type','application/json');
  if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:32768}));return;}
  generations++;if(hold){entered();await new Promise(resolve=>release=resolve);}
  const refs=body.messages[0].content.filter(p=>p.type==='text'&&p.text.startsWith('视觉证据：')).map(p=>JSON.parse(p.text.slice(5)).evidence_id);
  const check={title:'主体轮廓',subject:'主体',location:'全图',criterion:'可见连续平面',allowed_variations:[],support_evidence_ids:refs,counter_evidence_ids:[],limitations:[],status:'supported'};
  res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({summary:'可见平面与轮廓',checks:[check,{...check,title:'颜色分布',criterion:'表面颜色连续'}],suspects:[],limitations:[]})}}]}));
 });
 await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));
 const env={LIVE_VLM_ENDPOINT:`http://127.0.0.1:${model.address().port}/v1`,LIVE_VLM_MODEL:'maintenance-model',LIVE_VLM_CAPACITY_MODE:'vllm_tokenize',IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES:'2'};
 const previous=Object.fromEntries(Object.keys(env).map(k=>[k,process.env[k]]));Object.assign(process.env,env);
 const bridge=new PythonBridge({dbPath:path.join(root,'test.db')});
 const api=http.createServer(createIadHttpHandler(bridge));await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${api.address().port}/api/iad`;
 const get=async url=>{const r=await fetch(base+url);assert.equal(r.status,200,await r.clone().text());return r.json();};
 const post=async(url,body)=>{const r=await fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return r.json();};
 const terminal=async job=>{const deadline=Date.now()+8000;while(['PENDING','RUNNING'].includes(job.status)&&Date.now()<deadline){await delay(20);job=await get('/knowledge/status/'+job.run_id);}return job;};
 try{
  const dataset=await post('/datasets/import',{format:'labelme',name:'可维护知识',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
  const scope=await post('/knowledge/scopes/open',{dataset_id:dataset.dataset_id,kind:'normal',objective:'验证维护不改变已观察范围'});
  const sources=await get(`/knowledge/sources?dataset_id=${dataset.dataset_id}&kind=normal`);const ids=sources.items.map(s=>s.sample_id);
  const body={kind:'normal',image_count:ids.length,images:ids};
  const job=await terminal(await post('/knowledge/scopes/'+scope.scope_run_id+'/start',body));assert.equal(job.status,'COMPLETED',JSON.stringify(job.errors));
  const original=(await get('/knowledge?version_id='+job.knowledge_version_id)).knowledge;
  const waiting=await post('/knowledge/scopes/open',{dataset_id:dataset.dataset_id,kind:'normal',starting_version_id:original.version_id,objective:'已选知识在执行前由人工维护'});
  const checkId=original.checks[0].check_id;
  hold=true;const reached=new Promise(resolve=>entered=resolve);
  const running=await post('/knowledge/start',body);await reached;
  assert.equal((await fetch(base+'/knowledge/jobs/'+running.run_id,{method:'DELETE'})).status,422,'Running jobs must be cancelled first');
  const removal={submission_id:randomUUID(),check_id:checkId};
  const removeUrl='/knowledge/versions/'+original.version_id+'/checks/remove';
  assert.equal((await fetch(base+removeUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(removal)})).status,422,'Do not invalidate in-flight mining silently');
  await post('/knowledge/cancel/'+running.run_id,{});hold=false;release();
  assert.equal((await terminal(running)).status,'CANCELLED');
  const deleted=await fetch(base+'/knowledge/jobs/'+job.run_id,{method:'DELETE'});assert.equal(deleted.status,200,await deleted.clone().text());
  assert.equal((await get('/knowledge/jobs?dataset_id='+dataset.dataset_id)).jobs.some(j=>j.run_id===job.run_id),false);
  const historicalJob=await get('/knowledge/status/'+job.run_id);assert.ok(historicalJob.deleted_at);assert.equal(historicalJob.model_calls.length,job.model_calls.length);
  assert.equal((await fetch(base+'/knowledge/jobs/'+job.run_id,{method:'DELETE'})).status,200);
  assert.equal((await get('/knowledge/status/'+job.run_id)).deleted_at,historicalJob.deleted_at);
  assert.equal((await fetch(base+'/knowledge/retry/'+job.run_id,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,422);
  assert.deepEqual((await get('/knowledge?version_id='+original.version_id)).knowledge,original);
  let progress=await get('/knowledge/scopes/'+scope.scope_run_id);assert.equal(progress.observed,ids.length);assert.equal(progress.remaining,0);
  const version=await post(removeUrl,removal);
  assert.notEqual(version.version_id,original.version_id);
  const current=(await get(`/knowledge?dataset_id=${dataset.dataset_id}&kind=normal`)).knowledge;
  assert.equal((await get('/knowledge?version_id='+current.version_id)).freshness.status,'current','Human maintenance inherits the actual mining generation check');
  assert.equal(current.version_id,version.version_id);assert.equal(current.parent_version_id,original.version_id);
  assert.deepEqual(current.checks.map(c=>c.check_id),[original.checks[1].check_id]);assert.equal(current.manual_edit.submission_id,removal.submission_id);
  assert.deepEqual((await get('/knowledge?version_id='+original.version_id)).knowledge,original);
  assert.equal(generations,2,'Maintenance never launches a model call');
  assert.deepEqual(await post(removeUrl,removal),version,'A repeated submission publishes once');
  assert.equal((await fetch(base+removeUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...removal,check_id:original.checks[1].check_id})})).status,422,'Submission identity cannot change its meaning');
  assert.equal((await fetch(base+removeUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...removal,submission_id:randomUUID()})})).status,422,'Stale editors cannot overwrite the head');
  progress=await get('/knowledge/scopes/'+scope.scope_run_id);assert.equal(progress.current_version_id,version.version_id);assert.equal(progress.observed,ids.length);assert.equal(progress.remaining,0);
  const waitingState=await get('/knowledge/scopes/'+waiting.scope_run_id);assert.equal(waitingState.current_version_id,version.version_id);assert.equal(waitingState.observed,ids.length,'Explicit starting knowledge retains its actual historical observations without counting maintenance as new images');assert.equal(waitingState.remaining,0);
  const last=await post('/knowledge/versions/'+version.version_id+'/checks/remove',{submission_id:randomUUID(),check_id:current.checks[0].check_id});
  assert.equal((await get('/knowledge?version_id='+last.version_id)).knowledge.checks.length,0,'Removing the last check is a valid unready state');
  const frozen=original.evidence[0].image;assert.equal((await fetch(base+`/knowledge/evidence/${original.version_id}/${frozen.evidence_id}`)).status,200,'Deleting a job keeps frozen evidence accessible');
 }finally{
  if(release)release();bridge.destroy();await new Promise(resolve=>api.close(resolve));await new Promise(resolve=>model.close(resolve));
  for(const [k,v] of Object.entries(previous)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
  await fs.rm(root,{recursive:true,force:true});
 }
});
