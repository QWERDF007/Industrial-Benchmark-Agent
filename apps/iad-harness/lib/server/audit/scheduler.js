import path from 'node:path';
import fs from 'node:fs/promises';
import { AuditImageAgent } from './agent.js';
import { auditSessionPath } from './session-path.js';
import { runConcurrent } from '../jobs/concurrency.js';
export class AuditWorkflowScheduler {
    bridge;
    providers;
    host;
    dataRoot;
    onError;
    tasks = new Map();
    constructor(bridge, providers, host, dataRoot, onError) {
        this.bridge = bridge;
        this.providers = providers;
        this.host = host;
        this.dataRoot = dataRoot;
        this.onError = onError;
    }
    async execute(operation, args, signal, dispatch) {
        if (operation === 'audit_start')
            return this.start(args.request);
        if (operation === 'audit_cancel' || operation === 'audit_retry') {
            const job = await dispatch('analysis_node', { run_id: args.run_id }, signal);
            if (job.request?.audit_workflow_version)
                return operation === 'audit_cancel' ? this.cancel(args.run_id) : this.resume(args.run_id);
        }
        if (operation === 'audit_agent_session_export') {
            const sample = await this.bridge.execute('audit_agent_sample', args);
            if (!sample.session_created)
                throw new Error('本图审计Session尚未创建');
            const location = await this.bridge.execute('audit_agent_session_location', { session_id: sample.session_id });
            return { filename: path.basename(auditSessionPath(this.dataRoot, location)), jsonl: await this.host.exportJsonl(sample.session_id) };
        }
        return dispatch(operation, args, signal);
    }
    async start(request) {
        const configuration = await this.bridge.execute('audit_agent_configuration');
        const agent = await this.providers.freeze(configuration.settings.model, configuration.settings.agent_limits, 'agent', configuration.settings.reasoning_effort);
        const { created, ...job } = await this.bridge.execute('audit_agent_start', { request, configuration, agent });
        if (created && ['PENDING', 'RUNNING'].includes(job.status))
            this.launch(job.run_id);
        return job;
    }
    launch(runId) {
        const controller = new AbortController();
        const promise = this.run(runId, controller.signal).finally(() => this.tasks.delete(runId));
        this.tasks.set(runId, { controller, promise });
        void promise.catch(this.onError);
    }
    async run(runId, signal) {
        const snapshot = await this.bridge.execute('audit_agent_snapshot', { run_id: runId });
        const { samples } = await this.bridge.execute('audit_agent_samples', { run_id: runId });
        const pending = samples.filter(sample => sample.state !== 'COMPLETED');
        const agent = new AuditImageAgent(this.bridge, this.host, this.providers, this.dataRoot);
        await runConcurrent(pending, snapshot.settings.concurrency, signal, async (sample) => {
            try {
                await agent.run(runId, sample.sample_id, snapshot, signal);
                const final = await this.bridge.execute('audit_agent_sample', { run_id: runId, sample_id: sample.sample_id });
                await this.projectFinal(final);
            }
            catch (error) {
                if (signal.aborted)
                    return;
                await this.bridge.execute('audit_agent_failure', { run_id: runId, sample_id: sample.sample_id, message: error instanceof Error ? error.message : String(error) });
            }
        });
        if (!signal.aborted) {
            await this.bridge.execute('audit_agent_finish', { run_id: runId });
            await this.writeReport(runId);
        }
    }
    async projectFinal(sample) {
        await this.host.notice(sample.session_id, { type: 'iad/job', summary: '图级审计已提交',
            value: { kind: 'audit-final', job_id: sample.job_id, sample_id: sample.sample_id, final: sample.result }, record_id: 'audit-final:' + sample.sample_id });
    }
    async writeReport(runId) {
        const { samples } = await this.bridge.execute('audit_agent_samples', { run_id: runId });
        for (const sample of samples)
            if (sample.state === 'COMPLETED')
                await this.projectFinal(sample);
        const location = await this.bridge.execute('audit_agent_session_location', { session_id: samples[0].session_id });
        const directory = path.dirname(auditSessionPath(this.dataRoot, location));
        const summary = await this.bridge.execute('audit_job_report', { run_id: runId });
        const report = await this.bridge.execute('audit_job_export', { run_id: runId });
        await fs.mkdir(directory, { recursive: true });
        await fs.writeFile(path.join(directory, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
        await fs.writeFile(path.join(directory, 'report.html'), report.html);
    }
    async cancel(runId) {
        const task = this.tasks.get(runId);
        task?.controller.abort();
        await task?.promise;
        const job = await this.bridge.execute('audit_agent_cancel', { run_id: runId });
        await this.writeReport(runId);
        return job;
    }
    async resume(runId) {
        if (this.tasks.has(runId))
            return this.bridge.execute('audit_status', { run_id: runId });
        const existing = await this.bridge.execute('audit_status', { run_id: runId });
        if (existing.status === 'COMPLETED')
            return existing;
        const job = await this.bridge.execute('audit_agent_resume', { run_id: runId });
        this.launch(runId);
        return job;
    }
    async whenIdle() { await Promise.all([...this.tasks.values()].map(task => task.promise)); }
    async dispose() {
        const tasks = [...this.tasks];
        for (const [, task] of tasks)
            task.controller.abort();
        await this.whenIdle();
        for (const [runId] of tasks) {
            await this.bridge.execute('audit_agent_interrupt', { run_id: runId });
            await this.writeReport(runId);
        }
    }
}
