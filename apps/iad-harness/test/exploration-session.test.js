import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createUserMessage} from '@deepseek-ai/dsh-llm';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createDatasetSession} from './fixtures/dataset_session.js';

test('DSH conversation explores mixed examples and adopts directions only when requested', {timeout:60000}, async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-exploration-session-'));
 execFileSync(resolvePythonPath(),[fileURLToPath(new URL('fixtures/knowledge_dataset.py',import.meta.url)),root]);
 let dataset; const visualCalls=[],trace=[];
 const model=http.createServer(async(req,res)=>{
  let text='';for await(const chunk of req)text+=chunk;const body=JSON.parse(text);
  if(body.stream){
   const outputs=body.messages.filter(m=>m.role==='tool');
   const value=i=>JSON.parse(outputs[i].content);
   const n=outputs.length;
   const choices=[
    ()=>({name:'skill',arguments:{name:'explore-inspection-directions'}}),
    ()=>({name:'knowledge_sources',arguments:{dataset_id:dataset.dataset_id,kind:'normal',page_size:2}}),
    ()=>({name:'knowledge_sources',arguments:{dataset_id:dataset.dataset_id,kind:'defect',page_size:1}}),
    ()=>({name:'direction_exploration_start',arguments:{dataset_id:dataset.dataset_id,normal_images:value(1).items.map(v=>v.sample_id),defect_images:value(2).items.map(v=>v.sample_id)}}),
    ()=>({name:'direction_exploration_status',arguments:{run_id:value(3).run_id,wait_seconds:10}}),
    ()=>({name:'direction_exploration_get',arguments:{dataset_id:dataset.dataset_id}}),
    ()=>({name:'knowledge_prompt_get',arguments:{dataset_id:dataset.dataset_id,kind:'normal'}}),
    ()=>({name:'knowledge_directions_adopt',arguments:{dataset_id:dataset.dataset_id,kind:'normal',expected_revision:value(6).revision,directions:[{direction_id:value(5).exploration.directions[0].direction_id}]}}),
   ];
   const tool=choices[n]?.();
   const delta=tool?{role:'assistant',tool_calls:[{index:0,id:'explore-'+n,type:'function',function:{name:tool.name,arguments:JSON.stringify(tool.arguments)}}]}:{role:'assistant',content:'方向探索完成，已按要求采用首项方向，等待后续挖掘指令。'};
   res.writeHead(200,{'Content-Type':'text/event-stream'});
   for(const choice of [{index:0,delta,finish_reason:null},{index:0,delta:{},finish_reason:tool?'tool_calls':'stop'}])res.write('data: '+JSON.stringify({id:'explore-session',object:'chat.completion.chunk',model:'test-mllm',choices:[choice]})+'\n\n');
   res.end('data: [DONE]\n\n');return;
  }
  let answer;
  if(req.url==='/tokenize')answer={count:3000,max_model_len:32768};
  else{
   visualCalls.push(body);
   assert.equal(body.response_format.json_schema.name,'DirectionDraft');
   const content=body.messages[0].content;
   const ids=content.filter(v=>v.type==='text'&&v.text.startsWith('视觉证据：')).map(v=>JSON.parse(v.text.slice(5)).evidence_id);
   assert.equal(ids.length,3);
   answer={summary:'两组样例可比较孔位',limitations:['合成样例'],directions:[{title:'孔内局部外观',instruction:'比较孔内背景、遮挡及光照',applies_to:'both',rationale:'良品与异常候选存在局部差异',evidence_ids:ids,limitations:['需人工核实']} ]};
  }
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(req.url==='/tokenize'?answer:{choices:[{finish_reason:'stop',message:{content:JSON.stringify(answer)}}]}));
 });
 await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));
 const keys=['LIVE_VLM_ENDPOINT','LIVE_VLM_MODEL','LIVE_VLM_CAPACITY_MODE','IAD_EXPLORATION_SESSION_KEY'];const previous=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 process.env.LIVE_VLM_ENDPOINT=`http://127.0.0.1:${model.address().port}/v1`;process.env.LIVE_VLM_MODEL='test-mllm';process.env.LIVE_VLM_CAPACITY_MODE='vllm_tokenize';process.env.IAD_EXPLORATION_SESSION_KEY='isolated-test-credential';
 let session;
 try{
  session=await createDatasetSession({root:path.join(root,'session'),dbPath:path.join(root,'test.db'),endpoint:process.env.LIVE_VLM_ENDPOINT,model:'test-mllm',apiKeyEnv:'IAD_EXPLORATION_SESSION_KEY'});
  dataset=await session.ctx.iadPythonBridge.execute('dataset_import',{format:'labelme',name:'方向探索会话',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
  session.ctx.on('tools/result',(exec,result)=>trace.push({name:exec.name,result}));
  session.handle.agent.followup(createUserMessage({source:{kind:'user'},content:[{type:'text',text:`请对数据集${dataset.dataset_id}用两张良品和一张异常联合探索方向，采用第一项良品方向，完成后停止。`}]}));
  await session.handle.agent.whenIdle();
  assert.deepEqual(trace.map(v=>v.name),['skill','knowledge_sources','knowledge_sources','direction_exploration_start','direction_exploration_status','direction_exploration_get','knowledge_prompt_get','knowledge_directions_adopt']);
  assert.ok(trace.every(v=>!v.result.isError),JSON.stringify(trace));assert.equal(visualCalls.length,1);
  assert.equal(trace[4].result.value.status,'COMPLETED');
  assert.ok(trace[3].result.meta.links.some(v=>v.location.pageId==='industrial-exploration'));
  assert.equal(trace[5].result.meta.links.find(link=>link.label==='查看探索方向').location.tab,'results','方向结果链接应离开新建视图');
  const prompt=await session.ctx.iadPythonBridge.execute('knowledge_prompt_get',{dataset_id:dataset.dataset_id,kind:'normal'});
  assert.ok(prompt.configuration.directions.some(d=>d.origin==='explored'&&d.title==='孔内局部外观'&&d.enabled));
  assert.equal((await session.ctx.iadPythonBridge.execute('knowledge_get',{dataset_id:dataset.dataset_id,kind:'normal'})).knowledge,null);
 }finally{
  await session?.dispose();await new Promise(resolve=>model.close(resolve));for(const k of keys)if(previous[k]===undefined)delete process.env[k];else process.env[k]=previous[k];await fs.rm(root,{recursive:true,force:true});
 }
});
