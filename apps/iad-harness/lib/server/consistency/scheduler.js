import { createHash } from 'node:crypto';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { imageSessionPath } from '../sessions/image-path.js';
import { runConcurrent } from '../jobs/concurrency.js';
export class ConsistencyCheckScheduler {
    bridge;
    host;
    providers;
    review;
    onError;
    tasks = new Map();
    constructor(bridge, host, providers, review, onError) {
        this.bridge = bridge;
        this.host = host;
        this.providers = providers;
        this.review = review;
        this.onError = onError;
    }
    async execute(operation, args, signal, dispatch) {
        if (operation === 'consistency_agent_session_export') {
            const anchor = await dispatch('consistency_agent_anchor', { run_id: args.run_id, anchor_id: args.anchor_id }, signal);
            if (!anchor.session_created)
                throw new Error('主图会话尚未创建');
            const location = await dispatch('consistency_agent_session_location', { session_id: anchor.session_id }, signal);
            return { filename: path.basename(imageSessionPath('', location)), jsonl: await this.host.exportJsonl(anchor.session_id) };
        }
        if (operation === 'analysis_start' && args.request?.analysis_kind === 'consistency')
            return this.start(args.request);
        if (operation === 'analysis_cancel' || operation === 'analysis_retry') {
            const node = await dispatch('analysis_node', { run_id: args.run_id }, signal);
            if (node.request && Object.hasOwn(node.request, 'consistency_check'))
                return operation === 'analysis_cancel' ? this.cancel(args.run_id) : this.resume(args.run_id);
        }
        return dispatch(operation, args, signal);
    }
    async start(request) {
        const configuration = await this.bridge.execute('consistency_agent_configuration');
        const roles = {
            vision: await this.providers.freeze(configuration.settings.model, configuration.settings.vision_limits, 'vision', configuration.settings.reasoning_effort),
        };
        const { created, ...job } = await this.bridge.execute('consistency_agent_start', { request, configuration, roles });
        if (created && ['PENDING', 'RUNNING'].includes(job.status)) {
            this.launch(job.run_id);
        }
        return job;
    }
    launch(runId) {
        const controller = new AbortController();
        const promise = this.run(runId, controller.signal).finally(() => this.tasks.delete(runId));
        this.tasks.set(runId, { promise, controller });
        void promise.catch(this.onError);
    }
    async run(runId, signal) {
        const snapshot = await this.bridge.execute('consistency_agent_snapshot', { run_id: runId });
        const { anchors } = await this.bridge.execute('consistency_agent_anchors', { run_id: runId });
        const ready = [];
        await runConcurrent(anchors, snapshot.concurrency, signal, async (anchor) => {
            if (anchor.state === 'COMPLETED') {
                if (anchor.trace_state !== 'CLOSED')
                    await this.closeTrace(runId, anchor.anchor_id);
                return;
            }
            const identity = { run_id: runId, anchor_id: anchor.anchor_id, attempt: anchor.attempt };
            try {
                if (!anchor.session_created) {
                    await this.host.create(anchor.session_id);
                    await this.host.notice(anchor.session_id, { type: 'iad/consistency', summary: '主图审核会话已创建', value: { job_id: runId, anchor_id: anchor.anchor_id } });
                    await this.bridge.execute('consistency_agent_session_created', identity);
                }
                ready.push(anchor);
            }
            catch (error) {
                await this.failure(identity, error, signal);
            }
        });
        let preparationError;
        if (ready.length && !signal.aborted && snapshot.retrieval.mode === 'combined') {
            try {
                while (true) {
                    const { preparation } = await this.bridge.execute('consistency_agent_prepare', { run_id: runId }, signal);
                    if (!preparation || preparation.status === 'COMPLETED')
                        break;
                    await delay(250, undefined, { signal });
                }
            }
            catch (error) {
                preparationError = error;
            }
        }
        const work = [];
        await runConcurrent(ready, snapshot.concurrency, signal, async (anchor) => {
            const identity = { run_id: runId, anchor_id: anchor.anchor_id, attempt: anchor.attempt };
            try {
                if (preparationError)
                    throw preparationError;
                const candidates = await this.bridge.execute('consistency_agent_retrieve', identity);
                await this.host.notice(anchor.session_id, { type: 'iad/consistency', summary: '主图候选检索已完成', value: { job_id: runId, anchor_id: anchor.anchor_id, retrieval: candidates } });
                if (candidates.candidates.length === 0) {
                    await this.bridge.execute('consistency_agent_submit_empty', identity);
                    await this.closeTrace(runId, anchor.anchor_id);
                    return;
                }
                const vision = snapshot.roles.vision;
                if (vision.error || !vision.profile)
                    throw new Error('视觉模型角色不可用：' + (vision.error || '未配置'));
                const prepared = await this.bridge.execute('consistency_agent_verify', { ...identity, _model_execution: await this.providers.credentialsFor(vision.profile) }, signal, { timeoutMs: 0 });
                if (prepared.completed)
                    await this.closeTrace(runId, anchor.anchor_id);
                else
                    work.push({ runId, anchorId: anchor.anchor_id, sessionId: anchor.session_id, snapshot, candidates, attempt: anchor.attempt, signal });
            }
            catch (error) {
                await this.failure(identity, error, signal);
            }
        });
        const failed = new Set();
        let pending = [];
        for (let pass = 0; pass < 3 && !signal.aborted && work.length; pass++) {
            const { tasks } = await this.bridge.execute('consistency_agent_pair_tasks', { run_id: runId });
            const failures = new Map();
            const comparisons = new Map();
            await runConcurrent(tasks, snapshot.concurrency, signal, async (task) => {
                try {
                    const receipt = await this.bridge.execute('consistency_agent_pair_review', { run_id: runId, pair_key: task.pair_key,
                        _model_execution: await this.providers.credentialsFor(snapshot.roles.vision.profile) }, signal, { timeoutMs: 0 });
                    if (receipt)
                        for (const link of task.links) {
                            const records = comparisons.get(link.anchor_id) || [];
                            records.push(receipt);
                            comparisons.set(link.anchor_id, records);
                        }
                }
                catch (error) {
                    for (const link of task.links)
                        failures.set(link.anchor_id, error);
                }
            });
            if (signal.aborted)
                break;
            await runConcurrent(work.filter(task => comparisons.has(task.anchorId)), snapshot.concurrency, signal, async (task) => {
                try {
                    await this.host.notice(task.sessionId, { type: 'iad/consistency', summary: '图像内容核对已完成',
                        value: { job_id: runId, anchor_id: task.anchorId, comparisons: comparisons.get(task.anchorId) } });
                }
                catch (error) {
                    failures.set(task.anchorId, error);
                }
            });
            for (const [anchorId, error] of failures) {
                const task = work.find(item => item.anchorId === anchorId);
                failed.add(anchorId);
                await this.failure({ run_id: runId, anchor_id: anchorId, attempt: task.attempt }, error, signal);
            }
            await runConcurrent(work.filter(task => !failed.has(task.anchorId)), snapshot.concurrency, signal, async (task) => {
                try {
                    await this.review(task);
                }
                catch (error) {
                    failed.add(task.anchorId);
                    await this.failure({ run_id: runId, anchor_id: task.anchorId, attempt: task.attempt }, error, signal);
                }
            });
            if (signal.aborted)
                break;
            pending = (await this.bridge.execute('consistency_agent_pair_tasks', { run_id: runId })).tasks;
            if (!pending.length)
                break;
        }
        await runConcurrent(work.filter(task => !failed.has(task.anchorId)), snapshot.concurrency, signal, async (task) => {
            const identity = { run_id: runId, anchor_id: task.anchorId, attempt: task.attempt };
            try {
                if (pending.some(pair => pair.links.some(link => link.anchor_id === task.anchorId)))
                    throw new Error('图像内容核对与标注观察仍有矛盾，主图未完成');
                await this.bridge.execute('consistency_agent_finalize', identity);
                await this.closeTrace(runId, task.anchorId);
            }
            catch (error) {
                await this.failure(identity, error, signal);
            }
        });
        const node = await this.bridge.execute('analysis_node', { run_id: runId });
        if (node.status === 'RUNNING')
            await this.bridge.execute('consistency_agent_finish', { run_id: runId });
    }
    async failure(identity, error, signal) {
        const current = await this.bridge.execute('consistency_agent_anchor', identity);
        if (current.state === 'COMPLETED') {
            await this.pendingTrace(identity.run_id, identity.anchor_id, error);
        }
        else if (!signal.aborted && ['PENDING', 'RUNNING'].includes(current.state)) {
            const details = error instanceof Error && 'details' in error ? error.details : undefined;
            const failed = await this.bridge.execute('consistency_agent_failure', { ...identity,
                message: error instanceof Error ? error.message : String(error),
                code: error instanceof Error && 'code' in error ? error.code : undefined,
                source_run_id: details?.source_run_id, source_phase: details?.source_phase });
            if (failed.state === 'FAILED' && failed.session_created) {
                try {
                    await this.closeTrace(identity.run_id, identity.anchor_id);
                }
                catch (traceError) {
                    await this.pendingTrace(identity.run_id, identity.anchor_id, traceError);
                }
            }
        }
    }
    async closeTrace(runId, anchorId) {
        const identity = { run_id: runId, anchor_id: anchorId };
        const event = await this.bridge.execute('consistency_agent_trace_event', identity);
        const submissionId = createHash('sha256').update(JSON.stringify([runId, anchorId, event.attempt, event.state, event.result])).digest('hex');
        await this.host.notice(event.session_id, { type: 'iad/consistency', summary: event.state === 'COMPLETED' ? '主图终稿已提交' : '主图执行失败', value: event, record_id: submissionId });
        await this.bridge.execute('consistency_agent_trace_status', identity);
    }
    async pendingTrace(runId, anchorId, error) {
        await this.bridge.execute('consistency_agent_trace_status', { run_id: runId, anchor_id: anchorId,
            error: error instanceof Error ? error.message : String(error) });
        this.onError(error);
    }
    async reconcile(runId) {
        const { anchors } = await this.bridge.execute('consistency_agent_anchors', { run_id: runId });
        for (const anchor of anchors) {
            if (anchor.state === 'COMPLETED' && anchor.trace_state !== 'CLOSED')
                await this.closeTrace(runId, anchor.anchor_id);
        }
    }
    async cancel(runId) {
        const task = this.tasks.get(runId);
        await this.bridge.execute('consistency_agent_cancel', { run_id: runId });
        task?.controller.abort();
        await task?.promise;
        return this.bridge.execute('analysis_status', { run_id: runId });
    }
    async resume(runId) {
        if (this.tasks.has(runId))
            return this.bridge.execute('analysis_status', { run_id: runId });
        const node = await this.bridge.execute('analysis_node', { run_id: runId });
        if (node.status === 'COMPLETED') {
            await this.reconcile(runId);
            return this.bridge.execute('analysis_status', { run_id: runId });
        }
        const job = await this.bridge.execute('consistency_agent_resume', { run_id: runId });
        this.launch(runId);
        return job;
    }
    async whenIdle() {
        await Promise.all([...this.tasks.values()].map(task => task.promise));
    }
    async dispose() {
        for (const [runId, task] of this.tasks) {
            await this.bridge.execute('consistency_agent_interrupt', { run_id: runId });
            task.controller.abort();
        }
        await this.whenIdle();
    }
}
