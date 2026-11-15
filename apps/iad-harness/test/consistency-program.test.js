import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';

test('annotation requests begin before every image has finished local preparation',{timeout:30000},async()=>{
  const preparing=Promise.withResolvers(),release=Promise.withResolvers(),modelEntered=Promise.withResolvers();let held=false;
  const fixture=await createConsistencyAgentHost({candidateCount:2,onGeneration:async()=>{modelEntered.resolve();},
    modelRouting:{execute:async(operation,args,signal,dispatch)=>{
      if(operation==='consistency_agent_verify'&&!held){held=true;preparing.resolve();await release.promise;}
      return dispatch(operation,args,signal);
    }}});
  try{
    await fixture.bridge.execute('module_settings_save',{module:'consistency',expected_revision:1,settings:{concurrency:2}});
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact'});
    await preparing.promise;
    await Promise.race([modelEntered.promise,delay(5000).then(()=>{throw new Error('A prepared image is waiting for unrelated local preparation');})]);
    release.resolve();await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));assert.equal(status.failed,0);
  }finally{release.resolve();await fixture.close();}
});

test('both unannotated sides are program-consistent with zero real provider requests',{timeout:30000},async()=>{
  const fixture=await createConsistencyAgentHost({multiCandidate:true,withSimilarCandidate:true,unannotated:true});
  try{
    await fixture.bridge.execute('module_settings_save',{module:'consistency',expected_revision:1,settings:{model:null}});
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId]});
    await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));
    assert.equal(status.completed,4);assert.equal(status.failed,0);
    assert.equal(fixture.wires.length,0);assert.equal(status.model_calls.length,0);
    const page=await fixture.bridge.execute('consistency_agent_images',{run_id:job.run_id});
    assert.equal(page.counts.PROGRAM_CONSISTENT,4);
    assert.ok(page.items.every(item=>item.summary.reason==='PROGRAM_REVIEWED'&&item.summary.model_conclusion===null));
    assert.deepEqual(fixture.errors,[]);
  }finally{await fixture.close();}
});

test('local preparation continues while all four model requests are waiting for the provider',{timeout:45000},async()=>{
  const saturated=Promise.withResolvers(),prepared=Promise.withResolvers(),release=Promise.withResolvers();
  let preparing=0,active=0,peak=0;
  const fixture=await createConsistencyAgentHost({candidateCount:5,onGeneration:async()=>{
    active++;peak=Math.max(peak,active);if(active===4)saturated.resolve();
    await release.promise;active--;
  },modelRouting:{execute:async(operation,args,signal,dispatch)=>{
    if(operation==='consistency_agent_verify'){
      const later=++preparing>4;if(later)await saturated.promise;
      const result=await dispatch(operation,args,signal);
      if(later&&active===4)prepared.resolve();
      return result;
    }
    return dispatch(operation,args,signal);
  }}});
  try{
    await fixture.bridge.execute('module_settings_save',{module:'consistency',expected_revision:1,settings:{concurrency:4}});
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact'});
    await Promise.race([saturated.promise,delay(15000).then(()=>{throw new Error('Four provider requests did not begin');})]);
    await Promise.race([prepared.promise,delay(3000).then(()=>{throw new Error('Four model requests block independent local preparation');})]);
    release.resolve();await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));assert.equal(status.failed,0);assert.equal(peak,4);
  }finally{saturated.resolve();release.resolve();await fixture.close();}
});

test('ready annotation review starts while another content comparison is still running',{timeout:30000},async()=>{
  const release=Promise.withResolvers(),auditing=Promise.withResolvers(),comparing=Promise.withResolvers();let held=false;
  const fixture=await createConsistencyAgentHost({candidateCount:9,withSimilarCandidate:true,
    modelRouting:{execute:async(operation,args,signal,dispatch)=>{
      if(operation==='consistency_agent_pair_review_many'&&!held){held=true;comparing.resolve();await release.promise;}
      if(operation==='consistency_agent_audit'&&held)auditing.resolve();
      return dispatch(operation,args,signal);
    }}});
  try{
    await fixture.bridge.execute('module_settings_save',{module:'consistency',expected_revision:1,settings:{concurrency:2}});
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId]});
    await comparing.promise;
    await Promise.race([auditing.promise,delay(5000).then(()=>{throw new Error('Ready annotation review is blocked by another pair');})]);
    const before=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(before.status,'RUNNING');
    release.resolve();await fixture.scheduler.whenIdle();
    const after=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(after.status,'COMPLETED',JSON.stringify(after.errors));assert.equal(after.completed,10);
  }finally{release.resolve();await fixture.close();}
});

test('connected images settle every reverse audit before publishing final results',{timeout:30000},async()=>{
  const audited=new Set();
  const fixture=await createConsistencyAgentHost({candidateCount:2,modelRouting:{execute:async(operation,args,signal,dispatch)=>{
    if(operation==='consistency_agent_finalize')assert.equal(audited.size,3,'A reverse audit can still dispute this result');
    const result=await dispatch(operation,args,signal);
    if(operation==='consistency_agent_audit')audited.add(args.anchor_id);
    return result;
  }}});
  try{
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact'});
    await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));
    assert.equal(status.completed,3);assert.equal(status.failed,0);
    assert.deepEqual(fixture.errors,[]);
  }finally{await fixture.close();}
});

test('the first retrieval starts without creating sessions for queued images', {timeout:30000}, async()=>{
  const entered=Promise.withResolvers(),release=Promise.withResolvers();
  const fixture=await createConsistencyAgentHost({candidateCount:4,modelRouting:{execute:async(operation,args,signal,dispatch)=>{
    if(operation==='consistency_agent_retrieve_many'){entered.resolve();await release.promise;}
    return dispatch(operation,args,signal);
  }}});
  try {
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact'});
    await Promise.race([entered.promise,delay(10000).then(()=>{throw new Error('The first image did not enter retrieval');})]);
    const {anchors}=await fixture.bridge.execute('consistency_agent_anchors',{run_id:job.run_id});
    assert.equal(anchors.filter(anchor=>anchor.session_created).length,0);
    for(const anchor of anchors) assert.equal(await fixture.host.exists(anchor.session_id),anchor.session_created);
    release.resolve();await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));
    assert.equal(status.completed,5);assert.equal(status.failed,0);
  } finally {release.resolve();await fixture.close();}
});

test('program workflow saves real visual decisions without model calls for orchestration', {timeout:30000}, async()=>{
  const fixture=await createConsistencyAgentHost();
  try {
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact'});
    await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));
    assert.equal(status.completed,2);assert.equal(status.failed,0);
    assert.equal(fixture.wires.filter(body=>body.test_role==='agent').length,0);
    assert.equal(fixture.wires.filter(body=>body.test_role==='vision').length,2);
    for(const anchor of (await fixture.bridge.execute('consistency_agent_anchors',{run_id:job.run_id})).anchors) {
      const detail=await fixture.bridge.execute('consistency_agent_detail',{run_id:job.run_id,anchor_id:anchor.anchor_id});
      assert.equal(detail.result.assessments.length,1);
      assert.ok(detail.observations[0].result.observations[0].assessment);
      assert.equal(detail.trace_state,'CLOSED');
    }
    const before=fixture.wires.length;
    await fixture.scheduler.resume(job.run_id);await fixture.scheduler.whenIdle();
    assert.equal(fixture.wires.length,before);
    assert.deepEqual(fixture.errors,[]);
  } finally {await fixture.close();}
});

test('mutual similar candidates share the one delivered content comparison', {timeout:30000}, async()=>{
  const fixture=await createConsistencyAgentHost({multiCandidate:true,withSimilarCandidate:true});
  try {
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId]});
    await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));
    const {anchors}=await fixture.bridge.execute('consistency_agent_anchors',{run_id:job.run_id});
    const details=await Promise.all(anchors.map(anchor=>fixture.bridge.execute('consistency_agent_detail',
      {run_id:job.run_id,anchor_id:anchor.anchor_id})));
    const gates=details.flatMap(detail=>detail.gates.filter(gate=>gate.source==='vision'));
    const pairKeys=new Set(gates.map(gate=>gate.pair_key));
    assert.ok(pairKeys.size);assert.ok(!pairKeys.has(null));
    const comparisons=fixture.wires.filter(body=>body.test_role==='vision').map(body=>
      JSON.parse(body.messages.find(message=>message.role==='user').content[1].text))
      .filter(context=>context.scope==='joint'||context.scope==='pairs');
    const comparedPairs=comparisons.reduce((count,context)=>count+(context.scope==='joint'?1:Object.keys(context.pairs).length),0);
    assert.equal(comparedPairs,pairKeys.size);
    assert.equal(comparisons.length,1,'Partial owner groups share the remaining request capacity');
    assert.equal(gates.length,comparedPairs*2);
    assert.ok(status.model_calls.filter(call=>call.schema_name.startsWith('IdentityDecision')).every(call=>call.phase==='VERIFYING_CONTENT'));
    assert.deepEqual(fixture.errors,[]);
  } finally {await fixture.close();}
});

test('content requests combine thirty-two pairs while retaining every comparison',{timeout:120000},async(t)=>{
  const fixture=await createConsistencyAgentHost({candidateCount:65,withSimilarCandidate:true,annotatedCandidates:true,
    protocol:'openai-responses'});
  try{
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId]});
    await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));assert.equal(status.completed,66);
    const contexts=fixture.wires.map(body=>JSON.parse(body.messages.find(message=>message.role==='user').content[1].text))
      .filter(context=>context.scope==='pairs'||context.scope==='joint');
    const sizes=contexts.map(context=>context.scope==='pairs'?Object.keys(context.pairs).length:1);
    assert.ok(sizes.includes(32),JSON.stringify({sizes}));assert.ok(sizes.every(size=>size<=32));
    const {anchors}=await fixture.bridge.execute('consistency_agent_anchors',{run_id:job.run_id});
    const details=await Promise.all(anchors.map(anchor=>fixture.bridge.execute('consistency_agent_detail',
      {run_id:job.run_id,anchor_id:anchor.anchor_id})));
    const pairs=new Set(details.flatMap(detail=>detail.gates.filter(gate=>gate.source==='vision').map(gate=>gate.pair_key)));
    assert.equal(sizes.reduce((sum,size)=>sum+size,0),pairs.size);
    assert.equal(contexts.length,Math.ceil(pairs.size/32),'Program-only pairs must not fragment visual batches');
    const schemas=fixture.wires.map(body=>body.responses?.text.format.schema).filter(Boolean);
    const maxSchemaBytes=Math.max(...schemas.map(schema=>Buffer.byteLength(JSON.stringify(schema))));
    assert.ok(maxSchemaBytes<12000,'The batch must share identical contracts instead of repeating them');
    t.diagnostic(JSON.stringify({maximum_pairs:Math.max(...sizes),maximum_schema_bytes:maxSchemaBytes,
      compared_pairs:pairs.size,requests:contexts.length}));
    assert.deepEqual(fixture.errors,[]);
  }finally{await fixture.close();}
});

test('local workers freeze each pair batch before it enters the model pool',{timeout:45000},async()=>{
  const prepared=new Set();let preparations=0,reviews=0;
  const fixture=await createConsistencyAgentHost({candidateCount:9,withSimilarCandidate:true,
    modelRouting:{execute:async(operation,args,signal,dispatch)=>{
      if(operation==='consistency_agent_pair_prepare_many'){
        assert.equal(args._model_execution,undefined);
        const result=await dispatch(operation,args,signal);
        preparations++;for(const key of args.pair_keys)prepared.add(key);
        return result;
      }
      if(operation==='consistency_agent_pair_review_many'){
        assert.ok(args.pair_keys.every(key=>prepared.has(key)),'Model workers received unprepared pair inputs');
        reviews++;
      }
      return dispatch(operation,args,signal);
    }}});
  try{
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId]});
    await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));
    assert.ok(preparations>1);assert.equal(preparations,reviews);
    assert.deepEqual(fixture.errors,[]);
  }finally{await fixture.close();}
});

test('a rejected capacity subrequest does not fail already delivered unrelated pairs',{timeout:45000},async()=>{
  let requests=0;
  const fixture=await createConsistencyAgentHost({candidateCount:15,withSimilarCandidate:true,
    annotatedCandidates:true,featureGroupSize:2,maxVisualInputs:16,onGeneration:async(body,response)=>{
      const context=JSON.parse(body.messages.find(message=>message.role==='user').content[1].text);
      assert.equal(context.scope,'pairs');
      assert.equal(Object.keys(context.pairs).length,4);
      if(++requests===2){
        response.writeHead(400,{'Content-Type':'application/json'});
        response.end(JSON.stringify({error:{type:'invalid_request_error',message:'Bad Request'}}));
      }
    }});
  try{
    await fixture.bridge.execute('module_settings_save',{module:'consistency',expected_revision:1,settings:{concurrency:4}});
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId]});
    await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(requests,2,'An unknown HTTP 400 must not be automatically retried');
    assert.equal(status.status,'PARTIAL');
    assert.equal(status.completed,8,'The first four delivered pairs must finish all eight linked images');
    assert.equal(status.failed,8,'Only images with an unresolved pair may fail');
    const {anchors}=await fixture.bridge.execute('consistency_agent_anchors',{run_id:job.run_id});
    const successful=new Set();
    for(const anchor of anchors){
      const detail=await fixture.bridge.execute('consistency_agent_detail',{run_id:job.run_id,anchor_id:anchor.anchor_id});
      for(const gate of detail.gates)if(gate.source==='vision'&&gate.execution_status==='completed')successful.add(anchor.anchor_id);
    }
    assert.equal(successful.size,8);
    assert.ok(anchors.filter(anchor=>successful.has(anchor.anchor_id)).every(anchor=>anchor.state==='COMPLETED'));
    assert.equal(status.model_calls.filter(call=>call.operation==='generate'&&call.http_status===400).length,1);
    await fixture.scheduler.resume(job.run_id);
    await fixture.scheduler.whenIdle();
    const recovered=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(recovered.status,'COMPLETED');assert.equal(recovered.completed,16);assert.equal(recovered.failed,0);
    assert.equal(requests,3,'Explicit recovery must reuse all successful comparisons');
    const delivered=recovered.model_calls.filter(call=>call.operation==='generate'&&!call.error);
    assert.equal(delivered.length,2);
    assert.equal(new Set(delivered.flatMap(call=>call.pair_keys)).size,8);
    assert.deepEqual(fixture.errors,[]);
  }finally{await fixture.close();}
});

test('small annotated jobs fill the frozen model concurrency before waiting on a large batch',{timeout:45000},async()=>{
  const entered=Promise.withResolvers(),release=Promise.withResolvers();let active=0;
  const fixture=await createConsistencyAgentHost({candidateCount:7,withSimilarCandidate:true,annotatedCandidates:true,
    onGeneration:async body=>{
      const context=JSON.parse(body.messages.find(message=>message.role==='user').content[1].text);
      if(context.scope==='pairs'||context.scope==='joint'){
        if(++active===4)entered.resolve();
        await release.promise;
      }
    }});
  try{
    await fixture.bridge.execute('module_settings_save',{module:'consistency',expected_revision:1,settings:{concurrency:4}});
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId]});
    await Promise.race([entered.promise,delay(20000).then(()=>{throw new Error('Large batches left model capacity idle: '+active);})]);
    release.resolve();await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));assert.equal(status.failed,0);
    assert.deepEqual(fixture.errors,[]);
  }finally{release.resolve();await fixture.close();}
});

test('program-only pairs do not enlarge the visual batches and leave model workers idle',{timeout:45000},async()=>{
  const entered=Promise.withResolvers(),release=Promise.withResolvers();let active=0;
  const fixture=await createConsistencyAgentHost({candidateCount:28,withSimilarCandidate:true,
    onGeneration:async body=>{
      const context=JSON.parse(body.messages.find(message=>message.role==='user').content[1].text);
      if(context.scope==='pairs'||context.scope==='joint'){
        if(++active===2)entered.resolve();
        await release.promise;
      }
    }});
  try{
    await fixture.bridge.execute('module_settings_save',{module:'consistency',expected_revision:1,settings:{concurrency:4}});
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId]});
    await Promise.race([entered.promise,delay(20000).then(()=>{throw new Error('Program-only work left visual capacity idle: '+active);})]);
    release.resolve();await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));assert.equal(status.completed,29);
    assert.equal(status.failed,0);assert.deepEqual(fixture.errors,[]);
  }finally{release.resolve();await fixture.close();}
});

test('completed observations finalize with the frozen concurrency instead of a serial tail',{timeout:30000},async()=>{
  const entered=Promise.withResolvers(),release=Promise.withResolvers();let active=0;
  const fixture=await createConsistencyAgentHost({candidateCount:2,modelRouting:{execute:async(operation,args,signal,dispatch)=>{
    if(operation==='consistency_agent_finalize'){
      if(++active===2)entered.resolve();await release.promise;
    }
    return dispatch(operation,args,signal);
  }}});
  try{
    await fixture.bridge.execute('module_settings_save',{module:'consistency',expected_revision:1,settings:{concurrency:2}});
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact'});
    await Promise.race([entered.promise,delay(15000).then(()=>{throw new Error('Finalization serialized behind the first anchor');})]);
    release.resolve();await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(status.completed,3);assert.equal(status.failed,0);
  }finally{release.resolve();await fixture.close();}
});

test('cancellation remains responsive when all four visual workers are waiting for the provider', {timeout:45000},async()=>{
  const entered=Promise.withResolvers(),release=Promise.withResolvers();
  let active=0;
  const fixture=await createConsistencyAgentHost({candidateCount:4,onGeneration:async body=>{
    assert.equal(body.test_role,'vision');
    if(++active===4)entered.resolve();
    await release.promise;
  }});
  try {
    await fixture.bridge.execute('module_settings_save',{module:'consistency',expected_revision:1,settings:{concurrency:4}});
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact'});
    await Promise.race([entered.promise,delay(15000).then(()=>{throw new Error('Expected four active visual requests; got '+active);})]);
    const status=await Promise.race([fixture.scheduler.cancel(job.run_id),delay(1000).then(()=>{throw new Error('Cancellation is blocked behind visual generation');})]);
    assert.equal(status.status,'CANCELLED');assert.equal(active,4);
    release.resolve();await fixture.scheduler.whenIdle();
    assert.equal((await fixture.bridge.execute('analysis_status',{run_id:job.run_id})).completed,0);
  } finally {release.resolve();await fixture.close();}
});

test('cancelling between a failure notice and its write returns the cancelled state',{timeout:30000},async()=>{
  const entered=Promise.withResolvers(),release=Promise.withResolvers();
  const fixture=await createConsistencyAgentHost({modelRouting:{execute:async(operation,args,signal,dispatch)=>{
    if(operation==='consistency_agent_failure'){entered.resolve();await release.promise;}
    return dispatch(operation,args,signal);
  }}});
  try{
    fixture.rejectGeneration();
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact',
      subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A]}});
    await entered.promise;
    const cancellation=fixture.scheduler.cancel(job.run_id);cancellation.catch(()=>{});
    for(let count=0;count<100;count++){
      if((await fixture.bridge.execute('analysis_status',{run_id:job.run_id})).status==='CANCELLED')break;
      await delay(10);
    }
    release.resolve();
    const result=await cancellation;
    assert.equal(result.status,'CANCELLED');assert.equal(result.failed,0);
    const anchor=await fixture.bridge.execute('consistency_agent_anchor',{run_id:job.run_id,anchor_id:fixture.sampleIds.A});
    assert.equal(anchor.state,'CANCELLED');assert.equal(anchor.result,null);
  }finally{release.resolve();await fixture.close();}
});
