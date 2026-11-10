import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(process.argv.find(value => value.startsWith('--output='))?.slice(9)
  || 'runs/verification/consistency-identity');
const base = process.env.IAD_BROWSER_BASE_URL || 'http://127.0.0.1:8000';
await fs.mkdir(output, {recursive: true});
const read = async route => {
  const response = await fetch(base + '/api/iad/' + route);
  assert.equal(response.status, 200);
  return response.json();
};
const browser = async (dataset, verifyOnly) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [path.join(directory, 'verify-analysis-user-chain.js'),
    '--stage=consistency', '--dataset=' + dataset, '--output=' + output, ...(verifyOnly ? ['--verify-only'] : [])],
    {cwd: process.cwd(), env: process.env, stdio: 'inherit'});
  child.once('error', reject);
  child.once('exit', code => code === 0 ? resolve() : reject(new Error('浏览器验收失败，退出码：' + code)));
});
let previous;
const results = [];
for (const dataset of ['labelme', 'anomaly']) {
  const receiptPath = path.join(output, dataset + '-joint-consistency.json');
  if (!await fs.access(receiptPath).then(() => true, () => false)) await browser(dataset, false);
  const receipt = JSON.parse(await fs.readFile(receiptPath, 'utf8'));
  assert.equal(receipt.status, 200);
  const runId = receipt.response.run_id;
  let job;
  while (true) {
    job = await read('analysis/status/' + encodeURIComponent(runId));
    console.log(JSON.stringify({dataset, run_id: runId, status: job.status,
      completed: job.completed, failed: job.failed, total: job.total_samples}));
    if (!['PENDING', 'RUNNING'].includes(job.status)) break;
    await delay(30000);
  }
  await fs.writeFile(path.join(output, dataset + '-final-job.json'), JSON.stringify(job, null, 2) + '\n');
  assert.equal(job.status, 'COMPLETED', JSON.stringify(job.errors));
  assert.equal(job.completed, 100);
  assert.equal(job.failed, 0);
  if (previous) assert.ok(Date.parse(job.submitted_at) >= Date.parse(previous.finished_at), '两个真实作业不得重叠');
  await browser(dataset, true);
  const calls = job.model_calls.filter(call => call.operation === 'generate');
  results.push({dataset, run_id: runId, submitted_at: job.submitted_at, started_at: job.started_at,
    finished_at: job.finished_at, duration_seconds: (Date.parse(job.finished_at) - Date.parse(job.started_at)) / 1000,
    completed: job.completed, failed: job.failed, generation_requests: calls.length,
    cumulative_model_seconds: calls.reduce((sum, call) => sum + (call.elapsed_ms || 0), 0) / 1000,
    usage: calls.map(call => ({role: call.role, usage: call.usage}))});
  await fs.writeFile(path.join(output, 'serial-verification.json'), JSON.stringify(results, null, 2) + '\n');
  previous = job;
}
console.log(JSON.stringify({verified: results.map(({dataset, run_id, duration_seconds}) => ({dataset, run_id, duration_seconds})),
  serial: true, concurrency: 2}));
