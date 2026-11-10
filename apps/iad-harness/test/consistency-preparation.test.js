import {randomUUID} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createInterface} from 'node:readline';
import {setTimeout as delay} from 'node:timers/promises';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';

test('shared preparation can outlive a control RPC deadline without failing the native check', {timeout: 30000}, async () => {
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
    await delay(2300);
    const waiting = await fixture.bridge.execute('analysis_status', {run_id: job.run_id});
    assert.equal(waiting.status, 'RUNNING', JSON.stringify(waiting.errors));
    assert.equal(waiting.phase, 'PREPARING_SHARED_INDEX');
    assert.equal(fixture.wires.length, 0, 'Review cannot start while the shared feature preparation is blocked');
    worker.stdin.end();await exited;
    await fixture.scheduler.whenIdle();
    const final = await fixture.bridge.execute('analysis_status', {run_id: job.run_id});
    assert.equal(final.status, 'COMPLETED', JSON.stringify(final.errors));
    assert.equal(final.completed, 1);assert.equal(final.failed, 0);
    assert.equal(final.batch_runs.length, 1);
  } finally {
    if (!worker.stdin.writableEnded) worker.stdin.end();
    await exited;await fixture.close();
  }
});
