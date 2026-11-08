import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';

test('visual tool delivers every candidate fact with the observation before assessment', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost({candidateCount: 6});
  try {
    const anchorId = fixture.datasetId + ':A.png';
    const job = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId],
      mode: 'exact', max_exact_candidates: 6, subjects: {kind: 'samples', sample_ids: [anchorId]}});
    await fixture.scheduler.whenIdle();
    const detail = await fixture.bridge.execute('consistency_agent_detail', {run_id: job.run_id, anchor_id: anchorId});
    assert.equal(detail.state, 'COMPLETED', JSON.stringify(detail.errors));
    const {events} = await fixture.host.read(detail.session_id);
    const reads = events.filter(event => event.type === 'tool/call' && event.data.name === 'anchor_context');
    assert.equal(reads.length, 1, 'Facts delivered with observation must not require per-candidate reads');
    const observe = events.find(event => event.type === 'tool/call' && event.data.name === 'anchor_observe');
    const result = events.find(event => event.type === 'tool/result' && event.data.message.toolCallId === observe.data.callId);
    const delivered = JSON.parse(result.data.message.content[0].text);
    assert.equal(delivered.observations?.length, 6,
      'A successful visual call must deliver the actual facts of all six candidates, not just an observation receipt');
    for (const observation of delivered.observations) {
      assert.equal(observation.result.observations[0].candidate_id, observation.candidate_id);
      assert.equal(Object.keys(observation.facts.sources).length, 2);
    }
    const requests = fixture.wires.filter(body => body.test_role === 'agent');
    for (const event of events.filter(event => event.type === 'assistant/message')) {
      for (const call of event.data.message.content.filter(block => block.type === 'tool-call' && block.name === 'anchor_assess')) {
        const id = JSON.parse(call.arguments).assessment.candidate_id;
        const facts = requests[event.data.step - 1].messages.filter(message => message.role === 'tool' && message.content.startsWith('{'))
          .flatMap(message => JSON.parse(message.content).observations || []);
        assert.ok(facts.some(item => item.candidate_id === id), 'Actual model input must contain the candidate facts before its assessment');
      }
    }
  } finally {await fixture.close();}
});

test('a frozen page cannot reuse its request id for half its candidates and recovers before visual generation', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost({candidateCount: 6, splitFirstPage: true});
  try {
    const anchorId = fixture.datasetId + ':A.png';
    const job = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId], mode: 'exact',
      max_exact_candidates: 6, subjects: {kind: 'samples', sample_ids: [anchorId]}});
    await fixture.scheduler.whenIdle();
    const detail = await fixture.bridge.execute('consistency_agent_detail', {run_id: job.run_id, anchor_id: anchorId});
    assert.equal(detail.state, 'COMPLETED', JSON.stringify(detail.errors));
    assert.equal(fixture.wires.filter(body => body.test_role === 'vision').length, 1);
    assert.equal(detail.observations[0].request.candidate_ids.length, 6);
    const {events} = await fixture.host.read(detail.session_id);
    const errors = events.filter(event => event.type === 'tool/result' && event.data.message.isError);
    assert.equal(errors.length, 1);
    assert.match(JSON.stringify(errors[0]), /冻结页request_id/);
  } finally {await fixture.close();}
});


test('one selected model uses the exact visible prompt for every Agent and visual request', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost();
  try {
    const instruction = '直接比较主图相对参考图的标注。\n自定义要求：类别、数量与位置均如实说明。';
    const anchorId = fixture.datasetId + ':A.png';
    const job = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId],
      mode: 'exact', instruction, subjects: {kind: 'samples', sample_ids: [anchorId]}});
    await fixture.scheduler.whenIdle();
    const snapshot = await fixture.bridge.execute('consistency_agent_snapshot', {run_id: job.run_id});
    assert.equal(snapshot.instruction, instruction);
    assert.equal(Object.hasOwn(snapshot, 'agent_instruction'), false);
    assert.equal(Object.hasOwn(snapshot, 'visual_instruction'), false);
    assert.equal(Object.hasOwn(snapshot, 'agent_model'), false);
    assert.equal(snapshot.roles.agent.profile.model_id, snapshot.roles.vision.profile.model_id);
    for (const wire of fixture.wires) {
      assert.equal(wire.model, snapshot.model.model_id);
      if (wire.test_role === 'agent') {
        assert.deepEqual(wire.messages.filter(message => message.role === 'system').map(message => message.content), [instruction]);
      } else {
        assert.equal(wire.messages[0].content[0].text, instruction);
        const facts = JSON.parse(wire.messages[0].content[1].text).facts;
        for (const source of Object.values(facts.sources)) assert.equal(Object.hasOwn(source, 'policy'), false);
        for (const evidence of facts.evidence) {
          assert.equal(Object.hasOwn(evidence, 'annotation_applicability'), false);
          assert.equal(Object.hasOwn(evidence.verification, 'registration'), false);
        }
      }
    }
    const detail = await fixture.bridge.execute('consistency_agent_detail', {run_id: job.run_id, anchor_id: anchorId});
    assert.equal(detail.state, 'COMPLETED');
    assert.equal(detail.result.overall.text, '多类别');
  } finally {await fixture.close();}
});
