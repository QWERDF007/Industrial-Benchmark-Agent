import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {auditCapacity, collectScenario, verifyRecordedScenario} from '../scripts/consistency-verification.js';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';
import {randomUUID} from 'node:crypto';

test('a recorded program workflow verifies real decisions and zero orchestration calls',{timeout:30000},async()=>{
  const fixture=await createConsistencyAgentHost();
  const server=http.createServer(createIadHttpHandler(fixture.bridge));
  try {
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],mode:'exact'});
    await fixture.scheduler.whenIdle();
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const archive=path.join(fixture.root,'archive');await fs.mkdir(archive);
    await fs.writeFile(path.join(archive,'scenario.json'),JSON.stringify({name:'directional',verdict:'MATERIAL',
      original_conflicts:2,expected:{A:{B:'多类别'},B:{A:'少类别'}}}));
    await collectScenario('http://127.0.0.1:'+server.address().port+'/api/iad',archive,job.run_id);
    const report=await verifyRecordedScenario(archive);
    assert.equal(report.verified,true);assert.equal(report.completed,2);
    assert.equal(report.capacity.roles.agent.requests,0);assert.equal(report.capacity.roles.vision.requests,2);
  }finally{
    if(server.listening)await new Promise(resolve=>server.close(resolve));await fixture.close();
  }
});

test('capacity audits separate complete provider usage from repaired output validation errors', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-consistency-capacity-'));
  const profile = {model_id: 'vision', context_tokens: 32768, max_output_tokens: 4096};
  const call = {call_id: 'vision-output-format', role: 'vision', operation: 'generate', source: 'http',
    http_status: 200, finish_reason: 'stop', request_body: JSON.stringify({model: 'vision', max_tokens: 4096}),
    error: {type: 'ModelOutputError', message: 'visual_candidate_coverage'}};
  try {
    await fs.writeFile(path.join(root, 'config.json'), JSON.stringify({roles: {agent: {profile}, vision: {profile}}}));
    for (const [usage, expected, rule] of [
      [{prompt_tokens: 11693, completion_tokens: 745, total_tokens: 12438}, true, null],
      [null, false, 'provider-usage'],
      [{prompt_tokens: 42370, completion_tokens: 745, total_tokens: 43115}, false, 'frozen-context-reserve'],
    ]) {
      const raw = JSON.stringify([{...call, usage}]);
      await fs.writeFile(path.join(root, 'model-calls.json'), raw);
      const report = await auditCapacity(root);
      assert.equal(report.verified, expected);
      assert.deepEqual(report.violations.map(item => item.rule), rule ? [rule] : []);
      assert.equal(await fs.readFile(path.join(root, 'model-calls.json'), 'utf8'), raw);
    }
  } finally {await fs.rm(root, {recursive: true, force: true});}
});

test('zero-generation capacity audits do not require either model to be configured', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-consistency-empty-capacity-'));
  try {
    await fs.writeFile(path.join(root, 'config.json'), JSON.stringify({roles: {agent: {profile: null}, vision: {profile: null}}}));
    await fs.writeFile(path.join(root, 'model-calls.json'), '[]');
    const report = await auditCapacity(root);
    assert.equal(report.verified, true);assert.deepEqual(report.violations, []);
    for (const role of ['agent', 'vision']) {
      assert.equal(report.roles[role].requests, 0);assert.equal(report.roles[role].model_id, null);
      assert.equal(report.roles[role].max_input_tokens, null);
    }
  } finally {await fs.rm(root, {recursive: true, force: true});}
});

test('Responses capacity audits retain actual usage with capped or provider-managed output',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-responses-capacity-'));
  try{
    for(const limit of [4096,null]){
      await fs.writeFile(path.join(root,'config.json'),JSON.stringify({roles:{agent:{profile:null},vision:{profile:{
        model_id:'vision',api:'openai-responses',context_tokens:32768,max_output_tokens:limit}}}}));
      await fs.writeFile(path.join(root,'model-calls.json'),JSON.stringify([{call_id:'actual-responses',role:'vision',operation:'generate',
        request_body:JSON.stringify(limit?{model:'vision',max_output_tokens:limit}:{model:'vision'}),
        usage:{input_tokens:12000,output_tokens:800,total_tokens:12800}}]));
      const report=await auditCapacity(root);
      assert.equal(report.verified,true,JSON.stringify(report.violations));
      assert.equal(report.roles.vision.max_input_tokens,12000);assert.equal(report.roles.vision.max_output_tokens,800);
    }
  }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('scenario archiving follows every result page and preserves nested image paths without submitting model work', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-consistency-archive-'));
  const native = '{"original":"原生事件正文"}\n';
  const detail = {anchor_id: 'ds:OK/A.png', diagnostics_ref: '/api/iad/saved/diagnostic', trace_ref: '/api/iad/saved/native'};
  const second = {anchor_id: 'ds:NG/A.png', diagnostics_ref: '/api/iad/saved/diagnostic-two', trace_ref: '/api/iad/saved/native-two'};
  const calls = {call_id: 'call-one', usage: null, request_body: '{"原始请求":true}'};
  const routes = new Map([
    ['/api/iad/analysis/status/run-one', {status: 'COMPLETED', model_calls: [{call_id: 'call-one'}]}],
    ['/api/iad/consistency/checks/run-one/anchors', {total: 2, items: [{result_ref: '/api/iad/saved/result'}]}],
    ['/api/iad/consistency/checks/run-one/anchors?page=2', {total: 2, items: [{result_ref: '/api/iad/saved/result-two'}]}],
    ['/api/iad/saved/result', detail], ['/api/iad/saved/diagnostic', {recording: 'COMPLETE'}],
    ['/api/iad/saved/result-two', second], ['/api/iad/saved/diagnostic-two', {recording: 'COMPLETE'}],
    ['/api/iad/saved/native-two', native],
    ['/api/iad/saved/native', native], ['/api/iad/consistency/checks/run-one/config', {frozen: true}],
    ['/api/iad/consistency/checks/run-one/report', {completed: 1}],
    ['/api/iad/jobs/run-one/model-calls/call-one', calls],
    ['/api/iad/consistency/checks/run-one/export.jsonl', '{"anchor_id":"ds:A.png"}\n'],
  ]);
  const seen = [];
  const server = http.createServer((request, response) => {
    seen.push(request.method + ' ' + request.url);
    if (!routes.has(request.url)) {response.writeHead(404);response.end();return;}
    const value = routes.get(request.url);
    response.end(typeof value === 'string' ? value : JSON.stringify(value));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await collectScenario('http://127.0.0.1:' + server.address().port + '/api/iad', root, 'run-one');
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(root, 'results.json'), 'utf8')), [detail, second]);
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(root, 'model-calls.json'), 'utf8')), [calls]);
    assert.equal(await fs.readFile(path.join(root, 'OK/A.png.jsonl'), 'utf8'), native);
    assert.equal(await fs.readFile(path.join(root, 'NG/A.png.jsonl'), 'utf8'), native);
    assert.equal(await fs.readFile(path.join(root, 'results.jsonl'), 'utf8'), '{"anchor_id":"ds:A.png"}\n');
    assert.ok(seen.every(request => request.startsWith('GET ')));
    assert.equal(seen.length, routes.size);
  } finally {await new Promise(resolve => server.close(resolve));await fs.rm(root, {recursive: true, force: true});}
});
