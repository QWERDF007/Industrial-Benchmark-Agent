import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {Context} from '@deepseek-ai/cordis';
import {SystemPrompt} from '@deepseek-ai/dsh-system-prompt';
import {ToolRuntime} from '@deepseek-ai/dsh-tools';
import {SkillRegistry} from '@deepseek-ai/dsh-skill';
import {LocalAttachmentStore} from '@deepseek-ai/dsh-attachment-local';
import * as harness from '../lib/server/index.js';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';

for(const {limit,mode='vllm_tokenize',bytes,context,timeout,failure} of [{limit:null},{limit:6,failure:'images'},{limit:null,mode:null,failure:'unknown'},{limit:null,bytes:1000,failure:'bytes'},{limit:null,context:4000,failure:'context'},{limit:null,timeout:0.02,failure:'timeout'}])test(`knowledge visual capacity ${failure||limit||'complete group'}`,{timeout:30000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-visual-capacity-'));
  execFileSync(resolvePythonPath(),['-c',"from PIL import Image,ImageDraw;from pathlib import Path;import sys;p=Path(sys.argv[1]);(p/'images').mkdir();(p/'labels').mkdir();[(lambda im,i:(ImageDraw.Draw(im).rectangle((20,20,400+i*10,800),fill=(100+i,60,70)),im.save(p/'images'/f'part-{i}.png')))(Image.new('RGB',(1800,1200),(180+i,190,200)),i) for i in range(5)]",root]);
  const generations=[];
  const model=http.createServer(async(req,res)=>{
    let text='';for await(const chunk of req)text+=chunk;const body=JSON.parse(text);res.setHeader('Content-Type','application/json');
    if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:32768}));return;}
    generations.push(body);if(failure==='timeout')await delay(100);
    res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({summary:'观察记录已覆盖图组，暂无可发布判据',checks:[],suspects:[],limitations:['有限合成图']})}}]}));
  });
  await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));
  const values={LIVE_VLM_ENDPOINT:`http://127.0.0.1:${model.address().port}/v1`,LIVE_VLM_MODEL:'configured-vision-model',LIVE_VLM_CAPACITY_MODE:mode||undefined,LIVE_VLM_MAX_IMAGES:limit?.toString(),LIVE_VLM_MAX_REQUEST_BYTES:bytes?.toString(),LIVE_VLM_CONTEXT_TOKENS:context?.toString(),LIVE_VLM_TIMEOUT_SECONDS:timeout?.toString()};
  const previous=Object.fromEntries(Object.keys(values).map(key=>[key,process.env[key]]));
  for(const [key,value] of Object.entries(values)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
  const ctx=new Context();new SystemPrompt(ctx,{});new ToolRuntime(ctx);new SkillRegistry(ctx);new LocalAttachmentStore(ctx,{dshHome:path.join(root,'dsh')});
  const fork=await ctx.plugin(harness,{dbPath:path.join(root,'test.db')});
  const execute=async(name,args)=>{const result=await ctx.tools.execute({name,arguments:args,callId:crypto.randomUUID(),signal:new AbortController().signal});assert.equal(result.isError,false,JSON.stringify(result));if(result.value.status==='FAILED')assert.equal(JSON.parse(result.content[0].text).requires_user_decision,true,'The Agent-visible failure must require a user decision');return result.value;};
  try{
    const dataset=await execute('dataset_import',{format:'labelme',name:'容量',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
    const sources=await execute('knowledge_sources',{dataset_id:dataset.dataset_id,kind:'normal'});
    let job=await execute('knowledge_mine_normal',{image_count:5,images:sources.items.map(item=>item.sample_id)});
    while(['RUNNING','PENDING'].includes(job.status)){await delay(20);job=await execute('knowledge_job_status',{run_id:job.run_id,wait_seconds:0});}
    if(failure){
      assert.equal(job.status,'FAILED',JSON.stringify(job));
      assert.equal((await execute('knowledge_get',{dataset_id:dataset.dataset_id,kind:'normal'})).knowledge,null,'Insufficient capacity or failed transport never publishes partial knowledge');
      if(failure==='unknown'){assert.equal(generations.length,0);assert.match(job.errors[0].message,/容量能力未知/);}
      if(failure==='bytes'||failure==='context'||failure==='images')assert.equal(generations.length,0);
      if(failure==='timeout')assert.ok(job.model_calls.some(call=>call.error?.type?.endsWith('Timeout')));
      return;
    }
    assert.equal(job.status,'COMPLETED',JSON.stringify(job.errors));
    const knowledge=(await execute('knowledge_get',{version_id:job.knowledge_version_id})).knowledge;
    assert.equal(knowledge.observed_source_ids.length,5);
    assert.equal(generations.length,1,'The selected source group and all its native details remain one request');
    for(const body of generations){const images=body.messages[0].content.filter(item=>item.type==='image_url');assert.ok(images.length>0&&(!limit||images.length<=limit),`Actual visual inputs ${images.length} exceed limit or synthesis is text-only`);}
    const seen=new Set(generations.flatMap(body=>body.messages[0].content.filter(item=>item.type==='text'&&item.text.startsWith('视觉证据：')).map(item=>JSON.parse(item.text.slice(5)).evidence_id)));
    assert.ok(knowledge.evidence.every(item=>seen.has(item.image.evidence_id)),'Every planned full image and native ROI must really reach the model');
    assert.equal(job.request.model_profile.max_visual_inputs,limit);
    assert.equal(job.request.model_profile.capacity_mode,'vllm_tokenize');
  }finally{await fork.dispose();await new Promise(resolve=>model.close(resolve));for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}await fs.rm(root,{recursive:true,force:true});}
});

test('joint groups keep verified defect findings with their actual visual inputs',{timeout:30000},async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-defect-context-'));
 execFileSync(resolvePythonPath(),['-c',"from PIL import Image;from pathlib import Path;import sys,json;p=Path(sys.argv[1]);(p/'images').mkdir();(p/'labels').mkdir();[Image.new('RGB',(320,240),(100+i*20,120,150)).save(p/'images'/f'part-{i}.png') for i in range(5)];[(p/'labels'/f'part-{i}.json').write_text(json.dumps({'imageWidth':320,'imageHeight':240,'shapes':[{'shape_type':'rectangle','label':'待核实','points':[[60,70],[100,110]]}]})) for i in (3,4)]",root]);
 const leaks=[],calls=[];
 const model=http.createServer(async(req,res)=>{
  let text='';for await(const chunk of req)text+=chunk;const body=JSON.parse(text);res.setHeader('Content-Type','application/json');
  if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:32768}));return;}
  calls.push(body);const content=body.messages[0].content,prompt=content[0].text;
  const images=content.filter(item=>item.type==='text'&&item.text.startsWith('视觉证据：')).map(item=>JSON.parse(item.text.slice(5))),actual=new Set(images.map(item=>item.evidence_id));
  let result;
  if(body.response_format.json_schema.name==='KnowledgeVerification'){
   const scope=JSON.parse(prompt.split('待核验疑点：')[1].split('\n请根据图像')[0]);
   result={findings:scope.findings.map(target=>({finding_id:target.finding_id,status:'supported',affected_check_titles:['平面结构'],description:'局部需核实',normal_explanation:'排除允许变化',limitations:[],evidence_ids:[...target.regions.filter(item=>item.image.representation==='raw').map(item=>item.image.evidence_id),...images.filter(item=>item.role==='normal').map(item=>item.evidence_id)],conflicts:[]}))};
  }else{
   const context=prompt.split('冻结知识与已核验异常：')[1]?.split('\n来源：')[0];
   const sources=prompt.includes('\n来源：')?JSON.parse(prompt.split('\n来源：').at(-1).split('\n请根据图像')[0]):[];
   const findings=[...(context?JSON.parse(context).findings||[]:[]),...sources.flatMap(item=>item.verified_findings||[])];
   for(const finding of findings){const cited=[...finding.regions.map(item=>item.image.evidence_id),...finding.judgment.evidence_ids];if(cited.some(id=>!actual.has(id)))leaks.push(finding.finding_id);}
   const support=images.filter(item=>item.representation==='raw'&&(context?item.role==='roi':true)).map(item=>item.evidence_id);
   result={summary:'实际可见结构',checks:support.length?[{title:context?'局部外观':'平面结构',subject:'主体',location:'中部',criterion:context?'局部存在异常候选':'可见连续平面',allowed_variations:[],support_evidence_ids:support,counter_evidence_ids:[],limitations:[],status:'supported'}]:[],suspects:[],limitations:[],revisions:[]};
  }
  res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]}));
 });
 await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));
 const env={LIVE_VLM_ENDPOINT:`http://127.0.0.1:${model.address().port}/v1`,LIVE_VLM_MODEL:'defect-context-model',LIVE_VLM_CAPACITY_MODE:'vllm_tokenize',LIVE_VLM_MAX_IMAGES:'20',IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES:'2'};
 const previous=Object.fromEntries(Object.keys(env).map(key=>[key,process.env[key]]));Object.assign(process.env,env);
 const ctx=new Context();new SystemPrompt(ctx,{});new ToolRuntime(ctx);new SkillRegistry(ctx);new LocalAttachmentStore(ctx,{dshHome:path.join(root,'dsh')});const fork=await ctx.plugin(harness,{dbPath:path.join(root,'test.db')});
 const execute=async(name,args)=>{const result=await ctx.tools.execute({name,arguments:args,callId:crypto.randomUUID(),signal:new AbortController().signal});assert.equal(result.isError,false,JSON.stringify(result));return result.value;};
 const finish=async job=>{while(['PENDING','RUNNING'].includes(job.status)){await delay(20);job=await execute('knowledge_job_status',{run_id:job.run_id,wait_seconds:0});}assert.equal(job.status,'COMPLETED',JSON.stringify(job.errors));return job;};
 try{
  const dataset=await execute('dataset_import',{format:'labelme',name:'分组异常证据',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
  const normalSources=await execute('knowledge_sources',{dataset_id:dataset.dataset_id,kind:'normal'});
  const normal=await finish(await execute('knowledge_mine_normal',{image_count:3,images:normalSources.items.map(item=>item.sample_id)}));
  const defectSources=await execute('knowledge_sources',{dataset_id:dataset.dataset_id,kind:'defect',normal_version_id:normal.knowledge_version_id});
  const defect=await finish(await execute('knowledge_mine_defect',{image_count:2,images:defectSources.items.map(item=>item.sample_id),knowledge_preset:[normal.knowledge_version_id]}));
  assert.deepEqual(leaks,[],'A child group must not receive sibling findings or evidence references as its own learning context');
  assert.ok(calls.filter(body=>body.response_format.json_schema.name==='KnowledgeDraft').every(body=>body.response_format.json_schema.schema.properties.revisions.maxItems===0),'A seed draft cannot emit predecessor mappings when no same-kind preset exists');
  for(const body of calls.filter(body=>body.response_format.json_schema.name==='KnowledgeVerification')){
   const scope=JSON.parse(body.messages[0].content[0].text.split('待核验疑点：')[1].split('\n请根据图像')[0]);
   const field=body.response_format.json_schema.schema.$defs.KnowledgeJudgment.properties.finding_id;
   assert.deepEqual((field.enum||[field.const]).sort(),scope.findings.map(item=>item.finding_id).sort(),'Structured finding references must be constrained to the actual requested identities');
  }
  assert.ok(calls.every(body=>body.messages[0].content.filter(item=>item.type==='image_url').length<=20));
  const knowledge=(await execute('knowledge_get',{version_id:defect.knowledge_version_id})).knowledge;assert.equal(knowledge.sources.length,2);assert.equal(knowledge.findings.length,2);assert.ok(knowledge.mining_steps.length===1);
 }finally{await fork.dispose();model.closeAllConnections();await new Promise(resolve=>model.close(resolve));for(const[key,value]of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}await fs.rm(root,{recursive:true,force:true});}
});
