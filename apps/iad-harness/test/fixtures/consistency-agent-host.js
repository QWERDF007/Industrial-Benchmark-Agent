import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {v5 as uuidV5} from 'uuid';
import {Context} from '@deepseek-ai/cordis';
import {LlmRuntime} from '@deepseek-ai/dsh-llm';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import {PythonBridge, findWorkspaceRoot, resolvePythonPath} from '../../lib/server/python-bridge/index.js';
import {JobSessionHost} from '../../lib/server/sessions/host.js';
import {imageSessionPath} from '../../lib/server/sessions/image-path.js';
import {ConsistencyAnchorReviewer} from '../../lib/server/consistency/anchor-reviewer.js';
import {ConsistencyCheckScheduler} from '../../lib/server/consistency/scheduler.js';
import {NativeProviders} from '../../lib/server/models/providers.js';
import {chatRequest,sendResponses} from './responses.js';

export async function createConsistencyAgentHost({multiCandidate = false, withSimilarCandidate = false, candidateCount, maxVisualInputs, maxCandidatesPerPage, observeAllPages = false, splitFirstPage = false, agentUsage, agentFinish, agentTokenize, agentServerContext = 32768, indexMode, afterSubmission, modelRouting, onGeneration, bridgeTimeoutMs, protocol='openai-completions', taskType='bbox_defect'} = {}) {
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
      const body = chatRequest(JSON.parse(source));
      body.test_role = JSON.stringify(body.messages.at(-1)).includes('compaction engine')?'compaction':body.tools?.length?'agent':'vision';
      if (req.url === '/tokenize') {
        tokenizations.push(body);
        if (body.test_role === 'agent') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(agentTokenize ? await agentTokenize(body) : {count: 1000, max_model_len: 32768}));return;
        }
        const count = maxCandidatesPerPage === undefined ? 1000 : Object.keys(JSON.parse(
          body.messages.find(message=>message.role==='user').content[1].text).facts?.candidates || {}).length > maxCandidatesPerPage ? 32700 : 1000;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({count, max_model_len: 32768}));
        return;
      }
      if (body.test_role === 'agent') {
        for (const message of body.messages) {
          if(message.role!=='user'&&message.role!=='tool')continue;
          const text=typeof message.content==='string'?message.content:message.content.find(part=>part.type==='text')?.text;
          if (text?.startsWith('{')) {
            const item=JSON.parse(text.split('\n')[0]);
            if (item.anchor_id || item.anchor?.anchor_id) activeAnchor = item.anchor_id || item.anchor.anchor_id;
          }
        }
        agentOwners.set(body, activeAnchor);
      }
      wires.push(body);
      if (onGeneration) await onGeneration(body,res);
      if(res.writableEnded)return;
      const capacity = body.test_role === 'agent' && agentTokenize ? await agentTokenize(body) : undefined;
      if (capacity && capacity.count + (body.max_completion_tokens ?? body.max_tokens) > agentServerContext) {
        res.writeHead(400, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: {message: 'actual tokenizer: request exceeds declared context length'}}));
        return;
      }
      if (body.test_role === 'agent' && rejectNextPlanner) {
        rejectNextPlanner = false;
        res.writeHead(401, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: {message: 'fixture provider rejected this actual request'}}));
        return;
      }
      const isHeld = body.test_role === 'agent' && holdNextPlanner;
      if (isHeld) {holdNextPlanner = false;held.resolve();await release.promise;}
      let delta, finish = 'stop';
      if(JSON.stringify(body.messages.at(-1)).includes('compaction engine')){
        delta={content:'Preserve saved observations and assessments. Read anchor_context for current pending candidates and original evidence.'};
      } else if (body.test_role === 'vision' && !JSON.parse(body.messages.find(message=>message.role==='user').content[1].text).facts) {
        const context=JSON.parse(body.messages.find(message=>message.role==='user').content[1].text);
        const finding={relation:'content_different',reason:'实际原图颜色不同。',
          main_description:'当前图像的主体颜色。',candidate_description:'候选图像的主体颜色不同。'};
        delta={content:JSON.stringify({overview:context.scope==='joint'?finding:null,
          windows:context.windows.map(window=>({window_index:window.window_index,region_pair_id:window.region_pair_id,main_media_id:window.main_media_id,candidate_media_id:window.candidate_media_id,...finding})),
          media_ids:context.required_image_ids,limitations:[]})};
      } else if (body.test_role === 'vision') {
        const content = body.messages.find(message=>message.role==='user').content;
        const facts = JSON.parse(content[1].text).facts;
        const groups = content.filter(item => item.type === 'text' && item.text.startsWith('原图资料：'))
          .map(item => JSON.parse(item.text.slice(5)));
        assert.equal(groups.length, Object.keys(facts.candidates).length + 1);
        assert.ok(content.filter(item => item.type === 'text' && item.text.startsWith('图像视图：'))
          .every(item => !Object.hasOwn(JSON.parse(item.text.slice(5)), 'evidence_id')));
        assert.ok(content.some(item => item.type === 'image_url' && item.image_url.url.startsWith('data:image/png;base64,')));
        delta = {content: JSON.stringify({observations: Object.keys(facts.candidates).map(candidate_id => ({
          candidate_id, description: '依据实际原图与原始标注核对两侧可比现象、类别与数量',
          phenomena_comparable: true, appearance_explains_annotation_difference: false,
          media_ids: groups.filter(group => [facts.anchor.sample_id, candidate_id].includes(group.sample_id)).map(group => group.evidence_id), limitations: [],
        }))})};
        if (observationsBeforeHold > 0 && (heldAnchorId === undefined || facts.anchor.sample_id === heldAnchorId)
            && --observationsBeforeHold === 0) holdNextPlanner = true;
      } else {
        assert.equal(body.test_role, 'agent');
        const outputs = body.messages.filter(item => item.role === 'tool' && !item.content.startsWith('Error:')).map(item=>JSON.parse(item.content));
        const context = outputs.findLast(item => item.anchor);
        let name, args, observationRequests;
        if (!context) {name = 'anchor_context';args = {};}
        else if(context.phase==='gate') {
          const completed=new Set(outputs.filter(item=>item.phase==='gate'&&item.execution_status==='completed').map(item=>item.candidate_id));
          const candidate=context.pending_candidate_ids.find(identity=>!completed.has(identity));
          if(!candidate){name='anchor_context';args={};}
          else {
            const observation=[...context.gate_observations,...outputs.filter(item=>item.phase==='gate'&&item.observation_id)]
              .findLast(item=>item.candidate_id===candidate&&item.expected_revision===context.gate_revisions[candidate]);
            if(observation){name='anchor_assess';args={phase:'gate',request_id:'gate-'+candidate,
              fingerprint:context.fingerprint,candidate_id:candidate,expected_revision:context.gate_revisions[candidate],
              observation_ids:[observation.observation_id]};}
            else{name='anchor_observe';args={phase:'gate',request_id:'gate-view-'+candidate,fingerprint:context.fingerprint,
              candidate_ids:[candidate],gate_revisions:{[candidate]:context.gate_revisions[candidate]}};}
          }
        }
        else if(context.task_type==='anomaly_detection'&&context.phase==='audit') {
          const records=new Map([...context.assessments,...outputs.filter(item=>item.assessment_id)].map(item=>[item.candidate_id,item]));
          const candidate=context.candidate_ids.find(identity=>!records.has(identity));
          if(candidate){name='anchor_assess';args={phase:'audit',request_id:'label-'+candidate,fingerprint:context.fingerprint,
            candidate_id:candidate,expected_revision:context.gate_revisions[candidate]};}
          else{name='anchor_submit';args={request_id:'submit-'+context.anchor.anchor_id,fingerprint:context.fingerprint,
            assessment_ids:context.candidate_ids.map(identity=>records.get(identity).assessment_id)};}
        }
        else if(context.phase==='submit') {name='anchor_submit';args={request_id:'submit-'+context.anchor.anchor_id,fingerprint:context.fingerprint,assessment_ids:[]};}
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
            return {phase:'audit',request_id:'audit-'+candidate_id,candidate_id,expected_revision:context.gate_revisions[candidate_id],fingerprint: context.fingerprint,
              observation_ids: [record.observation_id], assessment: {candidate_id, verdict: count ? 'MATERIAL' : 'EQUIVALENT',
                explanation: `原始标注中，主图有${main.annotations.length}个标注，参考图有${other.annotations.length}个标注`,
                findings: count ? [conclusion] : [], issues: count ? [{
                  type: count > 0 ? 'extra_annotation' : 'missing_annotation',
                  main_annotation_ids: count > 0 ? main.annotations.map(item => item.annotation_id) : [],
                  candidate_annotation_ids: count < 0 ? other.annotations.map(item => item.annotation_id) : [],
                  media_ids: record.result.observations[0].media_ids,
                  description: '两侧同内容对象的登记标注数量不同。',
                  review_suggestion: '人工复核原始标注。', limitations: [],
                }] : []}};
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
            args = {request_id:'submit-'+context.anchor.anchor_id,fingerprint: context.fingerprint, assessment_ids: records.map(item => item.assessment_id)};
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
      if (body.test_role === 'agent' && agentFinish === 'length') {
        delta = {reasoning_content: '本次输出在工具调用前达到预算。'};finish = 'length';
      }
      if(protocol==='openai-responses') {
        sendResponses(res,body.model,delta);
        if(isHeld)lateResponse.resolve();
        return;
      }
      res.writeHead(200, {'Content-Type': 'text/event-stream'});
      const id = 'chatcmpl_' + randomUUID();
      res.end('data: ' + JSON.stringify({id, object: 'chat.completion.chunk', created: 1, model: body.model,
        choices: [{index: 0, delta: {role: 'assistant', ...delta}, finish_reason: null}]}) + '\n\n' +
        'data: ' + JSON.stringify({id, object: 'chat.completion.chunk', created: 1, model: body.model,
          choices: [{index: 0, delta: {}, finish_reason: finish}], usage: capacity ? {prompt_tokens: capacity.count, completion_tokens: 100, total_tokens: capacity.count + 100}
            : body.test_role === 'agent' && agentUsage === null ? undefined
            : body.test_role === 'agent' && agentUsage ? agentUsage : {prompt_tokens: 1000, completion_tokens: 100, total_tokens: 1100}})
        + '\n\ndata: [DONE]\n\n');
      if (isHeld) lateResponse.resolve();
    } catch (error) {
      res.writeHead(500, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({error: {message: error.message}}));
    }
  });
  await new Promise(resolve => provider.listen(0, '127.0.0.1', resolve));
  const endpoint = `http://127.0.0.1:${provider.address().port}/v1/${protocol==='openai-responses'?'responses':'chat/completions'}`;
  const dataset = JSON.parse(execFileSync(resolvePythonPath(), ['-c', `
import json,sys
from pathlib import Path
from PIL import Image
from iad_core.storage.database import Database
from iad_core.dataset.registry import DatasetRegistry,DatasetImport
from iad_core.workbench.module_settings import ModuleSettings
root=Path(sys.argv[1]);images=root/'images';images.mkdir();labels=root/'labels';labels.mkdir()
names=['A','B','C','D'] if sys.argv[3]=='multi' else ['A','B']
count=json.loads(sys.argv[6])
if count is not None: names=['A',*[f'R{index:02d}' for index in range(count)]]
for name in names:
    Image.new('RGB',(40,40),'green' if name=='C' else 'blue').save(images/(name+'.png'))
    shapes=[{'label':'scratch','shape_type':'rectangle','points':[[10,10],[20,20]]}] if name in ('A','D') or name=='C' and sys.argv[7]=='true' else []
    (labels/(name+'.json')).write_text(json.dumps({'imageWidth':40,'imageHeight':40,'shapes':shapes}))
db=Database(sys.argv[2])
if sys.argv[8]=='anomaly_detection':
    from iad_core.dataset.folder_preview import preview_folder_dataset
    from iad_core.task.config import FolderRule
    for name in names:
        destination=images/('anomaly' if name=='B' else 'normal');destination.mkdir(exist_ok=True)
        (images/(name+'.png')).rename(destination/(name+'.png'))
    rules=[FolderRule(path='normal',role='normal'),FolderRule(path='anomaly',role='anomaly')]
    preview=preview_folder_dataset(str(images),rules=rules)
    config=DatasetRegistry(db).import_dataset({'format':'folder_classification','name':'私有图像级审核','root_dir':str(images),
        'rules':[rule.model_dump() for rule in rules],'preview_fingerprint':preview.preview_fingerprint})
else:
    config=DatasetRegistry(db).import_labelme(DatasetImport(format='labelme',name='私有双角色审核',image_dir=str(images),annotation_dir=str(labels),annotation_policy={'annotation_coverage':'EXHAUSTIVE'}))
identities={name:config.dataset.id+':'+(('anomaly/' if name=='B' else 'normal/') if sys.argv[8]=='anomaly_detection' else '')+name+'.png' for name in names}
if sys.argv[5] != 'none':
    from tests.feature_fixtures import configure_test_encoder,MockFeatureExtractor
    from iad_core.feature.cache import ContentFeatureCache
    selection=configure_test_encoder(db,root)
    if sys.argv[5] in ('cached','partial'):
        ContentFeatureCache(db).prepare([identities[name] for name in (names if sys.argv[5]=='cached' else ['A'])],selection,
            extractor=MockFeatureExtractor(profile=selection.profile))
if sys.argv[7]=='true':
    import numpy as np
    from iad_core.duplicate.index import PixelIndex
    from iad_core.storage.features import FeatureRepository
    from iad_core.storage.models import FeatureRecord
    for name in names:
        vector=np.zeros(selection.profile.dim,dtype=selection.profile.storage_dtype);vector[0]=1
        FeatureRepository(db).upsert(FeatureRecord(content_group_id=PixelIndex(db).get(identities[name]).content_group_id,
            profile_id=selection.profile.profile_id,dim=selection.profile.dim,dtype=selection.profile.storage_dtype,embedding_blob=vector.tobytes()))
retrieval={'mode':'combined','min_similarity':0.9} if sys.argv[7]=='true' else {'mode':'exact'}
ModuleSettings(db).save({'module':'consistency','expected_revision':0,'settings':{**retrieval,'agent_limits':{'max_output_tokens':4096,'request_parameters':{'temperature':0.2}},'vision_limits':{'capacity_mode':'vllm_tokenize','max_output_tokens':4096,'max_visual_inputs':json.loads(sys.argv[4]),'request_parameters':{'temperature':0.2}},'model':{'provider_id':'isolated','model_id':'vision'}}})
print(json.dumps({'dataset_id':config.dataset.id,'sample_ids':identities}))
`, root, database, multiCandidate ? 'multi' : 'pair', JSON.stringify(maxVisualInputs ?? null), indexMode ?? (withSimilarCandidate?'cached':'none'), JSON.stringify(candidateCount ?? null), JSON.stringify(withSimilarCandidate),taskType], {cwd: workspace, env: {...process.env, PYTHONPATH: path.join(workspace, 'python')}, encoding: 'utf8'}));
  const bridge = new PythonBridge({cwd: workspace, dbPath: database, timeoutMs: bridgeTimeoutMs});
  const host = await JobSessionHost.open(path.join(root, 'sessions'),
    async session_id => imageSessionPath(path.join(root, 'sessions'), await bridge.execute('consistency_agent_session_location', {session_id})));
  const ctx = new Context();
  new LlmRuntime(ctx);
  const providers = {isolated: {api: protocol, baseURL: endpoint.replace(/\/(?:chat\/completions|responses)$/, ''),
    apiKeyEnv: 'LOCAL_TEST_KEY', retryPolicy: {mode: 'normal', maxRetries: 0}, models: [
      {id: 'planner', input: ['text'], contextWindow: 32768, maxTokens: 4096},
      {id: 'vision', input: ['text', 'image'], contextWindow: 32768, maxTokens: 4096,
        ...(protocol==='openai-responses'?{reasoningEfforts:{low:'low',medium:'medium',high:'high',xhigh:'xhigh'}}:{})}]}};
  ctx.provide('settings', {configure: () => () => {}, describe: () => [{ns: 'llm-pi-ai', revision: 1, value: {providers}}]});
  ctx.provide('credentials', {resolve: async () => ({value: 'isolated-test-key'})});
  const fork = await ctx.plugin(piAi, {providers});
  const native = new NativeProviders(() => ctx);
  const reviewer = new ConsistencyAnchorReviewer(bridge, host, native);
  const scheduler = new ConsistencyCheckScheduler(bridge, host, native, task => reviewer.review(task), error => errors.push(error));
  const removeRouting = bridge.useModelRouting({execute: async (operation, args, signal, dispatch) => {
    const result = modelRouting?await modelRouting.execute(operation,args,signal,(name,values={},cancellation)=>scheduler.execute(name,values,cancellation,dispatch)):
      await scheduler.execute(operation, args, signal, dispatch);
    if (operation === 'consistency_agent_submit' && afterSubmission) await afterSubmission(args);
    return result;
  }});
  return {root, database, endpoint, datasetId: dataset.dataset_id, sampleIds:dataset.sample_ids, bridge, host, scheduler, native, wires, tokenizations, errors, held, release, lateResponse,
    agentRequests(anchorId) {return wires.filter(body => body.test_role === 'agent' && [anchorId,uuidV5('iad:sample:'+anchorId,uuidV5.URL)].includes(agentOwners.get(body)));},
    holdPlanner() {holdNextPlanner = true;},
    holdPlannerAfterObservation(count = 1, anchorId) {observationsBeforeHold = count;heldAnchorId = anchorId;},
    queueSubmissionFaults(faults) {submissionFaults.push(...faults);},
    rejectPlanner() {rejectNextPlanner = true;},
    async close() {
      release.resolve();await scheduler.dispose();removeRouting();bridge.destroy();await host.dispose();await fork.dispose();
      await new Promise(resolve => provider.close(resolve));await fs.rm(root, {recursive: true, force: true});
    }};
}
