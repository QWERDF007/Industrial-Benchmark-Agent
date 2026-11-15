import {randomUUID} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile, spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {once} from 'node:events';
import {createInterface} from 'node:readline';
import {setTimeout as delay} from 'node:timers/promises';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';

test('closing a prepared bridge releases its pixel workers and lets the host exit', {timeout: 35000}, async () => {
  const fixtureUrl = new URL('./fixtures/consistency-agent-host.js', import.meta.url).href;
  await promisify(execFile)(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import {randomUUID} from 'node:crypto';
    import {createConsistencyAgentHost} from ${JSON.stringify(fixtureUrl)};
    const fixture = await createConsistencyAgentHost();
    try {
      const job = await fixture.scheduler.start({submission_id: randomUUID(), mode: 'exact', dataset_ids: [fixture.datasetId]});
      await fixture.scheduler.whenIdle();
      const final = await fixture.bridge.execute('analysis_status', {run_id: job.run_id});
      assert.equal(final.status, 'COMPLETED', JSON.stringify(final.errors));
    } finally {await fixture.close();}
  `], {timeout: 30000});
});

test('exact checks prepare imported pixels without an image encoder before reviewing', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost();
  try {
    const job = await fixture.scheduler.start({submission_id: randomUUID(), mode: 'exact', dataset_ids: [fixture.datasetId],
      subjects: {kind: 'samples', sample_ids: [fixture.datasetId + ':A.png']}});
    await fixture.scheduler.whenIdle();
    const final = await fixture.bridge.execute('analysis_status', {run_id: job.run_id});
    assert.equal(final.status, 'COMPLETED', JSON.stringify(final.errors));
    assert.equal(final.completed, 1);
    const children = await Promise.all(final.batch_runs.map(run_id=>fixture.bridge.execute('analysis_node', {run_id})));
    assert.deepEqual(children.map(child=>child.job_type), ['PIXEL_INDEX']);
    assert.ok(fixture.wires.length > 0);
  } finally {
    await fixture.close();
  }
});

test('a failed pixel index finishes the check before encoding or creating review sessions', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost({indexMode: 'configured'});
  try {
    await promisify(execFile)(fixture.bridge.pythonPath, ['-c',
      `import sqlite3,sys
with sqlite3.connect(sys.argv[1]) as db:
 db.execute("CREATE TRIGGER reject_pixel_publication BEFORE INSERT ON sample_pixel_index BEGIN SELECT RAISE(ABORT, 'Pixel index storage failed'); END")`, fixture.database]);
    const job = await fixture.scheduler.start({submission_id: randomUUID(), mode: 'combined', dataset_ids: [fixture.datasetId]});
    await assert.rejects(fixture.scheduler.whenIdle(), /Pixel index storage failed/);
    const final = await fixture.bridge.execute('analysis_status', {run_id: job.run_id});
    assert.equal(final.status, 'FAILED');
    assert.equal(final.failed, final.total_samples);
    assert.equal(final.completed, 0);
    assert.equal(fixture.wires.length, 0);
    const {anchors} = await fixture.bridge.execute('consistency_agent_anchors', {run_id: job.run_id});
    assert.ok(anchors.every(anchor => anchor.state === 'FAILED' && !anchor.session_created));
    const children = await Promise.all(final.batch_runs.map(run_id => fixture.bridge.execute('analysis_node', {run_id})));
    assert.deepEqual(children.map(child => child.job_type), ['PIXEL_INDEX']);
  } finally {
    await fixture.close();
  }
});

test('cancelling during index preparation closes the scheduler without creating review sessions', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost();
  const worker = spawn(fixture.bridge.pythonPath, ['-u', '-c',
    'import sys\nfrom filelock import FileLock\nwith FileLock(sys.argv[1]):\n print("LOCKED",flush=True)\n sys.stdin.buffer.read(1)', fixture.database + '.pixels.lock'],
    {stdio: ['pipe', 'pipe', 'pipe']});
  const exited = once(worker, 'exit');
  const lines = createInterface({input: worker.stdout});
  try {
    const [line] = await once(lines, 'line');assert.equal(line, 'LOCKED');lines.close();
    const job = await fixture.scheduler.start({submission_id: randomUUID(), mode: 'exact', dataset_ids: [fixture.datasetId]});
    while ((await fixture.bridge.execute('analysis_node', {run_id: job.run_id})).phase !== 'PREPARING_SHARED_INDEX') await delay(50);
    const cancelled = await fixture.scheduler.cancel(job.run_id);
    assert.equal(cancelled.status, 'CANCELLED');
    assert.equal(fixture.wires.length, 0);
    await fixture.scheduler.whenIdle();
  } finally {
    worker.stdin.end();await exited;await fixture.close();
  }
});

test('shared preparation can outlive a control RPC deadline without failing the check', {timeout: 30000}, async () => {
  const fixture = await createConsistencyAgentHost({indexMode: 'cached'});
  const execute = fixture.bridge.execute.bind(fixture.bridge);
  fixture.bridge.execute = async (operation, ...args) => {
    const started = performance.now();
    const result = await execute(operation, ...args);
    if (operation === 'consistency_agent_prepare') assert.ok(performance.now() - started < 2000,
      'A preparation control request must return within the deadline while its child job continues');
    return result;
  };
  const settings = await fixture.bridge.execute('feature_settings_view');
  const lock = fixture.database + '.features.' + settings.selection.profile.profile_id + '.lock';
  const worker = spawn(fixture.bridge.pythonPath, ['-u', '-c',
    'import sys\nfrom filelock import FileLock\nwith FileLock(sys.argv[1]):\n print("LOCKED",flush=True)\n sys.stdin.buffer.read(1)', lock],
    {stdio: ['pipe', 'pipe', 'pipe']});
  const exited = once(worker, 'exit');
  const lines = createInterface({input: worker.stdout});
  try {
    const [line] = await once(lines, 'line');assert.equal(line, 'LOCKED');lines.close();
    const job = await fixture.scheduler.start({submission_id: randomUUID(), mode: 'combined', dataset_ids: [fixture.datasetId],
      subjects: {kind: 'samples', sample_ids: [fixture.datasetId + ':A.png']}});
    let waiting;
    for (const deadline = performance.now()+15000; performance.now()<deadline;) {
      waiting = await fixture.bridge.execute('analysis_status', {run_id: job.run_id});
      if (waiting.phase === 'PREPARING_SHARED_INDEX' || waiting.status !== 'RUNNING') break;
      await delay(50);
    }
    assert.equal(waiting.status, 'RUNNING', JSON.stringify(waiting.errors));
    assert.equal(waiting.phase, 'PREPARING_SHARED_INDEX');
    await delay(2300);
    assert.equal((await fixture.bridge.execute('analysis_status', {run_id: job.run_id})).phase, 'PREPARING_SHARED_INDEX');
    assert.equal(fixture.wires.length, 0, 'Review cannot start while the shared feature preparation is blocked');
    const {anchors}=await fixture.bridge.execute('consistency_agent_anchors',{run_id:job.run_id});
    assert.ok(anchors.every(anchor=>!anchor.session_created));
    for(const anchor of anchors)assert.equal(await fixture.host.exists(anchor.session_id),false);
    worker.stdin.end();await exited;
    await fixture.scheduler.whenIdle();
    const final = await fixture.bridge.execute('analysis_status', {run_id: job.run_id});
    assert.equal(final.status, 'COMPLETED', JSON.stringify(final.errors));
    assert.equal(final.completed, 1);assert.equal(final.failed, 0);
    const children = await Promise.all(final.batch_runs.map(run_id=>fixture.bridge.execute('analysis_node', {run_id})));
    assert.deepEqual(children.map(child=>child.job_type), ['PIXEL_INDEX', 'IMAGE_INDEX']);
  } finally {
    if (!worker.stdin.writableEnded) worker.stdin.end();
    await exited;await fixture.close();
  }
});
