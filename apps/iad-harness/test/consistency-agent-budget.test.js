import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';

test('an indivisible image group fails before generation when its image budget is too small',{timeout:30000},async()=>{
 const fixture=await createConsistencyAgentHost({maxVisualInputs:2});
 try{
  const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact',
   subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A]}});
  await fixture.scheduler.whenIdle();
  const detail=await fixture.bridge.execute('consistency_agent_detail',{run_id:job.run_id,anchor_id:fixture.sampleIds.A});
  assert.equal(detail.state,'FAILED');assert.equal(detail.result,null);
  assert.match(detail.errors[0].message,/预算|视觉输入/);assert.equal(fixture.wires.length,0);
 }finally{await fixture.close();}
});

test('provider context cannot bypass the frozen visual context limit',{timeout:30000},async()=>{
 const fixture=await createConsistencyAgentHost({onTokenize:async()=>({count:42370,max_model_len:262144})});
 try{
  const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact',
   subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A]}});
  await fixture.scheduler.whenIdle();
  const detail=await fixture.bridge.execute('consistency_agent_detail',{run_id:job.run_id,anchor_id:fixture.sampleIds.A});
  assert.equal(detail.state,'FAILED');assert.match(detail.errors[0].message,/42370.*32768/);
  assert.equal(fixture.wires.length,0);
 }finally{await fixture.close();}
});

test('large candidate groups are admitted by actual visual capacity and compared page by page',{timeout:90000},async()=>{
 const fixture=await createConsistencyAgentHost({candidateCount:30,maxCandidatesPerPage:5});
 try{
  const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact',
   max_exact_candidates:30,subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A]}});
  await fixture.scheduler.whenIdle();
  const detail=await fixture.bridge.execute('consistency_agent_detail',{run_id:job.run_id,anchor_id:fixture.sampleIds.A});
  assert.equal(detail.state,'COMPLETED',JSON.stringify(detail.errors));
  assert.equal(detail.result.assessments.length,30);assert.ok(detail.visual_plan.pages.length>1);
  assert.ok(detail.visual_plan.pages.every(page=>page.candidate_ids.length<=5));
  assert.equal(fixture.wires.length,detail.visual_plan.pages.length);
  assert.ok(fixture.wires.every(body=>body.test_role==='vision'&&!body.tools));
  assert.ok(!JSON.stringify(fixture.wires).includes('compaction engine'));
 }finally{await fixture.close();}
});
