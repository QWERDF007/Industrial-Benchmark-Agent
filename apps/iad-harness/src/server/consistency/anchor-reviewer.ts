import {randomUUID} from 'node:crypto';
import {LlmError, MessageId} from '@deepseek-ai/dsh-llm';
import {defineTool} from '@deepseek-ai/dsh-tools';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import type {ConsistencyAnchorRun, TokenBudget} from '../../shared/domain.generated.js';
import {anchorContextQueryParameters, anchorAssessmentInputParameters, anchorReviewSubmissionParameters, anchorVisualStartParameters} from '../../shared/consistency-agent.parameters.generated.js';
import type {NativeProviders} from '../models/providers.js';
import type {PythonBridge} from '../python-bridge/index.js';
import {workbenchJsonOutput} from '../tool-output.js';
import type {AnchorReviewTask} from './scheduler.js';
import {JobSessionHost} from '../sessions/host.js';
import {NativeModelCalls} from '../sessions/model-calls.js';
import {NativeModelBudget} from '../sessions/model-budget.js';

declare module '@deepseek-ai/dsh-llm' {
  interface MessageSourceMap {
    'iad-consistency': {kind: 'iad-consistency'; form: 'notice'; summary: string};
  }
}

export class ConsistencyAnchorReviewer {
  constructor(private readonly bridge: PythonBridge, private readonly host: JobSessionHost,
    private readonly providers: Pick<NativeProviders, 'credentialsFor' | 'credentials'>) {}

  async review(task: AnchorReviewTask): Promise<void> {
    const {agent, vision} = task.snapshot.roles;
    if (agent.error || !agent.profile || !agent.native_profile) throw new Error('Agent 模型角色不可用：' + (agent.error || '未配置'));
    if (vision.error || !vision.profile || !vision.input_modalities.includes('image'))
      throw new Error('视觉模型角色不可用：' + (vision.error || '未配置图像输入能力'));
    const profile = agent.profile;
    if (!profile.model_id || !profile.context_tokens || !profile.max_output_tokens)
      throw new Error('Agent 模型角色缺少已声明的模型、上下文或输出容量');
    const provider = 'consistency-' + task.sessionId;
    const identity = {run_id: task.runId, anchor_id: task.anchorId, attempt: task.attempt};
    while (true) {
      task.signal.throwIfAborted();
      const verified = await this.bridge.execute<{identity: {completed: boolean}; completed: boolean}>('consistency_agent_verify',
        {...identity, _model_execution: await this.providers.credentialsFor(vision.profile)}, task.signal);
      if (verified.completed) return;
      if (verified.identity.completed) break;
    }
    await this.bridge.execute('consistency_agent_plan', {...identity, _model_execution: await this.providers.credentialsFor(vision.profile)}, task.signal);
    let failure: unknown;
    await this.host.withAgent(task.sessionId, {
      signal: task.signal,
      agentOptions: {provider, model: profile.model_id, maxTokens: profile.max_output_tokens},
      setup: async scope => {
        const saved = await this.bridge.execute<{observations: {candidate_id: string}[]}>('consistency_agent_context', {...identity, query: {}});
        const pending = new Set(saved.observations.map(item => item.candidate_id));
        new NativeModelCalls().attach(scope, {
          start: async request => {await this.bridge.execute('consistency_agent_model_call_start', {...identity, request});},
          end: async result => {await this.bridge.execute('consistency_agent_model_call_end', {...identity, result});},
        });
        scope.on('agent/error', event => {failure = event.error;});
        scope.on('session/event', (_session, event) => {
          if (event.type === 'turn/end' && event.data.reason.kind === 'max-tokens')
            failure = new LlmError(`Agent 达到冻结的输出上限 ${profile.max_output_tokens} tokens，未提交主图终稿`, 'MAX_TOKENS');
        });
        if (profile.credential_ref) scope.provide('credentials', this.providers.credentials);
        const execution = await this.providers.credentialsFor(profile);
        const budget = await NativeModelBudget.open(agent.native_profile as piAi.PiAiProviderProfile,
          (body, signal) => this.bridge.execute<TokenBudget>('consistency_agent_capacity',
            {...identity, body, _model_execution: execution}, signal));
        scope.effect(() => () => budget.close());
        await scope.plugin(piAi, {providers: {[provider]: budget.profile}});
        scope.on('agent/request', async (event, next) => {
          return {...await next(),
            ...(profile.request_parameters.temperature !== undefined ? {temperature: profile.request_parameters.temperature as number} : {}),
            ...(profile.request_parameters.stop !== undefined ? {stop: profile.request_parameters.stop as string[]} : {}),
          };
        });
        scope.systemPrompt.section({name: 'consistency-anchor-review', order: 100, text: task.snapshot.system_prompt ?? task.snapshot.instruction});
        scope.tools.register(defineTool({name: 'anchor_context', description: '开始审核或恢复上下文时读取冻结清单、指纹、视觉分页计划及当前观察和评估回执；传candidate_id复查该候选完整原始事实。按返回的冻结页观察，保存每个候选评估，再提交全部最新评估回执。',
          parameters: anchorContextQueryParameters, output: workbenchJsonOutput,
          execute: (query, execution) => this.bridge.execute('consistency_agent_context', {...identity, query}, execution.signal)}));
        scope.tools.register(defineTool({name: 'anchor_observe', description: '按上下文给出的完整冻结页发送主图和候选的原图、原始标注与全部局部，保存并返回observation_id及各候选完整视觉观察、事实和原图引用，可直接据此评估。先评估当前已观察页的全部候选才能读取下一页；当前页可补看原像素。',
          parameters: anchorVisualStartParameters, output: workbenchJsonOutput,
          execute: async (request, execution) => {
            if (pending.size && request.candidate_ids.some(id => !pending.has(id)))
              throw new Error('先完成已观察页的候选评估，再观察下一页；可继续为当前页补充原像素证据。');
            const reserved = request.candidate_ids.filter(id => !pending.has(id));
            for (const id of request.candidate_ids) pending.add(id);
            try {
              const model = await this.providers.credentialsFor(vision.profile!);
              return await this.bridge.execute('consistency_agent_observe', {...identity, request, _model_execution: model}, execution.signal);
            } catch (error) {
              for (const id of reserved) pending.delete(id);
              throw error;
            }
          }}));
        scope.tools.register(defineTool({name: 'anchor_assess', description: '仅保存已通过内容验证的候选标注审核，引用本场实际观察。MATERIAL必须在issues中保留全部独立问题、真实两侧框ID和实际原图ID，不能只给主要分类或自由文本；返回终稿使用的assessment_id。',
          parameters: anchorAssessmentInputParameters, output: workbenchJsonOutput,
          execute: async (submission, execution) => {
            const result = await this.bridge.execute('consistency_agent_assess', {...identity, submission}, execution.signal);
            pending.delete(submission.assessment.candidate_id);
            return result;
          }}));
        scope.tools.register(defineTool({name: 'anchor_submit', description: '提交全部最新assessment_ids；服务端从已保存评估派生主结论和分析，保留视觉限制，原子完成本主图。',
          parameters: anchorReviewSubmissionParameters, output: workbenchJsonOutput,
          execute: async (submission, execution) => {
            const result = await this.bridge.execute('consistency_agent_submit', {...identity, submission}, execution.signal);
            execution.concludeTurn();
            return result;
          }}));
      },
    }, async agent => {
      const abort = () => agent.cancel({kind: 'parent'});
      task.signal.addEventListener('abort', abort, {once: true});
      try {
        task.signal.throwIfAborted();
        agent.followup({id: MessageId(randomUUID()), role: 'user', source: {kind: 'iad-consistency', form: 'notice', summary: '审核冻结主图'},
          content: [{type: 'text', text: JSON.stringify({anchor_id: task.anchorId,
            attempt: task.attempt})},
            ...(task.snapshot.system_prompt ? [{type:'text' as const,text:'\n'+task.snapshot.instruction}] : [])]});
        await agent.whenIdle();
        if (failure) throw failure;
        const completed = await this.bridge.execute<ConsistencyAnchorRun>('consistency_agent_anchor', identity);
        if (completed.state !== 'COMPLETED') {
          task.signal.throwIfAborted();
          throw new Error('Agent 已结束但未提交完整主图终稿');
        }
      } finally {
        task.signal.removeEventListener('abort', abort);
      }
    });
  }
}
