import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {Context} from '@deepseek-ai/cordis';
import {LlmRuntime} from '@deepseek-ai/dsh-llm';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import {findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';

const workspace=findWorkspaceRoot();
const baseline=path.resolve(process.argv.find(value=>value.startsWith('--baseline-root='))?.slice('--baseline-root='.length)||'');
assert.notEqual(baseline,workspace,'使用--baseline-root指定8f16de2的独立检出');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:baseline,encoding:'utf8'}).trim(),'8f16de203f0e03166d0e47c6e2ea9fb829439caf');
const output=path.resolve(process.argv.find(value=>value.startsWith('--output='))?.slice('--output='.length)
    ||'runs/verification/analysis-user-chain/joint-semantic-comparison');
await fs.mkdir(output);
const baselineApp=path.join(baseline,'apps/iad-harness');
const fixture=fileURLToPath(new URL('./fixtures/analysis-semantic-dataset.py',import.meta.url));
const sources={anomaly:'analysis_dcf6319a2d2843deb14ba6daa38c4db8',labelme:'analysis_f2db9cd9c12f433a911830f506a1ba5d'};
const inputs={};
for(const [dataset,run] of Object.entries(sources)){
  inputs[dataset]=JSON.parse(execFileSync(resolvePythonPath(),[fixture,path.join(workspace,'data/benchmark.db'),run,path.join(output,dataset)],
    {cwd:baseline,env:{...process.env,PYTHONPATH:path.join(baseline,'python')},encoding:'utf8'}));
}
const sourceFiles=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard','--',
  'python/iad_core','apps/iad-harness/src','apps/iad-harness/scripts','apps/iad-harness/lib/server','apps/iad-harness/lib/shared'],
  {cwd:workspace,encoding:'utf8'}).split('\0').filter(Boolean).sort();
const sourceHash=createHash('sha256');
for(const file of sourceFiles)sourceHash.update(file+'\0').update(await fs.readFile(path.join(workspace,file)));
const result={baseline,baseline_commit:'8f16de203f0e03166d0e47c6e2ea9fb829439caf',
  current_sources_sha256:sourceHash.digest('hex'),source_files:sourceFiles,
  inputs,cases:[],started_at:new Date().toISOString()};
const save=()=>fs.writeFile(path.join(output,'comparison.json'),JSON.stringify(result,null,2)+'\n');
await save();
if(process.argv.includes('--prepare-only')){
  console.log(JSON.stringify({status:'PREPARED',output,datasets:Object.keys(inputs),images:12}));
}else{
  const packages=await fs.readdir(path.join(workspace,'node_modules/.pnpm'));
  const credentialPackage=packages.find(name=>name.startsWith('@deepseek-ai+dsh-credentials-local@'));
  const {parseCredentialsDocument}=await import(pathToFileURL(path.join(workspace,'node_modules/.pnpm',credentialPackage,
    'node_modules/@deepseek-ai/dsh-credentials-local/lib/index.js')));
  const credentialFile=path.join(workspace,'.dsh/.credentials.yaml');
  const credentials=parseCredentialsDocument(await fs.readFile(credentialFile,'utf8'),credentialFile).refs;
  process.env.IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES='2';
  for(const [dataset,input] of Object.entries(inputs))for(const module of ['exploration','knowledge']){
    for(const variant of ['baseline','forward','reverse'])await runCase(dataset,input,module,variant,credentials);
  }
  result.finished_at=new Date().toISOString();await save();
}

async function runCase(dataset,input,module,variant,credentials){
  const code=variant==='baseline'?baseline:workspace;
  const app=variant==='baseline'?baselineApp:path.join(workspace,'apps/iad-harness');
  const directory=path.join(output,dataset,module+'-'+variant);await fs.mkdir(directory);
  const database=path.join(directory,'comparison.db');
  execFileSync(resolvePythonPath(),['-c',
    'import sqlite3,sys; source=sqlite3.connect("file:"+sys.argv[1]+"?mode=ro",uri=True); target=sqlite3.connect(sys.argv[2]); source.backup(target); target.close(); source.close()',
    input.database,database],{encoding:'utf8'});
  const {PythonBridge}=await import(pathToFileURL(path.join(app,'lib/server/python-bridge/index.js')));
  const {NativeProviders}=await import(pathToFileURL(path.join(app,'lib/server/models/providers.js')));
  const {JobSessionHost}=await import(pathToFileURL(path.join(app,'lib/server/sessions/host.js')));
  const {AnalysisWorkflowScheduler}=await import(pathToFileURL(path.join(app,'lib/server/analysis/scheduler.js')));
  const {analysisSessionPath}=await import(pathToFileURL(path.join(app,'lib/server/analysis/agent.js')));
  const bridge=new PythonBridge({cwd:code,dbPath:database});
  await bridge.execute('workbench_initialize');
  const host=await JobSessionHost.open(path.join(directory,'sessions'),async session_id=>
    analysisSessionPath(directory,await bridge.execute('analysis_agent_session_location',{session_id})));
  const ctx=new Context();new LlmRuntime(ctx);
  const providers={'local-vlm-30004':structuredClone(input.native_profile)};
  ctx.provide('settings',{configure:()=>()=>{},describe:()=>[{ns:'llm-pi-ai',revision:1,value:{providers}}]});
  ctx.provide('credentials',{resolve:async ref=>{
    const value=credentials.get(String(ref));assert.ok(value,'必须使用DSH管理的模型凭据');return{value};
  },describe:async ref=>({configured:credentials.has(String(ref)),writable:false})});
  const plugin=await ctx.plugin(piAi,{providers});
  const scheduler=new AnalysisWorkflowScheduler(bridge,new NativeProviders(()=>ctx),{exploration:host,knowledge:host},directory,
    error=>console.error(error.name+': '+error.message));
  bridge.useModelRouting(scheduler);
  let heartbeat;
  try{
    const model=input.native_profile.models[0].id;
    const settings=await bridge.execute('module_settings_get',{module});
    await bridge.execute('module_settings_save',{module,expected_revision:settings.revision,
      settings:{model:{provider_id:'local-vlm-30004',model_id:model},batch_size:2,whole_image_max_side:null,
        agent_limits:{max_output_tokens:32768,request_parameters:{temperature:0.7}}}});
    const datasetIds=variant==='reverse'?[input.dataset_ids[0],input.dataset_ids[2],input.dataset_ids[1]]:input.dataset_ids;
    const request={submission_id:randomUUID(),analysis_kind:module,dataset_ids:datasetIds};
    if(module==='exploration'){
      request.normal_images=input.source_images.slice(0,2).filter(item=>item.candidate_role==='normal').map(item=>item.sample_id);
      request.defect_images=input.source_images.slice(0,2).filter(item=>item.candidate_role==='defect').map(item=>item.sample_id);
      request.prompt={text:'比较所选原图与已有人工标注，形成可独立复核的检查方向。写清可见对象、检查动作、比较依据与适用边界，保留真实正反依据，只选承担具体作用的关键原图。'};
    }else request.mining_prompt={objective:'在所选方向下形成有图像依据的条件性检查判据。',directions:[input.direction],
      instruction:'沿所选方向核对全部原图与已有人工标注，提炼可复核的条件性判据、已经观察的允许变化及反例。区分可观察但未见目标、目标结构不存在和目标区遮挡，不用方向文字代替本场依据。'};
    const started=performance.now();
    const job=await scheduler.start(request);
    const current={dataset,module,variant,directory,database,run_id:job.run_id,status:'RUNNING',started_at:new Date().toISOString()};
    result.cases.push(current);await save();console.log(JSON.stringify({event:'started',...current}));
    const snapshot=await bridge.execute('analysis_agent_snapshot',{run_id:job.run_id});
    await fs.writeFile(path.join(directory,'snapshot.json'),JSON.stringify(snapshot,null,2)+'\n');
    current.plan=snapshot.plan;
    assert.deepEqual(snapshot.plan,input.plans[module][variant==='reverse'?'reverse':'forward']);
    assert.equal(snapshot.manifest.records.length,6);
    assert.equal(new Set(snapshot.plan.rounds.flatMap(round=>round.targets.map(item=>item.sample_id))).size,6);
    assert.equal(snapshot.agent.profile.provider_id,'local-vlm-30004');
    assert.equal(snapshot.agent.profile.model_id,'ukisai/Swift-1.5-Qwen3.8-27b');
    assert.equal(snapshot.agent.profile.max_output_tokens,32768);
    heartbeat=setInterval(async()=>{
      try{const status=await bridge.execute('analysis_status',{run_id:job.run_id});console.log(JSON.stringify({event:'heartbeat',dataset,module,variant,
        run_id:job.run_id,status:status.status,completed:status.completed,failed:status.failed,phase:status.phase}));}
      catch(error){console.error(error.name+': '+error.message);}
    },30000);
    await scheduler.whenIdle();
    const status=await bridge.execute('analysis_status',{run_id:job.run_id});
    Object.assign(current,{status:status.status,completed:status.completed,failed:status.failed,elapsed_ms:performance.now()-started,
      version_id:status.analysis_version_id,execution_error:status.execution_error,
      calls:status.model_calls.filter(call=>call.source==='native_llm'),wire:[]});
    for(const call of status.model_calls.filter(item=>item.operation==='tokenize')){
      const payload=await bridge.execute('model_call_get',{run_id:job.run_id,call_id:call.call_id});
      const body=JSON.parse(payload.request_body);
      current.wire.push({model:body.model,temperature:body.temperature,chat_template_kwargs:body.chat_template_kwargs||null,
        tools_sha256:createHash('sha256').update(JSON.stringify(body.tools)).digest('hex'),
        image_count:body.messages.flatMap(item=>Array.isArray(item.content)?item.content:[]).filter(item=>item.type==='image_url').length});
    }
    if(status.analysis_version_id){
      const publication=await bridge.execute('analysis_publication',{version_id:status.analysis_version_id});
      await fs.writeFile(path.join(directory,'publication.json'),JSON.stringify(publication,null,2)+'\n');
      current.publication_file=path.join(directory,'publication.json');
    }
    const context=await bridge.execute('analysis_agent_context',{run_id:job.run_id});
    await fs.writeFile(path.join(directory,'session.jsonl'),await host.exportJsonl(context.session_id));
    await save();console.log(JSON.stringify({event:'finished',dataset,module,variant,status:current.status,completed:current.completed,elapsed_ms:current.elapsed_ms}));
  }finally{
    clearInterval(heartbeat);await scheduler.dispose();await host.dispose();bridge.destroy();await plugin.dispose();
  }
}
