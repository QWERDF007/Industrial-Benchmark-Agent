import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';

const base = process.env.IAD_BROWSER_BASE_URL || 'http://127.0.0.1:8000';
const output = path.resolve('runs/verification/consistency-identity-20261109/local-defect-pair-regression');
const previous = JSON.parse(await fs.readFile(path.join(output, '..', 'tiny-local-miss-attempt', 'labelme-joint-consistency.json'), 'utf8'));
const datasetId = previous.dataset_id;
const anchorId = datasetId + ':2023-09-22_15.50.19.227_1_(3387)_ch_3388_7494001487653549057_3.png';
const candidateId = datasetId + ':2023_09_19_16_59_33_832031_copy_0_250904.png';
await fs.mkdir(output, {recursive: true});
const request = {...previous.request, submission_id: randomUUID(),
  subjects: {kind: 'samples', sample_ids: [anchorId]}, corpus_scope: {kind: 'datasets', dataset_ids: [datasetId]}};
const read = async (route, body) => {
  const response = await fetch(base + '/api/iad/' + route, body ? {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)} : {});
  const value = await response.json();
  assert.equal(response.status, 200, JSON.stringify(value));
  return value;
};
const receiptFile = path.join(output, 'receipt.json');
let receipt = await fs.readFile(receiptFile, 'utf8').then(JSON.parse, () => null);
if (!receipt) {
  receipt = {request, response: await read('analysis/start', request)};
  await fs.writeFile(receiptFile, JSON.stringify(receipt, null, 2) + '\n');
}
const runId = receipt.response.run_id;
let job;
while (true) {
  job = await read('analysis/status/' + runId);
  console.log(JSON.stringify({run_id: runId, status: job.status, completed: job.completed, failed: job.failed}));
  if (!['PENDING', 'RUNNING'].includes(job.status)) break;
  await delay(10000);
}
await fs.writeFile(path.join(output, 'job.json'), JSON.stringify(job, null, 2) + '\n');
assert.equal(job.status, 'COMPLETED', JSON.stringify(job.errors));
assert.equal(job.completed, 1);
assert.equal(job.failed, 0);
const detail = await read('consistency/checks/' + runId + '/anchors/' + encodeURIComponent(anchorId));
await fs.writeFile(path.join(output, 'detail.json'), JSON.stringify(detail, null, 2) + '\n');
assert.equal(detail.gates.length, 1);
assert.equal(detail.gates[0].candidate_id, candidateId);
assert.equal(detail.gates[0].relation, 'content_different', detail.gates[0].reason);
assert.equal(detail.gates[0].gate_status, 'rejected');
assert.equal(detail.result.candidate_stats.assessed, 0);
assert.equal(detail.result.pass_reason, 'no_eligible_candidate');
console.log(JSON.stringify({verified: true, run_id: runId, rejected: candidateId, reason: detail.gates[0].reason}));
