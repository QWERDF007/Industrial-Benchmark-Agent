import test from 'node:test';
import {finalizeFixtureCatalog,respondFixtureTools} from './fixtures/analysis-finalization.js';
import {chatRequest} from './fixtures/responses.js';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {createHash, randomUUID} from 'node:crypto';
import {Context} from '@deepseek-ai/cordis';
import {LlmRuntime} from '@deepseek-ai/dsh-llm';
import {ToolRuntime} from '@deepseek-ai/dsh-tools';
import {SystemPrompt} from '@deepseek-ai/dsh-system-prompt';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import {PythonBridge, findWorkspaceRoot, resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {NativeProviders} from '../lib/server/models/providers.js';
import {JobSessionHost} from '../lib/server/sessions/host.js';
import {analysisSessionPath} from '../lib/server/analysis/agent.js';
import {AnalysisWorkflowScheduler} from '../lib/server/analysis/scheduler.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';
import {createExplorationTools} from '../lib/server/exploration/index.js';
import {createKnowledgeTools} from '../lib/server/knowledge/index.js';
import {toolPresentation} from '../lib/shared/tool-presentation.js';

for (const scenario of [{module:'exploration'}, {module:'knowledge'}, {module:'knowledge', capacityStop:true},
  {module:'exploration',emptyCatalog:true}, {module:'exploration',initialFailure:true},
  {module:'exploration',protocol:'openai-responses'}, {module:'knowledge',protocol:'openai-responses'}]) test(`one native ${scenario.module} Agent ${scenario.initialFailure ? 'retains a first-call failure before any observation' : 'observes all 19 registrations in its own Session' + (scenario.emptyCatalog ? ' and publishes an empty catalog' : scenario.capacityStop ? ' after a 12/19 capacity failure and resume' : ' and retains a last-round discovery')}${scenario.protocol?' with Responses reasoning':''}`, {timeout: process.env.IAD_ANALYSIS_BROWSER ? 120000 : 60000}, async t => {
  const {module, capacityStop, emptyCatalog, initialFailure,protocol='openai-completions'} = scenario;
  const expectedCounts=module==='exploration'?[[8,2],[2,2],[2,2],[0,1]]:[[2,2],[2,2],[2,2],[3,1],[3,0]];
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-analysis-agent-'));
  const workspace = findWorkspaceRoot(), database = path.join(root, 'analysis.db');
  const wire = [], errors = [];
  let firstRoundMedia, reopenedHistory, finalizationCalls=0;
  let blockCapacity = capacityStop;
  const provider = http.createServer(async (req, res) => {
    try {
      assert.equal(req.headers.authorization, 'Bearer analysis-test-key');
      let text = '';for await (const chunk of req) text += chunk;
      const body = chatRequest(JSON.parse(text));
      if(protocol==='openai-responses')assert.equal(body.responses.reasoning.effort,'high');
      if (req.url === '/tokenize') {res.end(JSON.stringify({count: blockCapacity && wire.length >= 6 ? 70000 : 1000, max_model_len: 65536}));return;}
      const instruction = body.messages.filter(message => message.role === 'system'||message.role==='developer').map(message => message.content).join('\n');
      assert.equal(instruction,data.system_prompt[module]+'\n系统自定义：按工具提交。');
      assert.doesNotMatch(instruction,/\b(?:analysis_\w+|exploration_commit|knowledge_commit)\b/);
      const tools=body.tools.map(tool=>tool.function.name);
      assert.ok(tools.includes('analysis_images'));
      assert.ok(tools.includes(module === 'exploration' ? 'exploration_commit' : 'knowledge_commit'));
      assert.ok(!instruction.includes('{{response_schema}}'), 'visible defaults use the native tool protocol');
      assert.ok(instruction.includes('系统自定义：按工具提交。'));
      assert.ok(!instruction.includes('用户自定义：比较边缘。'));
      assert.ok(body.messages.some(message=>message.role==='user'&&JSON.stringify(message.content).includes('用户自定义：比较边缘。')));
      wire.push(body);
      if(initialFailure){
        res.writeHead(400,{'Content-Type':'application/json'});
        res.end(JSON.stringify({error:{message:'controlled initial provider failure',type:'invalid_request_error'}}));return;
      }
      const parse = value => {try {return JSON.parse((typeof value==='string'?value:value.find(part=>part.type==='text').text).split('\n')[0]);} catch {return null;}};
      const contextIndex = body.messages.findLastIndex(message => message.role === 'user' && parse(message.content)?.job_id);
      assert.notEqual(contextIndex, -1);
      const context = parse(body.messages[contextIndex].content);
      const states=body.messages.filter(message=>message.role==='user').map(message=>parse(message.content))
        .filter(value=>(value)?.job_id===context.job_id);
      assert.deepEqual(states.at(-1),context,'使用最近注入的当前轮次状态');
      if(context.phase==='finalize'){
        finalizationCalls++;
        const outputs=body.messages.slice(contextIndex+1).filter(message=>message.role==='tool').map(message=>parse(message.content));
        respondFixtureTools(res,finalizeFixtureCatalog(context,outputs,module),{protocol});return;
      }
      const [normal,abnormal]=expectedCounts[context.round.round_id-1];
      assert.deepEqual(context.round.sampling_counts,{normal,abnormal,unclassified:0});
      assert.equal(context.registrations.filter(record=>record.sampling_group==='normal').length,normal);
      assert.equal(context.registrations.filter(record=>record.sampling_group==='abnormal').length,abnormal);
      if (capacityStop && context.round.round_id >= 3) {
        const checkpoint = body.messages.filter(message => message.role === 'user')
          .map(message => parse(message.content)).filter(value=>value?.job_id).at(-1);
        assert.equal(checkpoint.revision, context.revision);
        assert.ok(checkpoint.catalog.checks.find(check => check.check_id === 'seed-1').counter_evidence_ids.length > 0,
          'counterexamples survive successive structured checkpoints');
        assert.deepEqual(checkpoint.catalog.unresolved_questions, ['独立来源线索仍待核验。']);
        assert.equal(checkpoint.round.round_id, context.round.round_id);
      }
      const toolMessages=body.messages.slice(contextIndex+1).filter(message=>message.role==='tool');
      const outputs = toolMessages.map(message => parse(message.content));
      assert.ok(outputs.every(item => item && !item.error), JSON.stringify(body.messages.filter(message => message.role === 'tool').map(message => message.content.slice(0, 240))));
      const pages = outputs.filter(item=>Array.isArray(item.images));
      const history = outputs.find(item=>Array.isArray(item.items));
      const actual = body.messages.flatMap(message => Array.isArray(message.content) ? message.content : []).filter(part => part.type === 'image_url');
      const allPages=body.messages.filter(message=>message.role==='tool').map(message=>parse(message.content)).filter(value=>Array.isArray(value?.images));
      for (const page of allPages) {
        assert.ok(page.evidence_id, 'the original image owns the media bundle reference');
        assert.ok(page.images.every(item => !Object.hasOwn(item.image,'evidence_id')&&!Object.hasOwn(item.model_context,'evidence_id')));
      }
      assert.equal(actual.length,allPages.flatMap(page=>page.images).length,'未触发官方压缩时保留历史图片');
      let calls;
      if (!outputs.length) calls = [...context.round.targets.map(target => ({name: 'analysis_images', arguments: {sample_id: target.sample_id}})),
        {name:'analysis_crop',arguments:{sample_id:context.round.targets[0].sample_id,bbox:[1,2,7,9]}},
        ...(capacityStop && context.round.round_id===5 ? [{name:'analysis_observations',arguments:{round_id:1,page_size:1}}] : [])];
      else if(history && pages.every(page=>context.round.targets.some(target=>target.sample_id===page.sample_id))) {
        assert.equal(history.total,4);assert.equal(history.items.length,1);assert.equal(history.items[0].round_id,1);
        calls=history.items[0].evidence_ids.map(evidence_id=>({name:'analysis_evidence',arguments:{evidence_id}}));
      }
      else {
        assert.ok(actual.length >= pages.flatMap(page => page.images).length, 'every requested registration is actually sent, including repeated pixels');
        const expectedHashes = new Set(allPages.flatMap(page => page.images).map(item => item.image.sha256));
        assert.ok(actual.every(part => expectedHashes.has(createHash('sha256').update(Buffer.from(part.image_url.url.split(',')[1], 'base64')).digest('hex'))),
          'the provider receives the prepared pixels without substituting thumbnails');
        if(capacityStop && context.round.round_id===1)firstRoundMedia=pages.flatMap(page=>page.images).filter(item=>item.sample_id===context.round.targets[0].sample_id);
        if(history) {
          reopenedHistory=pages.filter(page=>!context.round.targets.some(target=>target.sample_id===page.sample_id)).flatMap(page=>page.images);
          assert.deepEqual(reopenedHistory,firstRoundMedia,'stable evidence IDs reopen the first-round whole image and crop after checkpoints');
          assert.deepEqual(reopenedHistory.map(item=>item.image.role),['overview','roi']);
        }
        const mediaBySample=new Map();
        for(const page of pages.filter(page=>context.round.targets.some(target=>target.sample_id===page.sample_id))){const images=mediaBySample.get(page.sample_id)||[];images.push(...page.images);mediaBySample.set(page.sample_id,images);}
        const observations = [...mediaBySample].map(([sample_id,images]) => ({sample_id, dataset_id: images[0].dataset_id,
          description: '已实际观察本登记原图与完整局部。', evidence_ids: [pages.find(page=>page.sample_id===sample_id).evidence_id],
          directions: context.selected_directions.map(direction => ({direction_ref: direction.ref, status: 'applicable', reason: '本图主体可见。'}))}));
        const wholeBySample=new Map([...mediaBySample].map(([sid])=>[sid,[pages.find(page=>page.sample_id===sid).evidence_id]]));
        const last = context.round.round_id === (module === 'exploration' ? 4 : 5);
        calls = [{name: module === 'exploration' ? 'exploration_commit' : 'knowledge_commit', arguments: {commit_key: 'round-complete',
          round_id: context.round.round_id, base_revision: context.revision, observations,
          ...(module === 'exploration' ? {directions: last && !emptyCatalog ? [{direction_id: 'edge', title: '边缘检查', instruction: '沿原图边缘回看轮廓连续性。',
            applies_to: 'both', rationale: '原图边缘提供可直接复核的依据。', evidence_ids: wholeBySample.get(observations[0].sample_id),
            dataset_ids: [observations[0].dataset_id], limitations: ['当前只有一例。']}] : []} :
            {checks: last ? [{check_id: 'K1', title: '表面关系', subject: '主体', location: '全图', criterion: '主体呈灰色。',
              allowed_variations: [], limitations: ['当前观察不能确定质量真值。'], status: 'supported',
              support_evidence_ids: wholeBySample.get(observations[0].sample_id), counter_evidence_ids: [],
              direction_refs: ['D1'], dataset_ids: [observations[0].dataset_id]}] : capacityStop && context.round.round_id <= 3 ? [{
                check_id:'seed-' + context.round.round_id, title:'待核验关系' + context.round.round_id, subject:'主体', location:'全图',
                criterion:'需要独立来源核验可见外观关系。', allowed_variations:[], limitations:['当前线索待核验。'], status:'provisional',
                support_evidence_ids:wholeBySample.get(observations[0].sample_id), counter_evidence_ids:wholeBySample.get(observations[1].sample_id),
                direction_refs:['D1'], dataset_ids:[observations[0].dataset_id]}] : []}),
          summary: '保留本场全部观察。', limitations: [], unresolved_questions: capacityStop ? ['独立来源线索仍待核验。'] : []}}];
        if (capacityStop && context.round.round_id === 2) calls[0].arguments.checks.push({
          check_id:'seed-1', title:'待核验关系1', subject:'主体', location:'全图', criterion:'需要独立来源核验可见外观关系。',
          allowed_variations:[], limitations:context.catalog.checks[0].limitations, status:'provisional',
          support_evidence_ids:context.catalog.checks[0].support_evidence_ids, counter_evidence_ids:[],
          direction_refs:['D1'], dataset_ids:context.catalog.checks[0].dataset_ids});

      }
      respondFixtureTools(res,calls,{protocol});
    } catch (error) {errors.push(String(error));res.writeHead(500);res.end(JSON.stringify({error: {message: String(error)}}));}
  });
  await new Promise(resolve => provider.listen(0, '127.0.0.1', resolve));
  t.after(async () => {provider.closeAllConnections();await new Promise(resolve => provider.close(resolve));await fs.rm(root, {recursive: true, force: true});});
  const endpoint = `http://127.0.0.1:${provider.address().port}/v1`;
  const data = JSON.parse(execFileSync(resolvePythonPath(), ['-c', `
import json,sys
from pathlib import Path
from PIL import Image
from iad_core.dataset.registry import DatasetRegistry,DatasetImport
from iad_core.storage.database import Database
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.knowledge.instructions import default_directions
from iad_core.analysis.prompt_text import EXPLORATION_WORKFLOW,knowledge_agent_prompt
from iad_core.exploration.prompts import ExplorationPrompts
root=Path(sys.argv[1]);db=Database(sys.argv[2]);datasets=[]
for label,count in [('A',11),('B',8)]:
    directory=root/label;directory.mkdir()
    for index in range(count):Image.new('RGB',(32,24),'gray').save(directory/(str(index).zfill(2)+'.png'))
    config=DatasetRegistry(db).import_labelme(DatasetImport(format='labelme',name=label,image_dir=str(directory),annotation_dir=str(directory)))
    datasets.append(config.dataset.id)
    config.quality.source='filename_regex';config.quality.pattern='^([0-9]+)'
    config.quality.mapping={str(index).zfill(2):'PASS' if index<(8 if label=='A' else 4) else 'FAIL' for index in range(count)}
    DatasetRegistry(db).save(config);DatasetRegistry(db).rescan(config.dataset.id)
for module in ['exploration','knowledge']:
    ModuleSettings(db).save({'module':module,'expected_revision':0,'settings':{'model':{'provider_id':'fixture','model_id':'native-image'},'batch_size':4}})
print(json.dumps({'dataset_ids':datasets,'normal_images':[datasets[0]+':'+str(i).zfill(2)+'.png' for i in range(8)],
    'defect_images':[datasets[0]+':'+str(i).zfill(2)+'.png' for i in (8,9)],
    'exploration_prompt':ExplorationPrompts().default().model_dump(),
    'system_prompt':{'exploration':EXPLORATION_WORKFLOW,'knowledge':knowledge_agent_prompt()},
    'mining_prompt':{'objective':'按所选方向观察完整范围。','directions':[default_directions()[0].model_dump()],
        'instruction':'用户自定义：比较边缘。'}}))
`, root, database], {cwd: workspace, env: {...process.env, PYTHONPATH: path.join(workspace, 'python')}, encoding: 'utf8'}));
  const bridge = new PythonBridge({cwd: workspace, dbPath: database});
  if(protocol==='openai-responses')await bridge.execute('module_settings_save',{module,expected_revision:1,settings:{reasoning_effort:'high'}});
  const host = await JobSessionHost.open(path.join(root, module + '-sessions'), async session_id =>
    analysisSessionPath(root, await bridge.execute('analysis_agent_session_location', {session_id})));
  const ctx = new Context();new LlmRuntime(ctx);
  new SystemPrompt(ctx, {});
  new ToolRuntime(ctx);
  const providers = {fixture: {api: protocol, baseURL: endpoint, apiKeyEnv: 'ANALYSIS_TEST_KEY',
    models: [{id: 'native-image', input: protocol==='openai-responses'?['text']:['text','image'], contextWindow: 65536, maxTokens: 4096,
      ...(protocol==='openai-responses'?{reasoningEfforts:{high:'high'}}:{})}]}};
  ctx.provide('settings', {configure: () => () => {}, describe: () => [{ns: 'llm-pi-ai', revision: 1, value: {providers}}]});
  ctx.provide('credentials', {resolve: async () => ({value: 'analysis-test-key'})});
  const plugin = await ctx.plugin(piAi, {providers});
  const native = new NativeProviders(() => ctx);
  const scheduler = new AnalysisWorkflowScheduler(bridge, native, {exploration: host, knowledge: host}, root, error => errors.push(String(error)));
  const removeRouting = bridge.useModelRouting(scheduler);
  for (const tool of [...createExplorationTools(bridge, ctx), ...createKnowledgeTools(bridge, ctx)]) ctx.tools.register(tool);
  const browser = process.env.IAD_ANALYSIS_BROWSER ? await import('./fixtures/analysis-page.js') : null;
  const page = browser ? await browser.analysisPageBundle(module, await bridge.execute('dataset_get', {dataset_id: data.dataset_ids[0]})) : null;
  const api = createIadHttpHandler(bridge);
  const server = http.createServer((req, res) => {
    if (page && req.url === '/analysis-browser.js') {res.writeHead(200, {'Content-Type':'application/javascript'});res.end(page);}
    else if (page && new URL(req.url, 'http://localhost').pathname === '/analysis-browser') {
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});res.end('<div id="root"></div><script src="/analysis-browser.js"></script>');
    } else return api(req, res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/iad`;
  try {
    for (const path of ['/exploration/start', '/exploration/batches/start', '/knowledge/start', '/knowledge/batches/start', '/knowledge/scopes/open', '/knowledge/scopes/old/stop', '/knowledge/cancel/old', '/exploration/cancel/old', '/exploration/delete/old','/dataset-reports']) {
      const retired = await fetch(base + path, {method:'POST', headers:{'Content-Type':'application/json'}, body:'{}'});
      assert.equal(retired.status, 404, 'the retired writer is absent: ' + path);
    }
    for (const path of ['/dataset-reports', '/dataset-reports/old', '/dataset-reports/old/status', '/dataset-reports/old/export', '/exploration', '/exploration/jobs', '/exploration/status/old', '/knowledge/scopes/old', '/knowledge/jobs', '/knowledge/status/old', '/knowledge/observations/old', '/knowledge/retry/old', '/knowledge/prompt', '/knowledge/sources']) {
      const retired = await fetch(base + path);
      assert.equal(retired.status, 404, 'the retired report reader is absent: ' + path);
    }
    await assert.rejects(bridge.execute('knowledge_batch_start', {request:{}}), /Unknown operation/);
    const request = {dataset_ids: data.dataset_ids, analysis_kind: module, submission_id: randomUUID(),
      system_prompt:data.system_prompt[module]+'\n系统自定义：按工具提交。',
      ...(module === 'exploration' ? {normal_images: data.normal_images, defect_images:data.defect_images, prompt: data.exploration_prompt} : {mining_prompt: data.mining_prompt})};
    if(module==='exploration')request.prompt={...request.prompt,text:'用户自定义：比较边缘。'};
    const {analysis_kind, ...toolArguments} = request;
    const started = await ctx.tools.execute({name: module === 'exploration' ? 'direction_exploration_start' : 'knowledge_mine',
      arguments: toolArguments, callId: 'start-analysis', signal: new AbortController().signal});
    assert.equal(started.isError, false, JSON.stringify(started));
    const response = await fetch(base + '/analysis/start', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(request)});
    assert.equal(response.status, 200, await response.clone().text());
    const job = await response.json();
    assert.equal(started.value.run_id, job.run_id, 'the public tool and HTTP share the same idempotent write entry');
    assert.equal(toolPresentation(started.value).links.find(link => link.label === '查看作业').location.pageId,
      module === 'exploration' ? 'industrial-exploration' : 'industrial-knowledge');
    const frozen=await bridge.execute('analysis_agent_snapshot',{run_id:job.run_id});
    assert.deepEqual(frozen.plan.sampling_ratio,{normal:1,abnormal:1});
    assert.deepEqual(frozen.plan.rounds.map(round=>[round.sampling_counts.normal,round.sampling_counts.abnormal]),expectedCounts);
    await scheduler.whenIdle();
    let status = await (await fetch(base + '/analysis/status/' + job.run_id)).json();
    if(initialFailure){
      assert.equal(status.status,'FAILED');
      assert.deepEqual([status.completed,status.failed,status.unprocessed],[0,0,19]);
      assert.equal(status.analysis_version_id,null);
      assert.match(status.execution_error.message,/controlled initial provider failure/);
      const nativeCalls=status.model_calls.filter(call=>call.source==='native_llm');
      assert.equal(nativeCalls.length,1);
      assert.ok(nativeCalls[0].error);
      assert.equal(wire.length,1);
      const context=await bridge.execute('analysis_agent_context',{run_id:job.run_id});
      const session=await host.read(context.session_id);
      assert.ok(session.events.some(event=>event.type==='turn/end'));
      assert.ok(!session.events.some(event=>event.type==='tool/call'));
      const results=await(await fetch(base+'/analysis/results/'+job.run_id)).json();
      assert.equal(results.publication,null);
      assert.deepEqual((await(await fetch(base+'/analysis/directions?'+new URLSearchParams({dataset_ids:JSON.stringify(data.dataset_ids)}))).json()).directions,[]);
      if(browser)await browser.verifyAnalysisPage(base.replace('/api/iad',''),module,{initialFailure});
      assert.equal(wire.length,1);assert.deepEqual(errors,[]);return;
    }
    let partialVersionId;
    let partialArchive,partialArchivePath;
    if (capacityStop) {
      assert.equal(status.status, 'PARTIAL',JSON.stringify({execution:status.execution_error,provider:errors}));
      assert.deepEqual([status.completed,status.failed,status.unprocessed], [12,0,7],JSON.stringify({execution:status.execution_error,provider:errors}));
      assert.match(status.execution_error.message, /context|上下文/i);
      const partial = await bridge.execute('analysis_agent_publication', {version_id:status.analysis_version_id});
      partialVersionId = partial.version_id;
      const exported=await fetch(base+'/analysis/publications/'+partial.version_id+'/export');
      assert.equal(exported.status,200);partialArchive=Buffer.from(await exported.arrayBuffer());
      partialArchivePath=(await bridge.execute('analysis_export',{version_id:partial.version_id})).path;
      assert.equal(partial.catalog.checks.length, 3);
      assert.equal(wire.length, 6, 'partial publication makes no finishing model request');
      const session = await bridge.execute('analysis_agent_context', {run_id:job.run_id});
      const changed=await fetch(base+'/settings/modules/knowledge',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({expected_revision:1,settings:{batch_size:1,sampling_ratio:{normal:3,abnormal:1}}})});
      assert.equal(changed.status,200,await changed.clone().text());
      assert.deepEqual(await bridge.execute('analysis_agent_snapshot',{run_id:job.run_id}),frozen);
      blockCapacity = false;
      const resumed = await fetch(base + '/analysis/retry/' + job.run_id, {method:'POST', headers:{'Content-Type':'application/json'}, body:'{}'});
      assert.equal(resumed.status, 200, await resumed.clone().text());
      assert.equal((await resumed.json()).run_id, job.run_id);
      await scheduler.whenIdle();
      status = await (await fetch(base + '/analysis/status/' + job.run_id)).json();
      assert.equal((await bridge.execute('analysis_agent_context', {run_id:job.run_id})).session_id, session.session_id);
      assert.deepEqual(await bridge.execute('analysis_agent_publication', {version_id:partial.version_id}), partial,
        'continuing the job preserves the exact published partial version');
      assert.notEqual(status.analysis_version_id, partial.version_id,JSON.stringify({error:status.execution_error,errors}));
      await fs.unlink(partialArchivePath);
      const restored=await fetch(base+'/analysis/publications/'+partial.version_id+'/export');
      assert.equal(restored.status,200,restored.ok?'':await restored.text());
      assert.deepEqual(Buffer.from(await restored.arrayBuffer()),partialArchive,
        'a partial export rebuilt after resume keeps its exact original trace, model calls and publication');
    }
    assert.equal(status.status,'COMPLETED',JSON.stringify({execution:status.execution_error,provider:errors,samples:status.errors}));
    assert.equal(status.completed, 19);
    assert.equal(status.failed, 0);
    assert.deepEqual(status.batch_runs, []);
    assert.ok(status.analysis_version_id);
    const publication = await bridge.execute('analysis_agent_publication', {version_id: status.analysis_version_id});
    assert.equal(publication.coverage.completed, 19);
    assert.equal(publication.coverage.failed, 0);
    assert.equal(publication.coverage.unprocessed, 0);
    assert.equal(publication.coverage.whole_images_observed, 19);
    assert.equal(publication.coverage.prepared_visuals,19+expectedCounts.length);
    assert.equal(publication.coverage.observed_visuals,19+expectedCounts.length);
    assert.equal(publication.catalog[module === 'exploration' ? 'directions' : 'checks'].length, emptyCatalog ? 0 : capacityStop ? 4 : 1);
    const resultsResponse = await fetch(base + '/analysis/results/' + job.run_id);
    assert.equal(resultsResponse.status, 200, await resultsResponse.clone().text());
    const results = await resultsResponse.json();
    assert.equal(results.publication.version_id, status.analysis_version_id);
    assert.ok(results.publication.evidence.length > 0);
    const crops=results.publication.evidence.filter(item=>item.image.source==='model');
    assert.equal(crops.length,expectedCounts.length);
    assert.ok(crops.every(item=>JSON.stringify(item.image.crop_bbox)==='[1,2,7,9]'&&item.image.sent_size[0]===6));
    const sources = await (await fetch(base + '/analysis/sources?' + new URLSearchParams({dataset_ids: JSON.stringify(data.dataset_ids)}))).json();
    assert.equal(sources.items.length, 19, 'selection reads all registrations, including unknown annotations');
    assert.equal(new Set(sources.items.map(item => item.sample_id)).size, 19);
    const image = results.publication.evidence[0].image;
    const pixels = await fetch(base + `/${module === 'exploration' ? 'exploration' : 'knowledge'}/evidence/${status.analysis_version_id}/${image.evidence_id}`);
    assert.equal(pixels.status, 200, await pixels.clone().text());
    assert.equal(createHash('sha256').update(Buffer.from(await pixels.arrayBuffer())).digest('hex'), image.sha256);
    if (module === 'knowledge') {
      const read = await ctx.tools.execute({name:'knowledge_get', arguments:{version_id:status.analysis_version_id},
        callId:'read-native-knowledge', signal:new AbortController().signal});
      assert.equal(read.isError, false, JSON.stringify(read));
      assert.equal(read.value.version_id, status.analysis_version_id);
      const byRun=await ctx.tools.execute({name:'knowledge_get',arguments:{run_id:job.run_id},
        callId:'read-native-knowledge-run',signal:new AbortController().signal});
      assert.equal(byRun.isError,false,JSON.stringify(byRun));
      assert.equal(byRun.value.publication.version_id,status.analysis_version_id);
      await assert.rejects(bridge.execute('knowledge_get',{run_id:job.run_id,version_id:status.analysis_version_id}),/作业run_id或发布version_id之一/);
      assert.equal(status.knowledge_version_id, status.analysis_version_id);
      const versions = await (await fetch(base + '/knowledge/versions?dataset_id=' + data.dataset_ids[0])).json();
      assert.equal(versions.versions[0].version_id, status.analysis_version_id);
      const detailResponse = await fetch(base + '/knowledge/details?' + new URLSearchParams({version_id: status.analysis_version_id}));
      assert.equal(detailResponse.status, 200, await detailResponse.clone().text());
      assert.ok((await detailResponse.json()).items.some(item => item.check_id === 'K1'));
      const observedResponse=await fetch(base+'/analysis/publications/'+status.analysis_version_id+'/observations?page_size=5');
      assert.equal(observedResponse.status,200,await observedResponse.clone().text());
      const observed=await observedResponse.json();
      assert.equal(observed.total,19);assert.equal(observed.items.length,5);
      assert.equal(observed.selected_directions[0].ref,'D1');
      assert.ok(observed.items.every(item=>item.directions[0].status==='applicable'&&[1,2].includes(item.evidence_ids.length)),JSON.stringify(observed.items));
      const filtered=await(await fetch(base+'/analysis/publications/'+status.analysis_version_id+'/observations?'+
        new URLSearchParams({direction_ref:'D1',sample_id:observed.items[0].sample_id}))).json();
      assert.equal(filtered.total,1);assert.deepEqual(filtered.items,[observed.items[0]]);
      if(partialVersionId){
        const partial=await(await fetch(base+'/analysis/publications/'+partialVersionId+'/observations?page_size=50')).json();
        assert.equal(partial.total,12,'a resumed job cannot add new observations to its old partial publication');
        assert.ok(partial.items.every(item=>item.revision<=3));
      }
    }
    const context = await bridge.execute('analysis_agent_context', {run_id: job.run_id});
    assert.equal(context.round, null);
    const rounds = module === 'exploration' ? 4 : 5;
    assert.ok(context.revision > rounds);assert.equal(publication.finalization.complete,true);
    if (module === 'exploration') assert.deepEqual(context.catalog.directions.map(direction=>direction.direction_id),emptyCatalog?[]:['edge']);
    else {
      const check = context.catalog.checks.find(item => item.check_id === 'K1');
      assert.equal(check.independent_source_count, 1);
      assert.equal(check.status, 'provisional');
    }
    assert.equal(wire.length, rounds * 2 + (capacityStop ? 1 : 0) + finalizationCalls);
    if(capacityStop)assert.equal(reopenedHistory.length,2);
    assert.deepEqual(errors, []);
    const location = await bridge.execute('analysis_agent_session_location', {session_id: context.session_id});
    const file = analysisSessionPath(root, location);
    assert.equal(await host.exportJsonl(context.session_id), await fs.readFile(file, 'utf8'));
    const sessionResponse = await fetch(base + '/analysis/session/' + job.run_id + '.jsonl');
    assert.equal(sessionResponse.status, 200, await sessionResponse.clone().text());
    assert.equal(await sessionResponse.text(), await host.exportJsonl(context.session_id));
    const session = await host.read(context.session_id);
    const finalizationTurns=session.events.filter(event=>event.type==='tool/call'&&event.data.name===module+'_finalize').length;
    assert.equal(new Set(session.events.filter(event => event.type === 'user/message' && event.data.source.kind==='user').map(event=>event.data.id)).size, rounds + (capacityStop ? 1 : 0) + finalizationTurns);
    assert.ok(!session.events.some(event=>event.type==='user/message'&&event.data.source.kind==='analysis-checkpoint'));
    assert.equal(status.model_calls.filter(call => call.source === 'native_llm'&&!call.error).length, rounds * 2 + (capacityStop ? 1 : 0) + finalizationCalls);
    assert.equal(status.model_calls.some(call=>call.source==='native_llm'&&!!call.error),!!capacityStop);
    assert.equal(status.model_calls.filter(call => call.source === 'native_llm').every(call => call.session_id === context.session_id), true);
    if (browser) await browser.verifyAnalysisPage(base.replace('/api/iad', ''), module, {partialVersionId,emptyCatalog});
    if (module === 'exploration') {
      const choicesUrl = base + '/analysis/directions?' + new URLSearchParams({dataset_ids: JSON.stringify(data.dataset_ids)});
      const choices = await (await fetch(choicesUrl)).json();
      if(emptyCatalog){assert.deepEqual(choices.directions,[]);return;}
      assert.deepEqual(choices.directions[0].source, {origin:'explored', run_id:job.run_id, version_id:status.analysis_version_id, direction_id:'edge'});
      const removal = await fetch(base + '/exploration/directions/remove', {method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({dataset_id:publication.catalog.directions[0].dataset_ids[0], version_id:status.analysis_version_id, direction_id:'edge'})});
      assert.equal(removal.status, 200, await removal.clone().text());
      assert.deepEqual((await (await fetch(choicesUrl)).json()).directions, []);
      assert.equal((await bridge.execute('analysis_agent_publication', {version_id:status.analysis_version_id})).catalog.directions.length, 1,
        'maintenance does not rewrite the published model result');
    }
  } finally {await scheduler.dispose();removeRouting();await host.dispose();bridge.destroy();await plugin.dispose();await new Promise(resolve => server.close(resolve));}
});
