import {randomUUID} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {startNativeModelHost} from '../browser/native-model-host.js';

test('the assembled native host admits exact zero-candidate checks without model configuration', {timeout: 60000}, async () => {
  const fixture = await startNativeModelHost();
  try {
    const deadline = Date.now() + 30000;
    while (!fixture.readLog().match(/dsh web: (http[^\s]+)/) && fixture.host.exitCode === null && Date.now() < deadline) await delay(100);
    const login = fixture.readLog().match(/dsh web: (http[^\s]+)/)?.[1];
    assert.ok(login, fixture.readLog());
    const base = new URL(login).origin + '/api/iad';
    const post = async (route, body) => {
      const response = await fetch(base + route, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
      assert.equal(response.status, 200, await response.clone().text());
      return response.json();
    };
    const dataset = await post('/datasets/import', {format: 'labelme', name: '原生入口零候选',
      image_dir: fixture.root + '/images', annotation_dir: fixture.root + '/labels'});
    const started = await post('/analysis/start', {submission_id: randomUUID(), analysis_kind: 'consistency', dataset_ids: [dataset.dataset_id], mode: 'exact'});
    let status;
    for (let index = 0; index < 200; index++) {
      status = await (await fetch(base + '/analysis/status/' + started.run_id)).json();
      if (!['PENDING', 'RUNNING'].includes(status.status)) break;
      await delay(25);
    }
    assert.equal(status.status, 'COMPLETED', JSON.stringify(status));
    assert.equal(status.completed, dataset.total_samples);
    assert.equal(status.failed, 0);
    assert.deepEqual(status.model_calls, []);
    const results = await (await fetch(base + '/consistency/checks/' + started.run_id + '/anchors')).json();
    const detail = await (await fetch(new URL(login).origin + results.items[0].result_ref)).json();
    const diagnosticsResponse = await fetch(new URL(login).origin + detail.diagnostics_ref);
    assert.equal(diagnosticsResponse.status, 200);
    const diagnostics = await diagnosticsResponse.json();
    assert.equal(diagnostics.job_id, started.run_id);
    assert.equal(diagnostics.anchor_id, detail.anchor_id);
    assert.equal(diagnostics.session_id, detail.session_id);
    assert.equal(diagnostics.roles.agent.requests, 0);
    assert.equal(diagnostics.roles.vision.requests, 0);
    assert.deepEqual(diagnostics.calls, []);
    const node = await (await fetch(base + '/analysis/node/' + started.run_id)).json();
    assert.equal(node.request.consistency_check.retrieval.max_exact_candidates, 5);
    assert.equal(node.request.consistency_check.roles.agent.profile, null);
    assert.equal(node.request.consistency_check.roles.vision.profile, null);
    assert.equal(fixture.calls.length, 0, '实际提供商未收到目录探测、tokenize 或生成请求');
    const settings = await (await fetch(base + '/models')).json();
    await post('/models', {expected_revision: settings.revision, selection: {provider_id: 'first-service', model_id: 'first-model', limits: {capacity_mode: 'vllm_tokenize'}}});
    await post('/settings/modules/consistency', {expected_revision: 0, settings: {mode: 'exact',
      model: {provider_id: 'second-service', model_id: 'second-model'}}});
    const configured = await post('/analysis/start', {submission_id: randomUUID(), analysis_kind: 'consistency', dataset_ids: [dataset.dataset_id], mode: 'exact'});
    const frozen = await (await fetch(base + '/consistency/checks/' + configured.run_id + '/config')).json();
    assert.ok(frozen.roles.agent.profile, JSON.stringify(frozen.roles.agent));
    assert.ok(frozen.roles.vision.profile, JSON.stringify(frozen.roles.vision));
    assert.equal(frozen.roles.agent.profile.model_id, 'second-model');
    assert.equal(frozen.roles.vision.profile.model_id, 'second-model');
    assert.equal(fixture.calls.length, 0);
  } finally {
    await fixture.close();
  }
});
