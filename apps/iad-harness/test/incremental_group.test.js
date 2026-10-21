import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { Context } from '@deepseek-ai/cordis';
import { SystemPrompt } from '@deepseek-ai/dsh-system-prompt';
import { ToolRuntime } from '@deepseek-ai/dsh-tools';
import { SkillRegistry } from '@deepseek-ai/dsh-skill';
import { LocalAttachmentStore } from '@deepseek-ai/dsh-attachment-local';
import * as harness from '../lib/server/index.js';
import { resolvePythonPath } from '../lib/server/python-bridge/index.js';

test('explicit image group: three native inputs, exact scope and no implicit preset through the shared HTTP boundary', {timeout:30000}, async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-explicit-group-'));
  execFileSync(resolvePythonPath(),[fileURLToPath(new URL('fixtures/knowledge_dataset.py',import.meta.url)),root]);
  execFileSync(resolvePythonPath(),['-c',"from PIL import Image;import sys;from pathlib import Path;p=Path(sys.argv[1]);Image.open(p/'images/part-0.png').save(p/'images/part-9-copy.png',compress_level=0)",root]);
  execFileSync(resolvePythonPath(),['-c',"from PIL import Image,ImageDraw;import sys;from pathlib import Path;p=Path(sys.argv[1]);[(lambda im,i:(ImageDraw.Draw(im).polygon([(20,20),(150,25),(60,120)],fill=(40+i,80,130)),im.save(p/'images'/f'part-{i}.png')))(Image.new('RGB',(320,240),(150+i,180,200)),i) for i in (3,4)]",root]);
  let duplicateSuspect=false,omitRevisions=false,addNewCheck=false, alterCriterion=false, observationMode="supports", localized=false,holdLearning=null;
  const generations=[];
  const model=http.createServer(async(req,res)=>{
    let text='';for await(const chunk of req)text+=chunk;
    const body=JSON.parse(text);res.setHeader('Content-Type','application/json');
    if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:32768}));return;}
    generations.push(body);
    const parts=body.messages[0].content;
    const images=parts.filter(p=>p.type==='text'&&p.text.startsWith('视觉证据：')).map(p=>JSON.parse(p.text.slice(5)));
    if(body.response_format.json_schema.name==='KnowledgeVerification'){
      const scope=JSON.parse(parts[0].text.split('待核验疑点：')[1].split('\n请根据图像')[0]);
      const findings=scope.findings.map(item=>({finding_id:item.finding_id,status:duplicateSuspect?'refuted':'insufficient',affected_check_titles:[],description:'保留原图和局部供人工核实',normal_explanation:'可能是允许变化',limitations:['合成验证'],evidence_ids:images.filter(e=>e.representation==='raw').map(e=>e.evidence_id),conflicts:[]}));
      res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({findings})}}]}));return;
    }
    if(body.response_format.json_schema.name==='KnowledgeRecheckResult'){
      const scope=JSON.parse(parts[0].text.split('人工处置重核验：')[1].split('\n请根据图像')[0]);
      const decisions=scope.events.map(event=>({submission_id:event.submission_id,status:'resolved',description:'实际新旧图像支持所建议的处置',evidence_ids:images.filter(e=>e.representation==='raw').map(e=>e.evidence_id),limitations:[]}));
      res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({decisions})}}]}));return;
    }
    if(body.response_format.json_schema.name==='KnowledgeObservations'){
      const scope=JSON.parse(parts[0].text.split('冻结观察请求：')[1].split('\n请根据图像')[0]);
      const observations=scope.sources.flatMap(source=>scope.checks.map(check=>({check_id:check.check_id,sample_id:source.sample_id,status:observationMode==='missing'?'supports':observationMode,description:'新图与冻结判据的实际观察',position_analysis:'位于主体范围',illumination_analysis:'光照可见',normal_explanation:'未见反例',evidence_ids:source.raw_evidence_ids,suspects:localized?[{evidence_id:source.raw_evidence_ids[0],bbox_1000:[250,375,375,625],description:'局部轮廓偏离冻结知识',normal_explanation:'也可能是光照'}]:[]})));
      res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify({observations:observationMode==='missing'?[]:observations})}}]}));return;
    }
    if(holdLearning){const hold=holdLearning;holdLearning=null;hold.entered.resolve();await hold.release.promise;}
    const result={summary:'可见主体轮廓',checks:[{title:'主体轮廓',subject:'主体',location:'全图',criterion:'存在连续的主体轮廓',allowed_variations:[],support_evidence_ids:images.filter(e=>e.representation==='raw').map(e=>e.evidence_id),counter_evidence_ids:[],limitations:[],status:'supported'}],suspects:[],limitations:[],revisions:[]};
    if(duplicateSuspect)result.suspects=[{evidence_id:images.at(-1).evidence_id,bbox_1000:[250,375,375,625],description:'相同图像的局部需核验',normal_explanation:'可能是正常结构'}];
    if(alterCriterion)result.checks[0].criterion='主体轮廓与边缘形成闭合区域';
    if(addNewCheck)result.checks.push({...result.checks[0],title:'角部结构',subject:'角部',criterion:'角部存在可见斜边与连接结构'});
    const parentText=parts[0].text.split('冻结父版本候选：')[1]?.split('\n')[0];
    if(parentText&&!omitRevisions){const parent=JSON.parse(parentText);result.revisions=parent.checks.map(check=>({previous_check_id:check.check_id,current_check_titles:['主体轮廓'],reason:'新图支持同一可见判据'}));}
    res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]}));
  });
  await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));
  const previous={capacity:process.env.LIVE_VLM_CAPACITY_MODE,endpoint:process.env.LIVE_VLM_ENDPOINT,model:process.env.LIVE_VLM_MODEL,policy:process.env.IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES};
  process.env.LIVE_VLM_CAPACITY_MODE='vllm_tokenize';
  process.env.LIVE_VLM_ENDPOINT=`http://127.0.0.1:${model.address().port}/v1`;process.env.LIVE_VLM_MODEL='test-mllm';process.env.IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES='2';
  const ctx=new Context();new SystemPrompt(ctx,{});new ToolRuntime(ctx);new SkillRegistry(ctx);new LocalAttachmentStore(ctx,{dshHome:path.join(root,'dsh')});
  const fork=await ctx.plugin(harness,{dbPath:path.join(root,'test.db')});
  const api=http.createServer(harness.createIadHttpHandler(ctx.iadPythonBridge));await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${api.address().port}/api/iad`;
  let calls=0;
  const execute=async(name,args)=>{
    const result=await ctx.tools.execute({name,arguments:args,callId:`group-${++calls}`,signal:new AbortController().signal});
    assert.equal(result.isError,false,JSON.stringify(result));return result.value;
  };
  const completed=async job=>{
    const deadline=Date.now()+10000;
    while(['PENDING','RUNNING'].includes(job.status)&&Date.now()<deadline){await delay(20);job=await execute('knowledge_job_status',{run_id:job.run_id,wait_seconds:0});}
    assert.equal(job.status,'COMPLETED',JSON.stringify(job));return(await execute('knowledge_get',{version_id:job.knowledge_version_id})).knowledge;
  };
  try{
    for(const name of ['knowledge_mine_normal','knowledge_mine_defect']){
      const schema=ctx.tools.schemas().find(t=>t.name===name).parameters;
      assert.deepEqual(Object.keys(schema.properties).sort(),['image_count','images','knowledge_preset']);
      assert.deepEqual([...schema.required].sort(),['image_count','images']);
      assert.equal(schema.properties.images.type,'array');
    }
    const dataset=await execute('dataset_import',{format:'labelme',name:'显式图组',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
    const sources=await execute('knowledge_sources',{dataset_id:dataset.dataset_id,kind:'normal'});
    const selected=sources.items.slice(0,2).map(s=>s.sample_id);
    const duplicate=sources.items.find(item=>item.relative_path==='part-9-copy.png').sample_id;
    await fs.mkdir(path.join(root,'other','labels'),{recursive:true});await fs.cp(path.join(root,'images'),path.join(root,'other','images'),{recursive:true});
    const other=await execute('dataset_import',{format:'labelme',name:'其他数据集',image_dir:path.join(root,'other','images'),annotation_dir:path.join(root,'other','labels')});
    const foreign=(await execute('knowledge_sources',{dataset_id:other.dataset_id,kind:'normal',page_size:1})).items[0].sample_id;
    for(const args of [{image_count:2,images:[selected[0],foreign]},{image_count:1,images:[selected[0]],knowledge_preset:['unknown-version']},{image_count:2,images:[selected[0]]},{image_count:1,images:[]},{image_count:2,images:[selected[0],selected[0]]},{image_count:1,images:['invented']}]){
      const result=await ctx.tools.execute({name:'knowledge_mine_normal',arguments:args,callId:`invalid-${++calls}`,signal:new AbortController().signal});assert.equal(result.isError,true);
    }
    assert.equal(generations.length,0,'Invalid groups must not call the model');
    const first=await completed(await execute('knowledge_mine_normal',{image_count:1,images:[selected[0]]}));
    assert.deepEqual(first.sources.map(s=>s.sample_id),[selected[0]]);assert.equal(first.parent_version_id,null);
    assert.equal(first.checks[0].status,'provisional','One source cannot meet the configured two-source support policy');
    const response=await fetch(base+'/knowledge/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'normal',image_count:1,images:[selected[1]]})});
    assert.equal(response.status,200,await response.clone().text());
    const second=await completed(await response.json());
    assert.deepEqual(second.sources.map(s=>s.sample_id),[selected[1]],'A new group without preset must not union the current head sources');
    assert.equal(second.parent_version_id,null,'Publication concurrency does not imply a semantic parent');
    assert.deepEqual((await execute('knowledge_get',{version_id:first.version_id})).knowledge,first);
    assert.equal(generations[0].model,'test-mllm');
    omitRevisions=true;
    const evolved=await completed(await execute('knowledge_mine_normal',{knowledge_preset:[first.version_id],image_count:1,images:[selected[1]]}));
    omitRevisions=false;
    assert.equal(evolved.support_policy.min_source_groups,2);
    assert.equal(evolved.checks.length,1,'An exactly identical criterion reuses its existing identity even if the model omits relationship bookkeeping');
    assert.equal(evolved.observation_steps.length,1,'Persist old-criterion observations before learning the successor');
    assert.equal(evolved.observation_steps[0].version_id,first.version_id);
    assert.deepEqual(evolved.observation_steps[0].result.observations.map(item=>item.sample_id),[selected[1]]);
    assert.deepEqual(generations.slice(-2).map(body=>body.response_format.json_schema.name),['KnowledgeObservations','KnowledgeDraft']);
    assert.ok(generations.at(-1).messages[0].content[0].text.includes(evolved.observation_steps[0].step_id),'Learning consumes the previously recorded observations');
    assert.equal(evolved.checks[0].status,'supported','Independent evidence can accumulate across explicit presets');
    assert.equal(evolved.parent_version_id,first.version_id,'Explicit semantic parent can differ from the concurrent publication head');
    assert.deepEqual(evolved.observed_source_ids,[selected[1]]);
    assert.deepEqual(evolved.sources.map(source=>source.sample_id).sort(),selected.slice().sort(),'Inherited support sources survive without becoming new observations');
    assert.equal(evolved.checks[0].check_id,first.checks[0].check_id);
    assert.ok(first.checks[0].support_evidence_ids.every(id=>evolved.checks[0].support_evidence_ids.includes(id)),'Preserve historical support, not only old rule text');
    assert.ok(first.evidence.every(e=>evolved.evidence.some(item=>item.image.evidence_id===e.image.evidence_id)));
    const supplied=generations.at(-1).messages[0].content.filter(p=>p.type==='text'&&p.text.startsWith('视觉证据：')).map(p=>JSON.parse(p.text.slice(5)));
    assert.ok(supplied.every(e=>e.source_sha256===evolved.sources.find(source=>source.sample_id===selected[1]).sha256),'Old sources must not all be resent for semantic inheritance');

    alterCriterion=true;
    const refined=await completed(await execute('knowledge_mine_normal',{knowledge_preset:[evolved.version_id],image_count:1,images:[sources.items.find(item=>item.relative_path==='part-3.png').sample_id]}));
    alterCriterion=false;
    const revisionSteps=refined.observation_steps.filter(step=>step.purpose==='revision');
    assert.ok(revisionSteps.length>0,'A changed predicate is visually checked against relevant old support and new images');
    assert.ok(revisionSteps.some(step=>first.checks[0].support_evidence_ids.some(eid=>step.input_evidence_ids.includes(eid))),'Only actual old visual evidence can ground a changed predicate');
    assert.equal(refined.checks[0].check_id,first.checks[0].check_id);
    assert.deepEqual(refined.checks[0].recheck_sample_ids,[selected[1]],'Old support not observed against the materially revised predicate remains pending');
    const unobservedOldIds=new Set(evolved.evidence.filter(item=>item.sample_id===selected[1]).map(item=>item.image.evidence_id));
    assert.ok(refined.checks[0].support_evidence_ids.every(id=>!unobservedOldIds.has(id)),'Unchecked old support cannot count for a new predicate');
    const recheckSources=await execute('knowledge_sources',{dataset_id:dataset.dataset_id,kind:'normal',recheck_from_version:refined.version_id});
    assert.deepEqual(recheckSources.items.map(item=>item.sample_id),[selected[1]]);
    const restrictedScope=await execute('knowledge_scope_open',{dataset_id:dataset.dataset_id,kind:'normal',objective:'仅处理part-3来源',search:'part-3',starting_version_id:refined.version_id});
    assert.equal(restrictedScope.total,1);assert.equal(restrictedScope.recheck,0,'Historical sources outside this frozen range cannot inflate its pending recheck count');
    const restrictedPending=await execute('knowledge_sources',{dataset_id:dataset.dataset_id,kind:'normal',scope_run_id:restrictedScope.scope_run_id,recheck_from_version:refined.version_id});
    assert.equal(restrictedPending.total,0);assert.equal(restrictedPending.coverage.recheck,0);
    await execute('knowledge_scope_stop',{scope_run_id:restrictedScope.scope_run_id});
    alterCriterion=true;
    const criteriaRechecked=await completed(await execute('knowledge_mine_normal',{knowledge_preset:[refined.version_id],image_count:1,images:[selected[1]]}));alterCriterion=false;
    assert.deepEqual(criteriaRechecked.checks[0].recheck_sample_ids,[],'An explicit group can close the actual pending predicate/source observations');
    assert.equal(criteriaRechecked.checks[0].check_id,refined.checks[0].check_id);


    const remainder=await execute('knowledge_sources',{dataset_id:dataset.dataset_id,kind:'normal',uncovered_from_version:evolved.version_id});
    assert.equal(remainder.coverage.observed,2);assert.equal(remainder.coverage.remaining,3);
    const fresh=sources.items.filter(item=>['part-3.png','part-4.png'].includes(item.relative_path)).map(item=>item.sample_id);
    assert.deepEqual(remainder.items.map(item=>item.sample_id),[...fresh,duplicate]);
    addNewCheck=true;
    const expandedJob=await execute('knowledge_mine_normal',{knowledge_preset:[evolved.version_id],image_count:2,images:fresh});
    const expanded=await completed(expandedJob);
    addNewCheck=false;
    assert.equal(expanded.checks.length,2,'Sufficient nonconflicting observations add a new criterion');
    assert.equal(expanded.checks[0].check_id,evolved.checks[0].check_id);
    assert.notEqual(expanded.checks[1].check_id,expanded.checks[0].check_id);
    assert.equal(expanded.checks[1].status,'supported');
    assert.deepEqual(expanded.checks[1].predecessor_check_ids,[]);
    assert.deepEqual(expanded.observed_source_ids,fresh);
    const compactStatus=await ctx.tools.execute({name:'knowledge_job_status',arguments:{run_id:expandedJob.run_id,wait_seconds:0},callId:`status-summary-${++calls}`,signal:new AbortController().signal});
    const modelStatus=JSON.parse(compactStatus.content[0].text);
    assert.equal(modelStatus.sample_ids,undefined,'Polling a job must not repeat the selected image list into the model context');
    assert.equal(modelStatus.images,undefined);assert.equal(modelStatus.completed,2);
    assert.equal(compactStatus.value.sample_ids.length,2,'Workbench still receives the complete canonical job');
    const compactRead=await ctx.tools.execute({name:'knowledge_get',arguments:{version_id:expanded.version_id},callId:`summary-${++calls}`,signal:new AbortController().signal});
    assert.equal(compactRead.isError,false);
    const visible=JSON.parse(compactRead.content[0].text);
    assert.equal(visible.knowledge.source_count,4,'Model-facing knowledge reads return counts rather than enumerating the cumulative source pool');
    assert.equal(visible.knowledge.check_count,2);
    assert.ok(!('sources' in visible.knowledge)&&!('evidence' in visible.knowledge)&&!('observation_steps' in visible.knowledge));
    const criteria=await execute('knowledge_details',{version_id:expanded.version_id,page:1,page_size:1});
    assert.equal(criteria.total,2);assert.equal(criteria.items.length,1);assert.equal(criteria.items[0].check_id,expanded.checks[0].check_id);
    const detailEvidence=await execute('knowledge_details',{version_id:expanded.version_id,check_id:criteria.items[0].check_id,page:1,page_size:1});
    assert.equal(detailEvidence.items.length,1);assert.ok(expanded.checks[0].support_evidence_ids.includes(detailEvidence.items[0].image.evidence_id));

    assert.equal((await execute('knowledge_sources',{dataset_id:dataset.dataset_id,kind:'normal',uncovered_from_version:evolved.version_id})).coverage.remaining,3,'Other successors do not change a requested historical chain');
    duplicateSuspect=true;
    const duplicateKnowledge=await completed(await execute('knowledge_mine_normal',{image_count:2,images:[selected[0],duplicate]}));
    assert.equal(duplicateKnowledge.checks[0].status,'provisional','Identical pixels with different PNG encoding and sample IDs are one support group');
    duplicateSuspect=false;
    assert.equal(duplicateKnowledge.findings[0].judgment.status,'insufficient','Identical pixels with different encodings are not independent comparison evidence either');
    const candidates=await execute('knowledge_sources',{dataset_id:dataset.dataset_id,kind:'defect'});
    const defect=await completed(await execute('knowledge_mine_defect',{image_count:1,images:[candidates.items[0].sample_id]}));
    assert.ok(defect.evidence.every(item=>item.image.role!=='normal'),'Anomaly candidates must not be presented as normal references');
    assert.equal(defect.normal_version_id,null);assert.ok(defect.checks.every(c=>c.status==='provisional'),'Uncalibrated anomaly candidates require a real normal baseline');
    const beforeInvalidPreset=generations.length;
    const wrongKind=await ctx.tools.execute({name:'knowledge_mine_normal',arguments:{image_count:1,images:[selected[0]],knowledge_preset:[defect.version_id]},callId:`wrong-kind-${++calls}`,signal:new AbortController().signal});
    assert.equal(wrongKind.isError,true);assert.equal(generations.length,beforeInvalidPreset);
    const entered=Promise.withResolvers(),release=Promise.withResolvers();holdLearning={entered,release};
    const frozen=await execute('knowledge_mine_normal',{image_count:1,images:[selected[1]],knowledge_preset:[expanded.version_id]});
    await entered.promise;
    const oldPath=path.join(root,'images/part-3.png'),originalPixels=await fs.readFile(oldPath);
    execFileSync(resolvePythonPath(),['-c',"from PIL import Image;import sys;p=sys.argv[1];im=Image.open(p);im.putpixel((0,0),(1,2,3));im.save(p)",oldPath]);
    release.resolve();
    let frozenStatus=frozen;while(['RUNNING','PENDING'].includes(frozenStatus.status)){await delay(20);frozenStatus=await execute('knowledge_job_status',{run_id:frozen.run_id,wait_seconds:0});}
    assert.equal(frozenStatus.status,'FAILED','Changing a historical preset source during generation must prevent publication');
    const staleRetry=await ctx.tools.execute({name:'knowledge_job_retry',arguments:{run_id:frozen.run_id},callId:`stale-retry-${++calls}`,signal:new AbortController().signal});
    assert.equal(staleRetry.isError,true,'Retry must validate the same historical preset, not only newly selected files');
    await fs.writeFile(oldPath,originalPixels);
    observationMode='missing';
    let incomplete=await execute('knowledge_mine_normal',{image_count:1,images:[selected[0]],knowledge_preset:[expanded.version_id]});
    while(['RUNNING','PENDING'].includes(incomplete.status)){await delay(20);incomplete=await execute('knowledge_job_status',{run_id:incomplete.run_id,wait_seconds:0});}
    assert.equal(incomplete.status,'FAILED','Missing frozen observations must not publish a successor');
    assert.equal(incomplete.knowledge_version_id,null);
    observationMode='contradicts';
    localized=true;
    const local=await completed(await execute('knowledge_mine_normal',{image_count:1,images:[fresh[0]],knowledge_preset:[expanded.version_id]}));localized=false;
    assert.ok(local.conflicts.some(item=>item.bbox?.length===4),'Old-criterion observations retain actual localized coordinates');
    assert.ok(local.findings.some(item=>item.regions.some(region=>region.image.role==='roi'&&region.image.representation==='raw')),'A local contradiction remains a real cropped visual finding even when the learner omits the suspect');

    const conflicted=await completed(await execute('knowledge_mine_normal',{image_count:1,images:[selected[0]],knowledge_preset:[expanded.version_id]}));
    assert.ok(conflicted.conflicts.length>0,'Contradictions cannot disappear when the learner omits them');
    const conflict=conflicted.conflicts[0];
    assert.equal(conflict.sample_id,selected[0]);
    assert.equal(conflict.source_sha256,first.sources[0].sha256);
    assert.equal(conflict.origin_version_id,expanded.version_id);
    assert.ok(conflict.observation_step_ids.every(id=>conflicted.observation_steps.some(step=>step.step_id===id)));
    assert.ok(conflict.new_evidence_ids.length>0&&conflict.comparison_evidence_ids.length>0,'Conflict retains actual new and historical evidence');
    assert.ok(conflicted.checks.every(check=>check.status==='conflicted'));
    const beforePaused=generations.length;
    const paused=await ctx.tools.execute({name:'knowledge_mine_normal',arguments:{image_count:1,images:[selected[1]],knowledge_preset:[conflicted.version_id]},callId:`paused-${++calls}`,signal:new AbortController().signal});
    assert.equal(paused.isError,true,'All affected criteria pause preset continuation rather than silently starting from zero');
    assert.equal(generations.length,beforePaused);
    const reviewUrl=base+'/review/knowledge?'+new URLSearchParams({version_id:conflicted.version_id,conflict_id:conflict.conflict_id});
    const reviewResponse=await fetch(reviewUrl);
    assert.equal(reviewResponse.status,200,'Human review opens the same frozen conflict context');
    const context=await reviewResponse.json();
    const submission={submission_id:crypto.randomUUID(),version_id:conflicted.version_id,conflict_id:conflict.conflict_id,
      context_signature:context.context_signature,reviewer:'复核员',action:'revise',instruction:'补充允许亮度变化，保留结构条件',reason:'对比真实新旧证据后需修订'};
    const beforeHuman=generations.length;
    const save=()=>fetch(base+'/review/knowledge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(submission)});
    const saved=await save();assert.equal(saved.status,200,await saved.clone().text());const event=await saved.json();
    assert.deepEqual(await(await save()).json(),event,'Same submission is idempotent');
    const stale=await fetch(base+'/review/knowledge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...submission,submission_id:crypto.randomUUID()})});
    assert.equal(stale.status,422,'An older review context cannot overwrite a concurrently appended decision');
    const reviewed=await(await fetch(reviewUrl)).json();assert.equal(reviewed.state,'pending_recheck');assert.equal(reviewed.events.length,1);
    assert.equal(generations.length,beforeHuman,'Human submission does not start a model or resume a cancelled job');
    assert.deepEqual((await execute('knowledge_get',{version_id:conflicted.version_id})).knowledge,conflicted,'Human events never rewrite the historical knowledge snapshot');
    assert.ok(!ctx.tools.schemas().some(tool=>/review.*submit/.test(tool.name)),'Agent has no human review write tool');
    const sampleReview=await fetch(base+'/review/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submission_id:crypto.randomUUID(),dataset_id:dataset.dataset_id,sample_id:selected[0],reviewer:'复核员',decision:'PASS',comment:'实际图像正常，知识边界需核验'})});
    assert.equal(sampleReview.status,200,await sampleReview.clone().text());
    observationMode='supports';
    const rechecked=await completed(await execute('knowledge_mine_normal',{image_count:1,images:[selected[1]],knowledge_preset:[conflicted.version_id]}));
    assert.equal(rechecked.parent_version_id,conflicted.version_id);
    assert.equal(rechecked.sources.find(source=>source.sample_id===selected[0]).qualification,'human_pass','An explicit recheck freezes the actual human source qualification');
    assert.equal(rechecked.conflicts.find(item=>item.conflict_id===conflict.conflict_id).resolution.submission_id,event.submission_id);
    assert.ok(rechecked.review_applications.some(item=>item.submission_id===event.submission_id&&item.status==='resolved'));
    assert.ok(rechecked.checks.every(check=>check.status==='conflicted'),'Other unresolved conflicts still quarantine shared descendants');
    assert.deepEqual((await execute('knowledge_get',{version_id:conflicted.version_id})).knowledge,conflicted,'Recheck publishes a successor without overwriting the reviewed snapshot');
    const unresolved=rechecked.conflicts.find(item=>item.resolution?.status!=='resolved');
    const nextContext=await(await fetch(base+'/review/knowledge?'+new URLSearchParams({version_id:rechecked.version_id,conflict_id:unresolved.conflict_id}))).json();
    const retain=await fetch(base+'/review/knowledge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submission_id:crypto.randomUUID(),version_id:rechecked.version_id,conflict_id:unresolved.conflict_id,context_signature:nextContext.context_signature,reviewer:'复核员',action:'retain',reason:'图像异常，不作为正常支持，保留结构判据后重核验'})});
    assert.equal(retain.status,200,await retain.clone().text());
    const failReview=await fetch(base+'/review/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submission_id:crypto.randomUUID(),dataset_id:dataset.dataset_id,sample_id:selected[0],reviewer:'复核员',decision:'FAIL',comment:'追加人工确认，原始标签不改'})});
    assert.equal(failReview.status,200,await failReview.clone().text());
    const excluded=await completed(await execute('knowledge_mine_normal',{image_count:1,images:[selected[1]],knowledge_preset:[rechecked.version_id]}));
    assert.ok(excluded.comparison_sources.some(source=>source.sample_id===selected[0]));
    assert.ok(!excluded.sources.some(source=>source.sample_id===selected[0]),'Human FAIL cannot remain in the normal support pool');
    const badEvidence=new Set(excluded.evidence.filter(item=>item.sample_id===selected[0]).map(item=>item.image.evidence_id));
    assert.ok(excluded.checks.every(check=>check.support_evidence_ids.every(eid=>!badEvidence.has(eid))));
    assert.ok(excluded.evidence.some(item=>item.sample_id===selected[0]),'Historical raw evidence remains available as comparison');
    const actualRecheck=JSON.parse(generations.findLast(body=>body.response_format.json_schema.name==='KnowledgeRecheckResult').messages[0].content[0].text.split('人工处置重核验：')[1].split('\n请根据图像')[0]);
    assert.ok(actualRecheck.source_context.some(source=>source.sample_id===selected[0]&&source.qualification==='human_fail'&&source.purpose==='comparison'),'The MLLM sees the actual current qualification of historical comparison sources');
    const malformedHttp=await fetch(base+'/knowledge/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'normal',image_count:1,images:[selected[0]],dataset_id:dataset.dataset_id})});
    assert.equal(malformedHttp.status,422,'The removed request contract must not remain as a second accepted entry');

  }finally{
    await fork.dispose();await new Promise(resolve=>api.close(resolve));await new Promise(resolve=>model.close(resolve));
    for(const [key,value] of [['LIVE_VLM_CAPACITY_MODE',previous.capacity],['LIVE_VLM_ENDPOINT',previous.endpoint],['LIVE_VLM_MODEL',previous.model],['IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES',previous.policy]]){if(value===undefined)delete process.env[key];else process.env[key]=value;}
    await fs.rm(root,{recursive:true,force:true});
  }
});
