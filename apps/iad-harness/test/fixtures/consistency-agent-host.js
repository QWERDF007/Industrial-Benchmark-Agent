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
import {JobSessionHost} from '../../lib/server/sessions/host.js';
import {imageSessionPath} from '../../lib/server/sessions/image-path.js';
import {ConsistencyAnchorReviewer} from '../../lib/server/consistency/anchor-reviewer.js';
import {ConsistencyCheckScheduler} from '../../lib/server/consistency/scheduler.js';
import {NativeProviders} from '../../lib/server/models/providers.js';
import {chatRequest,sendResponses} from './responses.js';

export async function createConsistencyAgentHost({multiCandidate=false,withSimilarCandidate=false,candidateCount,
  maxVisualInputs,maxCandidatesPerPage,onTokenize,generationUsage,generationFinish,indexMode,afterSubmission,
  modelRouting,onGeneration,bridgeTimeoutMs,protocol='openai-completions',maxOutputTokens=4096,taskType='bbox_defect'}={}) {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-program-check-'));
  const workspace=findWorkspaceRoot(),database=path.join(root,'checks.db');
  const wires=[],tokenizations=[],errors=[];
  let holdNext=false,holdAt=null,rejectNext=false;
  const held=Promise.withResolvers(),release=Promise.withResolvers(),lateResponse=Promise.withResolvers();
  const provider=http.createServer(async(req,res)=>{
    try {
      assert.equal(req.headers.authorization,'Bearer isolated-test-key');
      let source='';for await(const chunk of req)source+=chunk;
      const body=chatRequest(JSON.parse(source));body.test_role='vision';
      if(req.url==='/tokenize') {
        tokenizations.push(body);
        const candidates=Object.keys(JSON.parse(body.messages.find(message=>message.role==='user').content[1].text).facts?.candidates||{});
        const count=maxCandidatesPerPage!==undefined&&candidates.length>maxCandidatesPerPage?32700:1000;
        res.setHeader('Content-Type','application/json');
        res.end(JSON.stringify(onTokenize?await onTokenize(body):{count,max_model_len:32768}));return;
      }
      wires.push(body);
      if(onGeneration)await onGeneration(body,res);
      if(res.writableEnded)return;
      if(rejectNext) {
        rejectNext=false;res.writeHead(401,{'Content-Type':'application/json'});
        res.end(JSON.stringify({error:{message:'fixture provider rejected this actual request'}}));return;
      }
      if(protocol==='openai-responses') {
        const pending=[body.responses.text.format.schema];
        while(pending.length) {
          const schema=pending.pop();
          if(!schema||typeof schema!=='object')continue;
          assert.ok(schema.type!=='object'||schema.additionalProperties===false);
          pending.push(...Object.values(schema));
        }
      }
      const isHeld=holdNext||holdAt===wires.length;
      if(isHeld){holdNext=false;holdAt=null;held.resolve();await release.promise;}
      const content=body.messages.find(message=>message.role==='user').content;
      const context=JSON.parse(content[1].text);
      let answer;
      if(!context.facts) {
        const finding={relation:'content_different',
          main_description:'蓝色主体。',candidate_description:'绿色主体。'};
        answer={overview:finding,summary:'两图主体颜色不同。',regions:Object.fromEntries([
          ...context.windows.map(region=>[region.ref,finding]),
          ...context.unmapped_regions.map(region=>[region.ref,{observation:'局部没有可靠的对侧对应位置。'}])]),limitations:[]};
      } else {
        const facts=context.facts,sources=Object.values(facts.sources),main=sources.find(source=>source.sample_id===facts.anchor.sample_id);
        const groups=content.filter(part=>part.type==='text'&&part.text.startsWith('原图资料：')).map(part=>JSON.parse(part.text.slice(5)));
        assert.equal(groups.length,Object.keys(facts.candidates).length+1);
        assert.ok(content.some(part=>part.type==='image_url'&&part.image_url.url.startsWith('data:image/png;base64,')));
        assert.ok(content.filter(part=>part.type==='text'&&part.text.startsWith('图像视图：')).every(part=>!Object.hasOwn(JSON.parse(part.text.slice(5)),'evidence_id')));
        answer={reviews:Object.fromEntries(Object.keys(facts.candidates).map(identity=>{
          const candidate=sources.find(source=>source.sample_id===identity),count=main.annotations.length-candidate.annotations.length;
          return [identity,{verdict:count?'MATERIAL':'EQUIVALENT',
            explanation:count?'主图有'+main.annotations.length+'个框，候选有'+candidate.annotations.length+'个框。':'两图框住相同区域，类别相同。',
            issues:count?[{type:count>0?'extra_annotation':'missing_annotation',
              main_annotation_ids:count>0?main.annotations.map(item=>item.annotation_id):[],
              candidate_annotation_ids:count<0?candidate.annotations.map(item=>item.annotation_id):[],
              region_pair_ids:[],description:'同一内容的标注数量不同。',limitations:[],
              review_suggestion:'核对该处是否需要标框。',coverage_effect:null,coverage_reason:null,same_main_object_as:[]}]:[],
            limitations:[],disputed_regions:[]}];
        }))};
      }
      const delta=generationFinish==='length'?{reasoning_content:'本次输出达到预算。'}:{content:JSON.stringify(answer)};
      if(protocol==='openai-responses')sendResponses(res,body.model,delta);
      else {
        const id='chatcmpl_'+randomUUID();
        res.writeHead(200,{'Content-Type':'text/event-stream'});
        res.end('data: '+JSON.stringify({id,object:'chat.completion.chunk',created:1,model:body.model,
          choices:[{index:0,delta:{role:'assistant',...delta},finish_reason:null}]})+'\n\n'+'data: '+
          JSON.stringify({id,object:'chat.completion.chunk',created:1,model:body.model,
            choices:[{index:0,delta:{},finish_reason:generationFinish||'stop'}],
            ...(generationUsage===null?{}:{usage:generationUsage||{prompt_tokens:1000,completion_tokens:100,total_tokens:1100}})})+'\n\ndata: [DONE]\n\n');
      }
      if(isHeld)lateResponse.resolve();
    } catch(error) {
      res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:error.message}}));
    }
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  const endpoint='http://127.0.0.1:'+provider.address().port+'/v1/'+(protocol==='openai-responses'?'responses':'chat/completions');
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
ModuleSettings(db).save({'module':'consistency','expected_revision':0,'settings':{**retrieval,'vision_limits':{'capacity_mode':'vllm_tokenize','max_output_tokens':4096,'max_visual_inputs':json.loads(sys.argv[4]),'request_parameters':{'temperature':0.2}},'model':{'provider_id':'isolated','model_id':'vision'}}})
print(json.dumps({'dataset_id':config.dataset.id,'sample_ids':identities}))
`, root, database, multiCandidate ? 'multi' : 'pair', JSON.stringify(maxVisualInputs ?? null), indexMode ?? (withSimilarCandidate?'cached':'none'), JSON.stringify(candidateCount ?? null), JSON.stringify(withSimilarCandidate),taskType], {cwd: workspace, env: {...process.env, PYTHONPATH: path.join(workspace, 'python')}, encoding: 'utf8'}));
  const bridge = new PythonBridge({cwd: workspace, dbPath: database, timeoutMs: bridgeTimeoutMs});
  const host = await JobSessionHost.open(path.join(root, 'sessions'),
    async session_id => imageSessionPath(path.join(root, 'sessions'), await bridge.execute('consistency_agent_session_location', {session_id})));
  const ctx = new Context();
  new LlmRuntime(ctx);
  const providers = {isolated: {api: protocol, defaultMaxTokens:4096, baseURL: endpoint.replace(/\/(?:chat\/completions|responses)$/, ''),
    apiKeyEnv: 'LOCAL_TEST_KEY', retryPolicy: {mode: 'normal', maxRetries: 0}, models: [
      {id: 'vision', input: ['text', 'image'], contextWindow: 32768, ...(maxOutputTokens===null?{}:{maxTokens:maxOutputTokens}),
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
    if (operation === 'consistency_agent_finalize' && afterSubmission) await afterSubmission(args);
    return result;
  }});
  return {root,database,endpoint,datasetId:dataset.dataset_id,sampleIds:dataset.sample_ids,bridge,host,scheduler,native,wires,tokenizations,errors,held,release,lateResponse,
    holdGeneration(){holdNext=true;},
    holdAfterObservations(count=1){holdAt=wires.length+count+1;},
    rejectGeneration(){rejectNext=true;},
    async close(){
      release.resolve();await scheduler.dispose();removeRouting();bridge.destroy();await host.dispose();await fork.dispose();
      await new Promise(resolve=>provider.close(resolve));await fs.rm(root,{recursive:true,force:true});
    }};
}
