import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {startNativeModelHost} from '../browser/native-model-host.js';

test('the production bundle runs a native check from an empty working directory', {timeout: 60000}, async () => {
  const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-consistency-deployment-'));
  const bundlePath = path.join(root, 'bundle'), launchCwd = path.join(root, 'empty');
  let fixture;
  try {
    execFileSync('pnpm', ['--filter', '@industrial-benchmark/iad-harness', '--prod', 'deploy', '--legacy', bundlePath],
      {cwd: workspace, stdio: 'pipe'});
    await fs.mkdir(launchCwd);
    assert.deepEqual(await fs.readdir(launchCwd), []);
    const installedHost = await fs.realpath(path.join(bundlePath, 'node_modules/@deepseek-ai/dsh'));
    assert.ok(installedHost.startsWith(bundlePath + path.sep));
    fixture = await startNativeModelHost({bundlePath, launchCwd,
      plugins: [fileURLToPath(new URL('./fixtures/session-controller-probe.js', import.meta.url))],
      profilePatch: "- id: session-query-sqlite\n  config:\n    path: ':memory:'\n    openAt: first-search\n"});
    assert.equal(await fs.realpath(`/proc/${fixture.host.pid}/cwd`), launchCwd);
    const deadline = Date.now() + 30000;
    while (!fixture.readLog().includes('dsh web: http') && fixture.host.exitCode === null && Date.now() < deadline) await delay(100);
    const login = fixture.readLog().match(/dsh web: (http[^\s]+)/)?.[1];
    assert.ok(login, fixture.readLog());
    const base = new URL(login).origin + '/api/iad';
    const sessionCall = async (method, request) => {
      const response = await fetch(new URL(login).origin + '/__test/sessions/' + method,
        {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(request)});
      assert.equal(response.status, 200, (await response.clone().text()) || fixture.readLog().replace(/([?&]token=)[^&\s]+/g, '$1[redacted]'));
      return response.json();
    };
    const ordinary = await sessionCall('create', {cwd: launchCwd});
    await sessionCall('rename', {sessionId: ordinary.sessionId, title: '普通会话持久化核对'});
    assert.deepEqual((await sessionCall('list', {})).items.map(item => item.sessionId), [ordinary.sessionId]);
    const post = async (route, body) => {
      const response = await fetch(base + route, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
      assert.equal(response.status, 200, await response.clone().text());
      return response.json();
    };
    const dataset = await post('/datasets/import', {format: 'labelme', name: '隔离部署检查',
      image_dir: fixture.root + '/images', annotation_dir: fixture.root + '/labels'});
    let job = await post('/analysis/start', {submission_id: randomUUID(), analysis_kind: 'consistency', dataset_ids: [dataset.dataset_id], mode: 'exact'});
    while (['PENDING', 'RUNNING'].includes(job.status) && Date.now() < deadline) {
      await delay(50);
      job = await (await fetch(base + '/analysis/status/' + job.run_id)).json();
    }
    assert.equal(job.status, 'COMPLETED', JSON.stringify(job));
    assert.equal(job.completed, dataset.total_samples);
    assert.deepEqual(job.model_calls, []);
    const results = await (await fetch(base + '/consistency/checks/' + job.run_id + '/anchors')).json();
    assert.equal(results.items.length, dataset.total_samples);
    assert.ok(results.items.every(item => item.session_id && item.reason === 'NO_CANDIDATES'));
    const detail = await (await fetch(new URL(login).origin + results.items[0].result_ref)).json();
    assert.equal(detail.session_created, true);
    const trace = await fetch(new URL(login).origin + detail.trace_ref);
    assert.equal(trace.status, 200);
    const originalTrace = await trace.text();
    assert.ok(originalTrace.includes(detail.session_id));
    const diagnostics = await (await fetch(new URL(login).origin + detail.diagnostics_ref)).json();
    assert.equal(diagnostics.phase_recording, 'COMPLETE');
    assert.equal(diagnostics.phases.at(-1).phase, 'SUBMITTED');
    assert.deepEqual((await sessionCall('list', {})).items.map(item => item.sessionId), [ordinary.sessionId]);
    assert.equal(fixture.calls.length, 0);
    await sessionCall('prompt', {sessionId: ordinary.sessionId, requestId: randomUUID(), mode: 'queue',
      content: [{type: 'text', text: '普通会话持久化核对 ' + results.items[0].anchor_id}]});
    let ordinaryState;
    do {
      await delay(50);
      ordinaryState = await sessionCall('inspect', ordinary.sessionId);
    } while (!JSON.stringify(ordinaryState).includes('普通会话已保存') && Date.now() < deadline);
    assert.ok(JSON.stringify(ordinaryState).includes('普通会话已保存'));
    const ordinaryCalls = fixture.calls.length;
    assert.ok(ordinaryCalls > 0);
    assert.deepEqual((await sessionCall('search', {query: results.items[0].anchor_id})).items.map(item => item.sessionId), [ordinary.sessionId]);
    const originalHost = fixture.host;
    await fixture.restart();
    assert.notEqual(fixture.host.pid, originalHost.pid);
    assert.ok(originalHost.exitCode !== null || originalHost.signalCode !== null);
    const restoredDeadline = Date.now() + 30000;
    while (!fixture.readLog().includes('dsh web: http') && fixture.host.exitCode === null && Date.now() < restoredDeadline) await delay(100);
    assert.ok(fixture.readLog().includes('dsh web: http'), fixture.readLog());
    assert.deepEqual((await sessionCall('list', {})).items.map(item => item.sessionId), [ordinary.sessionId]);
    assert.deepEqual((await sessionCall('search', {query: results.items[0].anchor_id})).items.map(item => item.sessionId), [ordinary.sessionId]);
    assert.ok(JSON.stringify(await sessionCall('inspect', ordinary.sessionId)).includes('普通会话持久化核对'));
    const internal = await fetch(new URL(login).origin + '/__test/sessions/inspect',
      {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(detail.session_id)});
    assert.equal(internal.status, 500);
    assert.match((await internal.json()).error, /not found/);
    const reopenedTrace = await fetch(new URL(login).origin + detail.trace_ref);
    assert.equal(reopenedTrace.status, 200);
    assert.equal(await reopenedTrace.text(), originalTrace);
    assert.deepEqual(await (await fetch(new URL(login).origin + detail.diagnostics_ref)).json(), diagnostics);
    assert.equal(fixture.calls.length, ordinaryCalls);
    assert.deepEqual(await fs.readdir(launchCwd), []);
  } finally {
    await fixture?.close();
    await fs.rm(root, {recursive: true, force: true});
  }
});
