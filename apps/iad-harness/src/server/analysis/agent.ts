import path from 'node:path';
import type {Context} from '@deepseek-ai/cordis';
import {randomUUID} from 'node:crypto';
import {LlmError, MessageId} from '@deepseek-ai/dsh-llm';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import {defineTool, type InferValue} from '@deepseek-ai/dsh-tools';
import type {AnalysisAgentContext, AnalysisFinalizationContext, AnalysisBatchMaterials, RegistrationMediaPage, AnalysisSessionLocation, AnalysisWorkflowSnapshot, TokenBudget} from '../../shared/domain.generated.js';
import {analysisMediaParameters,analysisCatalogParameters,analysisCropParameters,analysisObservationParameters,
  analysisArgumentParameters,analysisClaimParameters,explorationImageParameters,explorationCropParameters} from '../../shared/analysis-agent.parameters.generated.js';
import {evidenceReferenceParameters} from '../../shared/media-reference.parameters.generated.js';
import type {NativeProviders} from '../models/providers.js';
import type {PythonBridge} from '../python-bridge/index.js';
import {JobSessionHost} from '../sessions/host.js';
import {NativeModelBudget} from '../sessions/model-budget.js';
import {NativeModelCalls} from '../sessions/model-calls.js';
import {NativeMediaAttachments, nativeMediaOutput} from '../sessions/media.js';
import type {ContentBlock} from '@deepseek-ai/dsh-llm';
import {workbenchJsonOutput} from '../tool-output.js';
import {registerExplorationTools} from './exploration.js';
import {registerKnowledgeTools} from './knowledge.js';
import {AnalysisObservers} from './observers.js';
import {AnalysisPromptContext} from './context.js';
import {analysisEvidenceReferenceParameters,analysisImageViewParameters} from '../../shared/analysis-context.parameters.generated.js';

export function analysisSessionPath(root: string, location: AnalysisSessionLocation): string {
  const directory=path.join(root, location.module + '-sessions', new Date(location.submitted_at).toISOString().replaceAll(':', '-'),location.job_id);
  return location.round_id ? path.join(directory,'observers',String(location.round_id),'session','events.jsonl')
    : path.join(directory,'session','events.jsonl');
}

export class AnalysisWorkflowAgent {
  constructor(private readonly bridge: PythonBridge, private readonly host: JobSessionHost,
    private readonly providers: Pick<NativeProviders, 'credentialsFor' | 'credentials'>, private readonly dataRoot: string) {}

  async run(runId: string, signal: AbortSignal): Promise<void> {
    const identity = {run_id: runId};
    const snapshot = await this.bridge.execute<AnalysisWorkflowSnapshot>('analysis_agent_snapshot', identity);
    const prompt = new AnalysisPromptContext(snapshot);
    const initial = await this.bridge.execute<AnalysisAgentContext>('analysis_agent_context', identity);
    if (!initial.round && snapshot.schema_version === 2) {
      const finalization = await this.bridge.execute<AnalysisFinalizationContext>('analysis_agent_finalization_context',identity);
      if (finalization.complete) return;
    }
    const {profile, native_profile} = snapshot.agent;
    const batchInput = snapshot.input_organization !== 'registration-tools';
    const delegated = snapshot.execution_mode === 'dsh-subagents';
    if (!profile?.model_id || !native_profile) throw new Error('作业缺少冻结的原生分析模型');
    const location = await this.bridge.execute<AnalysisSessionLocation>('analysis_agent_session_location', {session_id: initial.session_id});
    if (!initial.session_created) {
      await this.host.create(initial.session_id);
      await this.host.notice(initial.session_id, {type: 'iad/job', summary: '分析作业已受理', value: {job_id: runId, module: snapshot.module}});
      await this.bridge.execute('analysis_agent_session_created', identity);
    }
    const provider = 'analysis-' + initial.session_id;
    let failure: unknown;
    let rejectedCommits = 0;
    const maxRejectedCommits = 3;
    const commitCalls = new Set<string>();
    let attachments!: NativeMediaAttachments;
    let observers!: AnalysisObservers;
    const setup=async (scope:Context)=>{
        attachments = new NativeMediaAttachments(scope,path.dirname(analysisSessionPath(this.dataRoot,location)));
        if(delegated)await scope.inject(['subagents'],injected=>{
          observers=new AnalysisObservers(this.bridge,runId,attachments,injected.subagents,snapshot,prompt);
        });
        if (profile.credential_ref) scope.provide('credentials', this.providers.credentials);
        let providerProfile = {...native_profile, requestImagePixelBudget:Number.MAX_SAFE_INTEGER,
          requestImageMaxBytes:Number.MAX_SAFE_INTEGER} as piAi.PiAiProviderProfile;
        if (!batchInput) {
          const execution = await this.providers.credentialsFor(profile);
          const budget = await NativeModelBudget.open(providerProfile,
            (body,cancellation)=>this.bridge.execute<TokenBudget>('analysis_agent_capacity',{...identity,body,_model_execution:execution},cancellation));
          scope.effect(() => () => budget.close());
          providerProfile = budget.profile;
        }
        await scope.plugin(piAi, {providers: {[provider]: providerProfile}});
        new NativeModelCalls().attach(scope, {
          start: async request => {
            const messages = request.request.messages as {content: ContentBlock[]}[];
            const evidence_ids = prompt.onDemand && request.request.purpose === 'compaction' ? [] : [...new Set(messages.flatMap(message => message.content).flatMap(block =>
              block.type === 'image' && !block.offloaded && block.attachment.name?.endsWith('.png') ? [block.attachment.name.slice(0, -4)] : []))];
            await this.bridge.execute('analysis_agent_model_call_start', {...identity, request, evidence_ids});
          },
          end: async result => {await this.bridge.execute('analysis_agent_model_call_end', {...identity, result});},
        });
        scope.on('agent/error', event => {if(event.agent.id===initial.session_id)failure = event.error;});
        scope.on('agent/pre-step', async (event, next) => {
          if (event.agent.id===initial.session_id && rejectedCommits >= maxRejectedCommits)
            throw new LlmError(`连续${maxRejectedCommits}次观察、目录或定稿提交失败，已停止推理；已保存成果保留，请检查提交错误后再继续`, 'COMMIT_RETRY_EXHAUSTED');
          return next();
        });
        scope.on('session/event', (session, event) => {
          if(session.id!==initial.session_id)return;
          if (event.type === 'tool/call' && [snapshot.module + '_commit',snapshot.module + '_finalize'].includes(event.data.name))
            commitCalls.add(event.data.callId);
          if (event.type === 'tool/result' && commitCalls.delete(event.data.message.toolCallId))
            rejectedCommits = event.data.message.isError ? rejectedCommits + 1 : 0;
          if (event.type === 'turn/end' && event.data.reason.kind === 'max-tokens')
            failure = new LlmError('Agent 输出达到本次请求上限，未提交本轮观察', 'MAX_TOKENS');
        });
        scope.on('agent/request', async (_event, next) => ({...await next(),
          ...(profile.request_parameters.temperature !== undefined ? {temperature: profile.request_parameters.temperature as number} : {}),
          ...(profile.request_parameters.stop !== undefined ? {stop: profile.request_parameters.stop as string[]} : {})}));
        scope.systemPrompt.section({name: 'analysis-instruction', order: 100, interpolate:false,
          text:({agent})=>(delegated&&agent&&agent.id!==initial.session_id?snapshot.observer_prompt?.system_prompt:null)
            ?? snapshot.system_prompt ?? snapshot.instruction});
        if (snapshot.context_instruction) scope.systemPrompt.section({name:'analysis-context-protocol',order:110,
          interpolate:false,text:snapshot.context_instruction});
        scope.tools.register(defineTool({name: 'analysis_context', description: '读取本场目标、原始标注状态、目录revision、媒体覆盖、支持反例、待答问题和已选方向；状态变化或提交冲突后重新读取。当前目标全部完成或明确错误后进入后续登记；目标耗尽返回定稿阶段、锁定base_revision及pending_entry_ids。' + (snapshot.module === 'exploration' ? '探索首批严格是页面手选集合。' : '挖掘从首批开始按冻结计划自动取图，无手选首批。'),
          parameters: {}, output: workbenchJsonOutput, execute: async (_args, execution) => {
            if(delegated&&execution.agent?.id!==initial.session_id)
              return prompt.worker(await observers.context(execution.agent!.id,execution.signal)) as unknown as InferValue<{type:'json'}>;
            const context=await this.bridge.execute<AnalysisAgentContext & InferValue<{type:'json'}>>('analysis_agent_context',identity,execution.signal);
            if(delegated&&context.round&&context.round.round_id>1)
              return prompt.review(await observers.review(context,execution.signal)) as unknown as InferValue<{type:'json'}>;
            return !context.round && snapshot.schema_version===2
              ?prompt.finalization(await this.bridge.execute<AnalysisFinalizationContext>('analysis_agent_finalization_context',identity,execution.signal)) as unknown as InferValue<{type:'json'}>
              :prompt.context(context) as unknown as InferValue<{type:'json'}>;
          }}));
        scope.tools.register(defineTool({name:'analysis_catalog',description:'按稳定ID或offset/limit分页读取本场当前目录的完整方向或知识，返回revision和next_offset。catalog_counts是全目录总数，活动上下文可以只加载部分条目；不把未加载当作不存在。',
          parameters:analysisCatalogParameters,output:workbenchJsonOutput,
          execute:(query,execution)=>this.bridge.execute('analysis_agent_catalog',{...identity,query},execution.signal)}));
        scope.tools.register(defineTool({name:'analysis_observations',description:'分页读取本场已保存观察，返回revision、总数及逐图证据ID。可按稳定entry_id及evidence_role查询该主张的关联事实，或按round_id、sample_id、direction_ref筛选；同方向的其他主张不会混入条目查询。压缩后仍可查询历史。',
          parameters:analysisObservationParameters,output:workbenchJsonOutput,
          execute:(query,execution)=>this.bridge.execute('analysis_agent_history',{...identity,query},execution.signal)}));
        scope.tools.register(defineTool({name:'analysis_arguments',description:'按稳定entry_id分页读取该主张的完整论据，含实际observation_id、原图、角色、理由和有效状态。history=true回查解释或范围变更；revision可固定版本，精选图不影响完整关系。',
          parameters:analysisArgumentParameters,output:workbenchJsonOutput,
          execute:(query,execution)=>this.bridge.execute('analysis_agent_arguments',{...identity,query},execution.signal)}));
        scope.tools.register(defineTool({name:'analysis_claims',description:'按稳定entry_id分页回查主张修订、原文、原因与revision，合并前的来源ID仍可回查。',
          parameters:analysisClaimParameters,output:workbenchJsonOutput,
          execute:(query,execution)=>this.bridge.execute('analysis_agent_claims',{...identity,query},execution.signal)}));
        scope.tools.register(defineTool({name:'analysis_evidence',description:prompt.onDemand
          ?'按evidence_id显式重开冻结图证。默认view=whole只发送完整原图和原始标注元数据；view=annotation_rois读取该原图的原标注局部。可按局部ID重开单张；自定裁窗用analysis_crop。本次观察成功提交文字事实后卸载附件，事实与原件保留。读取不新增观察或完成覆盖。'
          :'按完整原图evidence_id重开本场已保存的冻结原图、原始标注及所属局部，适用于跨轮回看支持和反例。读取不会新增观察或完成覆盖，局部不提供独立图像引用。',
          parameters:prompt.onDemand?analysisEvidenceReferenceParameters:evidenceReferenceParameters,output:nativeMediaOutput,
          execute:async(query,execution)=>attachments.prepare(await this.bridge.execute<RegistrationMediaPage>(
            'analysis_agent_reference',{...identity,query},execution.signal),execution.signal)}));
        scope.tools.register(defineTool({name: 'analysis_images', description: prompt.onDemand
          ? '按当前批次sample_id显式补看图证。默认view=whole只返回完整原图和原始标注元数据；view=annotation_rois只读取原始标注局部。主动裁窗使用analysis_crop，历史引用使用analysis_evidence。成功提交观察后卸载附件，首次整批原图与必需局部已整体提供。'
          : batchInput
          ? '补看当前批次一条登记的完整原图、原始标注与全部必需局部。首次请求已包含本批全部材料；本工具一次返回该登记全部附件，取证受限或失败如实返回。'
          : '读取当前轮一条登记的原图、原始标注与全部必需ROI。total给出总附件数；可用offset和limit分页，但所有必需附件均观察才完成该登记。已提交过的媒体可按同一sample_id重读。取证错误如实返回，允许保留整图受限观察并报告错误。',
          parameters: prompt.onDemand ? analysisImageViewParameters : batchInput ? explorationImageParameters : analysisMediaParameters, output: nativeMediaOutput,
          execute: async (query, execution) => attachments.prepare(await this.bridge.execute<RegistrationMediaPage>(
            'analysis_agent_media', {...identity,query,...(delegated&&execution.agent?.id!==initial.session_id?{session_id:execution.agent!.id}:{})}, execution.signal), execution.signal)}));
        scope.tools.register(defineTool({name:'analysis_crop',description:batchInput
          ? '补看当前批次冻结原图的原始像素裁窗，bbox为原图半开区间[x0,y0,x1,y1]。部分越界取有效交集，一次返回一个完整裁窗；归属原登记，不是人工标注或独立样本，不计入必需材料。'
          : '补看当前轮冻结目标的原始像素裁窗，bbox为原图半开区间[x0,y0,x1,y1]。部分越界取有效交集，大裁窗按原像素分块，可用offset/limit分页；附件为本登记的补充证据。',
          parameters:batchInput ? explorationCropParameters : analysisCropParameters,output:nativeMediaOutput,
          execute:async(query,execution)=>attachments.prepare(await this.bridge.execute<RegistrationMediaPage>(
            'analysis_agent_crop',{...identity,query,...(delegated&&execution.agent?.id!==initial.session_id?{session_id:execution.agent!.id}:{})},execution.signal),execution.signal)}));
        if (snapshot.module === 'exploration') registerExplorationTools(scope, this.bridge, runId, prompt.onDemand);
        else registerKnowledgeTools(scope, this.bridge, runId, prompt.onDemand);
        if(delegated)observers.register(scope);
    };
    await this.host.withAgent(initial.session_id, {signal,
      evidenceOnDemand:prompt.onDemand,
      imageHandoffTools:prompt.onDemand ? [snapshot.module+'_observe', snapshot.module+'_commit', snapshot.module+'_finalize'] : undefined,
      subagents:delegated && 'concurrency' in snapshot.settings ? snapshot.settings.concurrency : undefined,
      agentOptions: {provider, model: profile.model_id, maxTokens: profile.max_output_tokens ?? undefined},
      ...(delegated?{sharedSetup:setup}:{setup}),
    }, async agent => {
      const abort = () => agent.cancel({kind: 'parent'});
      signal.addEventListener('abort', abort, {once: true});
      try {
        while (true) {
          signal.throwIfAborted();
          const context = await this.bridge.execute<AnalysisAgentContext>('analysis_agent_context', identity);
          if (!context.round && snapshot.schema_version===1) break;
          const review = delegated&&context.round&&context.round.round_id>1 ? await agent.runMaintenance(async()=>{
            try {return await observers.wave(agent,context,signal);}
            finally {
              // The host supplies one complete review packet instead of waking on individual settlement notices.
              for(const message of [...agent.inbox.nextTurn,...agent.inbox.nextStep])
                if(message.source.kind==='subagent-settled')agent.inbox.remove(message.id);
            }
          }):null;
          const materials = batchInput && context.round && !review
            ? await this.bridge.execute<AnalysisBatchMaterials>('analysis_agent_batch_materials', identity, signal) : null;
          const task=context.round?(review?.context ?? materials?.context ?? context):await this.bridge.execute<AnalysisFinalizationContext>('analysis_agent_finalization_context',identity);
          if ('complete' in task && task.complete) break;
          const taskContext = 'round' in task ? prompt.review(task) : prompt.finalization(task);
          const content: ContentBlock[] = [{type:'text',text:JSON.stringify(taskContext)+'\n\n'}];
          if(review)content.push(...review.media);
          for (const page of materials?.registrations ?? [])
            content.push(...nativeMediaOutput.render({}, await attachments.prepare(page, signal))
              .map(block=>block.type==='text'?{...block,text:block.text+'\n\n'}:block));
          if (!batchInput && !context.round && snapshot.finalization_instruction)
            content.push({type:'text',text:'\n'+snapshot.finalization_instruction});
          if (snapshot.system_prompt) content.push({type:'text',text:(batchInput?'':'\n')+snapshot.instruction});
          const stages=snapshot.knowledge_tasks??snapshot.exploration_tasks;
          if(stages)content.push({type:'text',text:!context.round?stages.finalize:review?stages.review:stages.initial});
          agent.followup({id:MessageId(randomUUID()),role:'user',source:{kind:'user'},content});
          await agent.whenIdle();
          if (failure) throw failure;
          const committed = await this.bridge.execute<AnalysisAgentContext>('analysis_agent_context', identity);
          if (committed.revision === task.revision) throw new Error('Agent 已结束但未提交当前观察、目录或定稿页');
        }
      } finally {signal.removeEventListener('abort', abort);}
    });
  }
}
