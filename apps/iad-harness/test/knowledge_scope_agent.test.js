import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createUserMessage} from '@deepseek-ai/dsh-llm';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createDatasetSession} from './fixtures/dataset_session.js';

test('DSH keeps the continuous scope when the next user message only confirms 20 images',{timeout:120000},async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-scope-agent-'));
 execFileSync(resolvePythonPath(),[fileURLToPath(new URL('fixtures/knowledge_scope_dataset.py',import.meta.url)),root]);
 let datasetId,call=0;const observationSizes=[],visionCalls=[];
 const model=http.createServer(async(req,res)=>{
  let text='';for await(const chunk of req)text+=chunk;const body=JSON.parse(text);
  if(body.stream){
   const lastUser=body.messages.findLastIndex(message=>message.role==='user');
   const outputs=body.messages.slice(lastUser+1).filter(message=>message.role==='tool');
   const latest=outputs.at(-1),raw=latest?.content;
   const value=raw?.startsWith('{')?JSON.parse(raw):null;
   const previous=body.messages.flatMap(message=>message.tool_calls||[]).find(item=>item.id===latest?.tool_call_id)?.function.name;
   let tool,answer;
   if(!outputs.length){
    const question=JSON.stringify(body.messages[lastUser]?.content);
    tool=question.includes('20张')?{name:'knowledge_scope_get',arguments:{dataset_id:datasetId,kind:'normal'}}
      :{name:'knowledge_scope_open',arguments:{dataset_id:datasetId,kind:'normal',objective:'持续挖掘全部良品来源，等待用户确认每次数量'}};
   }else if(!value){answer='读取失败，停止验证。';}
   else if(previous==='knowledge_scope_open'){answer='已保存全部范围，每次选择多少张？';}
   else if(previous==='knowledge_scope_get'){
    tool=value.remaining?{name:'knowledge_sources',arguments:{dataset_id:datasetId,kind:'normal',scope_run_id:value.scope_run_id,page_size:20}}
      :null;answer=tool?null:`已观察${value.observed}张，剩余${value.remaining}张；知识不是人工真值。`;
   }else if(previous==='knowledge_sources'){
    const versions=body.messages.slice(lastUser+1).filter(message=>message.role==='tool'&&message.content?.startsWith('{')).map(message=>JSON.parse(message.content)).filter(item=>'current_version_id' in item);
    const current=versions.at(-1)?.current_version_id;
    tool={name:'knowledge_mine_normal',arguments:{image_count:value.items.length,images:value.items.map(item=>item.sample_id),knowledge_preset:current?[current]:[]}};
   }else if(previous==='knowledge_mine_normal'||(previous==='knowledge_job_status'&&['PENDING','RUNNING'].includes(value.status))){tool={name:'knowledge_job_status',arguments:{run_id:value.run_id,wait_seconds:30}};}
   else if(previous==='knowledge_job_status'&&value.status==='COMPLETED'){tool={name:'knowledge_scope_get',arguments:{dataset_id:datasetId,kind:'normal'}};}
   else {answer='作业未完成，保留真实失败结果。';}
   const delta=tool?{role:'assistant',tool_calls:[{index:0,id:`scope-call-${++call}`,type:'function',function:{name:tool.name,arguments:JSON.stringify(tool.arguments)}}]}:{role:'assistant',content:answer};
   res.writeHead(200,{'Content-Type':'text/event-stream'});
   for(const choice of [{index:0,delta,finish_reason:null},{index:0,delta:{},finish_reason:tool?'tool_calls':'stop'}])res.write(`data: ${JSON.stringify({id:'scope-response',object:'chat.completion.chunk',model:'scope-controller',choices:[choice]})}\n\n`);
   res.end('data: [DONE]\n\n');return;
  }
  res.setHeader('Content-Type','application/json');if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:32768}));return;}
  visionCalls.push(body);const content=body.messages[0].content,prompt=content[0].text;
  const images=content.filter(item=>item.type==='text'&&item.text.startsWith('视觉证据：')).map(item=>JSON.parse(item.text.slice(5)));
  let result;
  if(body.response_format.json_schema.name==='KnowledgeObservations'){
   const scope=JSON.parse(prompt.split('冻结观察请求：')[1].split('\n请根据图像')[0]);observationSizes.push(scope.sources.length*scope.checks.length);
   result={observations:scope.sources.flatMap(source=>scope.checks.map(check=>({sample_id:source.sample_id,check_id:check.check_id,status:'supports',description:'可见结构符合判据',position_analysis:'主体',illumination_analysis:'均匀',normal_explanation:'允许亮度变化',evidence_ids:source.raw_evidence_ids,suspects:[]})))};
  }else{
   const parent=JSON.parse(prompt.split('冻结父版本候选：')[1].split('\n')[0]);
   const checks=['轮廓','位置'].map(title=>({title,subject:'主体',location:'全图',criterion:title==='轮廓'?'存在完整轮廓':'主体在完整画幅内',allowed_variations:[],support_evidence_ids:images.map(image=>image.evidence_id),counter_evidence_ids:[],limitations:[],status:'supported'}));
   result={summary:'主体轮廓与位置',checks,suspects:[],limitations:[],revisions:parent.checks.map(check=>({previous_check_id:check.check_id,current_check_titles:[check.title],reason:'新增同一判据的独立支持'}))};
  }
  res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]}));
 });
 await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));
 const env={LIVE_VLM_ENDPOINT:`http://127.0.0.1:${model.address().port}/v1`,LIVE_VLM_MODEL:'scope-vision-model',LIVE_VLM_CAPACITY_MODE:'vllm_tokenize',IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES:'2',IAD_SCOPE_TEST_KEY:'synthetic-test-credential'};
 const previous=Object.fromEntries(Object.keys(env).map(key=>[key,process.env[key]]));Object.assign(process.env,env);
 const session=await createDatasetSession({root:path.join(root,'dsh'),dbPath:path.join(root,'test.db'),endpoint:process.env.LIVE_VLM_ENDPOINT,model:'scope-controller',apiKeyEnv:'IAD_SCOPE_TEST_KEY'});
 const onAbort=()=>session.handle.agent.cancel({kind:'hook',reason:'scope acceptance timeout'});
 t.signal.addEventListener('abort',onAbort,{once:true});
 const trace=[];session.ctx.on('tools/result',(exec,result)=>trace.push({name:exec.name,args:exec.arguments,result}));
 const send=async text=>{session.handle.agent.followup(createUserMessage({source:{kind:'user'},content:[{type:'text',text}]}));await session.handle.agent.whenIdle();};
 try{
  const dataset=await session.ctx.iadPythonBridge.execute('dataset_import',{format:'labelme',name:'会话范围',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});datasetId=dataset.dataset_id;
  await send(`持续挖掘数据集 ${datasetId} 全部良品来源，直到整个范围观察完；每次数量稍后确认。`);
  assert.deepEqual(trace.map(item=>item.name),['knowledge_scope_open']);assert.equal(visionCalls.length,0);
  assert.ok(trace[0].result.meta.links.some(item=>item.location.pageId==='industrial-knowledge'&&item.location.scopeRunId===trace[0].result.value.scope_run_id),'Actual tool results link directly to the same frozen scope in the sidebar');
  await send('20张');
  assert.ok(trace.every(item=>!item.result.isError),trace.map(item=>[item.name,item.result.error]));
  const groups=trace.filter(item=>item.name==='knowledge_mine_normal');assert.deepEqual(groups.map(item=>item.args.image_count),[20,20,3]);
  assert.ok(groups.every(item=>Object.keys(item.args).sort().join(',')==='image_count,images,knowledge_preset'));
  const scope=trace.filter(item=>item.name==='knowledge_scope_get').at(-1).result.value;assert.equal(scope.observed,43);assert.equal(scope.remaining,0);assert.equal(scope.version_ids.length,3);
  assert.deepEqual(groups.map(item=>item.args.knowledge_preset),[[],[scope.version_ids[0]],[scope.version_ids[1]]]);
  assert.ok(observationSizes.length>0&&observationSizes.includes(40),'Two frozen criteria and the full 20-image group remain a single observation request');
  assert.ok(visionCalls.every(body=>body.model==='scope-vision-model'&&body.messages[0].content.filter(item=>item.type==='image_url').length<=20));
 }finally{t.signal.removeEventListener('abort',onAbort);await session.dispose();await new Promise(resolve=>model.close(resolve));for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}await fs.rm(root,{recursive:true,force:true});}
});
