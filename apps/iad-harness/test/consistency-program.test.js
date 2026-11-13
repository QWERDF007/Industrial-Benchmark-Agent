import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';

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
    const comparisons=fixture.wires.filter(body=>body.test_role==='vision'&&
      JSON.parse(body.messages.find(message=>message.role==='user').content[1].text).scope==='joint');
    assert.equal(comparisons.length,pairKeys.size);
    assert.equal(gates.length,comparisons.length*2);
    assert.ok(status.model_calls.filter(call=>call.schema_name==='IdentityDecision').every(call=>call.phase==='VERIFYING_CONTENT'));
    assert.deepEqual(fixture.errors,[]);
  } finally {await fixture.close();}
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
