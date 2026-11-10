import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {v5 as uuidV5} from 'uuid';
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
    fixture.holdPlanner();
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
    assert.equal(fixture.wires.filter(body => body.test_role === 'agent').length, 4);
    assert.equal(fixture.wires.filter(body => body.test_role === 'vision').length, 1);
    assert.deepEqual(errors, []);assert.deepEqual(fixture.errors, []);
  } finally {
    fixture.release.resolve();await other.dispose();await otherHost.dispose();await fixture.close();
  }
});

for (const sameDataset of [false, true]) test('independent checks can review native agents concurrently in the same private host: ' + (sameDataset ? 'same dataset' : 'different datasets'), {timeout: 30000}, async () => {
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
    fixture.holdPlanner();
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

test('a native output limit remains a technical failure with its actual reason', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost({agentFinish: 'length'});
  try {
    const started = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId],
      subjects: {kind: 'samples', sample_ids: [fixture.datasetId + ':A.png']}});
    await fixture.scheduler.whenIdle();
    const detail = await fixture.bridge.execute('consistency_agent_detail', {run_id: started.run_id, anchor_id: fixture.datasetId + ':A.png'});
    assert.equal(detail.state, 'FAILED');assert.equal(detail.result, null);
    assert.equal(detail.errors[0].code, 'MAX_TOKENS');assert.match(detail.errors[0].message, /4096/);
    const status = await fixture.bridge.execute('analysis_status', {run_id: started.run_id});
    assert.equal(status.model_calls.find(call => call.role === 'agent').finish_reason, 'max-tokens');
    assert.equal(fixture.wires.filter(body => body.test_role === 'vision').length, 0);
  } finally {await fixture.close();}
});

test('a native Agent completes visual orchestration beyond the transport deadline with structured assessments', {timeout:30000}, async()=>{
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

test('a native private Agent requests real visual media and submits its own anchor through logged tools', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost();
  const {bridge, host, scheduler, wires, errors, endpoint, held, release, lateResponse} = fixture;
  try {
    const request = {analysis_kind: 'consistency', submission_id: randomUUID(), dataset_ids: [fixture.datasetId], mode: 'exact',
      subjects: {kind: 'samples', sample_ids: [fixture.datasetId + ':A.png']}};
    const started = await scheduler.start(request);
    await scheduler.whenIdle();
    const {anchors: [anchor]} = await bridge.execute('consistency_agent_anchors', {run_id: started.run_id});
    const identity = {run_id: started.run_id, anchor_id: anchor.anchor_id};
    const snapshot = await bridge.execute('consistency_agent_snapshot', {run_id: started.run_id});
    const completed = await bridge.execute('consistency_agent_anchor', identity);
    assert.equal(completed.state, 'COMPLETED',JSON.stringify({errors,failures:(await bridge.execute('analysis_status',{run_id:started.run_id})).errors}));
    assert.equal(completed.result.overall.text, '多类别');
    assert.equal(completed.result.reason, 'MODEL_REVIEWED');
    assert.equal(wires.filter(body => body.test_role === 'vision').length, 1);
    assert.equal(wires.filter(body => body.test_role === 'agent').length, 4);
    assert.ok(wires.filter(body => body.test_role === 'agent').every(body => body.temperature === 0.2));
    const agentMessages=wires.find(body=>body.test_role==='agent').messages;
    assert.ok(agentMessages.some(message=>message.role==='system'&&message.content===snapshot.system_prompt));
    assert.ok(agentMessages.some(message=>message.role==='user'&&(typeof message.content==='string'?message.content:
      message.content.filter(part=>part.type==='text').map(part=>part.text).join('')).includes(snapshot.instruction)));
    const visionMessages=wires.find(body=>body.test_role==='vision').messages;
    assert.equal(visionMessages.find(message=>message.role==='system').content[0].text,snapshot.system_prompt);
    assert.equal(visionMessages.find(message=>message.role==='user').content[0].text,snapshot.instruction);
    const persisted = await host.read(anchor.session_id);
    assert.equal(persisted.events.filter(event => event.type === 'assistant/message').length, 4);
    assert.equal(new Set(persisted.events.filter(event => event.type === 'tool/result').map(event => event.data.message.toolCallId)).size, 4);
    const transcript = JSON.stringify(persisted.events);
    for (const name of ['anchor_context', 'anchor_observe', 'anchor_assess', 'anchor_submit']) assert.ok(transcript.includes(name));
    const finished = await bridge.execute('analysis_status', {run_id: started.run_id});
    assert.equal(finished.status, 'COMPLETED');
    assert.equal(finished.model_name, 'vision');
    assert.equal(finished.model_profile.endpoint, endpoint);
    assert.equal(finished.model_calls.filter(call => call.operation === 'generate' && call.role === 'vision').length, 1);
    const agentCalls = finished.model_calls.filter(call => call.role === 'agent' && call.operation === 'generate');
    assert.equal(agentCalls.length, 4);
    assert.ok(agentCalls.every(call => call.source === 'native_llm' && call.session_id === anchor.session_id && call.attempt === 1));
    assert.ok(agentCalls.every(call => call.schema_name === null && call.http_status === null && call.response_id === null));
    assert.ok(agentCalls.every(call => call.usage.inputTokens === 1000 && call.usage.outputTokens === 100));
    assert.ok(agentCalls.every(call => call.elapsed_ms >= 0 && call.finished_at && !call.error));
    const callDetail = await bridge.execute('model_call_get', {run_id: started.run_id, call_id: agentCalls[0].call_id});
    const nativeRequest = JSON.parse(callDetail.request_body);
    assert.equal(nativeRequest.model, 'vision');
    assert.equal(nativeRequest.signal, undefined);
    assert.ok(nativeRequest.messages.some(message => message.role === 'user'));
    assert.equal(JSON.parse(callDetail.response_body).usage.inputTokens, 1000);
    assert.equal(callDetail.http_status, null);
    const diagnostics = await bridge.execute('consistency_agent_diagnostics', identity);
    assert.equal(diagnostics.phase_recording, 'COMPLETE');
    assert.ok(diagnostics.phases.some(item => item.phase === 'AGENT_REVIEWING'));
    assert.ok(diagnostics.phases.some(item => item.phase === 'OBSERVING_ANCHOR'));
    assert.ok(diagnostics.phases.every(item => item.duration_seconds !== null && item.duration_seconds >= 0));
    assert.equal(diagnostics.phases.at(-1).phase, 'SUBMITTED');
    assert.equal(diagnostics.phases.at(-1).duration_seconds, 0);
    assert.deepEqual([diagnostics.roles.agent.requests, diagnostics.roles.agent.generation_requests,
      diagnostics.roles.agent.input_tokens, diagnostics.roles.agent.output_tokens, diagnostics.roles.agent.total_tokens],
      [8, 4, 4000, 400, 4400]);
    assert.equal(diagnostics.roles.agent.tokenization_requests, 4);
    assert.deepEqual([diagnostics.roles.vision.requests, diagnostics.roles.vision.tokenization_requests,
      diagnostics.roles.vision.generation_requests, diagnostics.roles.vision.input_tokens], [3, 2, 1, 1000]);
    assert.equal(diagnostics.roles.agent.failed_requests, 0);
    assert.equal(diagnostics.roles.agent.cost, null);
    assert.equal(wires[0].tools.some(tool => tool.function.name === 'shell'), false);
    assert.deepEqual(errors, []);
    fixture.holdPlanner();
    const interrupted = await scheduler.start({...request, submission_id: randomUUID()});
    await held.promise;
    const inFlight = await bridge.execute('consistency_agent_diagnostics', {run_id: interrupted.run_id, anchor_id: anchor.anchor_id});
    assert.equal(inFlight.roles.agent.requests, 2);
    assert.equal(inFlight.roles.agent.tokenization_requests, 1);
    assert.equal(inFlight.roles.agent.in_flight_requests, 1);
    assert.equal(inFlight.roles.agent.failed_requests, 0);
    assert.equal(inFlight.roles.agent.total_tokens, null);
    const cancelled = await scheduler.cancel(interrupted.run_id);
    assert.equal(cancelled.status, 'CANCELLED');
    assert.equal(cancelled.completed, 0);
    const {anchors: [before]} = await bridge.execute('consistency_agent_anchors', {run_id: interrupted.run_id});
    assert.equal(before.result, null);
    assert.equal(before.state, 'CANCELLED');
    const cancelledCalls = cancelled.model_calls.filter(call => call.role === 'agent' && call.operation === 'generate');
    assert.equal(cancelledCalls.length, 1);
    assert.equal(cancelledCalls[0].error.type, 'ABORTED');
    assert.equal(cancelledCalls[0].usage, null);
    const cancelledDiagnostics = await bridge.execute('consistency_agent_diagnostics', {run_id: interrupted.run_id, anchor_id: before.anchor_id});
    assert.equal(cancelledDiagnostics.phases.at(-1).phase, 'CANCELLED');
    assert.equal(cancelledDiagnostics.roles.agent.requests, 2);
    assert.equal(cancelledDiagnostics.roles.agent.tokenization_requests, 1);
    assert.equal(cancelledDiagnostics.roles.agent.failed_requests, 1);
    assert.equal(cancelledDiagnostics.roles.agent.input_tokens, null);
    const frozen = await bridge.execute('consistency_agent_snapshot', {run_id: interrupted.run_id});
    release.resolve();
    await lateResponse.promise;
    await bridge.execute('module_settings_save', {module: 'consistency', expected_revision: 1,
      settings: {model: {provider_id: 'changed', model_id: 'different'}}});
    const resumed = await scheduler.resume(interrupted.run_id);
    assert.equal(resumed.run_id, interrupted.run_id);
    await scheduler.whenIdle();
    const {anchors: [after]} = await bridge.execute('consistency_agent_anchors', {run_id: interrupted.run_id});
    assert.equal(after.session_id, before.session_id);
    assert.equal(after.attempt, before.attempt + 1);
    assert.equal(after.result.overall.text, '多类别');
    assert.deepEqual(await bridge.execute('consistency_agent_snapshot', {run_id: interrupted.run_id}), frozen);
    const resumedStatus = await bridge.execute('analysis_status', {run_id: interrupted.run_id});
    assert.equal(resumedStatus.completed, 1);
    assert.equal(resumedStatus.failed, 0);
    assert.equal(resumedStatus.status, 'COMPLETED');
    const attempts = resumedStatus.model_calls.filter(call => call.role === 'agent' && call.operation === 'generate');
    assert.equal(attempts.length, 5);
    assert.equal(new Set(attempts.map(call => call.call_id)).size, 5);
    assert.deepEqual(attempts.map(call => call.attempt), [1, 2, 2, 2, 2]);
    const resumedDiagnostics = await bridge.execute('consistency_agent_diagnostics', {run_id: resumed.run_id, anchor_id: after.anchor_id});
    assert.deepEqual(resumedDiagnostics.phases.slice(0, cancelledDiagnostics.phases.length), cancelledDiagnostics.phases);
    assert.equal(resumedDiagnostics.roles.agent.requests, 10);
    assert.equal(resumedDiagnostics.roles.agent.tokenization_requests, 5);
    assert.equal(resumedDiagnostics.roles.agent.failed_requests, 1);
    assert.equal(resumedDiagnostics.roles.agent.usage_missing, 1);
    assert.equal(resumedDiagnostics.roles.agent.total_tokens, null);
    assert.deepEqual(errors, []);
  } finally {
    await fixture.close();
  }
});

test('a native Agent resumes its frozen media pages without repeating a successful visual observation', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost({multiCandidate: true, maxCandidatesPerPage: 1});
  const {bridge, scheduler, datasetId, wires} = fixture;
  try {
    fixture.holdPlannerAfterObservation();
    const started = await scheduler.start({submission_id: randomUUID(), dataset_ids: [datasetId], subjects: {kind: 'samples', sample_ids: [datasetId + ':A.png']}});
    await fixture.held.promise;
    const before = await bridge.execute('consistency_agent_detail', {run_id: started.run_id, anchor_id: datasetId + ':A.png'});
    assert.equal(before.visual_plan.pages.length, 2);
    assert.equal(before.observations.length, 1);
    assert.equal(before.result, null);
    await scheduler.cancel(started.run_id);
    fixture.release.resolve();await fixture.lateResponse.promise;
    await scheduler.resume(started.run_id);await scheduler.whenIdle();
    const after = await bridge.execute('consistency_agent_detail', {run_id: started.run_id, anchor_id: datasetId + ':A.png'});
    assert.equal(after.state, 'COMPLETED');
    assert.equal(after.result.overall.text, '多类别');
    assert.deepEqual(after.visual_plan, before.visual_plan);
    assert.equal(after.observations.length, 2);
    assert.equal(after.observations[0].observation_id, before.observations[0].observation_id);
    const notice = wires.filter(body => body.test_role === 'agent').at(-1).messages
      .filter(message => message.role === 'user')
      .map(message => typeof message.content==='string'?message.content:message.content.find(part=>part.type==='text').text)
      .map(text=>JSON.parse(text.split('\n')[0])).findLast(value => value.anchor_id === uuidV5('iad:sample:'+datasetId+':A.png',uuidV5.URL));
    assert.equal(notice.attempt, 2);
    assert.deepEqual(Object.keys(notice).sort(), ['anchor_id', 'attempt']);
    assert.equal(wires.filter(body => body.test_role === 'vision').length, 2);
    assert.deepEqual(after.result.assessments.map(item => [item.candidate_id, item.conclusion]),
      [[datasetId + ':B.png', '多类别'], [datasetId + ':D.png', '一致']]);
    assert.deepEqual(fixture.errors, []);
  } finally {await fixture.close();}
});

test('an indivisible visual evidence unit fails with its actual budget reason before starting an Agent', {timeout: 30000}, async () => {
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

test('visual JSON generation parameters do not constrain the native tool-calling Agent', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost();
  const {bridge, scheduler, datasetId, wires} = fixture;
  try {
    const settings = await bridge.execute('module_settings_get',{module:'consistency'});
    await bridge.execute('module_settings_save',{module:'consistency',expected_revision:settings.revision,
      settings:{vision_limits:{...settings.settings.vision_limits,request_parameters:{response_format:{type:'json_object'},temperature:.1}}}});
    const started = await scheduler.start({submission_id: randomUUID(), dataset_ids: [datasetId], subjects: {kind: 'samples', sample_ids: [datasetId + ':A.png']}});
    await scheduler.whenIdle();
    const status = await bridge.execute('analysis_status', {run_id: started.run_id});
    assert.equal(status.status, 'COMPLETED', JSON.stringify(status.errors));
    const snapshot = await bridge.execute('consistency_agent_snapshot', {run_id: started.run_id});
    assert.equal(snapshot.roles.agent.profile.request_parameters.response_format, undefined);
    assert.equal(snapshot.roles.vision.profile.request_parameters.response_format.type, 'json_object');
    assert.equal(wires.find(body => body.test_role === 'vision').response_format.type, 'json_object');
    assert.equal(wires.filter(body => body.test_role === 'agent').length, 4);
  } finally {await fixture.close();}
});

test('a provider rejection is recorded as a failed native request with unknown complete usage', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost();
  try {
    fixture.rejectPlanner();
    const job = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId],
      subjects: {kind: 'samples', sample_ids: [fixture.datasetId + ':A.png']}});
    await fixture.scheduler.whenIdle();
    const diagnostics = await fixture.bridge.execute('consistency_agent_diagnostics',
      {run_id: job.run_id, anchor_id: fixture.datasetId + ':A.png'});
    assert.equal(diagnostics.state, 'FAILED');
    assert.equal(diagnostics.roles.agent.requests, 2);
    assert.equal(diagnostics.roles.agent.tokenization_requests, 1);
    assert.equal(diagnostics.roles.agent.failed_requests, 1);
    assert.equal(diagnostics.roles.agent.total_tokens, null);
    assert.equal(diagnostics.roles.vision.generation_requests, 0);
    assert.equal(fixture.wires.filter(body => body.test_role === 'agent').length, 1);
    const call = diagnostics.calls.find(call => call.role === 'agent');
    assert.equal(call.source, 'native_llm');
    assert.equal(call.finish_reason, 'error');
    assert.match(call.error.message, /fixture provider rejected/);
    assert.equal(call.usage, null);
    const detail = await fixture.bridge.execute('consistency_agent_detail', {run_id: job.run_id, anchor_id: diagnostics.anchor_id});
    assert.equal(detail.result, null);
  } finally {await fixture.close();}
});

test('native cache accounting preserves raw SDK counters and aggregates complete prompt tokens once', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost({agentUsage: {prompt_tokens: 1000, completion_tokens: 100, total_tokens: 1100,
    prompt_tokens_details: {cached_tokens: 400}}});
  try {
    const job = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId],
      subjects: {kind: 'samples', sample_ids: [fixture.datasetId + ':A.png']}});
    await fixture.scheduler.whenIdle();
    const diagnostics = await fixture.bridge.execute('consistency_agent_diagnostics',
      {run_id: job.run_id, anchor_id: fixture.datasetId + ':A.png'});
    assert.equal(diagnostics.state, 'COMPLETED');
    const calls = diagnostics.calls.filter(call => call.role === 'agent' && call.operation === 'generate');
    assert.equal(calls.length, 4);
    assert.ok(calls.every(call => call.usage.inputTokens === 600 && call.usage.cacheReadTokens === 400));
    assert.equal(diagnostics.roles.agent.input_tokens, 4000);
    assert.equal(diagnostics.roles.agent.output_tokens, 400);
    assert.equal(diagnostics.roles.agent.total_tokens, 4400);
  } finally {await fixture.close();}
});

test('a successful provider response without usage stays unknown despite SDK zero defaults', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost({agentUsage: null});
  try {
    const job = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId],
      subjects: {kind: 'samples', sample_ids: [fixture.datasetId + ':A.png']}});
    await fixture.scheduler.whenIdle();
    const diagnostics = await fixture.bridge.execute('consistency_agent_diagnostics',
      {run_id: job.run_id, anchor_id: fixture.datasetId + ':A.png'});
    assert.equal(diagnostics.state, 'COMPLETED');
    assert.equal(diagnostics.roles.agent.requests, 8);
    assert.equal(diagnostics.roles.agent.tokenization_requests, 4);
    assert.equal(diagnostics.roles.agent.failed_requests, 0);
    assert.equal(diagnostics.roles.agent.usage_missing, 4);
    assert.equal(diagnostics.roles.agent.input_tokens, null);
    assert.equal(diagnostics.roles.agent.total_tokens, null);
    assert.ok(diagnostics.calls.filter(call => call.role === 'agent').every(call => call.usage === null));
  } finally {await fixture.close();}
});

test('combined checks wait for the frozen shared index preparation before native review', {timeout: 30000}, async () => {
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
    assert.equal(fixture.wires.filter(body => body.test_role === 'agent').length, 4);
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

test('anomaly tools isolate task fields while one Session verifies then compares frozen labels', {timeout:30000}, async()=>{
  const fixture=await createConsistencyAgentHost({taskType:'anomaly_detection',multiCandidate:true,withSimilarCandidate:true});
  try {
    const started=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],
      subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A]}});
    await fixture.scheduler.whenIdle();
    const detail=await fixture.bridge.execute('consistency_agent_detail',{run_id:started.run_id,anchor_id:fixture.sampleIds.A});
    assert.equal(detail.state,'COMPLETED',JSON.stringify(detail.errors));
    assert.equal(detail.result.task_type,'anomaly_detection');
    assert.equal(detail.result.overall.text,'类别不一致');
    assert.deepEqual(detail.result.candidate_stats,{retrieved:3,eligible:2,rejected:1,unverified:0,assessed:2,
      consistent:1,discrepancy:1,undetermined:0,failed:0,pending:0});
    const agent=fixture.wires.filter(body=>body.test_role==='agent');
    assert.ok(agent.length>0);
    for(const body of agent) {
      assert.doesNotMatch(JSON.stringify(body.tools),/bbox|矩形|拆分|合并|candidate_annotation_ids|main_annotation_ids/);
      assert.doesNotMatch(JSON.stringify(body.messages),/annotation_ids|矩形|拆分|合并(?:实例|标注|框)|bbox|quality_status|\.png|image_path/);
    }
    const contexts=agent.flatMap(body=>body.messages.filter(message=>message.role==='tool')
      .map(message=>{try{return JSON.parse(message.content);}catch{return {};}}));
    assert.ok(contexts.some(context=>context.phase==='gate'));
    assert.ok(contexts.some(context=>context.phase==='audit'&&context.label_comparisons));
    const vision=fixture.wires.filter(body=>body.test_role==='vision');
    assert.ok(vision.length>0);
    for(const body of vision) {
      assert.doesNotMatch(JSON.stringify(body.messages),/annotations|quality_status|image_label|\.png|image_path/);
      assert.equal(JSON.parse(body.messages.find(message=>message.role==='user').content[1].text).facts,undefined);
    }
    const events=(await fixture.host.read(detail.session_id)).events;
    for(const name of ['anchor_context','anchor_observe','anchor_assess','anchor_submit'])
      assert.ok(JSON.stringify(events).includes(name));
    assert.equal(new Set(detail.candidate_records.map(record=>record.candidate_id)).size,3);
    assert.deepEqual(fixture.errors,[]);
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
    assert.equal(detail.outcome.result,'incomplete');assert.equal(detail.outcome.candidate_stats.failed,1);
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
    const settled=await Promise.race([fixture.scheduler.whenIdle().then(()=>true),new Promise(resolve=>setTimeout(()=>resolve(false),8000))]);
    assert.equal(settled,true,'模型格式错误必须结束执行，不能进入参数纠错循环');
    const detail=await fixture.bridge.execute('consistency_agent_detail',{run_id:started.run_id,anchor_id:fixture.sampleIds.C});
    assert.equal(detail.state,'FAILED');assert.equal(detail.result,null);
    const status=await fixture.bridge.execute('analysis_status',{run_id:started.run_id});
    assert.equal(status.errors[0].code,'EXECUTION_ERROR');
    assert.ok(fixture.wires.filter(body=>body.test_role==='vision').length<=2);
    assert.ok(fixture.wires.filter(body=>body.test_role==='agent').length<=2);
  } finally {await fixture.close();}
});
