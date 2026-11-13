import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {Context} from '@deepseek-ai/cordis';
import {PythonBridge, findWorkspaceRoot, resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';
import {JobSessionHost} from '../lib/server/sessions/host.js';
import {imageSessionPath} from '../lib/server/sessions/image-path.js';
import {ConsistencyCheckScheduler} from '../lib/server/consistency/scheduler.js';
import {NativeProviders} from '../lib/server/models/providers.js';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';

test('HTTP submission finishes every empty anchor in a real persisted session with no review model configured', {timeout: 30000}, async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-anchor-http-'));
  const workspace = findWorkspaceRoot();
  const database = path.join(root, 'checks.db');
  const config = JSON.parse(execFileSync(resolvePythonPath(), ['-c', `
import json,sys
from pathlib import Path
from PIL import Image
from iad_core.storage.database import Database
from iad_core.dataset.registry import DatasetRegistry,DatasetImport
from iad_core.workbench.module_settings import ModuleSettings
root=Path(sys.argv[1]); images=root/'images';images.mkdir()
for name,color in [('A','red'),('B','green'),('C','blue')]:
    Image.new('RGB',(32,32),color).save(images/(name+'.png'))
db=Database(sys.argv[2])
config=DatasetRegistry(db).import_labelme(DatasetImport(format='labelme',name='规则准入',image_dir=str(images),annotation_dir=str(images)))
ModuleSettings(db).save({'module':'consistency','expected_revision':0,'settings':{'mode':'exact'}})
print(json.dumps({'dataset_id':config.dataset.id}))
`, root, database], {cwd: workspace, env: {...process.env, PYTHONPATH: path.join(workspace, 'python')}, encoding: 'utf8'}));
  const bridge = new PythonBridge({cwd: workspace, dbPath: database});
  const host = await JobSessionHost.open(path.join(root, 'sessions'),
    async session_id => imageSessionPath(path.join(root, 'sessions'), await bridge.execute('consistency_agent_session_location', {session_id})));
  const unexpected = [];
  const errors = [];
  const scheduler = new ConsistencyCheckScheduler(bridge, host, new NativeProviders(() => new Context()),
    async task => {unexpected.push(task);}, error => errors.push(error));
  const removeRouting = bridge.useModelRouting(scheduler);
  const server = http.createServer(createIadHttpHandler(bridge));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/iad`;
  try {
    const request = {analysis_kind: 'consistency', submission_id: randomUUID(), dataset_ids: [config.dataset_id], instruction: '逐图核对'};
    const response = await fetch(base + '/analysis/start', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(request)});
    assert.equal(response.status, 200, await response.clone().text());
    const started = await response.json();
    let status;
    for (let index = 0; index < 200; index++) {
      status = await (await fetch(base + '/analysis/status/' + started.run_id)).json();
      if (!['PENDING', 'RUNNING'].includes(status.status)) break;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    assert.equal(status.status, 'COMPLETED', JSON.stringify(status));
    assert.equal(status.phase,'SUMMARIZING_CONSISTENCY_RESULTS');
    assert.ok(status.phase_timings.at(-1).finished_at);
    assert.equal(status.completed, 3);
    assert.equal(status.total_samples, 3);
    assert.deepEqual(unexpected, []);
    assert.deepEqual(errors, []);
    assert.deepEqual(status.model_calls, []);
    const {anchors} = await bridge.execute('consistency_agent_anchors', {run_id: started.run_id});
    assert.equal(anchors.length, 3);
    const exportResponse = await fetch(base + '/consistency/checks/' + started.run_id + '/export.jsonl');
    assert.equal(exportResponse.status, 200, await exportResponse.clone().text());
    assert.match(exportResponse.headers.get('content-type'), /application\/x-ndjson/);
    const exported = (await exportResponse.text()).trim().split('\n').map(line => JSON.parse(line));
    assert.deepEqual(exported.map(line => line.anchor_id), anchors.map(anchor => anchor.anchor_id));
    assert.equal(exported.every(line => line.reason === 'NO_CANDIDATES' && line.max_exact_candidates === 5), true);
    const reportResponse = await fetch(base + '/consistency/checks/' + started.run_id + '/report');
    assert.equal(reportResponse.status, 200, await reportResponse.clone().text());
    const report = await reportResponse.json();
    assert.equal(report.total, 3);
    assert.equal(report.no_candidates, 3);
    assert.equal(report.original_conflicts, 0);
    for (const anchor of anchors) {
      assert.equal(anchor.state, 'COMPLETED');
      assert.equal(anchor.session_created, true);
      assert.equal(anchor.result.reason, 'NO_CANDIDATES');
      const stored = await host.read(anchor.session_id);
      const notices = stored.events.filter(event => event.type === 'iad/consistency').map(event => event.data.value);
      assert.equal(notices[0].anchor_id, anchor.anchor_id);
      assert.equal(notices.at(-1).result.reason, 'NO_CANDIDATES');
      assert.equal(stored.events.some(event => event.type === 'assistant/attempt'), false);
      const detailResponse = await fetch(new URL(exported.find(line => line.anchor_id === anchor.anchor_id).result_ref, base));
      assert.equal(detailResponse.status, 200, await detailResponse.clone().text());
      const detail = await detailResponse.json();
      assert.equal(detail.result.reason, 'NO_CANDIDATES');
      const configuration = await (await fetch(new URL(detail.snapshot_ref, base))).json();
      assert.equal(configuration.retrieval.max_exact_candidates, 5);
      const nativeResponse = await fetch(new URL(detail.trace_ref, base));
      assert.equal(nativeResponse.status, 200, await nativeResponse.clone().text());
      const native = (await nativeResponse.text()).trim().split('\n').map(line => JSON.parse(line));
      assert.equal(native[0].type, 'session');
      assert.equal(native[0].id, anchor.session_id);
      assert.deepEqual(native.slice(1).map(event => event.type), stored.events.map(event => event.type));
      assert.equal(native.at(-1).data.value.result.reason, 'NO_CANDIDATES');
    }
    const repeated = await (await fetch(base + '/analysis/start', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(request)})).json();
    assert.equal(repeated.run_id, started.run_id);
    const combined = await (await fetch(base + '/analysis/start', {method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({...request, submission_id: randomUUID(), mode: 'combined'})})).json();
    let failed;
    for (let index = 0; index < 200; index++) {
      failed = await (await fetch(base + '/analysis/status/' + combined.run_id)).json();
      if (!['PENDING', 'RUNNING'].includes(failed.status)) break;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    assert.equal(failed.status, 'FAILED');
    assert.equal(failed.completed, 0);
    assert.equal(failed.failed, 3);
    assert.equal(failed.errors.every(error => error.code === 'PROFILE_NOT_CONFIGURED'), true);
    assert.deepEqual(failed.model_calls, []);
    assert.deepEqual(unexpected, []);
    assert.deepEqual(errors, []);
    const failedAnchors = await bridge.execute('consistency_agent_anchors', {run_id: combined.run_id});
    assert.equal(failedAnchors.anchors.every(anchor => anchor.state === 'FAILED' && anchor.result === null), true);
    for (const failedAnchor of failedAnchors.anchors) {
      assert.equal(failedAnchor.session_created,false);
      assert.equal(await host.exists(failedAnchor.session_id),false);
      const detail=await bridge.execute('consistency_agent_detail',{run_id:combined.run_id,anchor_id:failedAnchor.anchor_id});
      assert.equal(detail.errors[0].code,'PROFILE_NOT_CONFIGURED');
      assert.equal(detail.trace_ref,null);
    }
    const writeNotice = host.notice.bind(host);
    let interruptClosing = true;
    host.notice = async (id, notice) => {
      const result = await writeNotice(id, notice);
      if (interruptClosing && notice.value.result?.reason === 'NO_CANDIDATES') {
        interruptClosing = false;
        throw new Error('injected native closing failure after business commit');
      }
      return result;
    };
    const committed = await scheduler.start({...request, submission_id: randomUUID(),
      subjects: {kind: 'samples', sample_ids: [config.dataset_id + ':A.png']}});
    await scheduler.whenIdle();
    const committedStatus = await bridge.execute('analysis_status', {run_id: committed.run_id});
    assert.equal(committedStatus.status, 'COMPLETED');
    assert.equal(committedStatus.completed, 1);
    assert.equal(committedStatus.failed, 0);
    const {anchors: [pendingTrace]} = await bridge.execute('consistency_agent_anchors', {run_id: committed.run_id});
    assert.equal(pendingTrace.result.reason, 'NO_CANDIDATES');
    assert.equal(pendingTrace.trace_state, 'PENDING');
    assert.match(pendingTrace.trace_error, /injected native closing failure/);
    host.notice = writeNotice;
    await scheduler.reconcile(committed.run_id);
    const reconciled = await bridge.execute('consistency_agent_anchor', {run_id: committed.run_id, anchor_id: pendingTrace.anchor_id});
    assert.equal(reconciled.trace_state, 'CLOSED');
    assert.equal(reconciled.trace_error, null);
    const trace = await host.read(reconciled.session_id);
    const submissions = trace.events.filter(event => event.type === 'iad/consistency' && event.data.record_id && event.data.value.result);
    assert.equal(submissions.length, 1, '实际终稿事件已落盘时，对账不应重复写事件或重新审核');
    assert.equal(trace.events.filter(event=>event.data?.record_id===reconciled.session_id+':created').length,1);
    assert.deepEqual(unexpected, []);
    assert.equal((await bridge.execute('analysis_status', {run_id: committed.run_id})).completed, 1);
  } finally {
    await scheduler.dispose();
    await new Promise(resolve => server.close(resolve));
    removeRouting();
    bridge.destroy();
    await host.dispose();
    await fs.rm(root, {recursive: true, force: true});
  }
});

test('HTTP consistency checks require a stable submission id', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost();
  const server = http.createServer(createIadHttpHandler(fixture.bridge));
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/iad/analysis/start`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({analysis_kind: 'consistency', dataset_ids: [fixture.datasetId]})});
    assert.equal(response.status, 422);assert.match(await response.text(), /submission_id/);
    assert.deepEqual(fixture.wires, []);assert.deepEqual(fixture.tokenizations, []);
  } finally {
    await new Promise(resolve => server.close(resolve));await fixture.close();
  }
});

test('HTTP checks compare content only after a 0.943 candidate meets the frozen threshold', {timeout: 45000}, async () => {
  const fixture = await createConsistencyAgentHost({indexMode: 'cached'});
  const server = http.createServer(createIadHttpHandler(fixture.bridge));
  try {
    execFileSync(fixture.bridge.pythonPath, ['-c', `
import sys,numpy as np
from pathlib import Path
from PIL import Image
from iad_core.storage.database import Database
from iad_core.dataset.registry import DatasetRegistry
from iad_core.duplicate.index import PixelIndex
from iad_core.feature.profiles import ImageEncoders
from iad_core.storage.features import FeatureRepository
from iad_core.storage.models import FeatureRecord
root=Path(sys.argv[1]);db=Database(sys.argv[2]);identity=sys.argv[3]
Image.new('RGB',(40,40),(0,0,254)).save(root/'images/B.png')
DatasetRegistry(db).rescan(identity)
profile=ImageEncoders(db).profile()
for name,values in [('A',(1,0)),('B',(.943,np.sqrt(1-.943**2)))]:
    group=PixelIndex(db).get(identity+':'+name+'.png').content_group_id
    vector=np.zeros(profile.dim,dtype=profile.storage_dtype);vector[:2]=values
    FeatureRepository(db).upsert(FeatureRecord(content_group_id=group,profile_id=profile.profile_id,
        dim=profile.dim,dtype=profile.storage_dtype,embedding_blob=vector.tobytes()))
`, fixture.root, fixture.database, fixture.datasetId], {cwd: fixture.bridge.cwd,
      env: {...process.env, PYTHONPATH: path.join(fixture.bridge.cwd, 'python')}, stdio: 'pipe'});
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/iad`;
    const read = async route => {const response = await fetch(base + route);assert.equal(response.status, 200);return response.json();};
    const snapshots = [];
    for (const [mode, minimum, admitted] of [['exact', .95, false], ['combined', .95, false], ['combined', .94, true]]) {
      const response = await fetch(base + '/analysis/start', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({analysis_kind: 'consistency', submission_id: randomUUID(), dataset_ids: [fixture.datasetId],
          mode, min_similarity: minimum})});
      assert.equal(response.status, 200, await response.clone().text());
      const run = await response.json();await fixture.scheduler.whenIdle();
      const status = await read('/analysis/status/' + run.run_id);
      assert.equal(status.status, 'COMPLETED', JSON.stringify(status.errors));assert.equal(status.completed, 2);
      const snapshot = await read('/consistency/checks/' + run.run_id + '/config');
      assert.equal(snapshot.retrieval.min_similarity, mode === 'exact' ? null : minimum);
      snapshots.push({run_id: run.run_id, snapshot});
      const page = await read('/consistency/checks/' + run.run_id + '/anchors');assert.equal(page.total, 2);
      let requests=0;
      for (const row of page.items) {
        const detail = await read(row.result_ref.replace('/api/iad', ''));
        assert.equal(detail.result.reason, admitted ? 'NO_ELIGIBLE_CANDIDATES' : 'NO_CANDIDATES');
        assert.equal(detail.candidates.exact.selected, 0);
        assert.equal(detail.candidates.similar.selected, admitted ? 1 : 0);
        const diagnostics = await read(detail.diagnostics_ref.replace('/api/iad', ''));
        requests+=diagnostics.roles.vision.generation_requests;
        assert.equal(diagnostics.roles.agent.generation_requests, 0);
        if (admitted) assert.ok(detail.candidates.candidates[0].score > .942 && detail.candidates.candidates[0].score < .944);
      }
      assert.equal(requests,admitted?1:0,'A shared comparison has one actual provider request across both anchors');
      if (!admitted) {assert.deepEqual(fixture.wires, []);assert.deepEqual(fixture.tokenizations, []);}
    }
    for (const run of snapshots) assert.deepEqual(await read('/consistency/checks/' + run.run_id + '/config'), run.snapshot);
    assert.equal((await read('/settings/modules/consistency')).settings.min_similarity, .98);
    assert.deepEqual(fixture.errors, []);
  } finally {
    await new Promise(resolve => server.close(resolve));await fixture.close();
  }
});
