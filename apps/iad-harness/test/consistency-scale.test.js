import {randomUUID} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';

test('a native Agent covers thirty paged candidates and resumes without repeating saved observations', {timeout: 90000}, async () => {
  const agentTokenize = process.env.IAD_CONSISTENCY_TOKENIZE_MODEL ? async body => {
    const endpoint = process.env.LIVE_VLM_ENDPOINT.replace(/\/$/, '').replace(/\/chat\/completions$/, '').replace(/\/v1$/, '') + '/tokenize';
    const response = await fetch(endpoint, {method: 'POST', headers: {'Content-Type': 'application/json',
      Authorization: 'Bearer ' + process.env.LIVE_VLM_KEY}, body: JSON.stringify({...body,
        model: process.env.IAD_CONSISTENCY_TOKENIZE_MODEL, add_generation_prompt: true})});
    assert.equal(response.status, 200);
    return response.json();
  } : undefined;
  const fixture = await createConsistencyAgentHost({candidateCount: 30, maxCandidatesPerPage: 3, agentTokenize});
  const {bridge, scheduler, datasetId, wires} = fixture;
  try {
    fixture.holdPlannerAfterObservation(3, datasetId + ':R29.png');
    const started = await scheduler.start({submission_id: randomUUID(), dataset_ids: [datasetId], mode: 'exact', max_exact_candidates: 30,
      subjects: {kind: 'samples', sample_ids: [datasetId + ':A.png', datasetId + ':R29.png']}});
    const progress = await Promise.race([fixture.held.promise.then(() => 'paused'), scheduler.whenIdle().then(() => 'finished')]);
    assert.equal(progress, 'paused', JSON.stringify((await bridge.execute('analysis_status', {run_id: started.run_id})).errors));
    const identity = {run_id: started.run_id, anchor_id: datasetId + ':R29.png'};
    const before = await bridge.execute('consistency_agent_detail', identity);
    assert.equal(before.candidates.candidates.length, 30);
    assert.equal(before.observations.length, 3);
    assert.equal(before.result, null);
    assert.ok(before.assessments.length > 0);
    assert.ok(before.visual_plan.pages.length > 1);
    assert.ok(before.visual_plan.pages.every(page => page.candidate_ids.length <= 3));
    await scheduler.cancel(started.run_id);
    fixture.release.resolve();await fixture.lateResponse.promise;
    const foreign = await bridge.execute('consistency_agent_detail', {run_id: started.run_id, anchor_id: datasetId + ':A.png'});
    assert.equal(foreign.state, 'COMPLETED');
    assert.notEqual(foreign.session_id, before.session_id);
    const foreignObservation = foreign.observations.find(item => item.request.candidate_ids.includes(identity.anchor_id));
    assert.ok(foreignObservation);
    const sharedCandidate = foreignObservation.request.candidate_ids.find(candidate => candidate !== identity.anchor_id);
    assert.ok(sharedCandidate);
    const foreignCalls = wires.length;
    fixture.queueSubmissionFaults([{kind: 'duplicate'}, {kind: 'omit'}, {kind: 'foreign-reference'},
      {kind: 'foreign-observation', candidate_id: sharedCandidate, observation_id: foreignObservation.observation_id}]);
    await scheduler.resume(started.run_id);await scheduler.whenIdle();
    const after = await bridge.execute('consistency_agent_detail', identity);
    const expected = [datasetId + ':A.png', ...Array.from({length: 29}, (_, index) => datasetId + ':R' + String(index).padStart(2, '0') + '.png')];
    assert.equal(after.state, 'COMPLETED', JSON.stringify({errors: after.errors, runtime: fixture.errors.map(String)}));
    assert.equal(after.session_id, before.session_id);
    assert.equal(after.attempt, 2);
    assert.deepEqual(after.visual_plan, before.visual_plan);
    assert.deepEqual(after.observations.slice(0, 3), before.observations);
    assert.deepEqual(after.assessments.slice(0, before.assessments.length), before.assessments);
    assert.deepEqual(after.result.assessments.map(item => item.candidate_id).sort(), expected);
    assert.ok(after.result.assessments.every(item => item.conclusion === (item.candidate_id.endsWith(':A.png') ? '少类别' : '一致')));
    const transcript = await fixture.host.read(after.session_id);
    const calls = new Map(transcript.events.filter(event => event.type === 'tool/call').map(event => [event.data.callId, event.data.name]));
    const rejected = transcript.events.filter(event => event.type === 'tool/result' && event.data.message.isError
      && ['anchor_submit', 'anchor_assess'].includes(calls.get(event.data.message.toolCallId)));
    assert.equal(rejected.length, 4);
    assert.ok(transcript.events.some(event => event.type === 'compaction/prune'));
    if (agentTokenize) assert.ok(transcript.events.some(event => event.type === 'compaction/summary'));
    assert.equal(after.assessments.length, 30);
    assert.ok(rejected.every(event => event.data.message.content.some(block => block.type === 'text' && block.text.startsWith('Error:'))));
    assert.ok(rejected.at(-1).data.message.content.some(block => block.type === 'text' && block.text.includes('不属于本场')));
    assert.ok(wires.slice(foreignCalls).filter(body => body.model === 'vision').every(body =>
      JSON.parse(body.messages[0].content[0].text.split('冻结视觉输入：')[1].split('\n')[0]).anchor.sample_id === identity.anchor_id));
    const generated = wires.filter(body => body.model === 'vision' &&
      JSON.parse(body.messages[0].content[0].text.split('冻结视觉输入：')[1].split('\n')[0]).anchor.sample_id === identity.anchor_id);
    assert.equal(generated.length, after.visual_plan.pages.length);
    const seen = generated.flatMap(body => Object.keys(JSON.parse(body.messages[0].content[0].text.split('冻结视觉输入：')[1].split('\n')[0]).candidates));
    assert.equal(seen.length, 30);
    assert.deepEqual([...new Set(seen)].sort(), expected);
    const status = await bridge.execute('analysis_status', {run_id: started.run_id});
    assert.equal(status.completed, 2);
    assert.equal(status.failed, 0);
    const count = wires.length;
    await scheduler.resume(started.run_id);await scheduler.whenIdle();
    assert.equal(wires.length, count);
    assert.deepEqual(fixture.errors, []);
    if (process.env.IAD_CONSISTENCY_EVIDENCE_DIR) {
      const directory = process.env.IAD_CONSISTENCY_EVIDENCE_DIR;
      await fs.mkdir(directory, {recursive: true});
      const requests = fixture.agentRequests(identity.anchor_id);
      const peak = requests.reduce((largest, body) => Buffer.byteLength(JSON.stringify(body)) > Buffer.byteLength(JSON.stringify(largest)) ? body : largest);
      const snapshot = await bridge.execute('consistency_agent_snapshot', {run_id: started.run_id});
      await fs.writeFile(path.join(directory, 'peak-agent-request.json'), JSON.stringify(peak));
      await fs.writeFile(path.join(directory, 'agent-requests.jsonl'), requests.map(body => JSON.stringify(body)).join('\n') + '\n');
      await fs.writeFile(path.join(directory, 'tool-calls.jsonl'), transcript.events.filter(event => event.type === 'tool/call')
        .map(event => JSON.stringify({name: event.data.name, arguments: event.data.arguments})).join('\n') + '\n');
      await fs.writeFile(path.join(directory, 'final-submission.json'), transcript.events.filter(event =>
        event.type === 'tool/call' && event.data.name === 'anchor_submit').at(-1).data.arguments);
      await fs.writeFile(path.join(directory, 'summary.json'), JSON.stringify({provider_kind: 'simulated',
        token_counting: agentTokenize ? 'provider-tokenizer' : 'simulated', anchors: 2, candidates: 30, pages: generated.length,
        agent_requests: requests.length, peak_agent_request_bytes: Buffer.byteLength(JSON.stringify(peak)),
        agent_context_tokens: snapshot.roles.agent.profile.context_tokens, agent_output_tokens: snapshot.roles.agent.profile.max_output_tokens,
        rejected_submissions: rejected.length, session_id: after.session_id, job_id: started.run_id}));
    }
  } finally {await fixture.close();}
});
