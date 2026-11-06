import {observationMatrix} from './fixtures/knowledge-observations.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {PythonBridge, resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';

test('public HTTP runs frozen exploration and mining batches and persists criterion assessments', {timeout:30000}, async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-analysis-batches-'));
  execFileSync(resolvePythonPath(),[fileURLToPath(new URL('fixtures/knowledge_dataset.py',import.meta.url)),root,'--folder']);
  await fs.copyFile(path.join(root,'folder-dataset/OK/batch/part-0.png'),path.join(root,'folder-dataset/unknown/part-3.png'));
  const unknownStages=new Set();
  const model=http.createServer(async(req,res)=>{
    let raw='';for await(const chunk of req)raw+=chunk;
    const body=JSON.parse(raw);res.setHeader('Content-Type','application/json');
    if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:32768}));return;}
    const parts=body.messages[0].content, prompt=parts[0].text;
    const images=parts.filter(p=>p.type==='text'&&p.text.startsWith('视觉证据：')).map(p=>JSON.parse(p.text.slice(5)));
    assert.ok(images.every(image=>image.role!=='roi' && ['OK','NG','UNKNOWN'].includes(image.image_label)));
    if(images.some(image=>image.image_label==='UNKNOWN'))unknownStages.add(body.response_format.json_schema.name);
    let result;
    if(body.response_format.json_schema.name==='DirectionDraft')result={summary:'孔位方向',directions:[{title:'孔位关系',instruction:'联合比较孔位与光照',applies_to:'both',rationale:'本批可见孔位',evidence_ids:[images[0].evidence_id],limitations:[]}],limitations:[]};
    else if(body.response_format.json_schema.name==='GroupAnalysisDraft'){
      const scope=JSON.parse(prompt.split('冻结图组：')[1].split('\n请根据图像')[0]);
      const references=Object.entries(scope.candidates).map(([candidate_id,item])=>({candidate_id,
        comparison:{result_id:item.comparison.result_id,evidence_id:item.comparison.evidence_id}}));
      result={overall:{verdict:'UNCERTAIN',text:'缺少标注对象对应依据',references},
        assessments:references.map(ref=>({candidate_id:ref.candidate_id,verdict:'UNCERTAIN',conclusion:'缺少标注对象对应依据',explanation:'保留比较限制',findings:[]})),
        conclusions:[{text:'逐批核对实际图像与标签',references}],limitations:[]};
    }
    else if(body.response_format.json_schema.name==='KnowledgeDiscoveryLinks'){
      const scope=JSON.parse(prompt.split('冻结视觉提取：').at(-1).split('\n请根据图像')[0]);
      result=Object.fromEntries(scope.discovery.areas.map((area,index)=>['area_'+index,
        {status:'证据不足',subjects:['主体'],check_titles:[]}]));
    }else if(body.response_format.json_schema.name==='KnowledgeObservations'){
      const scope=JSON.parse(prompt.split('冻结观察请求：')[1].split('\n请根据图像')[0]);
      result=observationMatrix(scope,source=>({status:'supports',description:'当前来源可见轮廓',position_analysis:'主体',illumination_analysis:'均匀',normal_explanation:'未见反例',evidence_ids:source.raw_evidence_keys,suspects:[]}));
    }else{
      const raw=images.filter(image=>image.representation==='raw'),support=raw.filter(image=>image.image_label==='OK');
      const directions=[...prompt.matchAll(/^(direction_[a-f0-9]+) \| ([^：\n]+)：/gm)];
      result={summary:'主体轮廓',checks:[{title:'主体轮廓',subject:'主体',location:'全图',criterion:'可见连续外轮廓',allowed_variations:[],support_evidence_ids:support.map(i=>i.evidence_id),counter_evidence_ids:[],limitations:[],status:support.length?'supported':'provisional'}],suspects:[],limitations:[],
        discovery:{parts:[{name:'主体',location:'全图',evidence_ids:raw.map(image=>image.evidence_id)}],areas:directions.map(([,id,title])=>({direction_id:id,direction:title,status:'证据不足',reason:'合成流程验证方向覆盖',evidence_ids:raw.map(image=>image.evidence_id)}))}};
    }
    res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]}));
  });
  await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));
  const env={LIVE_VLM_ENDPOINT:`http://127.0.0.1:${model.address().port}/v1`,LIVE_VLM_MODEL:'batch-model',LIVE_VLM_CAPACITY_MODE:'vllm_tokenize',IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES:'2'};
  const previous=Object.fromEntries(Object.keys(env).map(key=>[key,process.env[key]]));Object.assign(process.env,env);
  const bridge=new PythonBridge({dbPath:path.join(root,'test.db')});
  const api=http.createServer(createIadHttpHandler(bridge));await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${api.address().port}/api/iad`;
  const get=async url=>{const r=await fetch(base+url);assert.equal(r.status,200,await r.clone().text());return r.json();};
  const post=async(url,body)=>{const r=await fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return r.json();};
  const terminal=async(kind,job)=>{const deadline=Date.now()+10000;while(['PENDING','RUNNING'].includes(job.status)&&Date.now()<deadline){await delay(20);job=await get(`/${kind}/status/${job.run_id}`);}assert.equal(job.status,'COMPLETED',JSON.stringify(job.errors));return job;};
  try{
    const rules=[{path:'OK',role:'normal'},{path:'NG',role:'anomaly'}], root_dir=path.join(root,'folder-dataset');
    const preview=await post('/datasets/preview',{root_dir,rules});
    const dataset=await post('/datasets/import',{format:'folder_classification',name:'HTTP批次',root_dir,rules,preview_fingerprint:preview.preview_fingerprint});
    const normal=await get(`/knowledge/sources?dataset_id=${dataset.dataset_id}&kind=normal`), defect=await get(`/knowledge/sources?dataset_id=${dataset.dataset_id}&kind=defect`);
    const explore=await terminal('exploration',await post('/exploration/batches/start',{submission_id:randomUUID(),dataset_id:dataset.dataset_id,normal_images:normal.items.map(i=>i.sample_id),defect_images:defect.items.map(i=>i.sample_id),initial_batch_size:3,batch_size:2}));
    assert.equal(explore.completed,4);assert.equal(explore.batch_runs.length,2);
    const first=await get('/exploration/status/'+explore.batch_runs[0]), second=await get('/exploration/status/'+explore.batch_runs[1]);
    assert.equal(second.exploration_request.parent_version_id,first.exploration_version_id);
    const submission={submission_id:randomUUID(),dataset_id:dataset.dataset_id,batch_size:2,
      mining_prompt:{objective:'完整图组观察',directions:[],instruction:'联合比较当前图组，按实际图像保留支持、反对与未知。'}};
    const job=await terminal('knowledge',await post('/knowledge/batches/start',submission));
    assert.equal((await post('/knowledge/batches/start',submission)).run_id,job.run_id);
    assert.equal(job.completed,5,'知识挖掘覆盖全部登记图像，包含未分类来源');assert.equal(job.batch_runs.length,3);
    const catalog=await get('/knowledge/versions?dataset_id='+dataset.dataset_id);
    assert.equal(catalog.current_version_id,job.knowledge_version_id);
    const original=await get('/knowledge?version_id='+job.knowledge_version_id);
    const check=original.knowledge.checks[0];
    const review=await post('/knowledge/check-review',{version_id:job.knowledge_version_id,check_id:check.check_id,submission_id:randomUUID(),expected_revision:0,status:'rejected',note:'需要另一视角'});
    assert.equal(review.revision,1);
    const page=await get(`/knowledge/details?version_id=${job.knowledge_version_id}&review_status=rejected`);
    assert.equal(page.total,1);assert.deepEqual(page.items[0].review,review);
    assert.deepEqual((await get('/knowledge?version_id='+job.knowledge_version_id)).knowledge,original.knowledge);
    let consistency=await post('/consistency/model-batches/start',{submission_id:randomUUID(),subjects:{kind:'samples',
      sample_ids:[...normal.items,...defect.items].map(item=>item.sample_id)},batch_size:3});
    const deadline=Date.now()+10000;
    while(['PENDING','RUNNING'].includes(consistency.status)&&Date.now()<deadline){await delay(20);consistency=await get('/consistency/model-batches/'+consistency.run_id);}
    assert.equal(consistency.status,'COMPLETED',JSON.stringify(consistency.errors));
    assert.equal(consistency.completed,4);assert.equal(consistency.batch_runs.length,2);
    for(const id of consistency.batch_runs){
      const child=await get('/consistency/model-batches/'+id);
      assert.equal(child.group_analysis.overall.verdict,'UNCERTAIN');
    }
    const secondRoot=path.join(root,'second-folder');
    await fs.cp(root_dir,secondRoot,{recursive:true});
    const secondPreview=await post('/datasets/preview',{root_dir:secondRoot,rules});
    const secondDataset=await post('/datasets/import',{format:'folder_classification',name:'第二子集',root_dir:secondRoot,rules,preview_fingerprint:secondPreview.preview_fingerprint});
    const request={submission_id:randomUUID(),analysis_kind:'exploration',dataset_ids:[dataset.dataset_id,secondDataset.dataset_id],initial_batch_size:3,batch_size:2};
    const grouped=await terminal('analysis',await post('/analysis/start',request));
    assert.equal(grouped.completed,10);assert.equal(grouped.dataset_results.length,2);
    assert.equal((await post('/analysis/start',request)).run_id,grouped.run_id);
    for(const datasetId of request.dataset_ids){
      const list=await get(`/analysis/jobs?dataset_id=${datasetId}&analysis_kind=exploration`);
      assert.equal(list.jobs.length,1);assert.equal(list.jobs[0].completed,10);
      assert.ok(!('request' in list.jobs[0]),'Job lists omit the full frozen source manifest');
    }
    const results=await get('/analysis/results/'+grouped.run_id);
    assert.equal(results.snapshots.length,2);
    assert.ok(results.snapshots.every(snapshot=>snapshot.request.parent_version_id));
    const miningPrompt={objective:'联合观察完整范围',directions:[],instruction:'联合比较本次图组的可见外观，保留正反证据和待确认项。'};
    const sharedBefore=await get('/knowledge/prompt?'+new URLSearchParams({dataset_id:dataset.dataset_id,kind:'normal'}));
    const mined=await terminal('analysis',await post('/analysis/start',{analysis_kind:'knowledge',dataset_ids:request.dataset_ids,batch_size:2,mining_prompt:miningPrompt}));
    assert.equal(mined.completed,10);assert.equal(mined.dataset_results.length,2);
    assert.deepEqual(await get('/knowledge/prompt?'+new URLSearchParams({dataset_id:dataset.dataset_id,kind:'normal'})),sharedBefore);
    for(const result of mined.dataset_results){
      const snapshot=(await get('/knowledge?'+new URLSearchParams({version_id:result.knowledge_version_id}))).knowledge;
      assert.equal(snapshot.mining_prompt.instruction,miningPrompt.instruction);
    }
    const checked=await terminal('analysis',await post('/analysis/start',{analysis_kind:'consistency',mode:'exact',dataset_ids:request.dataset_ids,batch_size:4}));
    assert.equal(checked.completed,10);assert.ok(checked.program_batch_id);
    assert.equal((await get('/consistency/runs/'+checked.program_batch_id)).status,'COMPLETED');
    assert.ok(unknownStages.has('KnowledgeDraft')&&unknownStages.has('GroupAnalysisDraft'),'未分类图像保留UNKNOWN并参与知识与一致性全范围观察');
    const snapshot=results.snapshots[0], direction=snapshot.directions[0];
    const removal={dataset_id:snapshot.dataset_id,version_id:snapshot.version_id,direction_id:direction.direction_id};
    assert.deepEqual(await post('/exploration/directions/remove',removal),removal);
    assert.deepEqual(await post('/exploration/directions/remove',removal),removal);
    const current=await get('/analysis/results/'+grouped.run_id);
    assert.deepEqual(current.snapshots,results.snapshots);
    assert.ok(current.removed_direction_ids.includes(direction.direction_id));
    const prompt=await get('/knowledge/prompt?'+new URLSearchParams({dataset_id:snapshot.dataset_id,kind:'normal'}));
    assert.ok(!prompt.configuration.directions.some(item=>item.direction_id===direction.direction_id));
  }finally{
    bridge.destroy();await new Promise(resolve=>api.close(resolve));await new Promise(resolve=>model.close(resolve));
    for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
    await fs.rm(root,{recursive:true,force:true});
  }
});
