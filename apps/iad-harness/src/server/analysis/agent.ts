import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {LlmError, MessageId} from '@deepseek-ai/dsh-llm';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import {defineTool, type InferValue} from '@deepseek-ai/dsh-tools';
import type {AnalysisAgentContext, AnalysisFinalizationContext, RegistrationMediaPage, AnalysisSessionLocation, AnalysisWorkflowSnapshot, TokenBudget} from '../../shared/domain.generated.js';
import {analysisMediaParameters,analysisCatalogParameters,analysisCropParameters,analysisObservationParameters,
  analysisArgumentParameters,analysisClaimParameters} from '../../shared/analysis-agent.parameters.generated.js';
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

export function analysisSessionPath(root: string, location: AnalysisSessionLocation): string {
  return path.join(root, location.module + '-sessions', new Date(location.submitted_at).toISOString().replaceAll(':', '-'),
    location.job_id, 'session', 'events.jsonl');
}

export class AnalysisWorkflowAgent {
  constructor(private readonly bridge: PythonBridge, private readonly host: JobSessionHost,
    private readonly providers: Pick<NativeProviders, 'credentialsFor' | 'credentials'>, private readonly dataRoot: string) {}

  async run(runId: string, signal: AbortSignal): Promise<void> {
    const identity = {run_id: runId};
    const snapshot = await this.bridge.execute<AnalysisWorkflowSnapshot>('analysis_agent_snapshot', identity);
    const initial = await this.bridge.execute<AnalysisAgentContext>('analysis_agent_context', identity);
    if (!initial.round && snapshot.schema_version === 2) {
      const finalization = await this.bridge.execute<AnalysisFinalizationContext>('analysis_agent_finalization_context',identity);
      if (finalization.complete) return;
    }
    const {profile, native_profile} = snapshot.agent;
    if (!profile?.model_id || !profile.max_output_tokens || !native_profile) throw new Error('作业缺少冻结的原生分析模型');
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
    await this.host.withAgent(initial.session_id, {signal,
      agentOptions: {provider, model: profile.model_id, maxTokens: profile.max_output_tokens},
      setup: async scope => {
        const attachments = new NativeMediaAttachments(scope,path.dirname(analysisSessionPath(this.dataRoot,location)));
        if (profile.credential_ref) scope.provide('credentials', this.providers.credentials);
        const execution = await this.providers.credentialsFor(profile);
        const budget = await NativeModelBudget.open({...native_profile, requestImagePixelBudget:Number.MAX_SAFE_INTEGER,
          requestImageMaxBytes:Number.MAX_SAFE_INTEGER} as piAi.PiAiProviderProfile,
          (body,cancellation)=>this.bridge.execute<TokenBudget>('analysis_agent_capacity',{...identity,body,_model_execution:execution},cancellation));
        scope.effect(() => () => budget.close());
        await scope.plugin(piAi, {providers: {[provider]: budget.profile}});
        new NativeModelCalls().attach(scope, {
          start: async request => {
            const messages = request.request.messages as {content: ContentBlock[]}[];
            const evidence_ids = [...new Set(messages.flatMap(message => message.content).flatMap(block =>
              block.type === 'image' && !block.offloaded && block.attachment.name?.endsWith('.png') ? [block.attachment.name.slice(0, -4)] : []))];
            await this.bridge.execute('analysis_agent_model_call_start', {...identity, request, evidence_ids});
          },
          end: async result => {await this.bridge.execute('analysis_agent_model_call_end', {...identity, result});},
        });
        scope.on('agent/error', event => {failure = event.error;});
        scope.on('agent/pre-step', async (_event, next) => {
          if (rejectedCommits >= maxRejectedCommits)
            throw new LlmError(`连续${maxRejectedCommits}次观察、目录或定稿提交失败，已停止推理；已保存成果保留，请检查提交错误后再继续`, 'COMMIT_RETRY_EXHAUSTED');
          return next();
        });
        scope.on('session/event', (_session, event) => {
          if (event.type === 'tool/call' && [snapshot.module + '_commit',snapshot.module + '_finalize'].includes(event.data.name))
            commitCalls.add(event.data.callId);
          if (event.type === 'tool/result' && commitCalls.delete(event.data.message.toolCallId))
            rejectedCommits = event.data.message.isError ? rejectedCommits + 1 : 0;
          if (event.type === 'turn/end' && event.data.reason.kind === 'max-tokens')
            failure = new LlmError('Agent 达到冻结输出上限，未提交本轮观察', 'MAX_TOKENS');
        });
        scope.on('agent/request', async (_event, next) => ({...await next(),
          ...(profile.request_parameters.temperature !== undefined ? {temperature: profile.request_parameters.temperature as number} : {}),
          ...(profile.request_parameters.stop !== undefined ? {stop: profile.request_parameters.stop as string[]} : {})}));
        scope.systemPrompt.section({name: 'analysis-instruction', order: 100, text: snapshot.system_prompt ?? snapshot.instruction});
        scope.tools.register(defineTool({name: 'analysis_context', description: '读取本场目标、原始标注状态、目录revision、媒体覆盖、支持反例、待答问题和已选方向；状态变化或提交冲突后重新读取。当前目标全部完成或明确错误后进入后续登记；目标耗尽返回定稿阶段、锁定base_revision及pending_entry_ids。' + (snapshot.module === 'exploration' ? '探索首批严格是页面手选集合。' : '挖掘从首批开始按冻结计划自动取图，无手选首批。'),
          parameters: {}, output: workbenchJsonOutput, execute: async (_args, execution) => {
            const context=await this.bridge.execute<AnalysisAgentContext & InferValue<{type:'json'}>>('analysis_agent_context',identity,execution.signal);
            return !context.round && snapshot.schema_version===2
              ?this.bridge.execute('analysis_agent_finalization_context',identity,execution.signal):context;
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
        scope.tools.register(defineTool({name:'analysis_evidence',description:'按完整原图evidence_id重开本场已保存的冻结原图、原始标注及所属局部，适用于跨轮回看支持和反例。读取不会新增观察或完成覆盖，局部不提供独立图像引用。',
          parameters:evidenceReferenceParameters,output:nativeMediaOutput,
          execute:async(query,execution)=>attachments.prepare(await this.bridge.execute<RegistrationMediaPage>(
            'analysis_agent_reference',{...identity,query},execution.signal),execution.signal)}));
        scope.tools.register(defineTool({name: 'analysis_images', description: '读取当前轮一条登记的原图、原始标注与全部必需ROI。total给出总附件数；可用offset和limit分页，但所有必需附件均观察才完成该登记。已提交过的媒体可按同一sample_id重读。取证错误如实返回，允许保留整图受限观察并报告错误。',
          parameters: analysisMediaParameters, output: nativeMediaOutput,
          execute: async (query, execution) => attachments.prepare(await this.bridge.execute<RegistrationMediaPage>(
            'analysis_agent_media', {...identity,query}, execution.signal), execution.signal)}));
        scope.tools.register(defineTool({name:'analysis_crop',description:'补看当前轮冻结目标的原始像素裁窗，bbox为原图半开区间[x0,y0,x1,y1]。部分越界取有效交集，大裁窗按原像素分块，可用offset/limit分页；附件为本登记的补充证据。',
          parameters:analysisCropParameters,output:nativeMediaOutput,
          execute:async(query,execution)=>attachments.prepare(await this.bridge.execute<RegistrationMediaPage>(
            'analysis_agent_crop',{...identity,query},execution.signal),execution.signal)}));
        if (snapshot.module === 'exploration') registerExplorationTools(scope, this.bridge, runId);
        else registerKnowledgeTools(scope, this.bridge, runId);
      },
    }, async agent => {
      const abort = () => agent.cancel({kind: 'parent'});
      signal.addEventListener('abort', abort, {once: true});
      try {
        while (true) {
          signal.throwIfAborted();
          const context = await this.bridge.execute<AnalysisAgentContext>('analysis_agent_context', identity);
          if (!context.round && snapshot.schema_version===1) break;
          const task=context.round?context:await this.bridge.execute<AnalysisFinalizationContext>('analysis_agent_finalization_context',identity);
          if ('complete' in task && task.complete) break;
          agent.followup({id:MessageId(randomUUID()),role:'user',source:{kind:'user'},
            content:[{type:'text',text:JSON.stringify(task)},
              ...(!context.round&&snapshot.finalization_instruction?[{type:'text' as const,text:'\n'+snapshot.finalization_instruction}]:[]),
              ...(snapshot.system_prompt?[{type:'text' as const,text:'\n'+snapshot.instruction}]:[])]});
          await agent.whenIdle();
          if (failure) throw failure;
          const committed = await this.bridge.execute<AnalysisAgentContext>('analysis_agent_context', identity);
          if (committed.revision === task.revision) throw new Error('Agent 已结束但未提交当前观察、目录或定稿页');
        }
      } finally {signal.removeEventListener('abort', abort);}
    });
  }
}
