import { randomUUID } from 'node:crypto';
import { LlmError, MessageId } from '@deepseek-ai/dsh-llm';
import { defineTool } from '@deepseek-ai/dsh-tools';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import { anchorToolParameters } from '../../shared/consistency-agent.parameters.generated.js';
import { workbenchJsonOutput } from '../tool-output.js';
import { NativeModelCalls } from '../sessions/model-calls.js';
import { NativeModelBudget } from '../sessions/model-budget.js';
export class ConsistencyAnchorReviewer {
    bridge;
    host;
    providers;
    constructor(bridge, host, providers) {
        this.bridge = bridge;
        this.host = host;
        this.providers = providers;
    }
    async review(task) {
        const { agent, vision } = task.snapshot.roles;
        if (agent.error || !agent.profile || !agent.native_profile)
            throw new Error('Agent 模型角色不可用：' + (agent.error || '未配置'));
        if (vision.error || !vision.profile)
            throw new Error('视觉模型角色不可用：' + (vision.error || '未配置'));
        const profile = agent.profile;
        if (!profile.model_id || !profile.context_tokens)
            throw new Error('Agent 模型角色缺少已声明的模型或上下文容量');
        const provider = 'consistency-' + task.sessionId;
        const identity = { run_id: task.runId, anchor_id: task.anchorId, attempt: task.attempt };
        task.signal.throwIfAborted();
        const prepared = await this.bridge.execute('consistency_agent_verify', { ...identity, _model_execution: await this.providers.credentialsFor(vision.profile) }, task.signal, { timeoutMs: 0 });
        if (prepared.completed)
            return;
        const taskType = task.snapshot.task_type;
        if (!taskType)
            throw new Error('历史作业只读保留，请新建检查');
        const parameters = anchorToolParameters[taskType];
        let failure;
        await this.host.withAgent(task.sessionId, {
            signal: task.signal,
            agentOptions: { provider, model: profile.model_id, maxTokens: profile.max_output_tokens ?? undefined },
            setup: async (scope, currentAgent) => {
                new NativeModelCalls().attach(scope, {
                    start: async (request) => { await this.bridge.execute('consistency_agent_model_call_start', { ...identity, request }); },
                    end: async (result) => { await this.bridge.execute('consistency_agent_model_call_end', { ...identity, result }); },
                });
                scope.on('agent/error', event => { failure ??= event.error; });
                scope.on('session/event', (_session, event) => {
                    if (event.type === 'turn/end' && event.data.reason.kind === 'max-tokens')
                        failure = new LlmError('Agent 输出达到本次请求上限，未提交主图终稿', 'MAX_TOKENS');
                });
                if (profile.credential_ref)
                    scope.provide('credentials', this.providers.credentials);
                const execution = await this.providers.credentialsFor(profile);
                const budget = await NativeModelBudget.open(agent.native_profile, (body, signal) => this.bridge.execute('consistency_agent_capacity', { ...identity, body, _model_execution: execution }, signal));
                scope.effect(() => () => budget.close());
                await scope.plugin(piAi, { providers: { [provider]: budget.profile } });
                scope.on('agent/request', async (event, next) => {
                    return { ...await next(),
                        ...(profile.request_parameters.temperature !== undefined ? { temperature: profile.request_parameters.temperature } : {}),
                        ...(profile.request_parameters.stop !== undefined ? { stop: profile.request_parameters.stop } : {}),
                    };
                });
                scope.systemPrompt.section({ name: 'consistency-anchor-review', order: 100, text: task.snapshot.system_prompt ?? task.snapshot.instruction });
                const dispatch = async (operation, args, execution) => {
                    try {
                        return await this.bridge.execute(operation, { ...identity, ...args }, execution.signal, operation === 'consistency_agent_context' || operation === 'consistency_agent_observe' ? { timeoutMs: 0 } : {});
                    }
                    catch (error) {
                        const code = error.code;
                        if (code !== 'INVALID_ARGUMENT' && code !== 'CONTRACT_ERROR') {
                            failure = error;
                            currentAgent.cancel({ kind: 'parent' });
                        }
                        throw error;
                    }
                };
                scope.tools.register(defineTool({ name: 'anchor_context', description: '读取当前阶段、冻结图像身份及资格版本。先完成全部候选的资格处置，再审核合格候选；恢复时以当前记录为准。',
                    parameters: parameters.context, output: workbenchJsonOutput,
                    execute: async (query, execution) => dispatch('consistency_agent_context', { query,
                        _model_execution: await this.providers.credentialsFor(vision.profile) }, execution) }));
                scope.tools.register(defineTool({ name: 'anchor_observe', description: '观察当前阶段的真实图像。gate每次一张候选，由工具完成必要局部观察；audit按上下文提供的完整观察组读取。引用当前资格版本，不自行扩大图像范围。',
                    parameters: parameters.observe, output: workbenchJsonOutput,
                    execute: async (request, execution) => dispatch('consistency_agent_observe', { request,
                        _model_execution: await this.providers.credentialsFor(vision.profile) }, execution) }));
                scope.tools.register(defineTool({ name: 'anchor_assess', description: '保存当前候选记录。gate引用实际身份观察，发现身份疑点时用recheck申请重新核验；audit只保存当前合格版本的专用审核。assessment直接传JSON对象，不能字符串化；未使用的可选字段省略。稳定request_id用于重试。',
                    parameters: parameters.assess, output: workbenchJsonOutput,
                    execute: (submission, execution) => dispatch('consistency_agent_assess', { submission }, execution) }));
                scope.tools.register(defineTool({ name: 'anchor_submit', description: '全部资格完成后提交当前有效候选的最新assessment_ids；零有效候选时为空。程序校验完整性、归并证据并形成当前主图唯一终稿。',
                    parameters: parameters.submit, output: workbenchJsonOutput,
                    execute: async (submission, execution) => {
                        const result = await dispatch('consistency_agent_submit', { submission }, execution);
                        execution.concludeTurn();
                        return result;
                    } }));
            },
        }, async (agent) => {
            const abort = () => agent.cancel({ kind: 'parent' });
            task.signal.addEventListener('abort', abort, { once: true });
            try {
                task.signal.throwIfAborted();
                agent.followup({ id: MessageId(randomUUID()), role: 'user', source: { kind: 'iad-consistency', form: 'notice', summary: '审核冻结主图' },
                    content: [{ type: 'text', text: JSON.stringify({ anchor_id: prepared.main_image_id,
                                attempt: task.attempt }) },
                        ...(task.snapshot.system_prompt ? [{ type: 'text', text: '\n' + task.snapshot.instruction }] : [])] });
                await agent.whenIdle();
                if (failure)
                    throw failure;
                const completed = await this.bridge.execute('consistency_agent_anchor', identity);
                if (completed.state !== 'COMPLETED') {
                    task.signal.throwIfAborted();
                    throw new Error('Agent 已结束但未提交完整主图终稿');
                }
            }
            finally {
                task.signal.removeEventListener('abort', abort);
            }
        });
    }
}
