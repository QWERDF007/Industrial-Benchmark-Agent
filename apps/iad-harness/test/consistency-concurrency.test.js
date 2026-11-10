import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';

for (const concurrency of [1, 2]) test(`one check respects its frozen ${concurrency} concurrent main images`, {timeout: 30000}, async () => {
  const entered = Promise.withResolvers(), release = Promise.withResolvers();
  const started = new Set();
  const fixture = await createConsistencyAgentHost({candidateCount: 2, onGeneration: async body => {
    if (body.test_role !== 'agent') return;
    const user = body.messages.find(message => message.role === 'user');
    const text = typeof user.content === 'string' ? user.content : user.content.find(part => part.type === 'text').text;
    const {anchor_id} = JSON.parse(text.split('\n')[0]);
    if (started.has(anchor_id)) return;
    started.add(anchor_id);
    if (started.size === concurrency) entered.resolve();
    await release.promise;
  }});
  try {
    await fixture.bridge.execute('module_settings_save', {module: 'consistency', expected_revision: 1, settings: {concurrency}});
    const job = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId], mode: 'exact'});
    await Promise.race([entered.promise, delay(3000).then(() => {throw new Error(`Expected ${concurrency} main images to enter model generation; got ${started.size}`);})]);
    const snapshot = await fixture.bridge.execute('consistency_agent_snapshot', {run_id: job.run_id});
    assert.equal(snapshot.concurrency, concurrency);
    await fixture.bridge.execute('module_settings_save', {module: 'consistency', expected_revision: 2, settings: {concurrency: 3}});
    assert.equal(started.size, concurrency);
    assert.equal((await fixture.bridge.execute('analysis_status', {run_id: job.run_id})).completed, 0);
    release.resolve();
    await fixture.scheduler.whenIdle();
    const status = await fixture.bridge.execute('analysis_status', {run_id: job.run_id});
    assert.equal(status.status, 'COMPLETED', JSON.stringify(status.errors));
    assert.equal(status.completed, 3);
    assert.equal(started.size, 3);
    assert.deepEqual(await fixture.bridge.execute('consistency_agent_snapshot', {run_id: job.run_id}), snapshot);
    for (const call of status.model_calls.filter(call => call.role === 'vision')) {
      const detail = await fixture.bridge.execute('model_call_get', {run_id: job.run_id, call_id: call.call_id});
      const request = JSON.parse(detail.request_body);
      const facts = JSON.parse(request.messages.find(message => message.role === 'user').content[1].text).facts;
      assert.equal(call.sample_id, facts.anchor.sample_id, 'concurrent visual calls must belong to their actual main image');
    }
    assert.deepEqual(fixture.errors, []);
  } finally {release.resolve();await fixture.close();}
});

test('cancel drains active images without dispatching queued images and resume preserves the frozen limit', {timeout: 30000}, async () => {
  const entered = Promise.withResolvers(), release = Promise.withResolvers();
  const started = new Set();
  const fixture = await createConsistencyAgentHost({candidateCount: 2, onGeneration: async body => {
    if (body.test_role !== 'agent') return;
    const user = body.messages.find(message => message.role === 'user');
    const text = typeof user.content === 'string' ? user.content : user.content.find(part => part.type === 'text').text;
    started.add(JSON.parse(text.split('\n')[0]).anchor_id);
    if (started.size === 2) entered.resolve();
    await release.promise;
  }});
  try {
    await fixture.bridge.execute('module_settings_save', {module: 'consistency', expected_revision: 1, settings: {concurrency: 2}});
    const job = await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId], mode: 'exact'});
    await Promise.race([entered.promise, delay(3000).then(() => {throw new Error('Both active main images must start');})]);
    const before = await fixture.bridge.execute('consistency_agent_anchors', {run_id: job.run_id});
    assert.equal((await fixture.scheduler.cancel(job.run_id)).status, 'CANCELLED');
    assert.equal(started.size, 2);
    assert.equal((await fixture.bridge.execute('analysis_status', {run_id: job.run_id})).completed, 0);
    release.resolve();
    await fixture.bridge.execute('module_settings_save', {module: 'consistency', expected_revision: 2, settings: {concurrency: 3}});
    await fixture.scheduler.resume(job.run_id);
    await fixture.scheduler.whenIdle();
    const after = await fixture.bridge.execute('consistency_agent_anchors', {run_id: job.run_id});
    assert.deepEqual(after.anchors.map(anchor => anchor.session_id), before.anchors.map(anchor => anchor.session_id));
    assert.equal((await fixture.bridge.execute('consistency_agent_snapshot', {run_id: job.run_id})).concurrency, 2);
    assert.equal((await fixture.bridge.execute('analysis_status', {run_id: job.run_id})).status, 'COMPLETED');
    assert.deepEqual(fixture.errors, []);
  } finally {release.resolve();await fixture.close();}
});
