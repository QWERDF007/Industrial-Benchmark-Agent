import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';

for(const concurrency of [1,2])test('visual work respects frozen concurrency '+concurrency,{timeout:45000},async()=>{
 const entered=Promise.withResolvers(),release=Promise.withResolvers();let started=0;
 const fixture=await createConsistencyAgentHost({candidateCount:2,onGeneration:async body=>{
  assert.equal(body.test_role,'vision');if(++started===concurrency)entered.resolve();await release.promise;
 }});
 try{
  await fixture.bridge.execute('module_settings_save',{module:'consistency',expected_revision:1,settings:{concurrency}});
  const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact'});
  await Promise.race([entered.promise,delay(15000).then(()=>{throw new Error('Visual work did not start');})]);
  const snapshot=await fixture.bridge.execute('consistency_agent_snapshot',{run_id:job.run_id});
  assert.equal(snapshot.concurrency,concurrency);
  await fixture.bridge.execute('module_settings_save',{module:'consistency',expected_revision:2,settings:{concurrency:3}});
  assert.equal(started,concurrency);
  release.resolve();await fixture.scheduler.whenIdle();
  const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
  assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));assert.equal(status.completed,3);assert.equal(started,3);
  assert.deepEqual(await fixture.bridge.execute('consistency_agent_snapshot',{run_id:job.run_id}),snapshot);
  for(const call of status.model_calls.filter(call=>call.operation==='generate')){
   const anchor=await fixture.bridge.execute('consistency_agent_anchor',{run_id:job.run_id,anchor_id:call.sample_id});
   assert.equal(call.session_id,anchor.session_id);assert.equal(call.phase,'OBSERVING_ANCHOR');
  }
  assert.deepEqual(fixture.errors,[]);
 }finally{release.resolve();await fixture.close();}
});

test('cancel stops queued work and resume preserves Sessions and frozen concurrency',{timeout:45000},async()=>{
 const entered=Promise.withResolvers(),release=Promise.withResolvers();let started=0;
 const fixture=await createConsistencyAgentHost({candidateCount:2,onGeneration:async()=>{
  if(++started===2)entered.resolve();await release.promise;
 }});
 try{
  await fixture.bridge.execute('module_settings_save',{module:'consistency',expected_revision:1,settings:{concurrency:2}});
  const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact'});
  await Promise.race([entered.promise,delay(15000).then(()=>{throw new Error('Both visual requests must start');})]);
  const before=await fixture.bridge.execute('consistency_agent_anchors',{run_id:job.run_id});
  assert.equal((await fixture.scheduler.cancel(job.run_id)).status,'CANCELLED');assert.equal(started,2);
  release.resolve();
  await fixture.bridge.execute('module_settings_save',{module:'consistency',expected_revision:2,settings:{concurrency:3}});
  await fixture.scheduler.resume(job.run_id);await fixture.scheduler.whenIdle();
  const after=await fixture.bridge.execute('consistency_agent_anchors',{run_id:job.run_id});
  assert.deepEqual(after.anchors.map(anchor=>anchor.session_id),before.anchors.map(anchor=>anchor.session_id));
  assert.equal((await fixture.bridge.execute('consistency_agent_snapshot',{run_id:job.run_id})).concurrency,2);
  assert.equal((await fixture.bridge.execute('analysis_status',{run_id:job.run_id})).status,'COMPLETED');
  assert.deepEqual(fixture.errors,[]);
 }finally{release.resolve();await fixture.close();}
});
