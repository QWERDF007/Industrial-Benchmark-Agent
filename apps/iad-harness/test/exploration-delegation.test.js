import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createAnalysisAgentHost} from './fixtures/analysis-agent-host.js';
import {respondFixtureTools,finalizeFixtureCatalog,evidenceOnDemandFixtureCalls} from './fixtures/analysis-finalization.js';

for(const module of ['exploration','knowledge'])for(const scenario of ['complete','failure','cancel','empty'])test('DSH native '+module+' children jointly observe four mixed batches: '+scenario,{timeout:90000},async t=>{
  const knowledge=module==='knowledge';
  const onDemand=process.env.IAD_ANALYSIS_ON_DEMAND==='1';
  const imageCount=Number(process.env.IAD_ANALYSIS_IMAGE_COUNT||20),batchSize=imageCount===100?8:4;
  const batchCount=Math.ceil((imageCount-batchSize)/batchSize);
  const respond=(res,calls)=>respondFixtureTools(res,onDemand?evidenceOnDemandFixtureCalls(calls):calls);
  const mainSystem='主系统：统一复核观察报告并更新方向目录。',mainUser='主任务：建立初始目录并全局定稿。';
  const observerPrompt={system_prompt:'子系统：整批观察，不修改全局目录。',user_prompt:'子任务：独立记录事实、支持、反例和新现象。'};
  const empty=scenario==='empty',resume=['failure','cancel'].includes(scenario),cancel=scenario==='cancel',concurrency=resume?4:2;
  const waves=Math.ceil(batchCount/concurrency);
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-native-delegation-')),workspace=findWorkspaceRoot();
  let runtime,inflight=0,peak=0,release,failedOnce=false,partialArchive,waveStarted,cancelled=false,compactions=0;
  const started=new Promise(resolve=>{waveStarted=resolve;});
  const overlap=new Promise(resolve=>{release=resolve;}),errors=[],children=[],mainRequests=[],wireStats=[];
  const parse=value=>{try{return JSON.parse((typeof value==='string'?value:value.find(item=>item.type==='text').text).split('\n')[0]);}catch{return null;}};
  const provider=http.createServer(async(req,res)=>{
    try{
      assert.notEqual(req.url,'/tokenize');const chunks=[];for await(const chunk of req)chunks.push(chunk);
      const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));
      wireStats.push({images:body.messages.flatMap(message=>Array.isArray(message.content)?message.content:[]).filter(block=>block.type==='image_url').length,chars:JSON.stringify(body.messages).length});
      if(JSON.stringify(body.messages.at(-1)).includes('compaction engine')){
        compactions++;res.writeHead(200,{'Content-Type':'text/event-stream'});
        res.end('data: '+JSON.stringify({choices:[{index:0,delta:{role:'assistant',content:'主Agent正在复核已保存的子报告。通过analysis_context恢复当前角色、待复核批次与完整原始报告。'},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n');return;
      }
      const userIndex=body.messages.findLastIndex(message=>message.role==='user'&&parse(message.content)?.job_id);
      const restoredIndex=body.messages.findLastIndex(message=>message.role==='tool'&&(parse(message.content)?.role||parse(message.content)?.phase==='finalize'||parse(message.content)?.round));
      const index=Math.max(userIndex,restoredIndex);
      if(index<0){respond(res,[{name:'analysis_context',arguments:{}}]);return;}
      const context=parse(body.messages[index].content);assert.ok(context);
      if(onDemand&&knowledge)assert.ok(context.selected_directions.every(direction=>!('source_evidence_ids' in direction)&&!('source_counter_evidence_ids' in direction)),'所选探索方向的累计证据清单不进入自动挖掘上下文');
      const systemText=JSON.stringify(body.messages.filter(message=>message.role==='system'));
      assert.ok(systemText.includes(context.role==='observer'?observerPrompt.system_prompt:mainSystem));
      assert.ok(!systemText.includes(context.role==='observer'?mainSystem:observerPrompt.system_prompt));
      if(userIndex>=0){
        const userText=JSON.stringify(body.messages[userIndex].content);
        assert.ok(userText.includes(context.role==='observer'?observerPrompt.user_prompt:mainUser));
        if(index===userIndex){
          const tasks=userText.match(/# 当前任务：/g)||[];
          const stage=knowledge?(context.role==='observer'?'当前批次知识联合观察':context.role==='reviewer'?'知识整波统一复核':context.phase==='finalize'?'知识全局定稿':'知识首批联合观察'):(context.role==='observer'?'当前批次联合探索':context.role==='reviewer'?'整波统一复核':context.phase==='finalize'?'全局定稿':'手选首批联合探索');
          assert.equal(tasks.length,1);assert.ok(userText.includes('# 当前任务：'+stage));
        }
      }
      const pages=context.role==='observer'&&index===restoredIndex?context.registrations:
        (Array.isArray(body.messages[index].content)?body.messages[index].content:[])
          .filter(block=>block.type==='text').map(block=>parse(block.text)).filter(value=>Array.isArray(value?.images));
      const outputs=body.messages.slice(index+(index===restoredIndex?0:1)).filter(message=>message.role==='tool').map(message=>parse(message.content));
      if(context.phase==='finalize'){respond(res,finalizeFixtureCatalog(context,outputs,module));return;}
      if(context.role==='observer'){
        inflight++;peak=Math.max(peak,inflight);children.push(context.task);
        if(inflight===concurrency)release();
        await Promise.race([overlap,new Promise((_,reject)=>setTimeout(()=>reject(new Error('本波观察未并行进入提供商')),10000).unref())]);
        inflight--;
        if(cancel&&!cancelled){
          if(children.length===4)waveStarted();
          await new Promise(resolve=>{res.once('close',resolve);setTimeout(resolve,15000).unref();});
          if(res.destroyed)return;
        }
        if(scenario==='failure'&&context.task.round.round_id===5&&!failedOnce){
          failedOnce=true;
          res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:'实际子请求失败用于恢复验证'}}));return;
        }
        assert.equal(context.task.round.sampling_counts.normal,context.task.round.targets.length/2);assert.equal(context.task.round.sampling_counts.abnormal,context.task.round.targets.length/2);
        assert.equal(pages.length,context.task.round.targets.length);assert.equal(pages.flatMap(page=>page.images).length,pages.length*1.5);
        if(onDemand)assert.ok(body.messages.flatMap(message=>Array.isArray(message.content)?message.content:[]).filter(block=>block.type==='image_url').length<=pages.length*1.5,'失败或取消恢复保留原附件，不再注入同批第二份图片');
        const names=body.tools.map(tool=>tool.function.name);
        assert.ok(!names.includes(module+'_commit')&&!names.includes(module+'_finalize')&&!names.includes('subagent'));
        if(knowledge)assert.deepEqual(context.selected_directions.map(item=>item.ref),['D1']);
        const ids=pages.map(page=>page.evidence_id);
        const discoveries=empty?[]:Array.from({length:context.task.round.round_id===2?3:1},(_,i)=>({candidate_id:'candidate-'+i,
          title:'独立检查对象 '+context.task.round.round_id+'-'+i,...(knowledge?{}:{instruction:'核对独立部位 '+context.task.round.round_id+'-'+i+' 的可见连续关系。'}),
          ...(knowledge?{subject:'主体',location:'独立部位',criterion:'核对可辨的独立部位连续关系。',allowed_variations:[],status:'provisional',support_evidence_ids:[ids[0],ids[Math.floor(pages.length/2)]],counter_evidence_ids:[],direction_refs:['D1'],dataset_ids:[data.dataset_id]}:{rationale:'该部位具备可重复的定位及观察动作。',applies_to:'both',evidence_ids:[ids[0],ids[Math.floor(pages.length/2)]]}),limitations:[]}));
        respond(res,[{name:module+'_observe',arguments:{
          ...(knowledge?{observations:pages.map(page=>({sample_id:page.sample_id,dataset_id:data.dataset_id,description:'主体轮廓可见。',evidence_ids:[page.evidence_id],directions:[{direction_ref:'D1',status:'applicable',reason:'主体结构可核对。'}]}))}:{}),assessments:[],
          discoveries,discovery_summary:'独立核对孔、外缘及开放表面，记录不能由已有动作覆盖的候选。',key_evidence_ids:empty?[]:[ids[Math.floor(pages.length/2)]]}}]);return;
      }
      if(context.role==='reviewer'){
        if(onDemand)assert.equal(body.messages.flatMap(message=>Array.isArray(message.content)?message.content:[]).filter(block=>block.type==='image_url').length,0,'主复核默认不携带推荐原图或历史附件');
        if(onDemand)assert.ok(context.catalog[knowledge?'checks':'directions'].every(entry=>!('evidence_ids' in entry)&&!('support_evidence_ids' in entry)&&!('counter_evidence_ids' in entry)));
        if(onDemand)assert.ok(!('completed_sample_ids' in context)&&!('accepted_observations' in context),'自动上下文不重复累计登记与历史事实清单');
        if(!outputs.length){respond(res,[{name:'analysis_context',arguments:{}}]);return;}
        assert.equal(outputs.at(-1).role,'reviewer','压缩后读取当前上下文仍须恢复主复核角色和原始子报告');
        assert.deepEqual(outputs.at(-1).reports,context.reports);
      }
      mainRequests.push(context);
      const reports=context.reports;
      const ids=pages.map(page=>page.evidence_id);
      const observations=knowledge&&!reports?pages.map(page=>({sample_id:page.sample_id,dataset_id:data.dataset_id,description:'主体轮廓可见。',evidence_ids:[page.evidence_id],directions:[{direction_ref:'D1',status:'applicable',reason:'主体结构可核对。'}]})):[];
      const directions=empty?[]:knowledge?(reports?reports.flatMap(task=>task.report.discoveries.map(({candidate_id,...item})=>({...item,check_id:'direction-'+task.round.round_id+'-'+candidate_id,key_evidence:[{evidence_id:item.support_evidence_ids[task.round.round_id%2?0:1],role:'support',reason:'典型结构说明检查动作。'}]}))):[{check_id:'seed',title:'外缘连续性',subject:'主体',location:'外缘',criterion:'沿可辨外缘检查连续性。',allowed_variations:[],status:'provisional',support_evidence_ids:[ids[0],ids[Math.floor(pages.length/2)]],counter_evidence_ids:[],dataset_ids:[data.dataset_id],direction_refs:['D1'],limitations:[],key_evidence:[{evidence_id:ids[0],role:'support',reason:'典型外缘提供复核参照。'}]}]):reports?reports.flatMap(task=>task.report.discoveries.map(item=>({direction_id:'direction-'+task.round.round_id+'-'+item.candidate_id,
        title:item.title,instruction:item.instruction,rationale:item.rationale,applies_to:item.applies_to,evidence_ids:item.evidence_ids,
        counter_evidence_ids:[],limitations:[],dataset_ids:[data.dataset_id],
        key_evidence:[{evidence_id:item.evidence_ids[task.round.round_id%2?0:1],role:'support',reason:'该原图清楚说明独立可见关系。'}]}))):[{direction_id:'seed',title:'外缘连续性',
        instruction:'沿可辨外缘检查连续关系。',rationale:'同一部位可比较。',applies_to:'both',evidence_ids:[ids[0],ids[Math.floor(pages.length/2)]],
        counter_evidence_ids:[],limitations:[],dataset_ids:[data.dataset_id],
        key_evidence:[{evidence_id:ids[0],role:'support',reason:'首批良品呈现清楚可比的外缘。'}]}];
      if(reports){
        assert.equal(reports.length,concurrency);
        assert.ok(reports.every(task=>!('catalog' in task)),'复核包不按报告重复携带冻结目录');
        assert.equal(context.registrations.length,reports.reduce((total,task)=>total+task.round.targets.length,0));
        if(empty)assert.equal(pages.length,0,'没有精选图时主复核只收批次资料和报告，不重复发送全批图像');
      }
      respond(res,[{name:module+'_commit',arguments:{commit_key:'main-'+context.round.round_id,
        base_revision:context.revision,round_id:context.round.round_id,observations,[knowledge?'checks':'directions']:directions,
        ...(reports?{report_reviews:reports.map(task=>({round_id:task.round.round_id,
          discovery_decisions:task.report.discoveries.map(item=>({candidate_id:item.candidate_id,action:'new',
            [knowledge?'check_id':'direction_id']:'direction-'+task.round.round_id+'-'+item.candidate_id,reason:'部位和检查动作独立，已有目录不能覆盖。'}))}))}:{}),
        arguments:directions.flatMap(item=>(knowledge?item.support_evidence_ids:item.evidence_ids).map(evidence_id=>({entry_id:knowledge?item.check_id:item.direction_id,evidence_id,role:'support',reason:'该原图呈现同部位的可比较外观。'}))),
        summary:'保留可执行比较动作和独立新发现。',limitations:[],unresolved_questions:[]}}]);
    }catch(error){errors.push(String(error.stack));res.writeHead(500);res.end(JSON.stringify({error:{message:String(error)}}));}
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{await runtime?.dispose();provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));await fs.rm(root,{recursive:true,force:true});});
  const data=JSON.parse(execFileSync(resolvePythonPath(),['-c',`
import sys,json
from pathlib import Path
from PIL import Image,ImageDraw
from iad_core.storage.database import Database
from iad_core.dataset.registry import DatasetRegistry,DatasetImport
from iad_core.workbench.module_settings import ModuleSettings
p=Path(sys.argv[1]);d=p/'images';d.mkdir()
for i in range(int(sys.argv[4])):
 im=Image.new('RGB',(100,80),(20+i,40,50));ImageDraw.Draw(im).rectangle([10,10,90,70],outline='white');im.save(d/f'{i:02}.png')
 (d/f'{i:02}.json').write_text(json.dumps(dict(imageWidth=100,imageHeight=80,shapes=[] if i<int(sys.argv[4])//2 else [dict(label='18',shape_type='rectangle',points=[[10,10],[30,30]])])))
db=Database(str(p/'pages.db'));ds=DatasetRegistry(db).import_labelme(DatasetImport(format='labelme',name='并行批次',image_dir=str(d),annotation_dir=str(d)))
ModuleSettings(db).save(dict(module=sys.argv[3],expected_revision=0,settings=dict(model=dict(provider_id='fixture',model_id='native-image'),batch_size=int(sys.argv[5]),**({} if sys.argv[2] in ('complete','empty') else dict(concurrency=4)))))
from iad_core.knowledge.instructions import default_directions
print(json.dumps(dict(dataset_id=ds.dataset.id,direction=default_directions()[0].model_dump(mode='json'))))
`,root,scenario,module,String(imageCount),String(batchSize)],{cwd:workspace,env:{...process.env,PYTHONPATH:path.join(workspace,'python')},encoding:'utf8'}));
  runtime=await createAnalysisAgentHost(root,`http://127.0.0.1:${provider.address().port}/v1`,{contextPolicy:onDemand?'evidence-on-demand-v1':'legacy',contextWindow:32768,onError:error=>errors.push(String(error.stack))});
  const job=await runtime.bridge.execute('analysis_start',{request:{submission_id:randomUUID(),analysis_kind:module,dataset_ids:[data.dataset_id],
    ...(knowledge?{mining_prompt:{objective:'检查主体轮廓。',instruction:mainUser,directions:[data.direction]}}:{normal_images:Array.from({length:batchSize/2},(_,i)=>data.dataset_id+':'+String(i).padStart(2,'0')+'.png'),defect_images:Array.from({length:batchSize/2},(_,i)=>data.dataset_id+':'+String(imageCount/2+i).padStart(2,'0')+'.png'),prompt:{text:mainUser}}),
    system_prompt:mainSystem,observer_prompt:observerPrompt}});
  if(cancel){
    await started;const startedAt=performance.now();
    await runtime.bridge.execute('analysis_cancel',{run_id:job.run_id});cancelled=true;
    assert.ok(performance.now()-startedAt<10000,'取消必须终止实际子请求，不等待提供商完成');
  }
  await runtime.scheduler.whenIdle();
  let status=await runtime.bridge.execute('analysis_status',{run_id:job.run_id});
  if(resume){
    assert.equal(status.status,cancel?'CANCELLED':'PARTIAL',JSON.stringify(status.execution_error));
    assert.equal(status.completed,4);assert.ok(status.model_calls.some(call=>call.error));
    const artifact=await runtime.bridge.execute('analysis_export',{version_id:status.analysis_version_id});
    partialArchive={artifact,version:status.analysis_version_id,bytes:await fs.readFile(artifact.path)};
    await runtime.bridge.execute('analysis_retry',{run_id:job.run_id});
    await runtime.scheduler.whenIdle();status=await runtime.bridge.execute('analysis_status',{run_id:job.run_id});
  }
  assert.deepEqual(errors,[]);assert.equal(status.status,'COMPLETED',JSON.stringify(status.execution_error));assert.equal(status.completed,imageCount);
  assert.equal(peak,concurrency);assert.equal(children.length,cancel?8:resume?5:batchCount);
  assert.deepEqual(new Set(children.map(task=>task.catalog_revision)),new Set(resume?[1]:Array.from({length:waves},(_,i)=>i+1)));
  assert.deepEqual(new Set(children.map(task=>task.wave_id)),new Set(resume?[1]:Array.from({length:waves},(_,i)=>i+1)));
  const publication=await runtime.bridge.execute('analysis_publication',{version_id:status.analysis_version_id});
  assert.equal(publication.catalog[knowledge?'checks':'directions'].length,empty?0:batchCount+3);assert.equal(publication.coverage.whole_images_observed,imageCount);
  assert.equal(new Set(status.model_calls.map(call=>call.session_id)).size,batchCount+1);
  assert.equal(mainRequests.filter(item=>item.round.round_id===1).length,1,'子代理结束通知不能唤醒主Agent重复观察旧首批');
  const selectedGroups=publication.catalog[knowledge?'checks':'directions'].map(item=>item.key_evidence.map(key=>
    publication.evidence.find(image=>image.evidence_id===key.evidence_id)?.sampling_group));
  if(!empty)assert.ok(selectedGroups.some(groups=>groups.length===1&&groups[0]==='normal'),'良品可在观察阶段独立精选');
  if(!empty)assert.ok(selectedGroups.some(groups=>groups.length===1&&groups[0]==='abnormal'),'有良品论据也允许仅精选异常代表');
  assert.ok(mainRequests.filter(item=>item.round.round_id>1).every(item=>item.role==='reviewer'&&item.reports.length),
    JSON.stringify(mainRequests.map(item=>({round:item.round?.round_id,role:item.role,reports:item.reports?.length,phase:item.phase}))));
  const trace=await runtime.host.read(publication.session_id);
  assert.deepEqual(trace.events.filter(event=>event.type==='tool/result'&&event.data.message.isError)
    .map(event=>event.data.message.content),[]);
  assert.equal(publication.delegations.length,batchCount);
  assert.equal(mainRequests.length,1+waves,'整波只需一次主Agent目录提交');
  assert.equal(new Set(publication.delegations.map(task=>task.review_revision)).size,waves);
  t.diagnostic(`main commits=${mainRequests.length}, observer batches=${batchCount}, peak=${peak}, compression=${compactions}`);
  if(onDemand)t.diagnostic(`on-demand: max images per request=${Math.max(...wireStats.map(item=>item.images))}, max message characters=${Math.max(...wireStats.map(item=>item.chars))}, main reviews contain zero images`);
  if(process.env.IAD_ANALYSIS_PROOF_DIR){
    await fs.mkdir(process.env.IAD_ANALYSIS_PROOF_DIR,{recursive:true});
    await fs.writeFile(path.join(process.env.IAD_ANALYSIS_PROOF_DIR,module+'-'+scenario+'-'+imageCount+'.json'),JSON.stringify({imageCount,batchSize,concurrency,compactions,wireStats,mainCommits:mainRequests.length,coverage:publication.coverage.whole_images_observed},null,2));
  }
  if(!empty&&!onDemand)assert.ok(compactions>0,'默认DSH压缩实际运行后仍能读回完整复核上下文');
  const artifact=await runtime.bridge.execute('analysis_export',{version_id:publication.version_id});
  const exported=JSON.parse(execFileSync(resolvePythonPath(),['-c',`
import json,sys,zipfile
with zipfile.ZipFile(sys.argv[1]) as z:
 print(json.dumps(dict(sessions=len([n for n in z.namelist() if n.endswith('events.jsonl')]),reports=len(z.read('observer-reports.jsonl').splitlines()))))
`,artifact.path],{encoding:'utf8'}));
  assert.deepEqual(exported,{sessions:batchCount+1,reports:batchCount});
  if(partialArchive){
    await fs.unlink(partialArchive.artifact.path);
    const restored=await runtime.bridge.execute('analysis_export',{version_id:partialArchive.version});
    assert.deepEqual(await fs.readFile(restored.path),partialArchive.bytes,'恢复后重建旧导出仍保留冻结的子报告和Session边界');
  }
});
