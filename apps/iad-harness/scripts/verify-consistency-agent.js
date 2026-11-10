import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {spawn, execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {randomUUID, createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {auditCapacity, collectScenario, verifyRecordedScenario} from './consistency-verification.js';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';

const {values} = parseArgs({options: {output: {type: 'string'}, 'env-file': {type: 'string'}, model: {type: 'string'},
  scenario: {type: 'string', default: 'directional'}, fixture: {type: 'string'}, audit: {type: 'string'}, 'verify-output': {type: 'string'}}});
if (values.audit) {
  const report = await auditCapacity(path.resolve(values.audit));
  console.log(JSON.stringify(report));
  process.exit(report.verified ? 0 : 1);
}
if (values['verify-output']) {
  const report = await verifyRecordedScenario(path.resolve(values['verify-output']));
  console.log(JSON.stringify(report));process.exit(report.verified ? 0 : 1);
}
const scaleCandidates = Array.from({length: 30}, (_, index) => 'R' + String(index).padStart(2, '0'));
const scenarios = {
  directional: {counts: {A: 1, B: 0, C: 2}, distinct: [], verdict: 'MATERIAL', original_conflicts: 3, expected: {
    A: {B: '多类别', C: '少类别'}, B: {A: '少类别', C: '少类别'}, C: {A: '多类别', B: '多类别'}}},
  equivalent: {counts: {A: 1, B: 1, C: 0}, distinct: ['C'], verdict: 'EQUIVALENT', original_conflicts: 0,
    expected: {A: {B: '一致'}, B: {A: '一致'}, C: {}}},
  scale: {counts: Object.fromEntries(['A', ...scaleCandidates].map(name => [name, 1])), distinct: [],
    verdict: 'EQUIVALENT', original_conflicts: 0, retrieval: {max_exact_candidates: 30},
    visual_limits: {max_request_bytes: 60000}, expected: {A: Object.fromEntries(scaleCandidates.map(name => [name, '一致']))}},
};
const scenario = scenarios[values.scenario];
assert.ok(scenario, '--scenario must be directional, equivalent or scale');
const subjects = Object.keys(scenario.expected);
assert.ok(values.output, '--output must be a new directory');
if (values['env-file']) process.loadEnvFile(values['env-file']);
const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const root = path.resolve(values.output), database = path.join(root, 'checks.db');
await fs.mkdir(root, {recursive: false});
await fs.writeFile(path.join(root, 'scenario.json'), JSON.stringify({name: values.scenario, ...scenario}, null, 2));
const fixture = values.fixture ? JSON.parse(await fs.readFile(path.resolve(values.fixture), 'utf8')) : null;
if (fixture) {
  await fs.mkdir(path.join(root, 'images'));await fs.mkdir(path.join(root, 'labels'));
  for (const name of Object.keys(scenario.counts)) {
    const pixels = await fs.readFile(path.join(fixture.images, name + '.png'));
    const annotations = await fs.readFile(path.join(fixture.labels, name + '.json'));
    assert.equal(createHash('sha256').update(pixels).digest('hex'), fixture.sources[name].image_sha256);
    assert.equal(createHash('sha256').update(annotations).digest('hex'), fixture.sources[name].annotation_sha256);
    await fs.writeFile(path.join(root, 'images', name + '.png'), pixels);
    await fs.writeFile(path.join(root, 'labels', name + '.json'), annotations);
  }
  await fs.writeFile(path.join(root, 'fixture.json'), JSON.stringify(fixture, null, 2));
}
const endpoint = process.env.LIVE_VLM_ENDPOINT.replace(/\/$/, '').replace(/\/chat\/completions$/, '');
const catalogResponse = await fetch(endpoint + '/models', {headers: {Authorization: 'Bearer ' + process.env.LIVE_VLM_KEY}});
assert.equal(catalogResponse.status, 200);
const models = (await catalogResponse.json()).data;
const model = values.model ? models.find(item => item.id === values.model) : models[0];
assert.ok(model?.id && model.max_model_len > 0, 'The provider must declare the actual model and context');
if (!fixture) execFileSync(resolvePythonPath(), ['-c', `import json,sys
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(sys.argv[1]);scenario=json.loads((root/'scenario.json').read_text())
images=root/'images';labels=root/'labels';images.mkdir();labels.mkdir()
image=Image.new('RGB',(320,240),(150,155,160));draw=ImageDraw.Draw(image)
draw.rounded_rectangle((24,24,296,216),radius=16,fill=(110,115,120),outline=(40,45,50),width=3)
draw.line((65,80,130,105),fill=(240,240,240),width=4)
draw.line((190,145,250,165),fill=(240,240,240),width=4)
boxes=[[[58,72],[138,113]],[[183,138],[258,173]]]
for name,count in scenario['counts'].items():
 sample=image.copy()
 if name in scenario['distinct']: sample.putpixel((0,0),(0,0,0))
 sample.save(images/(name+'.png'))
 (labels/(name+'.json')).write_text(json.dumps({'imageWidth':320,'imageHeight':240,
  'shapes':[{'label':'scratch','shape_type':'rectangle','points':box} for box in boxes[:count]]}))
`, root]);
const profile = path.join(root, 'home/profiles/web');
await fs.mkdir(path.join(profile, 'node_modules/@industrial-benchmark'), {recursive: true});
await fs.symlink(path.join(workspace, 'apps/iad-harness'), path.join(profile, 'node_modules/@industrial-benchmark/iad-harness'));
await fs.writeFile(path.join(profile, 'package.json'), JSON.stringify({name: 'consistency-live-verification', private: true,
  type: 'module', dsh: {profile: {bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app']}}}));
await fs.writeFile(path.join(profile, 'cordis.yml'), '[]\n');
await fs.writeFile(path.join(profile, 'cordis.patch.yml'), `- id: llm-pi-ai
  config:
    providers:
      live-verification:
        api: openai-completions
        baseURL: ${JSON.stringify(endpoint)}
        apiKeyEnv: LIVE_VLM_KEY
        compat:
          thinkingFormat: chat-template
          supportsDeveloperRole: false
        models:
          - id: ${JSON.stringify(model.id)}
            input: [text, image]
            contextWindow: ${model.max_model_len}
            maxTokens: 4096
            reasoningEfforts:
              off: null
              low: low
- id: agent-default-model
  config:
    provider: live-verification
    model: ${JSON.stringify(model.id)}
`);
const reservation = http.createServer();
await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
const port = reservation.address().port;
await new Promise(resolve => reservation.close(resolve));
const patch = path.join(root, 'host.yml');
await fs.writeFile(patch, `- id: webserver
  config:
    host: 127.0.0.1
    port: ${port}
- insert:
    - id: industrial-harness-plugin
      name: '@industrial-benchmark/iad-harness'
      config:
        cwd: ${JSON.stringify(workspace)}
        dbPath: ${JSON.stringify(database)}
`);
const host = spawn(process.env.IAD_NODE_PATH || process.execPath,
  [path.join(workspace, 'node_modules/@deepseek-ai/dsh/lib/bin.js'), '--profile', 'web', '--patch', patch, '--port', String(port), '--no-open'],
  {cwd: workspace, env: {...process.env, DSH_HOME: path.join(root, 'home')}, stdio: ['ignore', 'pipe', 'pipe']});
let log = '', runId;
host.stdout.on('data', value => {log += value;});host.stderr.on('data', value => {log += value;});
const base = `http://127.0.0.1:${port}/api/iad`;
const read = async route => {const response = await fetch(base + route);assert.equal(response.status, 200);return response.json();};
const post = async (route, body) => {const response = await fetch(base + route, {method: 'POST',
  headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});assert.equal(response.status, 200, await response.clone().text());return response.json();};
try {
  while (!log.includes('dsh web: http') && host.exitCode === null && host.signalCode === null) await delay(100);
  assert.ok(log.includes('dsh web: http'), 'The isolated host did not start');
  const dataset = await post('/datasets/import', {format: 'labelme', name: '真实双角色受控验收', image_dir: path.join(root, 'images'),
    annotation_dir: path.join(root, 'labels'), annotation_policy: fixture ? fixture.annotation_policy
      : {annotation_coverage: 'EXHAUSTIVE', policy_id: 'controlled-same-pixel'}});
  const parameters = {temperature: 0.1, chat_template_kwargs: {enable_thinking: false}};
  const settings = await read('/models');
  await post('/models', {expected_revision: settings.revision, selection: {provider_id: 'live-verification', model_id: model.id,
    limits: {capacity_mode: 'vllm_tokenize', max_output_tokens: 4096, request_parameters: parameters,
      ...scenario.visual_limits}}});
  const module = await read('/settings/modules/consistency');
  await post('/settings/modules/consistency', {expected_revision: module.revision, settings: {mode: 'exact',
    model: {provider_id: 'live-verification', model_id: model.id},
    agent_limits: {max_output_tokens: 4096, request_parameters: parameters}, ...scenario.retrieval}});
  const started = await post('/analysis/start', {analysis_kind: 'consistency', submission_id: randomUUID(), dataset_ids: [dataset.dataset_id],
    subjects: {kind: 'samples', sample_ids: subjects.map(name => dataset.dataset_id + ':' + name + '.png')}});
  runId = started.run_id;
  await fs.writeFile(path.join(root, 'run.json'), JSON.stringify({run_id: runId, dataset_id: dataset.dataset_id, model: model.id}));
  console.log(JSON.stringify({run_id: runId, model: model.id, output: root}));
  let status;
  do {
    await delay(1000);
    status = await read('/analysis/status/' + runId);
    await fs.writeFile(path.join(root, 'status.json'), JSON.stringify(status, null, 2));
  } while (['PENDING', 'RUNNING'].includes(status.status) && host.exitCode === null && host.signalCode === null);
  await collectScenario(base, root, runId);
  const report = await verifyRecordedScenario(root);
  console.log(JSON.stringify(report));
  assert.equal(report.verified, true, 'Strict zero-tool-error gate failed; scenario and capacity results are archived');
} finally {
  await fs.writeFile(path.join(root, 'host.log'), log.replace(/([?&]token=)[^&\s]+/g, '$1[redacted]'));
  if (host.exitCode === null && host.signalCode === null) {
    const exited = new Promise(resolve => host.once('exit', resolve));host.kill('SIGTERM');await exited;
  }
}
