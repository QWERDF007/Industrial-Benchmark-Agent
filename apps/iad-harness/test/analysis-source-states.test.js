import test from 'node:test';
import {finalizeFixtureCatalog,respondFixtureTools} from './fixtures/analysis-finalization.js';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';
import {createAnalysisAgentHost} from './fixtures/analysis-agent-host.js';

for(const module of ['exploration','knowledge'])for(const unreadable of [false,true])test(`native ${module} ${unreadable?'retains unreadable sources without publishing a visual result':'preserves every registered source state and publishes actual preparation failures'}`,{timeout:60000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-analysis-source-states-'));
  const errors=[],wire=[];
  let runtime,server,finalizationCalls=0;
  const previousPolicy=process.env.IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES;
  process.env.IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES='2';
  const provider=http.createServer(async(req,res)=>{
    try{
      let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);
      if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:65536}));return;}
      wire.push(body);
      const parse=content=>{try{return JSON.parse((typeof content==='string'?content:content.find(part=>part.type==='text').text).split('\n')[0]);}catch{return null;}};
      const contextIndex=body.messages.findLastIndex(message=>message.role==='user'&&parse(message.content)?.job_id);
      const context=parse(body.messages[contextIndex].content);
      const content=body.messages[contextIndex].content;
      const initialPages=(Array.isArray(content)?content.filter(part=>part.type==='text').map(part=>part.text):[content]).flatMap(text=>text.split('\n')).map(parse).filter(item=>Array.isArray(item?.images));
      const pages=[...initialPages,...body.messages.slice(contextIndex+1).filter(message=>message.role==='tool').map(message=>parse(message.content))];
      let calls;
      if(context.phase==='finalize'){
        finalizationCalls++;
        respondFixtureTools(res,finalizeFixtureCatalog(context,pages,module));return;
      }
      if(!pages.length)calls=context.round.targets.map(target=>({name:'analysis_images',arguments:{sample_id:target.sample_id}}));
      else{
        assert.ok(pages.every(page=>Array.isArray(page.images)),JSON.stringify(pages));
        const images=pages.flatMap(page=>page.images);
        const actual=body.messages.flatMap(message=>Array.isArray(message.content)?message.content:[]).filter(part=>part.type==='image_url');
        assert.deepEqual((images.length?actual.slice(-images.length):[]).map(part=>createHash('sha256').update(Buffer.from(part.image_url.url.split(',')[1],'base64')).digest('hex')).sort(),
          images.map(item=>item.image.sha256).sort());
        const observations=pages.map(page=>({sample_id:page.sample_id,dataset_id:context.registrations.find(record=>record.sample.sample_id===page.sample_id).sample.dataset_id,
          description:page.error?'保留可见范围与实际取证错误。':'观察当前原图和原始标注状态。',
          evidence_ids:page.evidence_id?[page.evidence_id]:[],report_preparation_error:!!page.error,
          limitations:page.error?[page.error]:[],directions:context.selected_directions.map(direction=>({direction_ref:direction.ref,
            status:page.error?'uncertain':'applicable',reason:page.error?'取证受限。':'当前原图可见。'}))}));
        const support=pages.filter(item=>item.evidence_id&&/:(copy-a|copy-b)\.png$/.test(item.sample_id)).map(item=>item.evidence_id);
        const existing=context.catalog.checks[0];
        const checks=module==='knowledge'&&(support.length||existing)?[{check_id:'visible-surface',title:'可见表面',subject:'主体',location:'全图',
          criterion:'复看当前可见表面。',allowed_variations:[],limitations:['同像素登记不增加独立支持。'],status:'supported',
          support_evidence_ids:[...(existing?.support_evidence_ids||[]),...support],counter_evidence_ids:[],direction_refs:['D1'],
          dataset_ids:[context.registrations[0].sample.dataset_id]}]:[];
        calls=[{name:module==='exploration'?'exploration_commit':'knowledge_commit',arguments:{commit_key:'complete',base_revision:context.revision,
          round_id:context.round.round_id,observations,...(module==='exploration'?{directions:[]}:{checks}),
          summary:'保留完整范围的观察和取证错误。',limitations:[],unresolved_questions:[]}}];
      }
      res.writeHead(200,{'Content-Type':'text/event-stream'});
      res.write('data: '+JSON.stringify({choices:[{index:0,delta:{role:'assistant',tool_calls:calls.map((call,index)=>({index,id:randomUUID(),type:'function',
        function:{name:call.name,arguments:JSON.stringify(call.arguments)}}))},finish_reason:null}]})+'\n\n');
      res.write('data: '+JSON.stringify({choices:[{index:0,delta:{},finish_reason:'tool_calls'}],usage:{prompt_tokens:500,completion_tokens:100,total_tokens:600}})+'\n\n');
      res.end('data: [DONE]\n\n');
    }catch(error){errors.push(String(error));res.writeHead(500);res.end(JSON.stringify({error:{message:String(error)}}));}
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{
    await runtime?.dispose();if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));
    if(previousPolicy===undefined)delete process.env.IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES;else process.env.IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES=previousPolicy;
    await fs.rm(root,{recursive:true,force:true});
  });
  const data=JSON.parse(execFileSync(resolvePythonPath(),['-c',`
import json,sys
from pathlib import Path
from PIL import Image
from iad_core.storage.database import Database
from iad_core.dataset.registry import DatasetRegistry,DatasetImport
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.knowledge.instructions import default_directions
root=Path(sys.argv[1]);images=root/'images';images.mkdir();labels=root/'labels';labels.mkdir()
names=['bad-image','broken-label','copy-a','copy-b','empty','excluded','ignore','unknown']
for index,name in enumerate(names):
 Image.new('RGB',(32,24),(70 if name.startswith('copy') else 80+index,100,120)).save(images/(name+'.png'))
 if name!='unknown':(labels/(name+'.json')).write_text(json.dumps(dict(imageWidth=32,imageHeight=24,shapes=[])))
(labels/'broken-label.json').write_text('{broken-json')
(labels/'ignore.json').write_text(json.dumps(dict(imageWidth=32,imageHeight=24,shapes=[dict(label='18',shape_type='rectangle',points=[[2,3],[10,12]],flags={'ignore':True})])))
db=Database(str(root/'pages.db'));registry=DatasetRegistry(db)
config=registry.import_labelme(DatasetImport(format='labelme',name='登记状态',image_dir=str(images),annotation_dir=str(labels),unannotated_is_normal=False))
with db.connection() as connection:connection.execute('UPDATE samples SET is_excluded=1 WHERE sample_id=?',(config.dataset.id+':excluded.png',))
(images/'bad-image.png').write_bytes(b'corrupted registered image')
if sys.argv[2]=='all-bad':
 for image in images.glob('*.png'):image.write_bytes(b'corrupted registered image')
for module in ['exploration','knowledge']:ModuleSettings(db).save(dict(module=module,expected_revision=0,settings=dict(model=dict(provider_id='fixture',model_id='native-image'),batch_size=3)))
print(json.dumps(dict(dataset_id=config.dataset.id,sample_ids=[config.dataset.id+':'+name+'.png' for name in names],direction=default_directions()[0].model_dump(mode='json'))))
`,root,unreadable?'all-bad':'mixed'],{cwd:findWorkspaceRoot(),env:{...process.env,PYTHONPATH:path.join(findWorkspaceRoot(),'python')},encoding:'utf8'}));
  runtime=await createAnalysisAgentHost(root,`http://127.0.0.1:${provider.address().port}/v1`,{onError:error=>errors.push(String(error))});
  const job=await runtime.scheduler.start({submission_id:randomUUID(),analysis_kind:module,dataset_ids:[data.dataset_id],
    ...(module==='exploration'?{normal_images:data.sample_ids,prompt:{text:'观察全部手选登记并保留取证错误。'}}:
      {mining_prompt:{objective:'观察全部登记。',instruction:'保留标注状态，ignore不作为质量依据。',directions:[data.direction]}})});
  await runtime.scheduler.whenIdle();
  const status=await runtime.bridge.execute('analysis_status',{run_id:job.run_id});
  if(unreadable){
    assert.equal(status.status,'FAILED',JSON.stringify({status,errors}));
    assert.deepEqual([status.completed,status.failed,status.unprocessed],[0,8,0]);
    assert.equal(status.analysis_version_id,null);
    assert.match(status.execution_error.message,/有效视觉观察/);
    const snapshot=await runtime.bridge.execute('analysis_agent_snapshot',{run_id:job.run_id});
    const history=await runtime.bridge.execute('analysis_agent_history',{run_id:job.run_id,query:{page_size:50}});
    assert.equal(history.total,8);
    assert.ok(history.items.every(item=>item.report_preparation_error&&item.evidence_ids.length===0));
    assert.equal(finalizationCalls,0);
    assert.equal(wire.length,snapshot.plan.rounds.length*(module==='exploration'?1:2),'零视觉材料不调用定稿模型');
    assert.deepEqual(errors,[]);
    return;
  }
  assert.equal(status.status,'PARTIAL',JSON.stringify({status,errors}));assert.deepEqual([status.completed,status.failed,status.unprocessed],[6,2,0],JSON.stringify({error:status.execution_error,errors}));
  const snapshot=await runtime.bridge.execute('analysis_agent_snapshot',{run_id:job.run_id});assert.equal(snapshot.manifest.records.length,8);
  if(module==='exploration')assert.equal(snapshot.plan.rounds.length,1,'all eight manual picks stay in the first round despite batch size three');
  const records=Object.fromEntries(snapshot.manifest.records.map(record=>[record.sample.relative_path,record]));
  assert.equal(records['unknown.png'].sample.annotation_availability.status,'NOT_PROVIDED');
  assert.equal(records['empty.png'].sample.annotation_availability.status,'VALID_EMPTY');
  assert.equal(records['ignore.png'].annotations[0].is_ignored,true);assert.equal(records['excluded.png'].sample.is_excluded,true);
  const history=await runtime.bridge.execute('analysis_agent_history',{run_id:job.run_id,query:{page_size:50}});
  assert.equal(history.total,8);assert.equal(new Set(history.items.map(item=>item.sample_id)).size,8);
  const publication=await runtime.bridge.execute('analysis_agent_publication',{version_id:status.analysis_version_id});
  assert.deepEqual([publication.coverage.total,publication.coverage.completed,publication.coverage.failed,publication.coverage.unprocessed],[8,6,2,0]);
  assert.equal(publication.coverage.whole_images_observed,7);assert.equal(publication.coverage.observed_visuals,module==='exploration'?7:9);
  const coverage=Object.fromEntries(publication.coverage.records.map(record=>[record.sample_id.split(':').at(-1),record]));
  assert.equal(coverage['bad-image.png'].state,'failed');assert.equal(coverage['bad-image.png'].observed_evidence_ids.length,0);
  assert.equal(coverage['broken-label.png'].state,'failed');assert.equal(coverage['broken-label.png'].observed_evidence_ids.length,1);
  assert.equal(coverage['ignore.png'].required_media.length,module==='exploration'?1:3);assert.equal(coverage['excluded.png'].state,'completed');
  if(module==='knowledge'){
    assert.equal(publication.catalog.checks[0].independent_source_count,1);assert.equal(publication.catalog.checks[0].status,'provisional');
    assert.ok(history.items.every(item=>item.directions.length===1));
  }
  assert.deepEqual(errors,[]);assert.equal(wire.length,snapshot.plan.rounds.length*(module==='exploration'?1:2)+finalizationCalls);assert.equal(publication.finalization.complete,true);
  const api=createIadHttpHandler(runtime.bridge);server=http.createServer(api);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/iad`;
  const callsBefore=status.model_calls.map(call=>call.call_id);
  const exported=await fetch(base+'/analysis/publications/'+publication.version_id+'/export');
  assert.equal(exported.status,200,exported.ok?'':await exported.text());assert.ok((await exported.arrayBuffer()).byteLength>0);
  assert.deepEqual((await runtime.bridge.execute('analysis_status',{run_id:job.run_id})).model_calls.map(call=>call.call_id),callsBefore);
});
