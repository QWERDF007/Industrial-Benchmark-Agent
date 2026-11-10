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

for(const {module,finalizationFailure=false} of [{module:'exploration'},{module:'knowledge'},{module:'knowledge',finalizationFailure:true}])test(`${module} keeps complete claim arguments while selecting one image through native tools${finalizationFailure?' when finalization quota is exhausted':''}`,{timeout:30000},async t=>{
  const priorPolicy=process.env.IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES;
  process.env.IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES='2';
  t.after(()=>{if(priorPolicy===undefined)delete process.env.IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES;else process.env.IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES=priorPolicy;});
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-analysis-arguments-'));
  let runtime,firstImage,firstObservation,checkedHistory=false,finalizationRequests=0;
  const errors=[];
  const parse=value=>{try{return JSON.parse((typeof value==='string'?value:value.find(part=>part.type==='text').text).split('\n')[0]);}catch{return null;}};
  const provider=http.createServer(async(req,res)=>{
    try{
      let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);
      if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:65536}));return;}
      const finalizeSchema=body.tools.find(tool=>tool.function.name===module+'_finalize').function.parameters;
      assert.equal(Object.hasOwn(finalizeSchema.properties,'direction_reviews'),module==='knowledge',
        '只有挖掘定稿回顾用户选中的来源方向，探索工具不暴露该字段');
      const at=body.messages.findLastIndex(message=>message.role==='user'&&parse(message.content)?.job_id);
      const context=parse(body.messages[at].content);
      const outputs=body.messages.slice(at+1).filter(message=>message.role==='tool').map(message=>parse(message.content));
      assert.ok(outputs.every(item=>item&&!item.error),JSON.stringify(outputs));
      const media=outputs.find(item=>Array.isArray(item.images));
      let calls;
      if(context.phase==='finalize'){
        finalizationRequests++;
        assert.equal(context.coverage.completed,2);assert.equal(context.entries.length,1);
        assert.equal('round' in context,false);assert.equal('round_id' in context,false);
        if(finalizationFailure){
          res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{code:'insufficient_quota',message:'controlled finalization quota exhausted'}}));return;
        }
        const catalog=outputs.find(item=>item.section);
        if(!catalog)calls=[{name:'analysis_catalog',arguments:{section:module==='exploration'?'directions':'checks',ids:['edge']}}];
        else{
          const {independent_source_count,support_limitations,predecessor_check_ids,predecessor_direction_ids,suggested_status,assessment_reason,...entry}=catalog.items[0];
          calls=[{name:module+'_finalize',arguments:{commit_key:'global-final',base_revision:context.base_revision,
            [module==='exploration'?'directions':'checks']:[entry],summary:'主体外缘可在可辨条件下沿原图复核。',limitations:[],unresolved_questions:[],
            ...(module==='knowledge'?{direction_reviews:[{direction_ref:'D1',reason:'两条登记均可观察，形成限定条件下的外缘检查判据。'}]}:{}),complete:true}}];
        }
      }else if(!media){
        calls=[{name:'analysis_images',arguments:{sample_id:context.round.targets[0].sample_id}}];
        if(context.round.round_id===2)calls.push(
          {name:'analysis_arguments',arguments:{entry_id:'edge',role:'support',limit:1}},
          {name:'analysis_claims',arguments:{entry_id:'edge',limit:1}},
          {name:'analysis_observations',arguments:{entry_id:'edge',evidence_role:'support',page_size:1}});
      }else{
        const eid=media.evidence_id;
        if(context.round.round_id===1)firstImage=eid;
        else{
          const argumentsPage=outputs.find(item=>item.items?.[0]?.origin_entry_id);
          const claims=outputs.find(item=>item.items?.[0]?.claim_revision&&item.items[0].content);
          const observations=outputs.find(item=>item.items?.[0]?.description);
          assert.equal(argumentsPage.total,1);assert.equal(argumentsPage.items[0].evidence_id,firstImage);
          assert.equal(argumentsPage.items[0].reason,'完整外缘可辨，支持沿边缘复核连续关系。');
          firstObservation=argumentsPage.items[0].observation_id;
          assert.equal(observations.items[0].observation_id,firstObservation);
          assert.equal(claims.total,1);assert.equal(claims.items[0].claim_revision,1);
          checkedHistory=true;
        }
        const shared={title:'沿外缘核对连续关系',dataset_ids:[media.images[0].dataset_id],limitations:[],
          counter_evidence_ids:[],key_evidence:[{evidence_id:firstImage,role:'support',reason:'完整边缘可直接复核。'}]};
        const entry=module==='exploration'
          ?{...shared,direction_id:'edge',instruction:'外缘可辨时沿轮廓核对是否连续。',applies_to:'both',rationale:'外缘在原图可见。',evidence_ids:[eid]}
          :{...shared,check_id:'edge',subject:'主体',location:'外缘',criterion:'外缘可辨时沿轮廓核对是否连续。',allowed_variations:[],status:'supported',support_evidence_ids:[eid],direction_refs:['D1']};
        calls=[{name:module+'_commit',arguments:{commit_key:'observed',base_revision:context.revision,round_id:context.round.round_id,
          observations:[{sample_id:media.sample_id,dataset_id:media.images[0].dataset_id,description:'完整外缘可辨。',
            evidence_ids:[media.evidence_id],directions:module==='knowledge'?[{direction_ref:'D1',status:'applicable',reason:'目标外缘可见。'}]:[]}],
          [module==='exploration'?'directions':'checks']:[entry],
          arguments:[{entry_id:'edge',evidence_id:eid,role:'support',reason:'完整外缘可辨，支持沿边缘复核连续关系。'}],
          summary:'主体外缘可沿原图复核。',limitations:[],unresolved_questions:[]}}];
      }
      res.writeHead(200,{'Content-Type':'text/event-stream'});
      res.end('data: '+JSON.stringify({choices:[{index:0,delta:{role:'assistant',tool_calls:calls.map((call,index)=>({index,id:randomUUID(),type:'function',function:{name:call.name,arguments:JSON.stringify(call.arguments)}}))},finish_reason:null}]})+'\n\n'+
        'data: '+JSON.stringify({choices:[{index:0,delta:{},finish_reason:'tool_calls'}],usage:{prompt_tokens:1000,completion_tokens:100,total_tokens:1100}})+'\n\ndata: [DONE]\n\n');
    }catch(error){errors.push(String(error));res.writeHead(500);res.end(JSON.stringify({error:{message:String(error)}}));}
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{await runtime?.dispose();provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));await fs.rm(root,{recursive:true,force:true});});
  const input=JSON.parse(execFileSync(resolvePythonPath(),['-c',`
import json,sys
from pathlib import Path
from PIL import Image
from iad_core.storage.database import Database
from iad_core.dataset.registry import DatasetRegistry,DatasetImport
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.knowledge.instructions import default_directions
p=Path(sys.argv[1]);images=p/'images';images.mkdir()
for i in range(2): Image.new('RGB',(32,24),(100+i*40,100,100)).save(images/(str(i)+'.png'))
db=Database(str(p/'pages.db'));dataset=DatasetRegistry(db).import_labelme(DatasetImport(format='labelme',name='论据与精选',image_dir=str(images),annotation_dir=str(images)))
ModuleSettings(db).save(dict(module=sys.argv[2],expected_revision=0,settings=dict(model=dict(provider_id='fixture',model_id='native-image'),batch_size=1)))
print(json.dumps(dict(dataset_id=dataset.dataset.id,directions=[default_directions()[0].model_dump(mode='json')])))
`,root,module],{cwd:findWorkspaceRoot(),env:{...process.env,PYTHONPATH:path.join(findWorkspaceRoot(),'python')},encoding:'utf8'}));
  runtime=await createAnalysisAgentHost(root,`http://127.0.0.1:${provider.address().port}/v1`);
  const job=await runtime.scheduler.start({submission_id:randomUUID(),analysis_kind:module,dataset_ids:[input.dataset_id],...(module==='exploration'
    ?{normal_images:[input.dataset_id+':0.png'],prompt:{text:'复核全部原图并选一张代表。'}}
    :{mining_prompt:{objective:'核对外缘。',instruction:'逐图核对，保留完整支持并精选一张。',directions:input.directions}})});
  assert.equal(job.completion_pending,true,'新作业的完成条件包含全局定稿');
  assert.equal((await runtime.bridge.execute('analysis_agent_snapshot',{run_id:job.run_id})).schema_version,2);
  await runtime.scheduler.whenIdle();
  const status=await runtime.bridge.execute('analysis_status',{run_id:job.run_id});
  const state=await runtime.bridge.execute('analysis_agent_context',{run_id:job.run_id});
  const session=await runtime.host.read(state.session_id);
  if(finalizationFailure){
    assert.equal(status.status,'PARTIAL');assert.equal(status.completed,2);assert.equal(status.unprocessed,0);
    assert.equal(finalizationRequests,1,'额度不足后不能再调用定稿模型');
    assert.match(status.execution_error.message,/quota exhausted/);
    const partial=await runtime.bridge.execute('analysis_agent_publication',{version_id:status.analysis_version_id});
    assert.equal(partial.finalization.complete,false);assert.deepEqual(partial.finalization.pending_entry_ids,['edge']);
    assert.equal(partial.coverage.completed,2);assert.equal(partial.catalog.checks[0].independent_source_count,2);
    assert.equal(session.events.filter(event=>event.type==='user/message').length,3);return;
  }
  assert.equal(status.execution_error,null);
  assert.equal(status.status,'COMPLETED',JSON.stringify({errors,status}));assert.equal(status.completed,2);
  assert.deepEqual(errors,[]);assert.equal(checkedHistory,true);
  assert.equal(finalizationRequests,2);
  assert.equal(session.events.filter(event=>event.type==='user/message').length,3,'观察和定稿共用同一个Session');
  const publication=await runtime.bridge.execute('analysis_agent_publication',{version_id:status.analysis_version_id});
  const entry=publication.catalog[module==='exploration'?'directions':'checks'][0];
  assert.equal(publication.finalization.complete,true);
  assert.equal(entry[module==='exploration'?'evidence_ids':'support_evidence_ids'].length,2);
  assert.equal(entry.key_evidence.length,1);
  if(module==='knowledge'){assert.equal(entry.independent_source_count,2);assert.equal(entry.status,'supported');assert.match(entry.assessment_reason,/2个独立图像来源组/);}
  const graph=await runtime.bridge.execute('analysis_agent_arguments',{run_id:job.run_id,query:{entry_id:'edge'}});
  assert.equal(graph.total,2);assert.equal(graph.items[0].observation_id,firstObservation);
});
