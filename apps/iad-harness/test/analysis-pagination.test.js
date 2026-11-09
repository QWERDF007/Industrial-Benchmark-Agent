import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync,fork} from 'node:child_process';
import {once} from 'node:events';
import {randomUUID,createHash} from 'node:crypto';
import {findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';
import {createAnalysisAgentHost} from './fixtures/analysis-agent-host.js';

for(const scenario of [{},{exploration:true},{recovery:true},{catalogPaging:true}])test(`${scenario.exploration?'exploration':'knowledge'}: thirty ROI observations persist within one round and one official DSH Session${scenario.recovery?' after the owner process is killed after a partial commit':scenario.catalogPaging?' with explicit catalog lookup':''}`,{timeout:60000},async t=>{
  const {recovery=false,catalogPaging=false,exploration=false}=scenario;
  const module=exploration?'exploration':'knowledge',catalogField=exploration?'directions':'checks',supportField=exploration?'evidence_ids':'support_evidence_ids';
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-analysis-pages-'));
  const workspace=findWorkspaceRoot(),database=path.join(root,'pages.db'),errors=[],wire=[],admissions=[],summaries=[],proposals=[];
  let runtime,server,child;
  const parse=value=>{try{return JSON.parse((typeof value==='string'?value:value.find(part=>part.type==='text').text).split('\n')[0]);}catch{return null;}};
  const provider=http.createServer(async(req,res)=>{
    try {
      let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);
      if(req.url==='/tokenize'){
        const count=body.messages.flatMap(message=>Array.isArray(message.content)?message.content:[]).filter(part=>part.type==='image_url').length;
        admissions.push(count);res.end(JSON.stringify({count:1000,max_model_len:65536}));return;
      }
      if(JSON.stringify(body.messages.at(-1)).includes('compaction engine')){
        summaries.push(body);
        res.writeHead(200,{'Content-Type':'text/event-stream'});
        res.end('data: '+JSON.stringify({choices:[{index:0,delta:{role:'assistant',content:'Saved ROI observations. Read analysis_context for current revision and pending evidence IDs.'},finish_reason:null}]})+'\n\n'+'data: '+JSON.stringify({choices:[{index:0,delta:{},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n');return;
      }
      wire.push(body);
      const contextIndex=body.messages.findLastIndex(message=>message.role==='user'&&parse(message.content)?.job_id);
      const context=parse(body.messages[contextIndex].content),progress=context.media_progress[0];
      assert.equal(context.round.round_id,1);
      assert.equal(context.round.targets.length,1);
      if(context.revision>0){
        const checkpoint=body.messages.filter(message=>message.role==='user').map(message=>parse(message.content)).filter(value=>value?.job_id).at(-1);
        assert.equal(checkpoint.revision,context.revision);
        assert.equal(checkpoint.accepted_observations.length,context.revision);
        assert.equal(checkpoint.catalog[catalogField][0].counter_evidence_ids.length,1);
        assert.deepEqual(checkpoint.catalog.unresolved_questions,['局部边缘仍需核对。']);
        if(catalogPaging){assert.equal(context.catalog_counts.checks,40);assert.equal(context.catalog.checks.length,40);}
      }
      const outputs=body.messages.slice(contextIndex+1).filter(message=>message.role==='tool').map(message=>parse(message.content));
      const pages=outputs.filter(value=>value?.images);
      const actual=body.messages.flatMap(message=>Array.isArray(message.content)?message.content:[]).filter(part=>part.type==='image_url');
      assert.ok(actual.length>=pages.flatMap(page=>page.images).length,'当前页图片实际传入模型');
      let call;
      const catalogPage=outputs.find(value=>value?.section==='checks');
      if(catalogPaging&&context.revision>0&&!catalogPage)call={name:'analysis_catalog',arguments:{section:'checks',ids:['C35'],limit:1}};
      else if(!pages.length){
        if(catalogPage){assert.equal(catalogPage.items[0].check_id,'C35');assert.equal(catalogPage.items[0].counter_evidence_ids.length,1);assert.equal(catalogPage.revision,context.revision);}
        call={name:'analysis_images',arguments:{sample_id:context.round.targets[0].sample_id,offset:progress.observed_evidence_ids.length,limit:5}};
      }
      else {
        const page=pages[0];assert.ok(!page.error);assert.equal(page.total,61);
        assert.deepEqual(actual.slice(-page.images.length).map(part=>createHash('sha256').update(Buffer.from(part.image_url.url.split(',')[1],'base64')).digest('hex')),
          page.images.map(item=>item.image.sha256));
        const ids=page.images.map(item=>item.image.evidence_id);
        const existing=context.catalog[catalogField][0];
        const entry={title:'边缘关系',limitations:['单一来源。'],counter_evidence_ids:existing?[]:[ids[0]],dataset_ids:[page.images[0].dataset_id],
          [supportField]:existing?existing[supportField]:[ids[0]],...(exploration
            ?{direction_id:'D1',instruction:'核对边缘连续性。',applies_to:'both',rationale:'当前局部可见。'}
            :{check_id:'C1',subject:'主体',location:'边缘',criterion:'核对边缘连续性。',allowed_variations:[],status:'conflicted',direction_refs:['D1']})};
        call={name:exploration?'exploration_commit':'knowledge_commit',arguments:{commit_key:'part-'+context.revision,round_id:1,base_revision:context.revision,
          observations:[{sample_id:page.sample_id,dataset_id:page.images[0].dataset_id,description:'本页可见原图或标注局部。',evidence_ids:ids,
            directions:exploration?[]:[{direction_ref:'D1',status:'applicable',reason:'边缘可见。'}]}],
          [catalogField]:[entry],summary:'累积本张全部局部观察。',limitations:['尚需独立来源。'],unresolved_questions:['局部边缘仍需核对。']}};
        if(catalogPaging&&context.revision===0)call.arguments.checks=Array.from({length:40},(_,index)=>({...call.arguments.checks[0],check_id:'C'+(index+1),title:'边缘关系'+(index+1)}));
        if(page.offset+page.images.length===page.total)call.arguments[catalogField].push({...entry,
          title:'末页局部新现象',counter_evidence_ids:[],...(exploration
            ?{direction_id:'last-roi-discovery',instruction:'复看末页首次见到的边缘变化。'}
            :{check_id:'last-roi-discovery',criterion:'末页首次见到的边缘变化需要独立来源核验。',status:'provisional'})});
      }
      if(call.name===module+'_commit')proposals.push({revision:context.revision,counter_evidence_ids:call.arguments[catalogField][0].counter_evidence_ids});
      res.writeHead(200,{'Content-Type':'text/event-stream'});
      res.write('data: '+JSON.stringify({choices:[{index:0,delta:{role:'assistant',tool_calls:[{index:0,id:randomUUID(),type:'function',function:{name:call.name,arguments:JSON.stringify(call.arguments)}}]},finish_reason:null}]})+'\n\n');
      res.write('data: '+JSON.stringify({choices:[{index:0,delta:{},finish_reason:'tool_calls'}],usage:{prompt_tokens:500,completion_tokens:100,total_tokens:600}})+'\n\n');res.end('data: [DONE]\n\n');
    } catch(error){errors.push(String(error));res.writeHead(500);res.end(JSON.stringify({error:{message:String(error)}}));}
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{if(child&&child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');await runtime?.dispose();
    if(server)await new Promise(resolve=>server.close(resolve));provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));await fs.rm(root,{recursive:true,force:true});});
  const data=JSON.parse(execFileSync(resolvePythonPath(),['-c',`
import sys,json
from pathlib import Path
from PIL import Image
from iad_core.dataset.registry import DatasetRegistry,DatasetImport
from iad_core.storage.database import Database
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.knowledge.instructions import default_directions
from iad_core.analysis.prompt_text import knowledge_agent_prompt
root=Path(sys.argv[1]);directory=root/'images';directory.mkdir()
Image.new('RGB',(320,240),'gray').save(directory/'sample.png')
(directory/'sample.json').write_text(json.dumps(dict(imageWidth=320,imageHeight=240,shapes=[dict(label='scratch',shape_type='rectangle',points=[[10+9*i,40],[15+9*i,45]]) for i in range(30)])))
db=Database(sys.argv[2]);dataset=DatasetRegistry(db).import_labelme(DatasetImport(format='labelme',name='30局部',image_dir=str(directory),annotation_dir=str(directory)))
for module in ['knowledge','exploration']:ModuleSettings(db).save(dict(module=module,expected_revision=0,settings=dict(model=dict(provider_id='fixture',model_id='native-image'),batch_size=1)))
print(json.dumps(dict(dataset_id=dataset.dataset.id,mining_prompt=dict(objective='观察所有原始局部。',instruction=knowledge_agent_prompt(),directions=[default_directions()[0].model_dump(mode='json')]))))
`,root,database],{cwd:workspace,env:{...process.env,PYTHONPATH:path.join(workspace,'python')},encoding:'utf8'}));
  const endpoint=`http://127.0.0.1:${provider.address().port}/v1`;
  const submission={submission_id:randomUUID(),analysis_kind:module,dataset_ids:[data.dataset_id],...(exploration
    ?{normal_images:[data.dataset_id+':sample.png'],prompt:{text:'观察全部原图与标注局部。'}}:{mining_prompt:data.mining_prompt})};
  let committed;
  if(recovery){
    child=fork(new URL('./fixtures/analysis-recovery-child.js',import.meta.url),[root,endpoint,JSON.stringify(submission)],
      {execPath:process.env.IAD_NODE_PATH||process.execPath,stdio:['ignore','pipe','pipe','ipc']});
    let output='';child.stdout.on('data',data=>{output+=data;});child.stderr.on('data',data=>{output+=data;});
    committed=await new Promise((resolve,reject)=>{child.once('message',resolve);child.once('error',reject);
      child.once('exit',(code,signal)=>reject(new Error(`Recovery child exited ${code}/${signal}: ${output}`)));});
    assert.equal(committed.receipt.revision,1);assert.equal(committed.observed,5);assert.equal(committed.native_commit_calls,1);
    const exited=once(child,'exit');child.kill('SIGKILL');assert.deepEqual(await exited,[null,'SIGKILL']);
  }
  runtime=await createAnalysisAgentHost(root,endpoint,{onError:error=>errors.push(String(error))});
  const {bridge,host,scheduler}=runtime;
  const browser=process.env.IAD_ANALYSIS_ROI_BROWSER==='1'&&!exploration&&!recovery&&!catalogPaging?await import('./fixtures/analysis-page.js'):null;
  const page=browser?await browser.analysisPageBundle('knowledge',await bridge.execute('dataset_get',{dataset_id:data.dataset_id})):null;
  const handler=createIadHttpHandler(bridge);
  server=http.createServer((req,res)=>{
    if(page&&req.url==='/analysis-browser.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(page);}
    else if(page&&new URL(req.url,'http://localhost').pathname==='/analysis-browser'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<div id="root"></div><script src="/analysis-browser.js"></script>');}
    else void handler(req,res);
  });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/iad`;
  if(recovery){
    await bridge.execute('analysis_agent_context',{run_id:committed.run_id});
    const interrupted=await(await fetch(base+'/analysis/status/'+committed.run_id)).json();
    assert.equal(interrupted.status,'INTERRUPTED');assert.ok(interrupted.analysis_version_id,'interruption publishes the already committed partial observations');
    await bridge.execute('module_settings_save',{module:'knowledge',expected_revision:1,settings:{model:null,batch_size:9}});
  }
  const response=await fetch(base+(recovery?'/analysis/retry/'+committed.run_id:'/analysis/start'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(recovery?{}:submission)});
  assert.equal(response.status,200,await response.clone().text());const job=await response.json();await scheduler.whenIdle();
  const status=await(await fetch(base+'/analysis/status/'+job.run_id)).json();
  assert.equal(status.status,'COMPLETED',JSON.stringify({errors,execution_error:status.execution_error}));assert.equal(status.completed,1);
  const publication=await bridge.execute('analysis_agent_publication',{version_id:status.analysis_version_id});
  assert.equal(publication.coverage.observed_visuals,61);assert.equal(publication.coverage.prepared_visuals,61);
  const generations=catalogPaging?publication.revision*3-1:26;
  assert.equal(publication.catalog[catalogField][0].counter_evidence_ids.length,1);assert.deepEqual(errors,[]);assert.equal(wire.length,generations);

  const context=await bridge.execute('analysis_agent_context',{run_id:job.run_id});const session=await host.read(context.session_id);
  if(recovery){assert.equal(context.session_id,committed.session_id);assert.equal(job.run_id,committed.run_id);}
  assert.ok(!session.events.some(event=>event.type==='user/message'&&event.data.source.kind==='analysis-checkpoint'));
  assert.ok(summaries.length>=2,'同一业务Session至少两次实际调用官方摘要模型');
  assert.equal(session.events.filter(event=>event.type==='compaction/summary').length,summaries.length);
  const discovery=publication.catalog[catalogField].find(entry=>(entry.direction_id||entry.check_id)==='last-roi-discovery');
  assert.ok(discovery);
  if(!exploration){assert.equal(discovery.independent_source_count,1);assert.equal(discovery.status,'provisional');}
  assert.equal((await fs.readdir(path.join(root,module+'-sessions'))).length,1);
  const exported=await fetch(base+'/analysis/publications/'+status.analysis_version_id+'/export');
  assert.equal(exported.status,200,exported.ok?'':await exported.text());
  const archive=Buffer.from(await exported.arrayBuffer());const archivePath=path.join(root,'download.zip');await fs.writeFile(archivePath,archive);
  const verified=JSON.parse(execFileSync(resolvePythonPath(),['-c',`
import sys,json,zipfile,hashlib
with zipfile.ZipFile(sys.argv[1]) as archive:
    names=set(archive.namelist())
    assert {'manifest.json','coverage.json',sys.argv[3],'evidence.jsonl','rounds.jsonl','session/events.jsonl'} <= names
    manifest=json.loads(archive.read('manifest.json'));coverage=json.loads(archive.read('coverage.json'))
    assert 'agent' not in manifest['snapshot'] and 'api_key' not in str(manifest).lower()
    assert coverage['completed']==1 and coverage['observed_visuals']==61
    evidence=[json.loads(line) for line in archive.read('evidence.jsonl').splitlines()]
    assert len(evidence)==61 and all(item['model_calls'] for item in evidence)
    assert all(hashlib.sha256(archive.read(item['media_path'])).hexdigest()==item['image']['sha256'] for item in evidence)
    rounds=[json.loads(line) for line in archive.read('rounds.jsonl').splitlines()]
    assert len(rounds)==int(sys.argv[2]) and all(item['round_id']==1 for item in rounds)
    assert [item['revision'] for item in rounds]==list(range(1,int(sys.argv[2])+1))
    assert all(item['session_id']==manifest['session_id'] for item in rounds)
    print(json.dumps({'version_id':manifest['version_id'],'session_sha256':hashlib.sha256(archive.read('session/events.jsonl')).hexdigest()}))
`,archivePath,String(publication.revision),exploration?'directions.json':'knowledge.json'],{encoding:'utf8'}));
  assert.equal(verified.version_id,status.analysis_version_id);
  assert.equal(verified.session_sha256,createHash('sha256').update(await host.exportJsonl(context.session_id)).digest('hex'));
  if(process.env.IAD_ANALYSIS_COMPACTION_EVIDENCE_DIR){
    const directory=path.resolve(process.env.IAD_ANALYSIS_COMPACTION_EVIDENCE_DIR);
    await fs.mkdir(directory,{recursive:true});
    const name=module+(recovery?'-recovery':catalogPaging?'-catalog':'-roi');
    await fs.writeFile(path.join(directory,name+'.json'),JSON.stringify({provider_kind:'simulated',module,job_id:job.run_id,session_id:context.session_id,
      summarizer_omits_counterexample:true,official_summary_requests:summaries.length,summary_events:session.events.filter(event=>event.type==='compaction/summary').length,
      completed:status.completed,prepared_visuals:publication.coverage.prepared_visuals,observed_visuals:publication.coverage.observed_visuals,
      submitted_counters:proposals,retained_counters:publication.catalog[catalogField][0].counter_evidence_ids,
      unresolved_questions:publication.catalog.unresolved_questions,last_page_discovery:discovery,
      session_sha256:verified.session_sha256,archive_sha256:createHash('sha256').update(archive).digest('hex')},null,2));
    await fs.copyFile(archivePath,path.join(directory,name+'.zip'));
  }
  assert.deepEqual(Buffer.from(await(await fetch(base+'/analysis/publications/'+status.analysis_version_id+'/export')).arrayBuffer()),archive);
  assert.equal(wire.length,generations);
  if(browser){await browser.verifyAnalysisRoiPage(base.replace('/api/iad',''));assert.equal(wire.length,generations);}
});
