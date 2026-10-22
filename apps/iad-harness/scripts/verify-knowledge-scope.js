import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {parseArgs} from 'node:util';
import {createUserMessage} from '@deepseek-ai/dsh-llm';
import {createDatasetSession,resolveDatasetSessionModel,readDatasetSessionContext} from '../test/fixtures/dataset_session.js';
import {findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';

assert.ok(process.env.LIVE_VLM_ENDPOINT&&process.env.LIVE_VLM_KEY,'Configure the local model environment');
assert.equal(process.env.LIVE_VLM_CAPACITY_MODE,'vllm_tokenize','This live verification requires an explicitly configured vLLM service');
const {values,positionals}=parseArgs({options:{resume:{type:'boolean'},'initial-size':{type:'string',default:'20'},'group-size':{type:'string',default:'20'}},allowPositionals:true});
const initialSize=Number(values['initial-size']),groupSize=Number(values['group-size']);
assert.ok([initialSize,groupSize].every(value=>Number.isInteger(value)&&value>0));
const workspace=findWorkspaceRoot(),output=path.resolve(positionals[0]||path.join(workspace,'runs/verification/knowledge-scope',String(Date.now())));
await fs.mkdir(output,{recursive:true});
const resuming=values.resume;
const previous=resuming?JSON.parse(await fs.readFile(path.join(output,'result.json'),'utf8')):null;
const priorTrace=resuming?JSON.parse(await fs.readFile(path.join(output,'trace.json'),'utf8')).trace:[];
if(resuming){assert.equal(previous.scope.total,43);await fs.copyFile(path.join(output,'result.json'),path.join(output,`result-before-resume-${Date.now()}.json`));}
else execFileSync(resolvePythonPath(),[path.join(workspace,'apps/iad-harness/test/fixtures/knowledge_scope_dataset.py'),output]);
const model=resolveDatasetSessionModel(workspace),endpoint=process.env.LIVE_VLM_ENDPOINT.replace(/\/chat\/completions\/?$/,'').replace(/\/$/,'');
const contextWindow=await readDatasetSessionContext({endpoint,model,apiKeyEnv:'LIVE_VLM_KEY'});
const session=await createDatasetSession({root:path.join(output,resuming?`dsh-resume-${Date.now()}`:'dsh'),dbPath:path.join(output,'test.db'),endpoint,model,apiKeyEnv:'LIVE_VLM_KEY',contextWindow});
const trace=[],violations=[];let quantityConfirmed=false,timer;
session.ctx.on('tools/result',(exec,result)=>{trace.push({name:exec.name,args:exec.arguments,result});console.log(JSON.stringify({tool:exec.name,error:result.isError,status:result.value?.status,remaining:result.value?.remaining}));});
session.handle.agent.ctx.tools.guard(exec=>{
 const blocked=/^(knowledge_mine_defect|model_audit_start|model_audit_retry|dataset_import|dataset_rescan)$/.test(exec.name)
  ||(!quantityConfirmed&&exec.name==='knowledge_mine_normal')
  ||(exec.name==='knowledge_sources'&&(exec.arguments.page_size||10)>Math.max(initialSize,groupSize))
  ||(exec.name==='knowledge_mine_normal'&&(exec.arguments.image_count>Math.max(initialSize,groupSize)||exec.arguments.image_count!==exec.arguments.images?.length));
 if(blocked){violations.push(exec.name);session.handle.agent.cancel({kind:'hook',reason:'Live synthetic scope violated'});return 'Only the explicitly requested normal scope and confirmed group size are authorized';}
});
const send=async text=>{session.handle.agent.followup(createUserMessage({source:{kind:'user'},content:[{type:'text',text}]}));await session.handle.agent.whenIdle();};
try{
 const dataset=resuming?{dataset_id:previous.scope.dataset_id}:await session.ctx.iadPythonBridge.execute('dataset_import',{format:'labelme',name:'合成连续知识验证',image_dir:path.join(output,'images'),annotation_dir:path.join(output,'labels')});
 timer=setTimeout(()=>session.handle.agent.cancel({kind:'hook',reason:'Live synthetic scope deadline'}),Number(process.env.IAD_LIVE_VERIFICATION_TIMEOUT_MS||1800000));
 if(resuming){
  quantityConfirmed=true;
  await send(`继续已授权的固定范围 ${previous.scope.scope_run_id}，数据集 ${dataset.dataset_id}，每次${groupSize}张直到真实剩余耗尽。先knowledge_scope_resume关联当前会话，再读取真实进度与作业；仍运行时等待，不重复启动。模型输出约束已升级，若旧冻结作业不可重试，按真实提示重新启动尚未发布图组，显式使用当前版本。不要重新导入、另建范围、重复已发布图组或执行其他阶段，保留失败、人审与缺证记录。`);
 }else{
 await send(`持续挖掘已接入数据集 ${dataset.dataset_id} 的全部良品来源，首组形成知识后，后续组结合上一版继续更新，直到处理完整个范围；图组大小下一条消息给出。不要执行其他阶段。`);
 assert.deepEqual(violations,[]);assert.equal(trace.filter(item=>item.name==='knowledge_mine_normal').length,0);
 quantityConfirmed=true;
 await send(initialSize===groupSize?`${initialSize}张`:`首次${initialSize}张，后续每次${groupSize}张`);
 }
 assert.deepEqual(violations,[]);
 const scopes=[...priorTrace,...trace].filter(item=>item.name==='knowledge_scope_open'&&!item.result.isError);assert.equal(scopes.length,1,'The actual Agent must persist its continuous scope');
 const scope=await session.ctx.iadPythonBridge.execute('knowledge_scope_get',{scope_run_id:scopes[0].result.value.scope_run_id});
 const jobs=(await session.ctx.iadPythonBridge.execute('knowledge_list',{dataset_id:dataset.dataset_id})).jobs;
 const versions=[];for(const id of scope.version_ids)versions.push((await session.ctx.iadPythonBridge.execute('knowledge_get',{version_id:id})).knowledge);
 const result={verified:scope.remaining===0&&scope.stale===0&&scope.active_run_ids.length===0&&jobs.every(job=>!['PENDING','RUNNING'].includes(job.status))&&trace.filter(item=>item.name==='knowledge_mine_normal').every(item=>!item.result.isError),model,context_tokens:contextWindow,tool_errors:[...priorTrace,...trace].filter(item=>item.result.isError).map(item=>({name:item.name,error:item.result.error})),scope,jobs:jobs.map(({run_id,root_run_id,parent_run_id,status,completed,failed,errors})=>({run_id,root_run_id,parent_run_id,status,completed,failed,errors})),versions:versions.map(version=>({version_id:version.version_id,parent_version_id:version.parent_version_id,observed:version.observed_source_ids.length,checks:version.checks.length,conflicts:version.conflicts.filter(item=>item.resolution?.status!=='resolved').length,provisional:version.checks.filter(item=>item.status==='provisional').length}))};
 await fs.writeFile(path.join(output,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 assert.equal(result.verified,true,'Actual MLLM continuous verification is incomplete; inspect recorded real status and evidence');
 const expected=[Math.min(initialSize,43)];for(let remaining=43-expected[0];remaining>0;remaining-=groupSize)expected.push(Math.min(groupSize,remaining));
 assert.deepEqual(versions.map(version=>version.observed_source_ids.length),expected);
}finally{
 clearTimeout(timer);await fs.writeFile(path.join(output,'trace.json'),JSON.stringify({trace:[...priorTrace,...trace],violations},null,2));
 await fs.writeFile(path.join(output,resuming?`events-resume-${Date.now()}.json`:'events.json'),JSON.stringify(session.handle.agent.session.snapshotEvents(),null,2));
 const knownScope=[...priorTrace,...trace].find(item=>item.name==='knowledge_scope_open'&&!item.result.isError)?.result.value.scope_run_id;
 if(knownScope){
  const state=await session.ctx.iadPythonBridge.execute('knowledge_scope_get',{scope_run_id:knownScope});
  for(const run_id of state.active_run_ids)await session.ctx.iadPythonBridge.execute('knowledge_cancel',{run_id});
 }
 await session.dispose();
}
