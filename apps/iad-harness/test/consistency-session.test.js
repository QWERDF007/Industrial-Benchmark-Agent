import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {Context} from '@deepseek-ai/cordis';
import {SkillRegistry} from '@deepseek-ai/dsh-skill';
import {SystemPrompt} from '@deepseek-ai/dsh-system-prompt';
import {ToolRuntime} from '@deepseek-ai/dsh-tools';
import {LocalAttachmentStore} from '@deepseek-ai/dsh-attachment-local';
import * as harness from '../lib/server/index.js';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';
import http from 'node:http';
import {createUserMessage} from '@deepseek-ai/dsh-llm';
import {createDatasetSession} from './fixtures/dataset_session.js';

test('native consistency tools resolve actual references and return decodable shared image attachments',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-consistency-native-'));
  execFileSync(resolvePythonPath(),['-c',`import json,sys
from pathlib import Path
from PIL import Image
r=Path(sys.argv[1]);r.mkdir(exist_ok=True)
for name,label in [('left','scratch'),('right','dent')]:
 Image.new('RGB',(80,80),(40,60,90)).save(r/(name+'.png'))
 (r/(name+'.json')).write_text(json.dumps({'imageWidth':80,'imageHeight':80,'shapes':[{'label':label,'shape_type':'rectangle','points':[[10,10],[30,30]]}]}))
`,path.join(root,'images')]);
  const ctx=new Context();new SystemPrompt(ctx,{});new ToolRuntime(ctx);new SkillRegistry(ctx);new LocalAttachmentStore(ctx,{dshHome:path.join(root,'dsh')});
  const fork=await ctx.plugin(harness,{dbPath:path.join(root,'test.db')});
  const execute=(name,args)=>ctx.tools.execute({name,arguments:args,callId:name,signal:new AbortController().signal});
  try{
    const auditSchema=ctx.tools.schemas().find(tool=>tool.name==='model_audit_start');
    assert.deepEqual(auditSchema.parameters.properties.consistency_mode.enum,['exact','visual','combined']);
    assert.ok(auditSchema.parameters.properties.corpus_scope);
    const imported=await execute('dataset_import',{format:'labelme',name:'原生证据',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'images'),annotation_policy:{policy_id:'same',annotation_role:'REFERENCE',annotation_coverage:'EXHAUSTIVE'}});
    const dataset=imported.value;
    const compared=await execute('consistency_compare',{sample_a:dataset.dataset_id+':left.png',sample_b:dataset.dataset_id+':right.png'});
    assert.equal(compared.isError,false,JSON.stringify(compared));
    const result=compared.value;assert.equal(result.verification.relation,'EXACT');
    const context=await execute('consistency_context',{evidence_id:result.evidence_id,result_id:result.result_id,return_location:{pageId:'industrial-consistency',evidenceId:result.evidence_id,resultId:result.result_id}});
    assert.equal(context.isError,false,JSON.stringify(context));
    assert.equal(context.value.context.verification.relation,'EXACT');assert.equal(context.value.context.remaining_differences,0);
    const images=context.content.filter(block=>block.type==='image');
    assert.equal(images.length+context.value.existing_images.length,context.value.context.media.length);assert.ok(images.length>=3);
    const originals=context.value.context.media.filter(item=>item.descriptor.representation==='original');
    assert.equal(originals.length,1);assert.deepEqual(originals[0].sides,['left','right']);
    for(const block of images){
      const stored=await ctx.attachments.readImage(block.attachment,new AbortController().signal);
      assert.deepEqual([...stored.data.subarray(0,8)],[137,80,78,71,13,10,26,10]);
    }
    assert.ok(context.meta.links.some(link=>link.location.evidenceId===result.evidence_id));
    const frozen=await execute('consistency_evidence',{evidence_id:result.evidence_id});assert.equal(frozen.isError,false,JSON.stringify(frozen));assert.equal(frozen.value.result.result_id,result.result_id);
    const media=await execute('consistency_evidence_media',{evidence_id:result.evidence_id,media_id:originals[0].descriptor.media_id});assert.equal(media.isError,false,JSON.stringify(media));assert.ok(media.content.some(block=>block.type==='image'));
    const submission={client_request_id:randomUUID(),evidence_id:result.evidence_id,result_id:result.result_id,
      difference_ids:[result.annotation.differences[0].difference_id],reviewer:'原生处置复核人',comment:'将右侧类别统一为scratch',
      action:{kind:'PROPOSE_REGION_CHANGE',changes:[{operation:'relabel',sample_id:dataset.dataset_id+':right.png',
        annotation_id:result.annotation.differences[0].right[0].annotation_id,category:'scratch'}]}};
    const decision=await ctx.iadPythonBridge.execute('consistency_review_submit',submission);
    const awaiting={client_request_id:randomUUID(),decision_id:decision.decision_id,evidence_id:result.evidence_id,reviewer:'原生处置复核人'};
    await ctx.iadPythonBridge.execute('consistency_correction_verify',awaiting);
    const source=path.join(root,'images/right.json'),labels=JSON.parse(await fs.readFile(source,'utf8'));
    labels.shapes[0].label='scratch';await fs.writeFile(source,JSON.stringify(labels));
    await ctx.iadPythonBridge.execute('dataset_scan',{dataset_id:dataset.dataset_id});
    const corrected=await ctx.iadPythonBridge.execute('consistency_compare',{sample_a:dataset.dataset_id+':left.png',sample_b:dataset.dataset_id+':right.png'});
    const verified={client_request_id:randomUUID(),decision_id:decision.decision_id,evidence_id:corrected.evidence_id,reviewer:'原生处置复核人'};
    await ctx.iadPythonBridge.execute('consistency_correction_verify',verified);
    const reviewed=await execute('consistency_context',{evidence_id:result.evidence_id,result_id:result.result_id});
    assert.equal(reviewed.isError,false,JSON.stringify(reviewed));
    const rendered=JSON.parse(reviewed.content.find(block=>block.type==='text').text).context.review_context;
    assert.deepEqual(rendered.decisions[0].request,submission,'实际模型文本必须保留处置动作、复核人及明确目标');
    assert.deepEqual(rendered.corrections.map(check=>check.request),[awaiting,verified],'修正历史必须保留同一decision_id与新旧证据关联');
    assert.deepEqual(rendered.corrections.map(check=>check.correction_state),['AWAITING_RESCAN','VERIFIED']);
    assert.equal(rendered.differences[0].correction_state,'VERIFIED');
    const skills=await ctx.skills.list();assert.ok(skills.some(skill=>skill.name==='audit-data-consistency'));
    assert.equal((await execute('consistency_context',{evidence_id:result.evidence_id,result_id:'missing'})).isError,true);
    const started=await execute('consistency_start',{subjects:{kind:'all_registered'},request_id:'native-start'});
    assert.equal(started.isError,false,JSON.stringify(started));assert.ok(started.meta.links.some(link=>link.location.batchId===started.value.batch_id));
    let batch;
    for(let attempt=0;attempt<50;attempt++){
      batch=await execute('consistency_status',{batch_id:started.value.batch_id});
      if(batch.value.children.length)break;
      await new Promise(resolve=>setTimeout(resolve,20));
    }
    assert.ok(batch.value.children.length>0);
    assert.ok(batch.value.children.every(child=>child.request));
    const renderedBatch=JSON.parse(batch.content.find(block=>block.type==='text').text);
    assert.ok(renderedBatch.children.every(child=>!('request' in child)),'运行时作业原始请求仍不重复送入模型');
    const query=await execute('consistency_query',{selection:{kind:'scope',subjects:{kind:'all_registered'}}});assert.equal(query.isError,false,JSON.stringify(query));
    assert.equal((await execute('feature_prepare',{task_id:dataset.task_id})).isError,true);
    assert.ok(harness.ALLOWED_TOOL_SURFACE.includes('image_index_prepare'));
  }finally{await fork.dispose();await fs.rm(root,{recursive:true,force:true});}
});

test('native agent consumes all difference pages without re-sending shared originals',{timeout:30000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-context-paging-'));let reference;
  const previousKey=process.env.IAD_CONTEXT_PAGING_KEY;process.env.IAD_CONTEXT_PAGING_KEY='synthetic-local-only';
  const trace=[],requests=[];
  const model=http.createServer(async(req,res)=>{
    const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=JSON.parse(Buffer.concat(chunks));requests.push(body);
    const outputs=body.messages.filter(message=>message.role==='tool');
    const latest=outputs.length ? JSON.parse(outputs.at(-1).content.split('\n')[0]).context : null;
    const call=!latest || latest.next_cursor ? {name:'consistency_context',arguments:{...reference,...(latest?.next_cursor ? {cursor:latest.next_cursor} : {})}} : null;
    res.writeHead(200,{'Content-Type':'text/event-stream'});
    const delta=call ? {role:'assistant',tool_calls:[{index:0,id:'page-'+outputs.length,type:'function',function:{name:call.name,arguments:JSON.stringify(call.arguments)}}]} : {role:'assistant',content:'已读取两页标注差异，保留原图事实与待核实范围。'};
    for(const choice of [{index:0,delta,finish_reason:null},{index:0,delta:{},finish_reason:call ? 'tool_calls' : 'stop'}])res.write('data: '+JSON.stringify({id:'context-pages',object:'chat.completion.chunk',model:'test-context-model',choices:[choice]})+'\n\n');
    res.end('data: [DONE]\n\n');
  });
  await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));let session;
  try{
    execFileSync(resolvePythonPath(),['-c',`import json,sys
from pathlib import Path
from PIL import Image
r=Path(sys.argv[1]);r.mkdir()
for name,label in [('left','scratch'),('right','dent')]:
 Image.new('RGB',(80,80),(40,60,90)).save(r/(name+'.png'))
 (r/(name+'.json')).write_text(json.dumps({'imageWidth':80,'imageHeight':80,'shapes':[{'label':label,'shape_type':'rectangle','points':[[10,10],[20,20]]},{'label':label,'shape_type':'rectangle','points':[[40,40],[50,50]]}]}))
`,path.join(root,'images')]);
    session=await createDatasetSession({root:path.join(root,'session'),dbPath:path.join(root,'test.db'),endpoint:`http://127.0.0.1:${model.address().port}/v1`,model:'test-context-model',contextWindow:262144,apiKeyEnv:'IAD_CONTEXT_PAGING_KEY'});
    const bridge=session.ctx.iadPythonBridge;
    const dataset=await bridge.execute('dataset_import',{format:'labelme',name:'上下文分页',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'images'),annotation_policy:{policy_id:'same',annotation_role:'REFERENCE',annotation_coverage:'EXHAUSTIVE'}});
    const saved=await bridge.execute('consistency_compare',{sample_a:dataset.dataset_id+':left.png',sample_b:dataset.dataset_id+':right.png'});
    reference={evidence_id:saved.evidence_id,result_id:saved.result_id,difference_page_size:1};
    session.ctx.on('tools/result',(exec,result)=>trace.push({name:exec.name,result}));
    session.handle.agent.followup(createUserMessage({source:{kind:'user'},content:[{type:'text',text:'解释已有证据的全部差异，按原游标继续。'}]}));
    await session.handle.agent.whenIdle();
    assert.equal(trace.length,2,JSON.stringify(session.handle.agent.session.snapshotEvents().filter(event=>/error|attempt|turn\/end/.test(event.type))));assert.ok(trace.every(item=>item.name==='consistency_context' && !item.result.isError),JSON.stringify(trace));
    assert.deepEqual(trace.map(item=>item.result.value.context.remaining_differences),[1,0]);
    const first=trace[0].result.value;const original=first.context.media.find(item=>item.descriptor.representation==='original');
    const attachment=first.attachments.find(item=>item.media_id===original.descriptor.media_id).attachment;
    assert.equal(trace.flatMap(item=>item.result.content).filter(block=>block.type==='image' && block.attachment.attachmentId===attachment.attachmentId).length,1);
    assert.ok(trace[1].result.value.existing_images.some(item=>item.attachment.attachmentId===attachment.attachmentId));
    const visual=requests.at(-1).messages.flatMap(message=>Array.isArray(message.content) ? message.content.filter(block=>block.type==='image_url') : []);
    assert.ok(visual.length>=3);
  }finally{await session?.dispose();await new Promise(resolve=>model.close(resolve));await fs.rm(root,{recursive:true,force:true});if(previousKey===undefined)delete process.env.IAD_CONTEXT_PAGING_KEY;else process.env.IAD_CONTEXT_PAGING_KEY=previousKey;}
});
