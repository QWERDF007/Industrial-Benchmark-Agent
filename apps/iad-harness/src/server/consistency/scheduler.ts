import {createHash} from 'node:crypto';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import type {AnchorCandidates, AnchorTraceEvent, ConsistencyAnchorRun, ConsistencyBatchSummary, ConsistencyCheckConfiguration, ConsistencyCheckSnapshot, ImageSessionLocation, JobFailure, JobSnapshot, JobView} from '../../shared/domain.generated.js';
import type {BridgeDispatch, ModelRouting, PythonBridge} from '../python-bridge/index.js';
import {JobSessionHost} from '../sessions/host.js';
import {imageSessionPath} from '../sessions/image-path.js';
import type {NativeProviders} from '../models/providers.js';
import {runConcurrent} from '../jobs/concurrency.js';

export interface AnchorReviewTask {
  runId: string;
  anchorId: string;
  sessionId: string;
  snapshot: ConsistencyCheckSnapshot;
  candidates: AnchorCandidates;
  attempt: number;
  signal: AbortSignal;
}

export class ConsistencyCheckScheduler implements ModelRouting {
  private readonly tasks = new Map<string, {promise: Promise<void>; controller: AbortController}>();

  constructor(private readonly bridge: PythonBridge, private readonly host: JobSessionHost,
    private readonly providers: NativeProviders,
    private readonly review: (task: AnchorReviewTask) => Promise<void>,
    private readonly onError: (error: unknown) => void) {}

  async execute(operation: string, args: Record<string, any>, signal: AbortSignal | undefined,
    dispatch: BridgeDispatch): Promise<any> {
    if (operation === 'consistency_agent_session_export') {
      const anchor = await dispatch('consistency_agent_anchor', {run_id: args.run_id, anchor_id: args.anchor_id}, signal) as ConsistencyAnchorRun;
      if (!anchor.session_created) throw new Error('主图会话尚未创建');
      const location = await dispatch('consistency_agent_session_location', {session_id: anchor.session_id}, signal) as ImageSessionLocation;
      return {filename: path.basename(imageSessionPath('', location)), jsonl: await this.host.exportJsonl(anchor.session_id)};
    }
    if (operation === 'analysis_start' && args.request?.analysis_kind === 'consistency') return this.start(args.request);
    if (operation === 'analysis_cancel' || operation === 'analysis_retry') {
      const node: JobSnapshot = await dispatch('analysis_node', {run_id: args.run_id}, signal);
      if (node.request && Object.hasOwn(node.request, 'consistency_check'))
        return operation === 'analysis_cancel' ? this.cancel(args.run_id) : this.resume(args.run_id);
    }
    return dispatch(operation, args, signal);
  }

  async start(request: Record<string, unknown>): Promise<JobView> {
    const configuration = await this.bridge.execute<ConsistencyCheckConfiguration>('consistency_agent_configuration');
    const roles = {
      agent: await this.providers.freeze(configuration.settings.model, configuration.settings.agent_limits, 'agent',configuration.settings.reasoning_effort),
      vision: await this.providers.freeze(configuration.settings.model, configuration.settings.vision_limits, 'vision',configuration.settings.reasoning_effort),
    };
    const {created, ...job} = await this.bridge.execute<JobView & {created: boolean}>('consistency_agent_start', {request, configuration, roles});
    if (created && ['PENDING', 'RUNNING'].includes(job.status)) {
      this.launch(job.run_id);
    }
    return job;
  }

  private launch(runId: string): void {
    const controller = new AbortController();
    const promise = this.run(runId, controller.signal).finally(() => this.tasks.delete(runId));
    this.tasks.set(runId, {promise, controller});
    void promise.catch(this.onError);
  }

  private async run(runId: string, signal: AbortSignal): Promise<void> {
    const snapshot = await this.bridge.execute<ConsistencyCheckSnapshot>('consistency_agent_snapshot', {run_id: runId});
    const {anchors} = await this.bridge.execute<{anchors: ConsistencyAnchorRun[]}>('consistency_agent_anchors', {run_id: runId});
    const ready: ConsistencyAnchorRun[] = [];
    for (const anchor of anchors) {
      if (signal.aborted) break;
      if (anchor.state === 'COMPLETED') {
        if (anchor.trace_state !== 'CLOSED') await this.closeTrace(runId, anchor.anchor_id);
        continue;
      }
      const identity = {run_id: runId, anchor_id: anchor.anchor_id, attempt: anchor.attempt};
      try {
        if (!anchor.session_created) {
          await this.host.create(anchor.session_id);
          await this.host.notice(anchor.session_id, {type: 'iad/consistency', summary: '主图审核会话已创建', value: {job_id: runId, anchor_id: anchor.anchor_id}});
          await this.bridge.execute('consistency_agent_session_created', identity);
        }
        ready.push(anchor);
      } catch (error) {
        await this.failure(identity, error, signal);
      }
    }
    let preparationError: unknown;
    if (ready.length && !signal.aborted && snapshot.retrieval.mode === 'combined') {
      try {
        while (true) {
          const {preparation} = await this.bridge.execute<{preparation: ConsistencyBatchSummary | null}>(
            'consistency_agent_prepare', {run_id: runId}, signal);
          if (!preparation || preparation.status === 'COMPLETED') break;
          await delay(250, undefined, {signal});
        }
      }
      catch (error) {preparationError = error;}
    }
    await runConcurrent(ready, snapshot.concurrency, signal, async anchor => {
      const identity = {run_id: runId, anchor_id: anchor.anchor_id, attempt: anchor.attempt};
      try {
        if (preparationError) throw preparationError;
        const candidates = await this.bridge.execute<AnchorCandidates>('consistency_agent_retrieve', identity);
        await this.host.notice(anchor.session_id, {type: 'iad/consistency', summary: '主图候选检索已完成', value: {job_id: runId, anchor_id: anchor.anchor_id, retrieval: candidates}});
        if (candidates.candidates.length === 0) {
          await this.bridge.execute('consistency_agent_submit_empty', identity);
        } else {
          await this.review({runId, anchorId: anchor.anchor_id, sessionId: anchor.session_id, snapshot, candidates, attempt: anchor.attempt, signal});
          const completed = await this.bridge.execute<ConsistencyAnchorRun>('consistency_agent_anchor', identity);
          if (completed.state !== 'COMPLETED') throw new Error('审核会话未提交主图结果');
        }
        await this.closeTrace(runId, anchor.anchor_id);
      } catch (error) {
        await this.failure(identity, error, signal);
      }
    });
    const node = await this.bridge.execute<JobSnapshot>('analysis_node', {run_id: runId});
    if (node.status === 'RUNNING') await this.bridge.execute('consistency_agent_finish', {run_id: runId});
  }

  private async failure(identity: {run_id: string; anchor_id: string; attempt: number}, error: unknown, signal: AbortSignal): Promise<void> {
    const current = await this.bridge.execute<ConsistencyAnchorRun>('consistency_agent_anchor', identity);
    if (current.state === 'COMPLETED') {
      await this.pendingTrace(identity.run_id, identity.anchor_id, error);
    } else if (!signal.aborted) {
      const details = error instanceof Error && 'details' in error ? error.details as Partial<JobFailure> : undefined;
      const failed = await this.bridge.execute<ConsistencyAnchorRun>('consistency_agent_failure', {...identity,
        message: error instanceof Error ? error.message : String(error),
        code: error instanceof Error && 'code' in error ? error.code : undefined,
        source_run_id: details?.source_run_id, source_phase: details?.source_phase});
      if (failed.session_created) {
        try {await this.closeTrace(identity.run_id, identity.anchor_id);}
        catch (traceError) {await this.pendingTrace(identity.run_id, identity.anchor_id, traceError);}
      }
    }
  }

  private async closeTrace(runId: string, anchorId: string): Promise<void> {
    const identity = {run_id: runId, anchor_id: anchorId};
    const event = await this.bridge.execute<AnchorTraceEvent>('consistency_agent_trace_event', identity);
    const submissionId = createHash('sha256').update(JSON.stringify([runId, anchorId, event.attempt, event.state, event.result])).digest('hex');
    await this.host.notice(event.session_id, {type: 'iad/consistency', summary: event.state === 'COMPLETED' ? '主图终稿已提交' : '主图执行失败', value: event, record_id: submissionId});
    await this.bridge.execute('consistency_agent_trace_status', identity);
  }

  private async pendingTrace(runId: string, anchorId: string, error: unknown): Promise<void> {
    await this.bridge.execute('consistency_agent_trace_status', {run_id: runId, anchor_id: anchorId,
      error: error instanceof Error ? error.message : String(error)});
    this.onError(error);
  }

  async reconcile(runId: string): Promise<void> {
    const {anchors} = await this.bridge.execute<{anchors: ConsistencyAnchorRun[]}>('consistency_agent_anchors', {run_id: runId});
    for (const anchor of anchors) {
      if (anchor.state === 'COMPLETED' && anchor.trace_state !== 'CLOSED') await this.closeTrace(runId, anchor.anchor_id);
    }
  }

  async cancel(runId: string): Promise<JobView> {
    const task = this.tasks.get(runId);
    await this.bridge.execute('consistency_agent_cancel', {run_id: runId});
    task?.controller.abort();
    await task?.promise;
    return this.bridge.execute('analysis_status', {run_id: runId});
  }

  async resume(runId: string): Promise<JobView> {
    if (this.tasks.has(runId)) return this.bridge.execute('analysis_status', {run_id: runId});
    const node = await this.bridge.execute<JobSnapshot>('analysis_node', {run_id: runId});
    if (node.status === 'COMPLETED') {
      await this.reconcile(runId);
      return this.bridge.execute('analysis_status', {run_id: runId});
    }
    const job = await this.bridge.execute<JobView>('consistency_agent_resume', {run_id: runId});
    this.launch(runId);
    return job;
  }

  async whenIdle(): Promise<void> {
    await Promise.all([...this.tasks.values()].map(task => task.promise));
  }

  async dispose(): Promise<void> {
    for (const [runId, task] of this.tasks) {
      await this.bridge.execute('consistency_agent_interrupt', {run_id: runId});
      task.controller.abort();
    }
    await this.whenIdle();
  }
}
