import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {sessionFormatCatalog} from '@deepseek-ai/dsh-session-format-catalog';

export async function collectScenario(base, root, runId) {
  const read = async url => {
    const response = await fetch(url);
    assert.equal(response.status, 200, 'Archive read failed: ' + url);
    return response.json();
  };
  const status = await read(base + '/analysis/status/' + runId);
  await fs.writeFile(path.join(root, 'status.json'), JSON.stringify(status, null, 2));
  const results = [], diagnostics = [];
  for (let number = 1; ; number++) {
    const page = await read(base + '/consistency/checks/' + runId + '/anchors' + (number === 1 ? '' : '?page=' + number));
    for (const item of page.items) {
      const detail = await read(new URL(item.result_ref, base));
      results.push(detail);
      diagnostics.push(await read(new URL(detail.diagnostics_ref, base)));
      const response = await fetch(new URL(detail.trace_ref, base));
      assert.equal(response.status, 200);
      const filename = path.join(root, detail.anchor_id.split(':').at(-1) + '.jsonl');
      await fs.mkdir(path.dirname(filename), {recursive: true});
      await fs.writeFile(filename, await response.text());
    }
    if (results.length >= page.total) break;
  }
  const [config, report] = await Promise.all([
    read(base + '/consistency/checks/' + runId + '/config'), read(base + '/consistency/checks/' + runId + '/report'),
  ]);
  const calls = [];
  for (const call of status.model_calls) calls.push(await read(base + '/jobs/' + runId + '/model-calls/' + call.call_id));
  await Promise.all(Object.entries({'results.json': results, 'diagnostics.json': diagnostics,
    'config.json': config, 'report.json': report, 'model-calls.json': calls})
    .map(([name, value]) => fs.writeFile(path.join(root, name), JSON.stringify(value, null, 2))));
  const exported = await fetch(base + '/consistency/checks/' + runId + '/export.jsonl');
  assert.equal(exported.status, 200);
  await fs.writeFile(path.join(root, 'results.jsonl'), await exported.text());
}

export async function auditCapacity(directory) {
  const rawCalls = await fs.readFile(path.join(directory, 'model-calls.json'), 'utf8');
  const rawConfig = await fs.readFile(path.join(directory, 'config.json'), 'utf8');
  const snapshot = JSON.parse(rawConfig), calls = JSON.parse(rawCalls);
  const roles = {}, violations = [];
  for (const role of ['agent', 'vision']) {
    const limits = snapshot.roles[role].profile;
    const generated = calls.filter(call => call.role === role && call.operation === 'generate');
    const measurements = generated.map(call => {
      assert.ok(limits,'Actual generation has no frozen model profile');
      const body = JSON.parse(call.request_body), usage = call.usage;
      const output = usage ? usage.output_tokens ?? usage.completion_tokens ?? usage.outputTokens : null;
      const input = usage ? usage.input_tokens ?? usage.prompt_tokens ??
        (Number.isInteger(usage.totalTokens)&&Number.isInteger(output)?usage.totalTokens-output:null) : null;
      const requested = body.maxTokens ?? body.max_output_tokens ?? body.max_completion_tokens ?? body.max_tokens ?? null;
      const bytes = Buffer.byteLength(JSON.stringify(body));
      const checks = [
        ['provider-usage', Boolean(usage)],
        ...(limits.max_output_tokens!==null?[['requested-output',Number.isInteger(requested)&&requested>0&&requested<=limits.max_output_tokens]]:[]),
        ...(usage ? [
          ['frozen-context-reserve', Number.isInteger(input) && input > 0 &&
            (limits.context_tokens===null || input + (requested ?? output) <= limits.context_tokens)],
          ['output-tokens', Number.isInteger(output) && output >= 0 && (limits.max_output_tokens===null || output <= limits.max_output_tokens)],
        ] : []),
        ...(role === 'vision' && limits.max_request_bytes ? [['request-bytes', bytes <= limits.max_request_bytes]] : []),
      ];
      violations.push(...checks.filter(([, passed]) => !passed).map(([rule]) => ({role, call_id: call.call_id, rule,
        input_tokens: input, output_tokens: output, context_tokens: limits.context_tokens, output_reserve: limits.max_output_tokens})));
      return {input, output, bytes};
    });
    const inputs = measurements.map(item => item.input).filter(Number.isInteger);
    const outputs = measurements.map(item => item.output).filter(Number.isInteger);
    roles[role] = {requests: generated.length, request_representation: role === 'agent' ? 'native-llm-options' : 'http-json',
      model_id: limits?.model_id ?? null,
      max_input_tokens: inputs.length ? Math.max(...inputs) : null,
      max_output_tokens: outputs.length ? Math.max(...outputs) : null,
      max_recorded_request_bytes: Math.max(0, ...measurements.map(item => item.bytes))};
  }
  const report = {verified: violations.length === 0, source: 'actual-provider-usage', roles, violations,
    calls_sha256: createHash('sha256').update(rawCalls).digest('hex'),
    config_sha256: createHash('sha256').update(rawConfig).digest('hex')};
  await fs.writeFile(path.join(directory, 'capacity.json'), JSON.stringify(report, null, 2));
  return report;
}

export async function verifyRecordedScenario(root) {
  const read = async name => JSON.parse(await fs.readFile(path.join(root, name), 'utf8'));
  const [status, results, diagnostics, businessReport, scenario, snapshot] = await Promise.all(
    ['status.json', 'results.json', 'diagnostics.json', 'report.json', 'scenario.json', 'config.json'].map(read));
  const program = snapshot.review_pipeline === 'identity-v8';
  const subjects = Object.keys(scenario.expected), values = {scenario: scenario.name}, traces = [];
  for (const detail of results) {
    const name = detail.anchor_id.split(':').at(-1);
    const raw = await fs.readFile(path.join(root, name + '.jsonl'), 'utf8');
    const [header, ...rows] = raw.trim().split('\n').map(JSON.parse);
    const restore = sessionFormatCatalog.createRestore(header, {recovery: 'strict'});
    rows.forEach(row => restore.decodeRow(row));
    const {events} = restore.finish();
    const summaries = events.filter(event => event.type === 'compaction/summary');
    traces.push({anchor_id: detail.anchor_id, tools: events.filter(event => event.type === 'tool/call').map(event => event.data.name),
      errors: events.filter(event => event.type === 'tool/result' && event.data.message.isError).map(event => event.data.message),
      summaries: summaries.length, real_summaries: summaries.filter(event => event.data.llmStreamCall === true && event.data.usage).length,
      prunes: events.filter(event => event.type === 'compaction/prune').length,
      sha256: createHash('sha256').update(raw).digest('hex')});
  }
  await fs.writeFile(path.join(root, 'tool-traces.json'), JSON.stringify(traces, null, 2));
  assert.equal(status.status, 'COMPLETED', JSON.stringify(status.errors));
  assert.equal(status.completed, subjects.length);assert.equal(status.failed, 0);
  assert.equal(results.length, subjects.length);
  for (const detail of results) {
    const name = path.parse(detail.anchor_id.split(':').at(-1)).name;
    const expected = scenario.expected[name], reviewed = Object.keys(expected).length > 0;
    assert.equal(detail.result.reason, reviewed ? 'MODEL_REVIEWED' : 'NO_CANDIDATES');
    assert.equal(detail.verdict, scenario.verdict);
    assert.deepEqual(Object.fromEntries(detail.result.assessments.map(item => [path.parse(item.candidate_id.split(':').at(-1)).name, item.conclusion])), expected);
    assert.equal(detail.result.assessments.length, Object.keys(expected).length);
    assert.equal(detail.observations.length > 0, reviewed && snapshot.task_type!=='anomaly_detection');
    assert.equal(detail.candidates.candidates.length, Object.keys(expected).length);
    if (values.scenario === 'scale') assert.ok(detail.visual_plan.pages.length > 1, 'The real capacity planner must paginate thirty candidates');
    const trace = traces.find(item => item.anchor_id === detail.anchor_id);
    const diagnostic = diagnostics.find(item => item.anchor_id === detail.anchor_id);
    if (reviewed) {
      if(program){
        assert.deepEqual(trace.tools,[]);assert.equal(diagnostic.roles.agent.requests,0);
        if(snapshot.task_type==='bbox_defect')assert.ok(diagnostic.roles.vision.generation_requests>0);
      }else{
        for (const tool of ['anchor_context', 'anchor_observe', 'anchor_assess', 'anchor_submit']) assert.ok(trace.tools.includes(tool));
        for (const role of ['agent', 'vision']) assert.ok(diagnostic.roles[role].generation_requests > 0);
      }
    } else {
      assert.deepEqual(trace.tools, []);
      assert.deepEqual(detail.candidates.candidates, []);
      assert.equal(detail.candidates.exact.state, 'done');
      assert.equal(detail.candidates.similar.state, 'disabled');
      for (const role of ['agent', 'vision']) assert.equal(diagnostic.roles[role].requests, 0);
    }
  }
  assert.equal(new Set(results.map(item => item.session_id)).size, subjects.length);
  assert.equal(businessReport.no_candidates, Object.values(scenario.expected).filter(expected => Object.keys(expected).length === 0).length);
  assert.equal(businessReport.original_conflicts, scenario.original_conflicts);
  if(program)assert.ok(status.model_calls.every(item=>item.role==='vision'));
  else assert.ok(status.model_calls.some(item => item.role === 'agent' && item.source === 'native_llm'));
  if(results.some(detail=>detail.observations.length))assert.ok(status.model_calls.some(item => item.role === 'vision' && item.operation === 'generate'));
  const capacity = await auditCapacity(root);
  const toolErrors = traces.reduce((sum, item) => sum + item.errors.length, 0);
  const fixturePath = path.join(root, 'fixture.json');
  const fixture = await fs.stat(fixturePath).then(() => read('fixture.json'), error => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  const report = {verified: toolErrors === 0 && capacity.verified, business_checks_passed: true,
    sample_kind: fixture ? fixture.sample_kind : 'controlled-synthetic', scenario: scenario.name,
    run_id: status.run_id, completed: status.completed, requests: status.model_calls.length, capacity,
    tool_errors: toolErrors, real_summaries: traces.reduce((sum, item) => sum + item.real_summaries, 0)};
  await fs.writeFile(path.join(root, 'verification.json'), JSON.stringify(report, null, 2));
  return report;
}
