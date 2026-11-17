import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { LlmError, MessageId } from '@deepseek-ai/dsh-llm';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { auditQualityScoreParameters, auditGlobalParameters, auditRecordParameters, auditReportEvidenceParameters } from '../../shared/audit.parameters.generated.js';
import { auditDatasetParameters, auditMemoryParameters, auditDraftQueryParameters, auditDefectProfileParameters, auditReviewParameters, auditDiscoveryParameters, auditObservationParameters, auditReportDraftParameters, auditReportFinalizeParameters } from '../../shared/audit-context.parameters.generated.js';
import { auditDistributionParameters } from '../../shared/distribution.parameters.generated.js';
import { promptDefaults } from '../../shared/prompt-defaults.generated.js';
import { NativeMediaAttachments, nativeMediaOutput } from '../sessions/media.js';
import { NativeModelCalls } from '../sessions/model-calls.js';
import { workbenchJsonOutput } from '../tool-output.js';
import { auditSessionPath } from './session-path.js';
import { AuditImageAgents } from './images.js';
const recordsInstruction = '当前输入是索引，不表示已读取图级结果。先通过 audit_records 按 record_index.scope、unread_only=true 和 next_cursor 连续读取全部未读有效版本；每页默认24000字符，可按上下文剩余容量调小。不得用页码遍历未读集合。需要原始完整细节时按sample_id、unread_only=false、representation=detail读取。复核后仅补读变化版本。画像和报告提交均检查实际读取覆盖。';
const masterTools = ['audit_dataset', 'audit_memory', 'audit_defect_profile', 'audit_observation', 'audit_report_draft', 'audit_report_section', 'audit_quality_score', 'audit_statistics', 'audit_distribution', 'audit_records', 'audit_report_evidence', 'audit_review_commit', 'audit_report_commit'];
export class AuditMasterAgent {
    bridge;
    host;
    providers;
    dataRoot;
    constructor(bridge, host, providers, dataRoot) {
        this.bridge = bridge;
        this.host = host;
        this.providers = providers;
        this.dataRoot = dataRoot;
    }
    async run(runId, snapshot, signal) {
        const identity = { run_id: runId };
        const state = await this.bridge.execute('audit_agent_report_state', identity);
        if (state.state === 'COMPLETED')
            return;
        const master = snapshot.master_prompt;
        const reportInstruction = snapshot.report_instruction;
        const location = await this.bridge.execute('audit_agent_session_location', { session_id: state.session_id });
        const { profile, native_profile } = snapshot.agent;
        if (!profile?.model_id || !native_profile)
            throw new Error('审计缺少冻结的原生模型');
        if (!state.session_created) {
            await this.host.create(state.session_id);
            await this.host.notice(state.session_id, { type: 'iad/job', summary: '数据集联合审计已受理', value: { job_id: runId } });
            await this.bridge.execute('audit_agent_report_session_created', identity);
        }
        const provider = 'audit-' + state.session_id;
        const onDemand = snapshot.context_policy === 'evidence-on-demand-v1';
        const failures = new Map();
        let observers;
        await this.host.withAgent(state.session_id, { signal, subagents: snapshot.settings.concurrency, evidenceOnDemand: onDemand, imageHandoffTools: ['audit_defect_profile', 'audit_observation', 'audit_commit', 'audit_review_commit', 'audit_report_section', 'audit_report_commit'],
            agentOptions: { provider, model: profile.model_id, maxTokens: profile.max_output_tokens ?? undefined },
            setup: async (scope) => { scope.tools.restrict({ allow: onDemand ? [...masterTools, 'audit_discovery'] : masterTools }); },
            sharedSetup: async (scope) => {
                const attachments = new NativeMediaAttachments(scope, path.dirname(auditSessionPath(this.dataRoot, location)));
                if (profile.credential_ref)
                    scope.provide('credentials', this.providers.credentials);
                await scope.plugin(piAi, { providers: { [provider]: { ...native_profile, requestImagePixelBudget: Number.MAX_SAFE_INTEGER,
                            requestImageMaxBytes: Number.MAX_SAFE_INTEGER } } });
                const { samples } = await this.bridge.execute('audit_agent_samples', identity);
                await scope.inject(['subagents'], injected => { observers = new AuditImageAgents(this.bridge, runId, attachments, injected.subagents, snapshot, samples, failures); });
                observers.register(scope);
                scope.tools.register(defineTool({ name: 'audit_observation', description: '保存当前比较已看清的简短视觉事实及原图引用。成功后释放已观察附件；后续使用文字事实，需要复看时显式读图。最终图级判断仍通过audit_commit提交。',
                    parameters: auditObservationParameters, output: workbenchJsonOutput,
                    execute: (note, execution) => this.bridge.execute('audit_agent_observation', { ...identity, session_id: execution.agent?.id, note }, execution.signal) }));
                new NativeModelCalls().attach(scope, {
                    start: async (request) => {
                        const messages = request.request.messages;
                        const evidence_ids = [...new Set(messages.flatMap(message => message.content).flatMap(block => block.type === 'image' && !block.offloaded && block.attachment.name?.endsWith('.png') ? [block.attachment.name.slice(0, -4)] : []))];
                        await this.bridge.execute('audit_agent_model_call_start', { ...identity, request, evidence_ids });
                    },
                    end: async (result) => { await this.bridge.execute('audit_agent_model_call_end', { ...identity, result }); },
                });
                scope.on('agent/error', event => { failures.set(event.agent.id, event.error); });
                scope.on('session/event', (session, event) => {
                    if (event.type === 'turn/end' && event.data.reason.kind === 'max-tokens')
                        failures.set(session.id, new LlmError('审计输出达到本次请求上限，尚未提交当前结果', 'MAX_TOKENS'));
                });
                scope.on('agent/request', async (event, next) => {
                    const request = await next();
                    return { ...request,
                        ...(profile.request_parameters.temperature !== undefined ? { temperature: profile.request_parameters.temperature } : {}),
                        ...(profile.request_parameters.stop !== undefined ? { stop: profile.request_parameters.stop } : {}),
                    };
                });
                scope.systemPrompt.section({ name: 'audit-role', order: 100, interpolate: false,
                    text: ({ agent }) => (agent?.id === state.session_id ? master : snapshot.observer_prompt).system_prompt || '' });
                scope.tools.register(defineTool({ name: 'audit_defect_profile', description: '综合全部已完成缺陷结果，实际查看少量代表缺陷原图，提交供良品审计使用的缺陷画像。成功结束本阶段，不生成报告。',
                    parameters: auditDefectProfileParameters, output: workbenchJsonOutput, execute: async (submission, execution) => {
                        if (execution.agent?.id !== state.session_id)
                            throw new Error('仅主 Agent 可以发布缺陷画像');
                        const result = await this.bridge.execute('audit_agent_defect_profile', { ...identity, submission }, execution.signal);
                        execution.concludeTurn();
                        return result;
                    } }));
                scope.tools.register(defineTool({ name: 'audit_dataset', description: '分页读取冻结的完全重复组、相似候选及评测基准、泄漏明细。候选仅提供复看线索，不能直接作为低信息增量结论。', parameters: auditDatasetParameters, output: workbenchJsonOutput,
                    execute: async (query, execution) => this.bridge.execute('audit_agent_dataset', { ...identity, query: { ...query, max_chars: Math.min(query.max_chars ?? 24000, await this.host.pageChars(execution.agent)) } }, execution.signal) }));
                scope.tools.register(defineTool({ name: 'audit_statistics', description: '读取按有效图级版本计算的覆盖、疑点、观察、一致性交叉和知识作用统计。', parameters: {}, output: workbenchJsonOutput,
                    execute: (_args, execution) => this.bridge.execute('audit_agent_report_statistics', identity, execution.signal) }));
                scope.tools.register(defineTool({ name: 'audit_quality_score', description: '由程序按冻结系数和当前有效图级记录计算综合分、三维分和分页扣分明细。归并同义场景，实际观察相似候选后确认低信息增量组；不得填入分数或推测数量。使用next_cursor读取后续条目，item_code读取某项的样本引用，dataset_id读取指定子数据集得分。正式报告的quality_assessment原样采用返回的assessment，图级复审变化后重新预览。',
                    parameters: auditQualityScoreParameters, output: workbenchJsonOutput,
                    execute: async (assessment, execution) => this.bridge.execute('audit_agent_quality_score', { ...identity, assessment: { ...assessment, max_chars: Math.min(assessment.max_chars ?? 24000, await this.host.pageChars(execution.agent)) } }, execution.signal) }));
                scope.tools.register(defineTool({ name: 'audit_distribution', description: '读取程序从冻结原图尺寸和原始标注计算的类别图数、标注实例数、几何分布、分位数、密度和来源分布。可按子数据集和类别筛选，数字直接采用工具结果。',
                    parameters: auditDistributionParameters, output: workbenchJsonOutput,
                    execute: (query, execution) => this.bridge.execute('audit_agent_distribution', { ...identity, query }, execution.signal) }));
                scope.tools.register(defineTool({ name: 'audit_records', description: '分页读取冻结范围的有效图级结果及上游记录，压缩后可重读。', parameters: auditRecordParameters, output: workbenchJsonOutput,
                    execute: async (query, execution) => this.bridge.execute('audit_agent_report_records', { ...identity, query: { ...query, max_chars: Math.min(query.max_chars ?? 24000, await this.host.pageChars(execution.agent)) } }, execution.signal) }));
                if (onDemand)
                    scope.tools.register(defineTool({ name: 'audit_discovery', description: '分页读取指定发现的完整业务正文、正式精选和支持或反例引用。修改主张或范围前读齐旧引用，逐项明确保留、移除或迁移角色；图级详情通过audit_records读取。',
                        parameters: auditDiscoveryParameters, output: workbenchJsonOutput,
                        execute: (query, execution) => this.bridge.execute('audit_agent_discovery', { ...identity, query }, execution.signal) }));
                scope.tools.register(defineTool({ name: 'audit_report_evidence', description: '打开冻结主图的完整原图与原始人工标注，用于跨图比较和选择典型或对照证据。', parameters: auditReportEvidenceParameters, output: nativeMediaOutput,
                    execute: async (query, execution) => attachments.prepare(await this.bridge.execute('audit_agent_report_evidence', { ...identity, ...query }, execution.signal), execution.signal) }));
                scope.tools.register(defineTool({ name: 'audit_review_commit', description: '提交全范围跨图分析的发现增量和明确冲突的定向复审。discoveries仅新增或正文变化；引用与精选单独变更。成功后结束本轮，有复审时先完成复审再继续报告。无需按批提交，也无需创建没有实际依据的发现。',
                    parameters: onDemand ? auditReviewParameters : auditGlobalParameters, output: workbenchJsonOutput, execute: async (submission, execution) => {
                        if (execution.agent?.id !== state.session_id)
                            throw new Error('仅主 Agent 可以发布全局发现');
                        const result = await this.bridge.execute('audit_agent_review_commit', { ...identity, submission }, execution.signal);
                        execution.concludeTurn();
                        return result;
                    } }));
                scope.tools.register(defineTool({ name: 'audit_memory', description: '分页读取主 Agent 已保存的视觉事实和图像引用，压缩后恢复观察依据。', parameters: auditMemoryParameters, output: workbenchJsonOutput,
                    execute: async (query, execution) => this.bridge.execute('audit_agent_memory', { ...identity, query: { ...query, max_chars: Math.min(query.max_chars ?? 24000, await this.host.pageChars(execution.agent)) } }, execution.signal) }));
                scope.tools.register(defineTool({ name: 'audit_report_draft', description: '读取报告草稿字段索引及版本；指定field后分页读取对应章节，用于恢复和局部修正。', parameters: auditDraftQueryParameters, output: workbenchJsonOutput,
                    execute: async (query, execution) => this.bridge.execute('audit_agent_report_draft', { ...identity, query: { ...query, max_chars: Math.min(query.max_chars ?? 24000, await this.host.pageChars(execution.agent)) } }, execution.signal) }));
                scope.tools.register(defineTool({ name: 'audit_report_section', description: '逐章保存或局部修正报告。先保存report_cases及引用，再保存对应分析。fields只填本次变化的字段，省略保留；base_revision取当前草稿版本。成功后释放已观察图片。',
                    parameters: auditReportDraftParameters, output: workbenchJsonOutput, execute: async (submission, execution) => {
                        if (execution.agent?.id !== state.session_id)
                            throw new Error('仅主 Agent 可以保存整体报告');
                        const result = await this.bridge.execute('audit_agent_report_draft', { ...identity, submission }, execution.signal);
                        return { revision: result.revision, saved_fields: Object.keys(submission.fields) };
                    } }));
                scope.tools.register(defineTool({ name: 'audit_report_commit', description: '提交已保存草稿的当前版本，原子生成正式报告。全部字段由audit_report_section保存；验证失败只修正对应字段，再用新草稿版本定稿。成功结束报告。',
                    parameters: auditReportFinalizeParameters, output: workbenchJsonOutput, execute: async (submission, execution) => {
                        if (execution.agent?.id !== state.session_id)
                            throw new Error('仅主 Agent 可以提交整体报告');
                        const result = await this.bridge.execute('audit_agent_report_commit', { ...identity, submission }, execution.signal);
                        execution.concludeTurn();
                        return onDemand ? { job_id: result.job_id, state: result.state, revision: result.revision } : result;
                    } }));
            } }, async (agent) => {
            const abort = () => agent.cancel({ kind: 'parent' });
            signal.addEventListener('abort', abort, { once: true });
            try {
                await this.bridge.execute('audit_agent_prepare_observations', identity, signal);
                while (true) {
                    signal.throwIfAborted();
                    const phase = await this.bridge.execute('audit_agent_phase', identity, signal);
                    if (phase.phase === 'blocked')
                        throw new Error(phase.limitations.join('；'));
                    if (phase.phase === 'defects' || phase.phase === 'normals') {
                        await agent.runMaintenance(async () => {
                            try {
                                await observers.run(agent, signal, phase.pending_sample_ids);
                            }
                            finally {
                                for (const message of [...agent.inbox.nextTurn, ...agent.inbox.nextStep])
                                    if (message.source.kind === 'subagent-settled')
                                        agent.inbox.remove(message.id);
                            }
                        });
                        continue;
                    }
                    if (phase.phase === 'defect_profile') {
                        await this.bridge.execute('audit_agent_report_begin', { ...identity, phase: 'defect_profile' }, signal);
                        const context = await this.bridge.execute('audit_agent_defect_context', identity, signal);
                        failures.delete(state.session_id);
                        agent.followup({ id: MessageId(randomUUID()), role: 'user', source: { kind: 'user' }, content: [
                                { type: 'text', text: JSON.stringify(context) + '\n\n' + recordsInstruction + '\n' + promptDefaults.auditDefectProfile },
                            ] });
                        await agent.whenIdle();
                        signal.throwIfAborted();
                        if (failures.has(state.session_id))
                            throw failures.get(state.session_id);
                        const next = await this.bridge.execute('audit_agent_phase', identity, signal);
                        if (next.phase === 'defect_profile')
                            throw new Error('主 Agent 结束但未提交缺陷画像');
                        await this.host.checkpoint(agent);
                        continue;
                    }
                    await this.bridge.execute('audit_agent_report_begin', identity, signal);
                    const context = await this.bridge.execute('audit_agent_review_context', identity, signal);
                    failures.delete(state.session_id);
                    agent.followup({ id: MessageId(randomUUID()), role: 'user', source: { kind: 'user' }, content: [
                            { type: 'text', text: JSON.stringify(context) + '\n\n' },
                            { type: 'text', text: recordsInstruction + '\n' + master.user_prompt + '\n\n' + reportInstruction },
                        ] });
                    await agent.whenIdle();
                    if (failures.has(state.session_id))
                        throw failures.get(state.session_id);
                    const saved = await this.bridge.execute('audit_agent_report_state', identity);
                    await this.host.checkpoint(agent);
                    if (saved.state === 'COMPLETED')
                        break;
                    if (saved.revision === context.revision)
                        throw new Error('主 Agent 结束但未提交报告或全局复审');
                }
            }
            finally {
                signal.removeEventListener('abort', abort);
            }
        });
    }
}
