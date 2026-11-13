import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';
import {JobSessionHost} from '../lib/server/sessions/host.js';
import {imageSessionPath} from '../lib/server/sessions/image-path.js';
import {ConsistencyCheckScheduler} from '../lib/server/consistency/scheduler.js';
import {ConsistencyAnchorReviewer} from '../lib/server/consistency/anchor-reviewer.js';

test('two independent schedulers cannot dispatch the same accepted job twice', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost();
  const otherHost = await JobSessionHost.open(path.join(fixture.root, 'sessions'),
    async session_id => imageSessionPath(path.join(fixture.root, 'sessions'), await fixture.bridge.execute('consistency_agent_session_location', {session_id})));
  const errors = [];
  const reviewer = new ConsistencyAnchorReviewer(fixture.bridge, otherHost, fixture.native);
  const other = new ConsistencyCheckScheduler(fixture.bridge, otherHost, fixture.native,
    task => reviewer.review(task), error => errors.push(error));
  try {
    fixture.holdGeneration();
    const request = {submission_id: randomUUID(), dataset_ids: [fixture.datasetId], mode: 'exact',
      subjects: {kind: 'samples', sample_ids: [fixture.datasetId + ':A.png']}};
    const started = await fixture.scheduler.start(request);
    await fixture.held.promise;
    const replayed = await other.start(request);await other.whenIdle();
    assert.equal(replayed.run_id, started.run_id);
    assert.equal(Object.hasOwn(started, 'created'), false);assert.equal(Object.hasOwn(replayed, 'created'), false);
    const active = await fixture.bridge.execute('consistency_agent_anchor', {run_id: started.run_id, anchor_id: request.subjects.sample_ids[0]});
    assert.equal(active.state, 'RUNNING');assert.equal(active.attempt, 1);
    fixture.release.resolve();await fixture.scheduler.whenIdle();
    const detail = await fixture.bridge.execute('consistency_agent_detail', {run_id: started.run_id, anchor_id: active.anchor_id});
    assert.equal(detail.state, 'COMPLETED');assert.equal(detail.result.reason, 'MODEL_REVIEWED');
    assert.equal(fixture.wires.filter(body => body.test_role === 'agent').length, 0);
    assert.equal(fixture.wires.filter(body => body.test_role === 'vision').length, 1);
    assert.deepEqual(errors, []);assert.deepEqual(fixture.errors, []);
  } finally {
    fixture.release.resolve();await other.dispose();await otherHost.dispose();await fixture.close();
  }
});

for (const sameDataset of [false, true]) test('independent checks can review visual checks concurrently in the same private host: ' + (sameDataset ? 'same dataset' : 'different datasets'), {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost();
  const errors = [];
  const reviewer = new ConsistencyAnchorReviewer(fixture.bridge, fixture.host, fixture.native);
  const other = new ConsistencyCheckScheduler(fixture.bridge, fixture.host, fixture.native,
    task => reviewer.review(task), error => errors.push(error));
  try {
    let datasetId = fixture.datasetId;
    if (!sameDataset) {
      await fs.cp(path.join(fixture.root, 'images'), path.join(fixture.root, 'second-images'), {recursive: true});
      await fs.cp(path.join(fixture.root, 'labels'), path.join(fixture.root, 'second-labels'), {recursive: true});
      const dataset = await fixture.bridge.execute('dataset_import', {format: 'labelme', name: '并行审核',
        image_dir: path.join(fixture.root, 'second-images'), annotation_dir: path.join(fixture.root, 'second-labels'),
        annotation_policy: {annotation_coverage: 'EXHAUSTIVE'}});
      datasetId = dataset.dataset_id;
    }
    fixture.holdGeneration();
    const first = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId], mode: 'exact',
      subjects: {kind: 'samples', sample_ids: [fixture.datasetId + ':A.png']}});
    await fixture.held.promise;
    const second = await other.start({submission_id: randomUUID(), dataset_ids: [datasetId], mode: 'exact',
      subjects: {kind: 'samples', sample_ids: [datasetId + (sameDataset ? ':A.png' : ':B.png')]}});
    await other.whenIdle();
    const completed = await fixture.bridge.execute('analysis_status', {run_id: second.run_id});
    assert.equal(completed.status, 'COMPLETED', JSON.stringify(completed.errors));
    assert.equal((await fixture.bridge.execute('analysis_status', {run_id: first.run_id})).status, 'RUNNING');
    const [left, right] = await Promise.all([first, second].map(run => fixture.bridge.execute('consistency_agent_anchors', {run_id: run.run_id})));
    assert.notEqual(left.anchors[0].session_id, right.anchors[0].session_id);
    fixture.release.resolve();await fixture.scheduler.whenIdle();
    assert.equal((await fixture.bridge.execute('analysis_status', {run_id: first.run_id})).status, 'COMPLETED');
    assert.deepEqual(errors, []);assert.deepEqual(fixture.errors, []);
  } finally {
    fixture.release.resolve();await other.dispose();await fixture.close();
  }
});

test('invalid annotations fail only their main image inside an accepted check', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost({multiCandidate:true});
  try {
    await fs.writeFile(path.join(fixture.root, 'labels/A.json'), JSON.stringify({imageWidth: 40, imageHeight: 40,
      shapes: [{label: 'scratch', shape_type: 'rectangle', points: [[10, 10], [10, 20]]}]}));
    await fixture.bridge.execute('dataset_scan', {dataset_id: fixture.datasetId});
    const job=await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId], mode: 'exact',
      subjects: {kind: 'samples', sample_ids: [fixture.sampleIds.A,fixture.sampleIds.C]}});
    await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(status.status,'PARTIAL');assert.equal(status.completed,1);assert.equal(status.failed,1);
    const bad=await fixture.bridge.execute('consistency_agent_detail',{run_id:job.run_id,anchor_id:fixture.sampleIds.A});
    assert.equal(bad.state,'FAILED');assert.equal(bad.result,null);
    assert.equal(bad.errors[0].code,'ANNOTATION_UNREADABLE');
    assert.equal(bad.errors[0].source_phase,'AWAITING_REVIEW');
    assert.match(bad.errors[0].message,/矩形标注无法审核/);
    assert.ok(bad.gates.every(gate=>gate.gate_status==='eligible'));
    assert.equal(bad.session_created,true);assert.equal(bad.trace_state,'CLOSED');
    const good=await fixture.bridge.execute('consistency_agent_detail',{run_id:job.run_id,anchor_id:fixture.sampleIds.C});
    assert.equal(good.state,'COMPLETED');assert.equal(good.result.reason,'NO_CANDIDATES');
    assert.deepEqual(fixture.wires, []);
  } finally {await fixture.close();}
});

test('a direct visual request completes beyond the transport deadline with structured assessments', {timeout:30000}, async()=>{
  const fixture=await createConsistencyAgentHost({bridgeTimeoutMs:3000, onGeneration:async body=>{
    if(body.test_role==='vision') await new Promise(resolve=>setTimeout(resolve,3500));
    if(body.test_role==='agent') {
      const assessment=body.tools.find(tool=>tool.function.name==='anchor_assess').function.parameters.properties.assessment;
      assert.equal(assessment.type,'object');
      assert.equal(assessment.oneOf,undefined);
      assert.equal(body.tools.find(tool=>tool.function.name==='anchor_observe').function.parameters.properties.windows,undefined);
    }
  }});
  try {
    const started=await fixture.scheduler.start({analysis_kind:'consistency',submission_id:randomUUID(),
      dataset_ids:[fixture.datasetId],mode:'exact',subjects:{kind:'samples',sample_ids:[fixture.datasetId+':A.png']}});
    await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:started.run_id});
    assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));
    assert.deepEqual(fixture.errors,[]);
    const {anchors:[anchor]}=await fixture.bridge.execute('consistency_agent_anchors',{run_id:started.run_id});
    const completed=await fixture.bridge.execute('consistency_agent_anchor',{run_id:started.run_id,anchor_id:anchor.anchor_id});
    assert.equal(completed.state,'COMPLETED');
    assert.ok(completed.result);
    assert.ok(status.model_calls.some(call=>call.role==='vision' && call.elapsed_ms>=3500));
  } finally {await fixture.close();}
});

test('an indivisible visual evidence unit fails with its actual budget reason before visual generation', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost({multiCandidate: true, maxVisualInputs: 1});
  const {bridge, scheduler, datasetId, wires, host} = fixture;
  try {
    const started = await scheduler.start({submission_id: randomUUID(), dataset_ids: [datasetId], subjects: {kind: 'samples', sample_ids: [datasetId + ':A.png']}});
    await scheduler.whenIdle();
    const status = await bridge.execute('analysis_status', {run_id: started.run_id});
    assert.equal(status.status, 'FAILED');
    assert.equal(status.errors[0].code, 'RESOURCE_LIMIT');
    assert.equal(status.errors[0].source_phase, 'PLANNING_VISUAL_PAGES');
    const {anchors: [anchor]} = await bridge.execute('consistency_agent_anchors', {run_id: started.run_id});
    assert.equal(anchor.result, null);
    assert.equal((await host.read(anchor.session_id)).events.some(event => event.type === 'assistant/attempt'), false);
    assert.equal(wires.length, 0);
    const empty = await scheduler.start({submission_id: randomUUID(), dataset_ids: [datasetId], subjects: {kind: 'samples', sample_ids: [datasetId + ':C.png']}});
    await scheduler.whenIdle();
    assert.equal((await bridge.execute('analysis_status', {run_id: empty.run_id})).status, 'COMPLETED');
    assert.equal(wires.length, 0);
  } finally {await fixture.close();}
});

test('combined checks wait for the frozen shared index preparation before visual review', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost({indexMode: 'cached'});
  try {
    const started = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId], mode: 'combined',
      subjects: {kind: 'samples', sample_ids: [fixture.datasetId + ':A.png']}});
    await fixture.scheduler.whenIdle();
    const node = await fixture.bridge.execute('analysis_node', {run_id: started.run_id});
    assert.equal(node.status, 'COMPLETED');
    assert.ok(node.index_batch_id);
    assert.equal(node.prepared_sources, 2);
    const preparation = await fixture.bridge.execute('consistency_status', {batch_id: node.index_batch_id});
    assert.equal(preparation.kind, 'index');
    assert.equal(preparation.status, 'COMPLETED');
    assert.equal(preparation.completed, 2);
    assert.ok(preparation.children.every(child => child.job_type === 'IMAGE_INDEX' && child.model_calls.length === 0));
    assert.equal(fixture.wires.filter(body => body.test_role === 'agent').length, 0);
    assert.equal(fixture.wires.filter(body => body.test_role === 'vision').length, 1);
  } finally {await fixture.close();}
});

test('combined zero candidates pass after shared preparation without either review model configured', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost({multiCandidate: true, indexMode: 'cached'});
  try {
    await fixture.bridge.execute('module_settings_save', {module: 'consistency', expected_revision: 1,
      settings: {model: null}});
    const job = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId], mode: 'combined',
      subjects: {kind: 'samples', sample_ids: [fixture.datasetId + ':C.png']}});
    await fixture.scheduler.whenIdle();
    const detail = await fixture.bridge.execute('consistency_agent_detail', {run_id: job.run_id, anchor_id: fixture.datasetId + ':C.png'});
    assert.equal(detail.state, 'COMPLETED');
    assert.equal(detail.result.reason, 'NO_CANDIDATES');
    assert.equal(detail.candidates.exact.state, 'done');
    assert.equal(detail.candidates.similar.state, 'done');
    assert.equal(detail.candidates.candidates.length, 0);
    assert.deepEqual(fixture.wires, []);
    const diagnostics = await fixture.bridge.execute('consistency_agent_diagnostics', {run_id: job.run_id, anchor_id: detail.anchor_id});
    assert.equal(diagnostics.roles.agent.requests, 0);
    assert.equal(diagnostics.roles.vision.requests, 0);
  } finally {await fixture.close();}
});

test('unconfigured combined preparation leaves real sessions and fails every anchor before review', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost();
  try {
    const job = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId], mode: 'combined'});
    await fixture.scheduler.whenIdle();
    const status = await fixture.bridge.execute('analysis_status', {run_id: job.run_id});
    assert.equal(status.status, 'FAILED');
    assert.equal(status.failed, 2);
    assert.ok(status.errors.every(error => error.code === 'PROFILE_NOT_CONFIGURED' && error.source_phase === 'PREPARING_SHARED_INDEX'));
    const {anchors} = await fixture.bridge.execute('consistency_agent_anchors', {run_id: job.run_id});
    for (const anchor of anchors) {
      assert.equal(anchor.result, null);
      assert.equal(anchor.session_created, true);
      assert.equal((await fixture.host.read(anchor.session_id)).events.some(event => event.type === 'assistant/message'), false);
    }
    assert.deepEqual(fixture.wires, []);
  } finally {await fixture.close();}
});

test('an actual encoder preparation failure retains its error code across the worker bridge', {timeout: 45000}, async () => {
  const fixture = await createConsistencyAgentHost({indexMode: 'cold'});
  try {
    const job = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId], mode: 'combined'});
    await fixture.scheduler.whenIdle();
    const status = await fixture.bridge.execute('analysis_status', {run_id: job.run_id});
    assert.equal(status.status, 'FAILED');
    assert.equal(status.failed, 2);
    assert.ok(status.errors.every(error => error.code === 'ENCODER_UNAVAILABLE'), JSON.stringify(status.errors));
    assert.deepEqual(fixture.wires, []);
    const node = await fixture.bridge.execute('analysis_node', {run_id: job.run_id});
    assert.ok(node.index_batch_id);
    const preparation = await fixture.bridge.execute('consistency_status', {batch_id: node.index_batch_id});
    assert.equal(preparation.status, 'FAILED');
    assert.equal(preparation.children.length, 1, '编码器失败不能自动再次尝试');
    assert.equal(preparation.children[0].errors[0].code, 'ENCODER_UNAVAILABLE');
    assert.ok(status.errors.every(error => error.source_run_id === preparation.children[0].run_id
      && error.source_phase === preparation.children[0].errors[0].source_phase));
  } finally {await fixture.close();}
});

test('an exact match cannot admit review when combined corpus feature preparation is incomplete', {timeout: 45000}, async () => {
  const fixture = await createConsistencyAgentHost({multiCandidate: true, indexMode: 'partial'});
  try {
    const job = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId], mode: 'combined',
      subjects: {kind: 'samples', sample_ids: [fixture.datasetId + ':A.png']}});
    await fixture.scheduler.whenIdle();
    const status = await fixture.bridge.execute('analysis_status', {run_id: job.run_id});
    assert.equal(status.status, 'FAILED');
    assert.equal(status.errors[0].code, 'ENCODER_UNAVAILABLE');
    const detail = await fixture.bridge.execute('consistency_agent_detail', {run_id: job.run_id, anchor_id: fixture.datasetId + ':A.png'});
    assert.equal(detail.result, null);
    assert.equal(detail.candidates, null);
    assert.deepEqual(fixture.wires, []);
    const diagnostic = await fixture.bridge.execute('consistency_agent_diagnostics', {run_id: job.run_id, anchor_id: detail.anchor_id});
    assert.equal(diagnostic.roles.agent.requests, 0);
    assert.equal(diagnostic.roles.vision.requests, 0);
  } finally {await fixture.close();}
});

test('identity provider failure terminates the native turn with failed candidate evidence instead of passing',{timeout:30000},async()=>{
  const fixture=await createConsistencyAgentHost({multiCandidate:true,withSimilarCandidate:true,onGeneration(body){
    if(body.test_role==='vision')throw new Error('isolated identity provider failed');
  }});
  try {
    const started=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],
      subjects:{kind:'samples',sample_ids:[fixture.sampleIds.C]}});
    await fixture.scheduler.whenIdle();
    const detail=await fixture.bridge.execute('consistency_agent_detail',{run_id:started.run_id,anchor_id:fixture.sampleIds.C});
    assert.equal(detail.state,'FAILED');assert.equal(detail.result,null);
    assert.equal(detail.outcome.result,'incomplete');assert.equal(detail.outcome.candidate_stats.failed,detail.gates.filter(gate=>gate.execution_status==='failed').length);
    assert.ok(detail.gates.some(gate=>gate.execution_status==='failed'&&gate.gate_status===null));
    assert.match(detail.gates.find(gate=>gate.execution_status==='failed').reason,/500 Internal Server Error/);
    const status=await fixture.bridge.execute('analysis_status',{run_id:started.run_id});
    const call=status.model_calls.find(call=>call.role==='vision'&&call.operation==='generate');
    assert.equal(call.http_status,500);
    const recorded=await fixture.bridge.execute('model_call_get',{run_id:started.run_id,call_id:call.call_id});
    assert.match(recorded.response_body,/isolated identity provider failed/);
    assert.ok(fixture.wires.filter(body=>body.test_role==='agent').length<=2,'技术失败后不再让 Agent 反复调用工具');
  } finally {await fixture.close();}
});

test('invalid vision output is an execution failure and cannot loop as invalid tool arguments',{timeout:30000},async()=>{
  const fixture=await createConsistencyAgentHost({multiCandidate:true,withSimilarCandidate:true,onGeneration(body,res){
    if(body.test_role==='vision') {
      res.writeHead(200,{'Content-Type':'application/json'});
      res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'{"verdict":"same"}'}}]}));
    }
  }});
  try {
    const started=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],
      subjects:{kind:'samples',sample_ids:[fixture.sampleIds.C]}});
    const settled=await Promise.race([fixture.scheduler.whenIdle().then(()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),20000))]);
    assert.equal(settled,true,'模型格式错误必须结束执行，不能进入参数纠错循环');
    const detail=await fixture.bridge.execute('consistency_agent_detail',{run_id:started.run_id,anchor_id:fixture.sampleIds.C});
    assert.equal(detail.state,'FAILED');assert.equal(detail.result,null);
    const status=await fixture.bridge.execute('analysis_status',{run_id:started.run_id});
    assert.equal(status.errors[0].code,'EXECUTION_ERROR');
    assert.ok(fixture.wires.filter(body=>body.test_role==='vision').length<=6);
    assert.ok(fixture.wires.filter(body=>body.test_role==='agent').length<=2);
  } finally {await fixture.close();}
});

test('visual decisions have actual call, Session and phase provenance without invented Agent events',{timeout:30000},async()=>{
 const fixture=await createConsistencyAgentHost();
 try{
  const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact',
   subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A]}});
  await fixture.scheduler.whenIdle();
  const detail=await fixture.bridge.execute('consistency_agent_detail',{run_id:job.run_id,anchor_id:fixture.sampleIds.A});
  assert.equal(detail.state,'COMPLETED',JSON.stringify(detail.errors));
  const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
  const calls=status.model_calls.filter(call=>call.operation==='generate');
  assert.equal(calls.length,1);assert.equal(calls[0].role,'vision');assert.equal(calls[0].schema_name,'AnnotationReview');
  assert.equal(calls[0].session_id,detail.session_id);assert.equal(calls[0].phase,'OBSERVING_ANCHOR');assert.equal(calls[0].attempt,1);
  const call=await fixture.bridge.execute('model_call_get',{run_id:job.run_id,call_id:calls[0].call_id});
  assert.ok(JSON.parse(call.request_body).messages.some(message=>message.role==='user'));
  assert.ok(call.response_body);assert.equal(call.http_status,200);
  const transcript=await fixture.host.read(detail.session_id);
  assert.ok(!transcript.events.some(event=>event.type==='assistant/attempt'));
  assert.equal(transcript.events.filter(event=>event.type==='iad/consistency').at(-1).data.value.result.reason,'MODEL_REVIEWED');
 }finally{await fixture.close();}
});

test('saved visual pages and decisions survive cancellation without repeating successful requests',{timeout:45000},async()=>{
 const fixture=await createConsistencyAgentHost({multiCandidate:true,maxCandidatesPerPage:1});
 try{
  fixture.holdAfterObservations(1);
  const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact',
   subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A]}});
  await fixture.held.promise;
  const identity={run_id:job.run_id,anchor_id:fixture.sampleIds.A};
  const before=await fixture.bridge.execute('consistency_agent_detail',identity);
  assert.equal(before.observations.length,1);assert.ok(before.assessments.length);
  await fixture.scheduler.cancel(job.run_id);fixture.release.resolve();await fixture.lateResponse.promise;
  await fixture.scheduler.resume(job.run_id);await fixture.scheduler.whenIdle();
  const after=await fixture.bridge.execute('consistency_agent_detail',identity);
  assert.equal(after.state,'COMPLETED',JSON.stringify(after.errors));assert.equal(after.attempt,2);
  assert.equal(after.session_id,before.session_id);assert.deepEqual(after.visual_plan,before.visual_plan);
  assert.equal(after.observations[0].observation_id,before.observations[0].observation_id);
  assert.deepEqual(after.assessments.slice(0,before.assessments.length),before.assessments);
  const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
  const successful=status.model_calls.filter(call=>call.operation==='generate'&&!call.error);
  assert.equal(new Set(successful.map(call=>call.request_id)).size,successful.length);
  assert.deepEqual(fixture.errors,[]);
 }finally{await fixture.close();}
});

for(const usage of [null,{prompt_tokens:1000,completion_tokens:100,total_tokens:1100,prompt_tokens_details:{cached_tokens:700}}])
test('visual diagnostics preserve complete counters and missing usage: '+Boolean(usage),{timeout:30000},async()=>{
 const fixture=await createConsistencyAgentHost({generationUsage:usage});
 try{
  const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact',
   subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A]}});
  await fixture.scheduler.whenIdle();
  const diagnostic=await fixture.bridge.execute('consistency_agent_diagnostics',{run_id:job.run_id,anchor_id:fixture.sampleIds.A});
  assert.equal(diagnostic.roles.agent.generation_requests,0);
  assert.equal(diagnostic.roles.vision.input_tokens,usage?1000:null);
  assert.equal(diagnostic.roles.vision.usage_missing,usage?0:1);
  assert.equal(diagnostic.roles.vision.cost,null);
 }finally{await fixture.close();}
});

test('a provider rejection remains a failed request with the original response',{timeout:30000},async()=>{
 const fixture=await createConsistencyAgentHost();
 try{
  fixture.rejectGeneration();
  const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact',
   subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A]}});
  await fixture.scheduler.whenIdle();
  const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
  assert.equal(status.status,'FAILED');assert.equal(status.completed,0);
  const call=status.model_calls.find(call=>call.operation==='generate');
  assert.equal(call.http_status,401);assert.equal(call.usage,null);
  const payload=await fixture.bridge.execute('model_call_get',{run_id:job.run_id,call_id:call.call_id});
  assert.match(payload.response_body,/provider rejected/);
 }finally{await fixture.close();}
});

test('an output limit remains an execution failure with the actual model reason',{timeout:30000},async()=>{
 const fixture=await createConsistencyAgentHost({generationFinish:'length'});
 try{
  const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact',
   subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A]}});
  await fixture.scheduler.whenIdle();
  const detail=await fixture.bridge.execute('consistency_agent_detail',{run_id:job.run_id,anchor_id:fixture.sampleIds.A});
  assert.equal(detail.state,'FAILED');assert.equal(detail.result,null);assert.match(detail.errors[0].message,/4096/);
  const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
  assert.equal(status.model_calls.find(call=>call.operation==='generate').finish_reason,'length');
 }finally{await fixture.close();}
});

test('image-level labels are compared by the program without visual or orchestration calls',{timeout:30000},async()=>{
 const fixture=await createConsistencyAgentHost({taskType:'anomaly_detection'});
 try{
  const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact'});
  await fixture.scheduler.whenIdle();
  const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
  assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));assert.equal(status.completed,2);
  assert.deepEqual(fixture.wires,[]);
  for(const anchor of (await fixture.bridge.execute('consistency_agent_anchors',{run_id:job.run_id})).anchors){
   assert.equal(anchor.result.assessments[0].issues[0].type,'image_label_mismatch');
  }
 }finally{await fixture.close();}
});
