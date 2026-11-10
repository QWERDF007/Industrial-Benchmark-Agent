import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {Context} from '@deepseek-ai/cordis';
import {ToolRuntime} from '@deepseek-ai/dsh-tools';
import {SystemPrompt} from '@deepseek-ai/dsh-system-prompt';
import {createConsistencyTools} from '../lib/server/consistency/index.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';

test('native tools share the root check lifecycle and retired writers are unavailable', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost();
  const ctx = new Context();
  const fork = await ctx.plugin({apply: scope => {
    new SystemPrompt(scope, {includeHarnessIdentity: false, includeRuntimeContext: false});
    new ToolRuntime(scope);
    for (const tool of createConsistencyTools(fixture.bridge, scope)) scope.tools.register(tool);
  }});
  const server = http.createServer(createIadHttpHandler(fixture.bridge));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    assert.equal(ctx.tools.get('consistency_group_analyze'), undefined);
    for (const name of ['consistency_check_start', 'consistency_check_status', 'consistency_check_cancel', 'consistency_check_retry'])
      assert.ok(ctx.tools.get(name), name);
    const missingSubmission = await ctx.tools.execute({name: 'consistency_check_start',
      arguments: {dataset_ids: [fixture.datasetId], mode: 'exact'}, callId: randomUUID(), signal: new AbortController().signal});
    assert.equal(missingSubmission.isError, true);
    assert.match(JSON.stringify(missingSubmission), /submission_id/);
    const execute = async (name, args) => {
      const reply = await ctx.tools.execute({name, arguments: args, callId: randomUUID(), signal: new AbortController().signal});
      assert.equal(reply.isError, false, JSON.stringify(reply));
      return JSON.parse(reply.content.find(item => item.type === 'text').text);
    };
    const request = {dataset_ids: [fixture.datasetId], mode: 'exact', submission_id: randomUUID(),
      subjects: {kind: 'samples', sample_ids: [fixture.datasetId + ':A.png']}};
    const started = await execute('consistency_check_start', request);
    await fixture.scheduler.whenIdle();
    const before = fixture.wires.length;
    assert.equal((await execute('consistency_check_status', {run_id: started.run_id})).status, 'COMPLETED');
    assert.equal((await execute('consistency_check_start', request)).run_id, started.run_id);
    assert.equal((await execute('consistency_check_retry', {run_id: started.run_id})).run_id, started.run_id);
    await fixture.scheduler.whenIdle();
    assert.equal(fixture.wires.length, before);
    const {anchors} = await fixture.bridge.execute('consistency_agent_anchors', {run_id: started.run_id});
    assert.equal(anchors.length, 1);
    assert.equal(anchors[0].result.reason, 'MODEL_REVIEWED');
    const page = await execute('consistency_check_results', {run_id: started.run_id, page: 1, page_size: 18});
    assert.equal(page.total, 1);
    const detail = await execute('consistency_check_result', {run_id: started.run_id, anchor_id: anchors[0].anchor_id});
    assert.equal(detail.result.reason, 'MODEL_REVIEWED');
    assert.equal(fixture.wires.length, before);
    const base = `http://127.0.0.1:${server.address().port}/api/iad/consistency`;
    for (const path of ['/gallery/analyze', '/model-batches/start', '/model-batches/old/retry']) {
      const response = await fetch(base + path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{}'});
      assert.equal(response.status, 404, path);
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    await fork.dispose();
    await fixture.close();
  }
});
