import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fork} from 'node:child_process';
import {once} from 'node:events';
import {sessionFormatCatalog} from '@deepseek-ai/dsh-session-format-catalog';

test('a process killed after the real business commit resumes only the missing native trace', {timeout: 30000}, async () => {
  const children = [];
  let root;
  const start = args => {
    const child = fork(new URL('./fixtures/consistency-recovery-child.js', import.meta.url), args,
      {execPath: process.env.IAD_NODE_PATH || process.execPath, stdio: ['ignore', 'pipe', 'pipe', 'ipc']});
    children.push(child);
    let output = '';
    child.stdout.on('data', data => {output += data;});child.stderr.on('data', data => {output += data;});
    return {child, message: new Promise((resolve, reject) => {
      child.once('message', resolve);child.once('error', reject);
      child.once('exit', (code, signal) => reject(new Error(`Recovery child exited ${code}/${signal}: ${output}`)));
    })};
  };
  try {
    const first = start(['commit']);
    const committed = await first.message;root = committed.root;
    assert.equal(committed.detail.state, 'COMPLETED');assert.equal(committed.detail.trace_state, 'OPEN');
    assert.equal(committed.detail.result.reason, 'MODEL_REVIEWED');
    assert.ok(!committed.calls.some(call => call.role === 'agent' && call.operation === 'generate'));
    assert.ok(committed.calls.some(call => call.role === 'vision' && call.operation === 'generate'));
    const exited = once(first.child, 'exit');first.child.kill('SIGKILL');
    assert.deepEqual(await exited, [null, 'SIGKILL']);
    const second = start(['recover', root, committed.run_id, committed.anchor_id]);
    const finished = once(second.child, 'exit');
    const recovered = await second.message;
    assert.deepEqual(await finished, [0, null]);
    assert.equal(recovered.status.status, 'COMPLETED');assert.equal(recovered.status.completed, 1);
    assert.equal(recovered.detail.session_id, committed.detail.session_id);
    assert.equal(recovered.detail.attempt, committed.detail.attempt);
    assert.deepEqual(recovered.detail.result, committed.detail.result);
    assert.equal(recovered.detail.trace_state, 'CLOSED');
    assert.deepEqual(recovered.snapshot, committed.snapshot);
    assert.deepEqual(recovered.status.model_calls.map(call => call.call_id), committed.calls.map(call => call.call_id));
    assert.deepEqual(recovered.errors, []);
    const [header, ...rows] = recovered.jsonl.trim().split('\n').map(JSON.parse);
    const restore = sessionFormatCatalog.createRestore(header, {recovery: 'strict'});
    rows.forEach(row => restore.decodeRow(row));
    const events = restore.finish().events;
    const completed = events.filter(event => event.type === 'iad/consistency' && event.data.summary === '主图终稿已提交');
    assert.equal(completed.length, 1);assert.ok(completed[0].data.record_id);
    assert.equal(events.filter(event => event.type === 'tool/call').length, 0);
  } finally {
    for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    if (root) await fs.rm(root, {recursive: true, force: true});
  }
});
