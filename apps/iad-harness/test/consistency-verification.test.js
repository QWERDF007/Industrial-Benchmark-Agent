import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

test('offline capacity audit preserves every frozen budget violation and exits unsuccessfully', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-budget-audit-'));
  try {
    await fs.writeFile(path.join(root, 'config.json'), JSON.stringify({roles: {
      agent: {profile: {context_tokens: 32768, max_output_tokens: 4096}},
      vision: {profile: {context_tokens: 32768, max_output_tokens: 4096}}}}));
    await fs.writeFile(path.join(root, 'model-calls.json'), JSON.stringify([
      {call_id: 'over-context', role: 'agent', operation: 'generate', request_body: '{"maxTokens":4096}',
        usage: {totalTokens: 46466, outputTokens: 4096}},
      {call_id: 'over-reserve', role: 'agent', operation: 'generate', request_body: '{"maxTokens":4096}',
        usage: {totalTokens: 34906, outputTokens: 3925}},
    ]));
    const result = spawnSync(process.execPath, ['apps/iad-harness/scripts/verify-consistency-agent.js', '--audit', root],
      {cwd: new URL('../../..', import.meta.url), encoding: 'utf8'});
    assert.equal(result.status, 1);
    const report = JSON.parse(await fs.readFile(path.join(root, 'capacity.json'), 'utf8'));
    assert.equal(report.verified, false);
    assert.deepEqual(report.violations.map(item => item.call_id), ['over-context', 'over-reserve']);
    assert.equal(report.roles.agent.max_input_tokens, 42370);
    assert.match(report.calls_sha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(JSON.parse(result.stdout), report);
  } finally {await fs.rm(root, {recursive: true, force: true});}
});
