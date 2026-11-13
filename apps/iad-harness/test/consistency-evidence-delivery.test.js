import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';

test('each direct annotation decision retains all actual image and source facts',{timeout:30000},async()=>{
 const fixture=await createConsistencyAgentHost({candidateCount:6});
 try{
  const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact',
   max_exact_candidates:6,subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A]}});
  await fixture.scheduler.whenIdle();
  const detail=await fixture.bridge.execute('consistency_agent_detail',{run_id:job.run_id,anchor_id:fixture.sampleIds.A});
  assert.equal(detail.state,'COMPLETED',JSON.stringify(detail.errors));
  assert.equal(fixture.wires.length,1);assert.equal(detail.observations.length,1);
  const observed=detail.observations[0];assert.equal(Object.keys(observed.request.facts.sources).length,7);
  assert.equal(observed.result.observations.length,6);
  for(const finding of observed.result.observations){
   assert.equal(finding.assessment.candidate_id,finding.candidate_id);
   assert.deepEqual([...finding.media_ids].sort(),[...observed.request.facts.required_image_ids[finding.candidate_id]].sort());
  }
  const transcript=await fixture.host.read(detail.session_id);
  assert.equal(transcript.events.filter(event=>event.type==='assistant/attempt').length,0);
  assert.equal(transcript.events.filter(event=>event.type==='iad/consistency').at(-1).data.value.result.reason,'MODEL_REVIEWED');
 }finally{await fixture.close();}
});

test('a frozen visual request id cannot be reused for a smaller candidate group',{timeout:30000},async()=>{
 const fixture=await createConsistencyAgentHost({candidateCount:6});
 try{
  const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact',
   max_exact_candidates:6,subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A]}});
  await fixture.scheduler.whenIdle();
  const detail=await fixture.bridge.execute('consistency_agent_detail',{run_id:job.run_id,anchor_id:fixture.sampleIds.A});
  const context=await fixture.bridge.execute('consistency_agent_context',{run_id:job.run_id,anchor_id:fixture.sampleIds.A,attempt:detail.attempt,query:{}});
  const page=context.anchor.visual_plan.pages[0],snapshot=await fixture.bridge.execute('consistency_agent_snapshot',{run_id:job.run_id});
  const before=fixture.wires.length;
  await assert.rejects(fixture.bridge.execute('consistency_agent_observe',{run_id:job.run_id,anchor_id:fixture.sampleIds.A,
   attempt:detail.attempt,request:{...page,phase:'audit',candidate_ids:page.candidate_ids.slice(0,3),
    gate_revisions:Object.fromEntries(page.candidate_ids.slice(0,3).map(id=>[id,page.gate_revisions[id]]))},
   _model_execution:await fixture.native.credentialsFor(snapshot.roles.vision.profile)}),/冻结页request_id/);
  assert.equal(fixture.wires.length,before);
 }finally{await fixture.close();}
});

test('the selected visual model receives the editable system and user prompts unchanged',{timeout:30000},async()=>{
 const fixture=await createConsistencyAgentHost();
 try{
  const instruction='比较两图的原始框、类别与覆盖。',system_prompt='依据实际图像写清具体差别。';
  const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact',
   instruction,system_prompt,subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A]}});
  await fixture.scheduler.whenIdle();
  const snapshot=await fixture.bridge.execute('consistency_agent_snapshot',{run_id:job.run_id});
  assert.equal(snapshot.instruction,instruction);assert.equal(snapshot.system_prompt,system_prompt);
  assert.equal(snapshot.roles.agent.profile,null);
  for(const body of fixture.wires){
   assert.equal(body.test_role,'vision');assert.equal(body.model,snapshot.model.model_id);
   assert.equal(body.messages.find(message=>message.role==='system').content[0].text,system_prompt);
   assert.equal(body.messages.find(message=>message.role==='user').content[0].text,instruction);
  }
  assert.equal((await fixture.bridge.execute('consistency_agent_anchor',{run_id:job.run_id,anchor_id:fixture.sampleIds.A})).result.overall.text,'多类别');
 }finally{await fixture.close();}
});
