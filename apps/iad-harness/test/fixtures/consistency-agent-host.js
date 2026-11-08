import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {Context} from '@deepseek-ai/cordis';
import {LlmRuntime} from '@deepseek-ai/dsh-llm';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import {PythonBridge, findWorkspaceRoot, resolvePythonPath} from '../../lib/server/python-bridge/index.js';
import {ConsistencySessionHost} from '../../lib/server/consistency/session-host.js';
import {ConsistencyAnchorReviewer} from '../../lib/server/consistency/anchor-reviewer.js';
import {ConsistencyCheckScheduler} from '../../lib/server/consistency/scheduler.js';
import {NativeProviders} from '../../lib/server/models/providers.js';

export async function createConsistencyAgentHost({multiCandidate = false, candidateCount, maxVisualInputs, maxCandidatesPerPage, observeAllPages = false, splitFirstPage = false, agentUsage, agentFinish, agentTokenize, agentServerContext = 32768, indexMode, afterSubmission} = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-anchor-agent-'));
  const workspace = findWorkspaceRoot();
  const database = path.join(root, 'checks.db');
  const wires = [], tokenizations = [], errors = [];
  const agentOwners = new WeakMap();
  let activeAnchor;
  const submissionFaults = [];
  let holdNextPlanner = false;
  let observationsBeforeHold = 0;
  let heldAnchorId;
  let rejectNextPlanner = false;
  const held = Promise.withResolvers(), release = Promise.withResolvers(), lateResponse = Promise.withResolvers();
  const provider = http.createServer(async (req, res) => {
    try {
      assert.equal(req.headers.authorization, 'Bearer isolated-test-key');
      let source = '';
      for await (const chunk of req) source += chunk;
      const body = JSON.parse(source);
      if (req.url === '/tokenize') {
        tokenizations.push(body);
        if (body.model === 'planner') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(agentTokenize ? await agentTokenize(body) : {count: 1000, max_model_len: 32768}));return;
        }
        const count = maxCandidatesPerPage === undefined ? 1000 : Object.keys(JSON.parse(
          body.messages[0].content[0].text.split('冻结视觉输入：')[1].split('\n')[0]).candidates).length > maxCandidatesPerPage ? 32700 : 1000;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({count, max_model_len: 32768}));
        return;
      }
      if (body.model === 'planner') {
        for (const message of body.messages) {
          if ((message.role === 'user' || message.role === 'tool') && typeof message.content === 'string' && message.content.startsWith('{')) {
            const item = JSON.parse(message.content);
            if (item.anchor_id || item.anchor?.anchor_id) activeAnchor = item.anchor_id || item.anchor.anchor_id;
          }
        }
        agentOwners.set(body, activeAnchor);
      }
      wires.push(body);
      const capacity = body.model === 'planner' && agentTokenize ? await agentTokenize(body) : undefined;
      if (capacity && capacity.count + (body.max_completion_tokens ?? body.max_tokens) > agentServerContext) {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: {message: 'actual tokenizer: request exceeds declared context length'}}));
        return;
      }
      if (body.model === 'planner' && rejectNextPlanner) {
        rejectNextPlanner = false;
        res.writeHead(401, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: {message: 'fixture provider rejected this actual request'}}));
        return;
      }
      const isHeld = body.model === 'planner' && holdNextPlanner;
      if (isHeld) {holdNextPlanner = false;held.resolve();await release.promise;}
      let delta, finish = 'stop';
      if (body.model === 'vision') {
        const content = body.messages[0].content;
        const facts = JSON.parse(content[0].text.split('冻结视觉输入：')[1].split('\n')[0]);
        const media = content.filter(item => item.type === 'text' && item.text.startsWith('视觉证据：'))
          .map(item => JSON.parse(item.text.slice(5)).evidence_id);
        assert.ok(content.some(item => item.type === 'image_url' && item.image_url.url.startsWith('data:image/png;base64,')));
        delta = {content: JSON.stringify({observations: Object.keys(facts.candidates).map(candidate_id => ({
          candidate_id, description: '依据实际原图与原始标注核对两侧可比现象、类别与数量',
          phenomena_comparable: true, appearance_explains_annotation_difference: false, media_ids: media, limitations: [],
        }))})};
        if (observationsBeforeHold > 0 && (heldAnchorId === undefined || facts.anchor.sample_id === heldAnchorId)
            && --observationsBeforeHold === 0) holdNextPlanner = true;
      } else if (body.messages.at(-1)?.role === 'user' && JSON.stringify(body.messages.at(-1).content).includes('You are now acting as a compaction engine')) {
        delta = {content: '本场继续审核冻结主图。通过anchor_context读取最新候选、已保存评估和未完成观察；复用成功记录，逐候选评估后引用全部最新assessment_ids提交。'};
      } else {
        assert.equal(body.model, 'planner');
        const outputs = body.messages.filter(item => item.role === 'tool' && !item.content.startsWith('Error:')).map(item => JSON.parse(item.content));
        const context = outputs.findLast(item => item.anchor);
        let name, args, observationRequests;
        if (!context) {name = 'anchor_context';args = {};}
        else if (outputs.at(-1)?.reason !== 'MODEL_REVIEWED') {
          const observed = new Map([...context.observation_index, ...outputs.filter(item => item.observation_id && item.request_id)]
            .map(item => [item.request_id, item]));
          const assessed = new Map([...context.assessments, ...outputs.filter(item => item.assessment_id)]
            .map(item => [item.candidate_id, item]));
          const bound = new Map(outputs.flatMap(item => item.observations || []).map(item => [item.candidate_id, item]));
          const pendingAssessment = context.candidate_ids.find(identity => bound.has(identity) && !assessed.has(identity));
          const pendingRead = context.candidate_ids.filter(identity => !assessed.has(identity)
            && [...observed.values()].some(item => item.candidate_ids.includes(identity)))
            .find(identity => !bound.has(identity));
          const pendingPage = context.anchor.visual_plan.pages.find(page => !observed.has(page.request_id)
            && page.candidate_ids.some(identity => !assessed.has(identity)));
          const candidateSubmission = candidate_id => {
            const record = bound.get(candidate_id);
            const sources = Object.values(record.facts.sources);
            const main = sources.find(item => item.sample_id === record.facts.anchor.sample_id);
            const other = sources.find(item => item.sample_id === candidate_id);
            const count = main.annotations.length - other.annotations.length;
            const conclusion = count > 0 ? '多类别' : count < 0 ? '少类别' : '一致';
            return {fingerprint: context.fingerprint,
              observation_ids: [record.observation_id], assessment: {candidate_id, verdict: count ? 'MATERIAL' : 'EQUIVALENT',
                categories: count ? [conclusion] : [], explanation: `原始标注中，主图有${main.annotations.length}个标注，参考图有${other.annotations.length}个标注`,
                findings: count ? [conclusion] : []}};
          };
          if (pendingRead) {name = 'anchor_context';args = {candidate_id: pendingRead};}
          else if (pendingAssessment) {name = 'anchor_assess';args = candidateSubmission(pendingAssessment);}
          else if (pendingPage) {
            name = 'anchor_observe';args = pendingPage;
            if (splitFirstPage) {args = {...pendingPage, candidate_ids: pendingPage.candidate_ids.slice(0, 3)};splitFirstPage = false;}
            if (observeAllPages) observationRequests = context.anchor.visual_plan.pages.filter(page => !observed.has(page.request_id));
          }
          else {
            const records = context.candidate_ids.map(identity => assessed.get(identity));
            name = 'anchor_submit';
            args = {fingerprint: context.fingerprint, assessment_ids: records.map(item => item.assessment_id)};
            const pendingFault = submissionFaults[0];
            const needed = pendingFault?.kind === 'foreign-reference' ? context.candidate_ids.slice(0, 1)
              : pendingFault?.kind === 'foreign-observation' ? [pendingFault.candidate_id] : [];
            if (needed.some(identity => !bound.has(identity))) {
              name = 'anchor_context';args = {candidate_id: needed[0]};
            } else {
            const fault = submissionFaults.shift();
            switch (fault?.kind) {
              case 'duplicate': args.assessment_ids[args.assessment_ids.length - 1] = args.assessment_ids[0];break;
              case 'omit': args.assessment_ids.pop();break;
              case 'foreign-reference':
                name = 'anchor_assess';args = candidateSubmission(context.candidate_ids[0]);
                args.assessment.candidate_id = 'candidate-outside-this-scene';break;
              case 'foreign-observation':
                name = 'anchor_assess';args = candidateSubmission(fault.candidate_id);
                args.observation_ids = [fault.observation_id];break;
            }
            }
          }
        }
        if (name) {
          finish = 'tool_calls';
          delta = {tool_calls: (observationRequests || [args]).map((input, index) => ({index,
            id: 'call_' + randomUUID(), type: 'function', function: {name, arguments: JSON.stringify(input)}}))};
        } else delta = {content: '主图审核已提交。'};
      }
      if (body.model === 'planner' && agentFinish === 'length') {
        delta = {reasoning_content: '本次输出在工具调用前达到预算。'};finish = 'length';
      }
      res.writeHead(200, {'Content-Type': 'text/event-stream'});
      const id = 'chatcmpl_' + randomUUID();
      res.end('data: ' + JSON.stringify({id, object: 'chat.completion.chunk', created: 1, model: body.model,
        choices: [{index: 0, delta: {role: 'assistant', ...delta}, finish_reason: null}]}) + '\n\n' +
        'data: ' + JSON.stringify({id, object: 'chat.completion.chunk', created: 1, model: body.model,
          choices: [{index: 0, delta: {}, finish_reason: finish}], usage: capacity ? {prompt_tokens: capacity.count, completion_tokens: 100, total_tokens: capacity.count + 100}
            : body.model === 'planner' && agentUsage === null ? undefined
            : body.model === 'planner' && agentUsage ? agentUsage : {prompt_tokens: 1000, completion_tokens: 100, total_tokens: 1100}})
        + '\n\ndata: [DONE]\n\n');
      if (isHeld) lateResponse.resolve();
    } catch (error) {
      res.writeHead(500, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({error: {message: error.message}}));
    }
  });
  await new Promise(resolve => provider.listen(0, '127.0.0.1', resolve));
  const endpoint = `http://127.0.0.1:${provider.address().port}/v1/chat/completions`;
  const dataset = JSON.parse(execFileSync(resolvePythonPath(), ['-c', `
import json,sys
from pathlib import Path
from PIL import Image
from iad_core.storage.database import Database
from iad_core.dataset.registry import DatasetRegistry,DatasetImport
from iad_core.workbench.module_settings import ModuleSettings
from iad_core.workbench.model_settings import WorkbenchModels
root=Path(sys.argv[1]);images=root/'images';images.mkdir();labels=root/'labels';labels.mkdir()
names=['A','B','C','D'] if sys.argv[3]=='multi' else ['A','B']
count=json.loads(sys.argv[6])
if count is not None: names=['A',*[f'R{index:02d}' for index in range(count)]]
for name in names:
    Image.new('RGB',(40,40),'green' if name=='C' else 'blue').save(images/(name+'.png'))
    shapes=[{'label':'scratch','shape_type':'rectangle','points':[[10,10],[20,20]]}] if name in ('A','D') else []
    (labels/(name+'.json')).write_text(json.dumps({'imageWidth':40,'imageHeight':40,'shapes':shapes}))
db=Database(sys.argv[2])
config=DatasetRegistry(db).import_labelme(DatasetImport(format='labelme',name='私有双角色审核',image_dir=str(images),annotation_dir=str(labels),annotation_policy={'annotation_coverage':'EXHAUSTIVE'}))
if sys.argv[5] != 'none':
    from tests.feature_fixtures import configure_test_encoder,MockFeatureExtractor
    from iad_core.feature.cache import ContentFeatureCache
    selection=configure_test_encoder(db,root)
    if sys.argv[5] in ('cached','partial'):
        ContentFeatureCache(db).prepare([config.dataset.id+':'+name+'.png' for name in (names if sys.argv[5]=='cached' else ['A'])],selection,
            extractor=MockFeatureExtractor(profile=selection.profile))
ModuleSettings(db).save({'module':'consistency','expected_revision':0,'settings':{'mode':'exact','agent_model':{'provider_id':'isolated','model_id':'planner'},'agent_limits':{'max_output_tokens':4096,'request_parameters':{'temperature':0.2}},'model':{'provider_id':'isolated','model_id':'vision'}}})
WorkbenchModels(db).save({'expected_revision':0,'selection':{'provider_id':'isolated','model_id':'vision','limits':{'capacity_mode':'vllm_tokenize','max_output_tokens':4096,'max_visual_inputs':json.loads(sys.argv[4]),'request_parameters':{'temperature':0.2}}}})
print(json.dumps({'dataset_id':config.dataset.id}))
`, root, database, multiCandidate ? 'multi' : 'pair', JSON.stringify(maxVisualInputs ?? null), indexMode ?? 'none', JSON.stringify(candidateCount ?? null)], {cwd: workspace, env: {...process.env, PYTHONPATH: path.join(workspace, 'python')}, encoding: 'utf8'}));
  const bridge = new PythonBridge({cwd: workspace, dbPath: database});
  const host = await ConsistencySessionHost.open(path.join(root, 'sessions'),
    session_id => bridge.execute('consistency_agent_session_location', {session_id}));
  const ctx = new Context();
  new LlmRuntime(ctx);
  const providers = {isolated: {api: 'openai-completions', baseURL: endpoint.replace('/chat/completions', ''),
    apiKeyEnv: 'LOCAL_TEST_KEY', retryPolicy: {mode: 'normal', maxRetries: 0}, models: [
      {id: 'planner', input: ['text'], contextWindow: 32768, maxTokens: 4096},
      {id: 'vision', input: ['text', 'image'], contextWindow: 32768, maxTokens: 4096}]}};
  ctx.provide('settings', {configure: () => () => {}, describe: () => [{ns: 'llm-pi-ai', revision: 1, value: {providers}}]});
  ctx.provide('credentials', {resolve: async () => ({value: 'isolated-test-key'})});
  const fork = await ctx.plugin(piAi, {providers});
  const native = new NativeProviders(() => ctx);
  const reviewer = new ConsistencyAnchorReviewer(bridge, host, native);
  const scheduler = new ConsistencyCheckScheduler(bridge, host, native, task => reviewer.review(task), error => errors.push(error));
  const removeRouting = bridge.useModelRouting({execute: async (operation, args, signal, dispatch) => {
    const result = await scheduler.execute(operation, args, signal, dispatch);
    if (operation === 'consistency_agent_submit' && afterSubmission) await afterSubmission(args);
    return result;
  }});
  return {root, database, endpoint, datasetId: dataset.dataset_id, bridge, host, scheduler, native, wires, tokenizations, errors, held, release, lateResponse,
    agentRequests(anchorId) {return wires.filter(body => body.model === 'planner' && agentOwners.get(body) === anchorId);},
    holdPlanner() {holdNextPlanner = true;},
    holdPlannerAfterObservation(count = 1, anchorId) {observationsBeforeHold = count;heldAnchorId = anchorId;},
    queueSubmissionFaults(faults) {submissionFaults.push(...faults);},
    rejectPlanner() {rejectNextPlanner = true;},
    async close() {
      release.resolve();await scheduler.dispose();removeRouting();bridge.destroy();await host.dispose();await fork.dispose();
      await new Promise(resolve => provider.close(resolve));await fs.rm(root, {recursive: true, force: true});
    }};
}
