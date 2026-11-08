import {randomUUID} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';

test('a larger provider window cannot bypass the frozen native Agent context reserve', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost({agentServerContext: 262144,
    agentTokenize: async () => ({count: 42370, max_model_len: 262144})});
  try {
    const anchorId = fixture.datasetId + ':A.png';
    const started = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId],
      subjects: {kind: 'samples', sample_ids: [anchorId]}});
    await fixture.scheduler.whenIdle();
    const detail = await fixture.bridge.execute('consistency_agent_detail', {run_id: started.run_id, anchor_id: anchorId});
    assert.equal(fixture.wires.filter(body => body.model === 'planner').length, 0,
      'Over-budget SDK requests must be rejected before reaching provider generation');
    assert.equal(detail.state, 'FAILED');assert.equal(detail.result, null);
    assert.match(detail.errors[0].message, /42370.*32768.*4096/);
  } finally {await fixture.close();}
});

test('native admission counts the rendered tools and messages and preserves provider generation', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost();
  try {
    const anchorId = fixture.datasetId + ':A.png';
    const started = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId],
      subjects: {kind: 'samples', sample_ids: [anchorId]}});
    await fixture.scheduler.whenIdle();
    const detail = await fixture.bridge.execute('consistency_agent_detail', {run_id: started.run_id, anchor_id: anchorId});
    assert.equal(detail.state, 'COMPLETED');
    const calls = fixture.wires.filter(body => body.model === 'planner');
    const measured = fixture.tokenizations.filter(body => body.model === 'planner');
    assert.equal(measured.length, calls.length);assert.equal(calls.length, 4);
    calls.forEach((body, index) => {
      assert.deepEqual(measured[index].messages, body.messages);
      assert.deepEqual(measured[index].tools, body.tools);
      assert.ok(body.tools.some(tool => tool.function.name === 'anchor_assess'));
      assert.equal(body.max_completion_tokens ?? body.max_tokens, 4096);
    });
    const status = await fixture.bridge.execute('analysis_status', {run_id: started.run_id});
    const counters = status.model_calls.filter(call => call.role === 'agent' && call.operation === 'tokenize');
    assert.equal(counters.length, 4);
    assert.ok(counters.every(call => call.http_status === 200));
  } finally {await fixture.close();}
});

test('cancelling a pending native token count prevents its later response from dispatching generation', {timeout: 30000}, async () => {
  const entered = Promise.withResolvers(), release = Promise.withResolvers();
  const fixture = await createConsistencyAgentHost({agentTokenize: async () => {
    entered.resolve();await release.promise;return {count: 1000, max_model_len: 32768};
  }});
  try {
    const anchorId = fixture.datasetId + ':A.png';
    const started = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId],
      subjects: {kind: 'samples', sample_ids: [anchorId]}});
    await entered.promise;
    const cancelled = await fixture.scheduler.cancel(started.run_id);
    assert.equal(cancelled.status, 'CANCELLED');
    release.resolve();await fixture.scheduler.whenIdle();
    const detail = await fixture.bridge.execute('consistency_agent_detail', {run_id: started.run_id, anchor_id: anchorId});
    assert.equal(detail.state, 'CANCELLED');assert.equal(detail.result, null);
    assert.equal(fixture.wires.filter(body => body.model === 'planner').length, 0);
  } finally {release.resolve();await fixture.close();}
});

test('pending page facts are assessed before another page expands the native context', {timeout: 90000}, async () => {
  const fixture = await createConsistencyAgentHost({candidateCount: 30, maxCandidatesPerPage: 5, observeAllPages: true,
    agentServerContext: 262144, agentTokenize: async body => {
      const detailed = body.messages.filter(item => item.role === 'tool' && item.content.startsWith('{')).flatMap(item => {
        const value = JSON.parse(item.content);
        return value.observation_id && value.facts ? [value] : value.observations || [];
      });
      return {count: detailed.length > 5 ? 41056 : 1000, max_model_len: 262144};
    }});
  try {
    const anchorId = fixture.datasetId + ':A.png';
    const started = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId], mode: 'exact', max_exact_candidates: 30,
      subjects: {kind: 'samples', sample_ids: [anchorId]}});
    await fixture.scheduler.whenIdle();
    const detail = await fixture.bridge.execute('consistency_agent_detail', {run_id: started.run_id, anchor_id: anchorId});
    assert.equal(detail.state, 'COMPLETED', JSON.stringify(detail.errors));
    assert.equal(detail.result.assessments.length, 30);
    assert.ok(detail.visual_plan.pages.length > 1);
    assert.equal(detail.observations.length, detail.visual_plan.pages.length);
    assert.equal(fixture.wires.filter(body => body.model === 'vision').length, detail.visual_plan.pages.length);
    assert.ok(detail.result.assessments.every(item => item.conclusion === '多类别'));
  } finally {await fixture.close();}
});
