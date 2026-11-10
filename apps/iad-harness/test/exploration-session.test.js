import test from 'node:test';
import {finalizeFixtureCatalog} from './fixtures/analysis-finalization.js';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {randomUUID,createHash} from 'node:crypto';
import {createUserMessage} from '@deepseek-ai/dsh-llm';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {analysisSessionPath} from '../lib/server/analysis/agent.js';
import {createDatasetSession} from './fixtures/dataset_session.js';

test('DSH conversation explores the full scope and mines a fixed direction across applicable and inapplicable subsets only after a second user request',{timeout:60000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-native-exploration-session-'));
  const database=path.join(root,'test.db'),trace=[],wire=[],errors=[];
  const explorationSubmission=randomUUID(),knowledgeSubmission=randomUUID();
  execFileSync(resolvePythonPath(),[fileURLToPath(new URL('fixtures/knowledge_dataset.py',import.meta.url)),root]);
  let session,server,dataset,otherDataset,phase=0,phaseStart=0;
  const apiKeyEnv='IAD_NATIVE_CONVERSATION_KEY',previousKey=process.env[apiKeyEnv];process.env[apiKeyEnv]='isolated-conversation-key';
  t.after(async()=>{
    await session?.dispose();
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    if(previousKey===undefined)delete process.env[apiKeyEnv];else process.env[apiKeyEnv]=previousKey;
    await fs.rm(root,{recursive:true,force:true});
  });
  const parse=content=>{try{return JSON.parse((typeof content==='string'?content:content.find(part=>part.type==='text').text).split('\n')[0]);}catch{return null;}};
  const respond=(res,calls,text)=>{
    const id=randomUUID();
    const delta=calls?{role:'assistant',tool_calls:calls.map((call,index)=>({index,id:randomUUID(),type:'function',function:{name:call.name,arguments:JSON.stringify(call.arguments)}}))}:{role:'assistant',content:text};
    res.writeHead(200,{'Content-Type':'text/event-stream'});
    res.write('data: '+JSON.stringify({id,choices:[{index:0,delta,finish_reason:null}]})+'\n\n');
    res.write('data: '+JSON.stringify({id,choices:[{index:0,delta:{},finish_reason:calls?'tool_calls':'stop'}],usage:{prompt_tokens:500,completion_tokens:200,total_tokens:700}})+'\n\n');
    res.end('data: [DONE]\n\n');
  };
  server=http.createServer(async(req,res)=>{
    try{
      let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);
      if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:65536}));return;}
      assert.equal(req.headers.authorization,'Bearer isolated-conversation-key');wire.push(body);
      const names=body.tools.map(tool=>tool.function.name),module=names.includes('exploration_commit')?'exploration':names.includes('knowledge_commit')?'knowledge':null;
      if(module){
        const contextIndex=body.messages.findLastIndex(message=>message.role==='user'&&parse(message.content)?.job_id);
        const context=parse(body.messages[contextIndex].content);
        const pages=body.messages.slice(contextIndex+1).filter(message=>message.role==='tool').map(message=>parse(message.content));
        if(context.phase==='finalize'){respond(res,finalizeFixtureCatalog(context,pages,module));return;}
        if(!pages.length){respond(res,context.round.targets.map(target=>({name:'analysis_images',arguments:{sample_id:target.sample_id}})));return;}
        const images=pages.flatMap(page=>page.images),actual=body.messages.flatMap(message=>Array.isArray(message.content)?message.content:[]).filter(part=>part.type==='image_url');
        const retained=body.messages.filter(message=>message.role==='tool').map(message=>parse(message.content)).filter(value=>Array.isArray(value?.images)).flatMap(page=>page.images);
        assert.equal(actual.length,retained.length);
        assert.deepEqual(actual.map(part=>createHash('sha256').update(Buffer.from(part.image_url.url.split(',')[1],'base64')).digest('hex')).sort(),retained.map(image=>image.image.sha256).sort());
        const observations=pages.map(page=>({sample_id:page.sample_id,dataset_id:page.images[0].dataset_id,
          description:'本场观察原图与全部标注局部。',evidence_ids:page.images.map(image=>image.image.evidence_id),
          directions:context.selected_directions.map(direction=>({direction_ref:direction.ref,
            status:page.images[0].dataset_id===dataset.dataset_id?'applicable':'not_applicable',
            reason:page.images[0].dataset_id===dataset.dataset_id?'本图孔位可见。':'本图为无孔平面，不适用选定孔位方向。'}))}));
        const ids=images.filter(image=>image.dataset_id===dataset.dataset_id&&image.image.role==='overview'&&image.image.representation==='raw').map(image=>image.image.evidence_id);
        const entries=module==='exploration'?{directions:[{direction_id:'hole',title:'孔位检查',instruction:'比较孔位轮廓与局部边缘。',
          applies_to:'both',rationale:'本场原图可复看孔位。',evidence_ids:ids,dataset_ids:[dataset.dataset_id],limitations:[]}]}:
          {checks:[{check_id:'hole-edge',title:'孔位边缘',subject:'部件',location:'孔位',criterion:'沿原图核对孔位轮廓连续性。',allowed_variations:[],
            support_evidence_ids:ids,counter_evidence_ids:[],direction_refs:context.selected_directions.map(direction=>direction.ref),dataset_ids:[dataset.dataset_id],limitations:[],status:'provisional'}]};
        respond(res,[{name:module==='exploration'?'exploration_commit':'knowledge_commit',arguments:{commit_key:'complete',round_id:context.round.round_id,
          base_revision:context.revision,observations,...entries,summary:'本场全部已观察图像的孔位结果。',limitations:[],unresolved_questions:[]}}]);return;
      }
      const tools=body.messages.filter(message=>message.role==='tool'),value=index=>parse(tools[phaseStart+index].content),step=tools.length-phaseStart;
      if(trace.at(-1)?.result.isError){respond(res,null,'工具返回错误，保留实际状态。');return;}
      const steps=phase===0?[
        ()=>({name:'skill',arguments:{name:'explore-inspection-directions'}}),
        ()=>({name:'analysis_sources',arguments:{dataset_ids:[dataset.dataset_id]}}),
        ()=>({name:'direction_exploration_presets',arguments:{}}),
        ()=>{const preset=value(2).presets[0];return {name:'direction_exploration_start',arguments:{submission_id:explorationSubmission,dataset_ids:[dataset.dataset_id],
          normal_images:value(1).items.slice(0,2).map(item=>item.sample_id),defect_images:value(1).items.slice(2).map(item=>item.sample_id),
          prompt:{preset_id:preset.id,preset_name:preset.name,text:preset.text}}};},
        ()=>({name:'direction_exploration_status',arguments:{run_id:value(3).run_id,wait_seconds:10}}),
        ()=>({name:'direction_exploration_get',arguments:{run_id:value(3).run_id}}),
        ()=>({name:'knowledge_direction_choices',arguments:{dataset_ids:[dataset.dataset_id]}}),
      ]:[
        ()=>({name:'knowledge_direction_choices',arguments:{dataset_ids:[dataset.dataset_id,otherDataset.dataset_id]}}),
        ()=>{const direction=value(0).directions[0];return {name:'knowledge_mine',arguments:{submission_id:knowledgeSubmission,dataset_ids:[dataset.dataset_id,otherDataset.dataset_id],
          mining_prompt:{objective:'沿选中孔位方向观察全部登记。',instruction:'逐图观察孔位，保留相反证据。',directions:[{
            direction_id:direction.direction_id,title:direction.title,instruction:direction.instruction,origin:'explored',source:direction.source}]}}};},
        ()=>({name:'knowledge_job_status',arguments:{run_id:value(1).run_id,wait_seconds:10}}),
        ()=>({name:'knowledge_get',arguments:{run_id:value(1).run_id}}),
      ];
      respond(res,step<steps.length?[steps[step]()]:null,phase===0?'探索已完成，等待用户选择方向开展挖掘。':'已完成选中方向的知识挖掘。');
    }catch(error){errors.push(String(error));res.writeHead(500);res.end(JSON.stringify({error:{message:String(error)}}));}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const endpoint=`http://127.0.0.1:${server.address().port}/v1`;
  session=await createDatasetSession({root:path.join(root,'conversation'),dbPath:database,endpoint,model:'native-conversation',apiKeyEnv,contextWindow:65536});
  const bridge=session.ctx.iadPythonBridge;
  dataset=await bridge.execute('dataset_import',{format:'labelme',name:'会话探索',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
  execFileSync(resolvePythonPath(),['-c',"from pathlib import Path;from PIL import Image;import sys;p=Path(sys.argv[1]);p.mkdir();Image.new('RGB',(32,24),'green').save(p/'flat.png')",path.join(root,'other')]);
  otherDataset=await bridge.execute('dataset_import',{format:'labelme',name:'无孔平面',image_dir:path.join(root,'other'),annotation_dir:path.join(root,'other')});
  await bridge.execute('model_settings_save',{expected_revision:0,selection:{provider_id:'iad-verification',model_id:'native-conversation',limits:{capacity_mode:'vllm_tokenize'}}});
  for(const module of ['exploration','knowledge'])await bridge.execute('module_settings_save',{module,expected_revision:0,
    settings:{model:{provider_id:'iad-verification',model_id:'native-conversation'},batch_size:2,agent_limits:{max_output_tokens:4096}}});
  session.ctx.on('tools/result',(execution,result)=>trace.push({name:execution.name,result}));
  session.handle.agent.followup(createUserMessage({source:{kind:'user'},content:[{type:'text',text:`对${dataset.dataset_id}用两张良品和一张异常样例探索方向，完成后停止。`}]}));
  await session.handle.agent.whenIdle();
  assert.ok(trace.every(item=>!item.result.isError),JSON.stringify(trace.filter(item=>item.result.isError)));
  assert.deepEqual(trace.map(item=>item.name),['skill','analysis_sources','direction_exploration_presets','direction_exploration_start','direction_exploration_status','direction_exploration_get','knowledge_direction_choices']);
  assert.equal(trace[4].result.value.status,'COMPLETED',JSON.stringify({errors,execution:trace[4].result.value.execution_error}));
  const explored=trace[5].result.value.publication;
  assert.equal(explored.coverage.completed,3);assert.equal(explored.catalog.directions.length,1);
  assert.deepEqual((await bridge.execute('analysis_list',{dataset_id:dataset.dataset_id,analysis_kind:'knowledge'})).jobs,[]);
  phase=1;phaseStart=trace.length;
  session.handle.agent.followup(createUserMessage({source:{kind:'user'},content:[{type:'text',text:`采用${explored.version_id}的hole方向，对${dataset.dataset_id}和${otherDataset.dataset_id}开展知识挖掘，不适用也观察并记录原因，完成后停止。`}]}));
  await session.handle.agent.whenIdle();
  assert.ok(trace.every(item=>!item.result.isError),JSON.stringify(trace.filter(item=>item.result.isError)));
  assert.deepEqual(trace.slice(phaseStart).map(item=>item.name),['knowledge_direction_choices','knowledge_mine','knowledge_job_status','knowledge_get']);
  assert.equal(trace[phaseStart+2].result.value.status,'COMPLETED',JSON.stringify({errors,execution:trace[phaseStart+2].result.value.execution_error}));
  const mined=trace.at(-1).result.value.publication;
  assert.equal(mined.coverage.completed,4);assert.equal(mined.coverage.unprocessed,0);assert.equal(mined.catalog.checks.length,1);
  assert.deepEqual(mined.catalog.checks[0].dataset_ids,[dataset.dataset_id]);
  assert.deepEqual(mined.selected_directions[0].source,{origin:'explored',run_id:explored.job_id,version_id:explored.version_id,direction_id:'hole'});
  assert.deepEqual(mined.selected_directions[0].source_dataset_ids,[dataset.dataset_id]);
  const otherObservation=await bridge.execute('analysis_agent_history',{run_id:mined.job_id,query:{sample_id:otherDataset.dataset_id+':flat.png'}});
  assert.equal(otherObservation.total,1);
  assert.deepEqual(otherObservation.items[0].directions,[{direction_ref:'D1',status:'not_applicable',reason:'本图为无孔平面，不适用选定孔位方向。'}]);
  assert.ok(otherObservation.items[0].evidence_ids.length>0,'inapplicable registrations still have real observed images');
  const publishedObservation=await bridge.execute('analysis_observations',{version_id:mined.version_id,
    query:{sample_id:otherDataset.dataset_id+':flat.png',direction_ref:'D1'}});
  assert.equal(publishedObservation.total,1);assert.deepEqual(publishedObservation.items,otherObservation.items);
  const explorationContext=await bridge.execute('analysis_agent_context',{run_id:explored.job_id}),knowledgeContext=await bridge.execute('analysis_agent_context',{run_id:mined.job_id});
  assert.notEqual(explorationContext.session_id,knowledgeContext.session_id);
  assert.notEqual(explorationContext.session_id,session.handle.agent.session.id);
  for(const context of [explorationContext,knowledgeContext]){
    const location=await bridge.execute('analysis_agent_session_location',{session_id:context.session_id});
    const events=(await fs.readFile(analysisSessionPath(root,location),'utf8')).trim().split('\n').map(line=>JSON.parse(line));
    assert.ok(events.some(event=>event.type==='tool/call'&&event.data.name.endsWith('_commit')));
  }
  assert.deepEqual(errors,[]);assert.ok(wire.some(body=>body.messages.some(message=>Array.isArray(message.content)&&message.content.some(part=>part.type==='image_url'))));
});
