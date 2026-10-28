import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {appendFileSync,constants} from 'node:fs';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {createUserMessage} from '@deepseek-ai/dsh-llm';
import {createDatasetSession} from '../test/fixtures/dataset_session.js';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';

const {values}=parseArgs({options:{'env-file':{type:'string'},image:{type:'string'},control:{type:'string'},output:{type:'string'},intent:{type:'string',default:'query'}}});
assert.ok(values.image&&values.control&&values.output,'--image, --control and --output are required');
assert.ok(['query','check','retry'].includes(values.intent),'Supported intents: query, check, retry');
if(values['env-file'])process.loadEnvFile(values['env-file']);
const endpoint=(process.env.LIVE_VLM_ENDPOINT||'').replace(/\/chat\/completions$/,'').replace(/\/$/,'');
assert.ok(endpoint,'Configure LIVE_VLM_ENDPOINT');
const root=path.resolve(values.output);await fs.mkdir(root);
const response=await fetch(endpoint+'/models',{headers:{Authorization:'Bearer '+(process.env.LIVE_VLM_KEY||'')},signal:AbortSignal.timeout(10000)});
assert.equal(response.status,200,'Actual model catalog must be available');
const catalog=await response.json(),model=catalog.data.find(item=>item.id===process.env.LIVE_VLM_MODEL)||catalog.data[0];
assert.ok(model?.id&&Number.isSafeInteger(model.max_model_len));
const sources={};for(const file of [values.image,values.control])sources[path.resolve(file)]=createHash('sha256').update(await fs.readFile(file)).digest('hex');
execFileSync(resolvePythonPath(),['-c',`import json,sys,shutil
from pathlib import Path
from PIL import Image
root=Path(sys.argv[1]);image=Path(sys.argv[2]);control=Path(sys.argv[3])
for dataset,name,source,label in [('current','a'+image.suffix,image,'A'),('current','z'+control.suffix,control,None),('reference','b'+image.suffix,image,'B')]:
 folder=root/dataset;folder.mkdir(exist_ok=True);target=folder/name;shutil.copyfile(source,target)
 with Image.open(target) as pixels:width,height=pixels.size
 shapes=[] if label is None else [{'label':label,'shape_type':'rectangle','points':[[2,2],[10,10]]}]
 target.with_suffix('.json').write_text(json.dumps({'imageWidth':width,'imageHeight':height,'shapes':shapes}))
`,root,path.resolve(values.image),path.resolve(values.control)]);
const annotationBytes=new Map();for(const folder of ['current','reference'])for(const name of await fs.readdir(path.join(root,folder)))if(name.endsWith('.json'))annotationBytes.set(path.join(root,folder,name),await fs.readFile(path.join(root,folder,name)));
const session=await createDatasetSession({root:path.join(root,'session'),dbPath:path.join(root,'benchmark.db'),endpoint,model:model.id,apiKeyEnv:'LIVE_VLM_KEY',contextWindow:model.max_model_len,maxTokens:16384});
const trace=[],violations=[],cases={};let phase='setup',allowed=new Set();
session.ctx.on('tools/result',(exec,result)=>{
  const item={phase,name:exec.name,arguments:exec.arguments,result};trace.push(item);
  appendFileSync(path.join(root,'tool-trace.jsonl'),JSON.stringify(item)+'\n');
  console.log(JSON.stringify({phase,tool:exec.name,error:result.isError,status:result.value?.status}));
});
session.handle.agent.ctx.tools.guard(exec=>{
  if(!allowed.has(exec.name)||(exec.name==='skill'&&exec.arguments.name!=='audit-data-consistency')){
    violations.push({phase,name:exec.name,arguments:exec.arguments});
    session.handle.agent.cancel({kind:'hook',reason:'Unrequested consistency operation'});
    return 'Only the requested consistency intent is authorized';
  }
});
const readers=['skill','dataset_list','image_retrieve','consistency_compare','consistency_context','consistency_evidence','consistency_evidence_media','consistency_status','consistency_query','consistency_report','consistency_groups','consistency_group_members'];
async function runIntent(name,prompt,tools){
  phase=name;allowed=new Set(tools);const offset=trace.length,started=Date.now();
  await fs.writeFile(path.join(root,name+'-prompt.txt'),prompt);
  session.handle.agent.followup(createUserMessage({source:{kind:'user'},content:[{type:'text',text:prompt}]}));
  await session.handle.agent.whenIdle();
  const turns=session.handle.agent.session.snapshotEvents().filter(event=>event.type==='turn/end');
  assert.equal(turns.at(-1).data.reason.kind,'completed');assert.deepEqual(violations,[]);
  const calls=trace.slice(offset);assert.ok(calls.every(item=>!item.result.isError),JSON.stringify(calls.filter(item=>item.result.isError)));
  const messages=session.handle.agent.session.deriveMessages();let lastUser=messages.findLastIndex(item=>item.role==='user');
  const answer=messages.slice(lastUser+1).filter(item=>item.role==='assistant').flatMap(item=>item.content.filter(block=>block.type==='text').map(block=>block.text)).join('\n');
  assert.ok(answer.trim());cases[name]={elapsed_ms:Date.now()-started,tools:calls.map(item=>item.name),answer};return calls;
}
try{
  const bridge=session.ctx.iadPythonBridge,datasets={};
  for(const folder of ['current','reference'])datasets[folder]=await bridge.execute('dataset_import',{format:'labelme',name:'意图验证-'+folder,image_dir:path.join(root,folder),annotation_dir:path.join(root,folder),annotation_policy:{policy_id:'controlled-intent-policy',annotation_role:'REFERENCE',annotation_coverage:'EXHAUSTIVE'}});
  const current=datasets.current.dataset_id+':a'+path.extname(values.image),other=datasets.reference.dataset_id+':b'+path.extname(values.image);
  if(values.intent==='query'){
    const calls=await runIntent('query',`当前选中图像：${current}\n请在当前工作区的所有已登记数据集中找这张图的副本，保留跨集候选及实际引用。只查这一张，不启动批量检查、建库、知识挖掘或审核；不需要解释物理缺陷。`,readers);
    const retrieved=calls.filter(item=>item.name==='image_retrieve');assert.ok(retrieved.length);
    assert.ok(retrieved.every(item=>item.arguments.query.kind==='sample'&&item.arguments.query.sample_id===current));
    const page=retrieved.at(-1).result.value,members=page.exact.groups.flatMap(group=>group.members);
    assert.equal(members.length,1);assert.equal(members[0].sample_id,other);assert.equal(members[0].relation,'EXACT');
    const batches=await bridge.execute('consistency_list',{});assert.equal(batches.items.length,0);
    Object.assign(cases.query,{members:members.length,cross_dataset:members[0].dataset_id!==datasets.current.dataset_id,started_batches:batches.items.length});
  }
  if(values.intent==='check'){
    const calls=await runIntent('check','请对整个工作区的全部已登记图像启动严格同图与标注一致性检查，检索库也为全库。核对实际作业到终态，报告完成、失败和未处理数；不启动知识挖掘、模型审核或人工裁决，不改源标注。',[...readers,'consistency_start']);
    const starts=calls.filter(item=>item.name==='consistency_start');assert.ok(starts.length);
    assert.ok(starts.every(item=>item.arguments.subjects.kind==='all_registered'&&(item.arguments.corpus_scope?.kind||'all_registered')==='all_registered'&&(item.arguments.mode||'exact')==='exact'));
    const identities=new Set(starts.map(item=>item.result.value.batch_id));assert.equal(identities.size,1);
    const batch_id=starts[0].result.value.batch_id;
    assert.ok(calls.some(item=>item.name==='consistency_status'&&item.arguments.batch_id===batch_id&&item.result.value.status==='COMPLETED'),'Agent must read the actual terminal state');
    const state=await bridge.execute('consistency_status',{batch_id});
    assert.equal(state.status,'COMPLETED');assert.equal(state.completed,state.total);assert.equal(state.total,3);
    assert.equal(state.failed,0);assert.equal(state.unprocessed,0);assert.equal(state.scopes.corpus.sample_count,3);
    assert.ok(state.children.every(child=>child.job_type==='DATA_CONSISTENCY'&&child.model_name===null));
    Object.assign(cases.check,{batch_id,total:state.total,completed:state.completed,failed:state.failed,unprocessed:state.unprocessed,corpus_samples:state.scopes.corpus.sample_count,started_batches:identities.size});
  }
  if(values.intent==='retry'){
    const control=path.join(root,'current','z'+path.extname(values.control)),bytes=await fs.readFile(control);
    const controlId=datasets.current.dataset_id+':'+path.basename(control);let writer,parent,before;
    await fs.unlink(control);execFileSync('mkfifo',[control]);
    try{
      parent=await bridge.execute('consistency_start',{subjects:{kind:'samples',sample_ids:[current,controlId]},corpus_scope:{kind:'all_registered'},mode:'exact',request_id:'controlled-retry-parent'});
      const deadline=Date.now()+5000;
      while(Date.now()<deadline){
        try{writer=await fs.open(control,constants.O_WRONLY|constants.O_NONBLOCK);break;}
        catch(error){if(error.code!=='ENXIO')throw error;await delay(20);}
      }
      assert.ok(writer,'The real worker must reach the blocked source');
      const running=await bridge.execute('consistency_status',{batch_id:parent.batch_id});assert.equal(running.completed,1);
      await bridge.execute('consistency_cancel',{batch_id:parent.batch_id});
      await writer.writeFile(bytes);await writer.close();writer=null;
      const stopped=Date.now()+5000;
      while(Date.now()<stopped){before=await bridge.execute('consistency_status',{batch_id:parent.batch_id});if(before.status==='CANCELLED')break;await delay(20);}
      assert.equal(before.status,'CANCELLED');assert.equal(before.completed,1);assert.equal(before.unprocessed,1);
    }finally{
      if(parent)await bridge.execute('consistency_cancel',{batch_id:parent.batch_id});
      if(writer){await writer.writeFile(bytes);await writer.close();}
      const release=await fs.open(control,constants.O_RDWR|constants.O_NONBLOCK);await release.writeFile(bytes);await release.close();
      await fs.unlink(control);await fs.writeFile(control,bytes);
    }
    const calls=await runIntent('retry',`原批次：${parent.batch_id}\n继续这个已取消的一致性检查。先核对实际状态，只处理原冻结范围里失败或未处理的图，复用已完成结果，不另开全库任务、不重扫或扩大范围。等恢复作业结束后报告原范围的完成、失败和未处理数，不执行知识挖掘、模型审核或人工裁决。`,[...readers,'consistency_retry']);
    assert.ok(calls.some(item=>item.name==='consistency_status'&&item.arguments.batch_id===parent.batch_id&&item.result.value.status==='CANCELLED'));
    const retried=calls.filter(item=>item.name==='consistency_retry');assert.ok(retried.length);
    assert.ok(retried.every(item=>item.arguments.batch_id===parent.batch_id));
    const identities=new Set(retried.map(item=>item.result.value.batch_id));assert.equal(identities.size,1);
    const batch_id=retried[0].result.value.batch_id;
    assert.ok(calls.some(item=>item.name==='consistency_status'&&item.arguments.batch_id===batch_id&&item.result.value.status==='COMPLETED'));
    const state=await bridge.execute('consistency_status',{batch_id});
    assert.equal(state.parent_batch_id,parent.batch_id);assert.equal(state.root_batch_id,parent.batch_id);
    assert.equal(state.status,'COMPLETED');assert.equal(state.completed,2);assert.equal(state.total,2);
    assert.equal(state.failed,0);assert.equal(state.unprocessed,0);assert.deepEqual(state.scopes,before.scopes);
    assert.deepEqual(state.children.flatMap(child=>child.sample_ids),[controlId]);
    assert.deepEqual(await bridge.execute('consistency_status',{batch_id:parent.batch_id}),before);
    Object.assign(cases.retry,{batch_id,parent_batch_id:parent.batch_id,parent_completed:before.completed,parent_unprocessed:before.unprocessed,total:state.total,completed:state.completed,newly_processed:state.children.reduce((sum,child)=>sum+child.completed,0),parent_preserved:true,frozen_scope_preserved:true});
  }
  for(const [file,sha] of Object.entries(sources))assert.equal(createHash('sha256').update(await fs.readFile(file)).digest('hex'),sha);
  for(const [file,bytes] of annotationBytes)assert.ok((await fs.readFile(file)).equals(bytes));
  const result={model:model.id,context_window:model.max_model_len,controlled_annotation_labels:true,sources,cases,violations,source_bytes_unchanged:true,annotation_files_unchanged:true};
  await fs.writeFile(path.join(root,'result.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({output:root,cases:Object.keys(cases),violations:violations.length}));
}finally{
  await fs.writeFile(path.join(root,'tool-trace.json'),JSON.stringify(trace,null,2)+'\n');
  await fs.writeFile(path.join(root,'session-events.json'),JSON.stringify(session.handle.agent.session.snapshotEvents(),null,2)+'\n');
  await session.dispose();
}
