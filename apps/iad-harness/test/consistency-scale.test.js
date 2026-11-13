import {randomUUID} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';

test('thirty candidates retain frozen pages and successful observations through resume',{timeout:90000},async()=>{
 const fixture=await createConsistencyAgentHost({candidateCount:30,maxCandidatesPerPage:3});
 try{
  fixture.holdAfterObservations(3);
  const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact',
   max_exact_candidates:30,subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A]}});
  await fixture.held.promise;
  const identity={run_id:job.run_id,anchor_id:fixture.sampleIds.A};
  const before=await fixture.bridge.execute('consistency_agent_detail',identity);
  assert.equal(before.candidates.candidates.length,30);assert.equal(before.observations.length,3);
  assert.equal(before.result,null);assert.ok(before.assessments.length);
  assert.ok(before.visual_plan.pages.every(page=>page.candidate_ids.length<=3));
  await fixture.scheduler.cancel(job.run_id);fixture.release.resolve();await fixture.lateResponse.promise;
  await fixture.scheduler.resume(job.run_id);await fixture.scheduler.whenIdle();
  const after=await fixture.bridge.execute('consistency_agent_detail',identity);
  assert.equal(after.state,'COMPLETED',JSON.stringify(after.errors));assert.equal(after.session_id,before.session_id);
  assert.equal(after.attempt,2);assert.deepEqual(after.visual_plan,before.visual_plan);
  assert.deepEqual(after.observations.slice(0,3),before.observations);
  assert.deepEqual(after.assessments.slice(0,before.assessments.length),before.assessments);
  assert.equal(after.result.assessments.length,30);
  assert.equal(new Set(after.result.assessments.map(item=>item.candidate_id)).size,30);
  const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
  const completed=status.model_calls.filter(call=>call.operation==='generate'&&!call.error);
  assert.equal(completed.length,after.visual_plan.pages.length);
  assert.equal(new Set(completed.map(call=>call.request_id)).size,completed.length);
  const beforeResume=fixture.wires.length;
  await fixture.scheduler.resume(job.run_id);await fixture.scheduler.whenIdle();
  assert.equal(fixture.wires.length,beforeResume);assert.deepEqual(fixture.errors,[]);
 }finally{await fixture.close();}
});
