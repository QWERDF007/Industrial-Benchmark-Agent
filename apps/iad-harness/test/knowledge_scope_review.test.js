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

test('continuous range rechecks human dispositions without counting historical images twice',{timeout:120000},async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-scope-review-'));
 const bridge=new PythonBridge({dbPath:path.join(root,'test.db')});
 execFileSync(bridge.pythonPath,[fileURLToPath(new URL('fixtures/knowledge_scope_dataset.py',import.meta.url)),root]);
 let contradiction=null,calls=0,hold=null,recheckStatus='resolved';const holds=[];
 const model=http.createServer(async(req,res)=>{
  let text='';for await(const chunk of req)text+=chunk;const body=JSON.parse(text);res.setHeader('Content-Type','application/json');
  if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:32768}));return;}
  calls++;const content=body.messages[0].content,prompt=content[0].text;
  if(hold&&body.response_format.json_schema.name==='KnowledgeDraft'){const gate=hold;hold=null;gate.entered.resolve();await gate.release.promise;}
  const images=content.filter(item=>item.type==='text'&&item.text.startsWith('视觉证据：')).map(item=>JSON.parse(item.text.slice(5)));
  let result;
  if(body.response_format.json_schema.name==='KnowledgeObservations'){
   const scope=JSON.parse(prompt.split('冻结观察请求：')[1].split('\n请根据图像')[0]);
   result=observationMatrix(scope,source=>({status:source.sample_id===contradiction?'contradicts':'supports',description:'图像与判据的实际对照',position_analysis:'主体',illumination_analysis:'均匀',normal_explanation:'可能为允许变化',evidence_ids:source.raw_evidence_keys,suspects:[]}));
  }else if(body.response_format.json_schema.name==='KnowledgeRecheckResult'){
   const scope=JSON.parse(prompt.split('人工处置重核验：')[1].split('\n请根据图像')[0]);
   result={decisions:scope.events.map(event=>({submission_id:event.submission_id,status:recheckStatus,description:'真实新旧证据支持人工建议，异常图移出正常支持',evidence_ids:images.filter(item=>item.representation==='raw').map(item=>item.evidence_id),limitations:[]}))};
  }else{
   const previous=JSON.parse(prompt.split('冻结父版本候选：')[1].split('\n')[0]);
   result={summary:'可见主体结构',checks:[{title:'结构',subject:'主体',location:'中部',criterion:'存在完整轮廓',allowed_variations:[],support_evidence_ids:images.map(image=>image.evidence_id),counter_evidence_ids:[],limitations:[],status:'supported'}],suspects:[],limitations:[],revisions:previous.checks.map(check=>({previous_check_id:check.check_id,current_check_titles:['结构'],reason:'同一判据的新增证据'}))};
  }
  res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]}));
 });
 await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));
 const env={LIVE_VLM_ENDPOINT:`http://127.0.0.1:${model.address().port}/v1`,LIVE_VLM_MODEL:'review-range-model',LIVE_VLM_CAPACITY_MODE:'vllm_tokenize',IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES:'2'};
 const previous=Object.fromEntries(Object.keys(env).map(key=>[key,process.env[key]]));Object.assign(process.env,env);
 const server=http.createServer(createIadHttpHandler(bridge));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/api/iad`;
 const api=async(url,body,status=200)=>{const response=await fetch(base+url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});assert.equal(response.status,status,await response.clone().text());return response.json();};
 const finish=async job=>{while(['PENDING','RUNNING'].includes(job.status)){await delay(20);job=await api(`/knowledge/status/${job.run_id}`);}assert.equal(job.status,'COMPLETED',JSON.stringify(job.errors));return (await api(`/knowledge?version_id=${job.knowledge_version_id}`)).knowledge;};
 try{
  const dataset=await api('/datasets/import',{format:'labelme',name:'冲突连续范围',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
  const scope=await api('/knowledge/scopes/open',{dataset_id:dataset.dataset_id,kind:'normal',objective:'持续归纳，并人工核实冲突后继续'});
  const sourceQuery='/knowledge/sources?'+new URLSearchParams({dataset_id:dataset.dataset_id,kind:'normal',scope_run_id:scope.scope_run_id,page_size:'3'});
  const sourceIds=(await api(sourceQuery)).items.map(item=>item.sample_id),start=`/knowledge/scopes/${scope.scope_run_id}/start`;
  const first=await finish(await api(start,{kind:'normal',image_count:2,images:sourceIds.slice(0,2)}));
  contradiction=sourceIds[2];
  const conflicted=await finish(await api(start,{kind:'normal',image_count:1,images:[sourceIds[2]],knowledge_preset:[first.version_id]}));
  const conflict=conflicted.conflicts[0];assert.ok(conflict);
  await api(`/knowledge/scopes/${scope.scope_run_id}/stop`,{});
  const reference={version_id:conflicted.version_id,conflict_id:conflict.conflict_id};
  const context=await api('/review/knowledge?'+new URLSearchParams(reference));
  await api('/review/knowledge',{...reference,submission_id:crypto.randomUUID(),context_signature:context.context_signature,reviewer:'人工复核员',action:'retain',reason:'异常来源移出正常支持，保留判据并核验'});
  await api('/review/submit',{submission_id:crypto.randomUUID(),dataset_id:dataset.dataset_id,sample_id:sourceIds[2],reviewer:'人工复核员',decision:'FAIL',comment:'确认图像异常，仅作比较证据'});
  const countBefore=calls,body={kind:'normal',image_count:1,images:[sourceIds[0]],knowledge_preset:[conflicted.version_id]};
  await api(start,body,422);assert.equal(calls,countBefore,'Human feedback must not resume a stopped task');
  await api(`/knowledge/scopes/${scope.scope_run_id}/resume`,{});
  const candidates=await api(sourceQuery+'&include_observed=true');
  assert.ok(candidates.items.some(item=>item.sample_id===sourceIds[0]),'Explicit recheck selection includes historical eligible support');
  contradiction=null;
  for(const outcome of ['insufficient','unresolved']){
   recheckStatus=outcome;
   const pendingVersion=await finish(await api(start,body));
   assert.equal(pendingVersion.conflicts[0].resolution.status,outcome);
   const pendingContext=await api('/review/knowledge?'+new URLSearchParams({version_id:pendingVersion.version_id,conflict_id:conflict.conflict_id}));
   assert.equal(pendingContext.state,'pending_recheck','Inadequate or contradictory evidence never closes human follow-up');
   assert.ok(pendingVersion.checks.every(check=>check.status==='conflicted'));
   assert.equal((await api(`/knowledge/scopes/${scope.scope_run_id}`)).pending_review,1);
   body.knowledge_preset=[pendingVersion.version_id];
  }
  recheckStatus='resolved';
  const rechecked=await finish(await api(start,body));
  assert.equal(rechecked.scope_run_id,scope.scope_run_id);assert.equal(rechecked.parent_version_id,body.knowledge_preset[0]);
  assert.ok(rechecked.comparison_sources.some(source=>source.sample_id===sourceIds[2]));assert.equal(rechecked.conflicts[0].resolution.status,'resolved');
  const progress=await api(`/knowledge/scopes/${scope.scope_run_id}`);
  assert.equal(progress.observed,3,'Rechecking old support is not another new image');assert.equal(progress.remaining,40);assert.equal(progress.stale,0,'Human-confirmed exclusion is accounted for, not perpetually stale');assert.equal(progress.excluded,1);assert.equal(progress.pending_review,0);
  await api(start,{...body,knowledge_preset:[rechecked.version_id]},422);assert.equal((await api(`/knowledge/scopes/${scope.scope_run_id}`)).version_ids.length,5,'No pending human event means an already-covered group cannot be replayed');
  const next=(await api(sourceQuery)).items[0].sample_id;
  const continued=await finish(await api(start,{kind:'normal',image_count:1,images:[next],knowledge_preset:[rechecked.version_id]}));
  assert.ok(continued.comparison_sources.some(source=>source.sample_id===sourceIds[2]),'Explicit continuations preserve the actual excluded comparison source metadata');
  const finalProgress=await api(`/knowledge/scopes/${scope.scope_run_id}`);assert.equal(finalProgress.observed,4);assert.equal(finalProgress.remaining,39);assert.equal(finalProgress.excluded,1);assert.equal(finalProgress.stale,0);
  const gate={entered:Promise.withResolvers(),release:Promise.withResolvers()};hold=gate;holds.push(gate);
  const interruptedSource=(await api(sourceQuery)).items[0].sample_id;
  const interrupted=await api(start,{kind:'normal',image_count:1,images:[interruptedSource],knowledge_preset:[continued.version_id]});
  await gate.entered.promise;
  await api(`/knowledge/scopes/${scope.scope_run_id}/stop`,{});
  const stopping=await api(`/knowledge/status/${interrupted.run_id}`);assert.equal(stopping.cancel_requested,true);assert.ok(stopping.observation_steps.length>0,'Accepted observations survive while publication is pending');
  const observed=await api(`/knowledge/observations/${interrupted.run_id}`);
  assert.equal(observed.progress.planned_sources,1);assert.equal(observed.progress.observed_sources,1);assert.equal(observed.progress.published_sources,0);assert.equal(observed.knowledge_version_id,null);
  assert.ok(observed.items.length>0);assert.ok(observed.items.some(item=>item.observed));
  const frozenImage=await fetch(base+`/knowledge/observations/${interrupted.run_id}/evidence/${observed.items[0].image.evidence_id}`);assert.equal(frozenImage.status,200);assert.equal(frozenImage.headers.get('content-type'),'image/png');assert.ok((await frozenImage.arrayBuffer()).byteLength>0);
  await api(`/knowledge/observations/${interrupted.run_id}/evidence/invented`,undefined,404);

  assert.equal((await api(`/knowledge/scopes/${scope.scope_run_id}`)).observed,4,'Unpublished group observations do not inflate published scope coverage');
  gate.release.resolve();
  let cancelled;do{await delay(20);cancelled=await api(`/knowledge/status/${interrupted.run_id}`);}while(['PENDING','RUNNING'].includes(cancelled.status));
  assert.equal(cancelled.status,'CANCELLED');assert.equal(cancelled.knowledge_version_id,null);
  await api(`/knowledge/retry/${interrupted.run_id}`,{},422);
  await api(`/knowledge/scopes/${scope.scope_run_id}/resume`,{});
  const retried=await api(`/knowledge/retry/${interrupted.run_id}`,{});assert.equal(retried.parent_run_id,interrupted.run_id);
  const recovered=await finish(retried);assert.equal(recovered.parent_version_id,continued.version_id);
  const recoveredProgress=await api(`/knowledge/scopes/${scope.scope_run_id}`);assert.equal(recoveredProgress.observed,5);assert.equal(recoveredProgress.remaining,38);assert.equal(recoveredProgress.version_ids.length,7);
  const disputed=(await api(sourceQuery)).items[0].sample_id;contradiction=disputed;
  const disputedVersion=await finish(await api(start,{kind:'normal',image_count:1,images:[disputed],knowledge_preset:[recovered.version_id]}));
  const disputedConflict=disputedVersion.conflicts.find(item=>item.sample_id===disputed);
  const dispositionUrl='/review/knowledge?'+new URLSearchParams({version_id:disputedVersion.version_id,conflict_id:disputedConflict.conflict_id});
  let humanContext=await api(dispositionUrl);
  const disposition={version_id:disputedVersion.version_id,conflict_id:disputedConflict.conflict_id,reviewer:'人工复核员',reason:'先补证，不能自动消除矛盾'};
  await api('/review/knowledge',{...disposition,submission_id:crypto.randomUUID(),context_signature:humanContext.context_signature,action:'need_evidence'});
  const beforeMissing=calls;await api(start,{kind:'normal',image_count:1,images:[sourceIds[0]],knowledge_preset:[disputedVersion.version_id]},422);assert.equal(calls,beforeMissing,'Requiring evidence does not authorize rechecking without usable criteria');
  humanContext=await api(dispositionUrl);
  await api('/review/knowledge',{...disposition,reason:'对照实际新旧证据后建议退役此判据',submission_id:crypto.randomUUID(),context_signature:humanContext.context_signature,action:'retire'});
  assert.equal(calls,beforeMissing,'Retirement suggestion itself is not model rechecking or knowledge mutation');
  contradiction=null;
  const retired=await finish(await api(start,{kind:'normal',image_count:1,images:[sourceIds[0]],knowledge_preset:[disputedVersion.version_id]}));
  assert.equal(retired.checks.length,0);assert.equal(retired.conflicts.find(item=>item.conflict_id===disputedConflict.conflict_id).resolution.status,'resolved');
  assert.equal((await api(`/knowledge?version_id=${disputedVersion.version_id}`)).knowledge.checks.length,1,'Retiring a criterion never alters its prior version');



 }finally{for(const gate of holds)gate.release.resolve();bridge.destroy();await new Promise(resolve=>server.close(resolve));model.closeAllConnections();await new Promise(resolve=>model.close(resolve));for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}await fs.rm(root,{recursive:true,force:true});}
});
