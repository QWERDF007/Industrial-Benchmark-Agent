import path from 'node:path';
import type {AnalysisAgentConfiguration, AnalysisAgentContext, AnalysisPublicationView, AnalysisSessionLocation, ArtifactRef, JobSnapshot, JobView} from '../../shared/domain.generated.js';
import type {NativeProviders} from '../models/providers.js';
import type {BridgeDispatch, ModelRouting, PythonBridge} from '../python-bridge/index.js';
import type {JobSessionHost} from '../sessions/host.js';
import {AnalysisWorkflowAgent,analysisSessionPath} from './agent.js';

export class AnalysisWorkflowScheduler implements ModelRouting {
  private readonly tasks = new Map<string, {controller: AbortController; promise: Promise<void>}>();

  constructor(private readonly bridge: PythonBridge, private readonly providers: NativeProviders,
    private readonly hosts: Record<'exploration'|'knowledge', JobSessionHost>, private readonly dataRoot: string,
    private readonly onError: (error: unknown) => void) {}

  async execute(operation: string, args: Record<string, any>, signal: AbortSignal | undefined, dispatch: BridgeDispatch): Promise<any> {
    if (operation === 'analysis_start' && ['exploration', 'knowledge'].includes(args.request?.analysis_kind)) return this.start(args.request);
    if (operation === 'analysis_export') return this.exportVersion(args.version_id);
    if (operation === 'analysis_cancel' || operation === 'analysis_retry') {
      const node = await dispatch('analysis_node', {run_id: args.run_id}, signal) as JobSnapshot;
      if (node.request && Object.hasOwn(node.request, 'analysis_workflow_version'))
        return operation === 'analysis_cancel' ? this.cancel(args.run_id) : this.resume(args.run_id);
    }
    if (operation === 'analysis_agent_session_export') {
      const context = await this.bridge.execute<AnalysisAgentContext>('analysis_agent_context', {run_id: args.run_id});
      if (!context.session_created) throw new Error('作业内部Session尚未创建');
      const location = await this.bridge.execute<AnalysisSessionLocation>('analysis_agent_session_location', {session_id: context.session_id});
      return {filename: `${location.job_id}.jsonl`, jsonl: await this.hosts[location.module].exportJsonl(context.session_id)};
    }
    return dispatch(operation, args, signal);
  }

  async start(request: Record<string, unknown>): Promise<JobView> {
    const configuration = await this.bridge.execute<AnalysisAgentConfiguration>('analysis_agent_configuration', {module: request.analysis_kind});
    const agent = await this.providers.freeze(configuration.settings.model, configuration.settings.agent_limits, 'agent',configuration.settings.reasoning_effort);
    const {created, ...job} = await this.bridge.execute<JobView & {created: boolean}>('analysis_agent_start', {request, configuration, agent});
    if (created && ['PENDING', 'RUNNING'].includes(job.status)) this.launch(job.run_id, configuration.module);
    return job;
  }

  private launch(runId: string, module: 'exploration'|'knowledge'): void {
    const controller = new AbortController();
    const promise = (async () => {
      let error: {type: string; message: string} | undefined;
      try {await new AnalysisWorkflowAgent(this.bridge, this.hosts[module], this.providers, this.dataRoot).run(runId, controller.signal);}
      catch (failure) {
        if (controller.signal.aborted) return;
        error = {type: failure instanceof Error ? failure.name : 'Error', message: failure instanceof Error ? failure.message : String(failure)};
      }
      const job = await this.bridge.execute<JobView>('analysis_agent_finish', {run_id: runId, error});
      await this.terminal(job);
    })().finally(() => this.tasks.delete(runId));
    this.tasks.set(runId, {controller, promise});
    void promise.catch(this.onError);
  }

  private async terminal(job:JobView):Promise<void> {
    const context=await this.bridge.execute<AnalysisAgentContext>('analysis_agent_context',{run_id:job.run_id});
    if(!context.session_created)return;
    const location=await this.bridge.execute<AnalysisSessionLocation>('analysis_agent_session_location',{session_id:context.session_id});
    await this.hosts[location.module].notice(context.session_id,{type:'iad/job',summary:'分析作业已结束',
      value:{job_id:job.run_id,status:job.status,version_id:job.analysis_version_id,execution_error:job.execution_error},
      record_id:`terminal:${job.status}:${context.revision}`});
    if(job.analysis_version_id)await this.exportVersion(job.analysis_version_id);
  }

  private async exportVersion(versionId:string):Promise<ArtifactRef> {
    const publication=await this.bridge.execute<AnalysisPublicationView>('analysis_publication',{version_id:versionId});
    if(!publication.session_id)throw new Error('历史发布版本没有记录原生Session身份');
    const location=await this.bridge.execute<AnalysisSessionLocation>('analysis_agent_session_location',{session_id:publication.session_id});
    const directory=path.dirname(path.dirname(analysisSessionPath(this.dataRoot,location)));
    return this.bridge.execute('analysis_agent_artifacts',{version_id:versionId,directory,
      session_jsonl:await this.hosts[location.module].exportJsonl(publication.session_id)});
  }

  async cancel(runId: string): Promise<JobView> {
    const task = this.tasks.get(runId);
    task?.controller.abort();
    await task?.promise;
    const job=await this.bridge.execute<JobView>('analysis_agent_cancel',{run_id:runId});
    await this.terminal(job);return job;
  }

  async resume(runId: string): Promise<JobView> {
    if (this.tasks.has(runId)) return this.bridge.execute('analysis_status', {run_id: runId});
    const node = await this.bridge.execute<JobSnapshot>('analysis_node', {run_id: runId});
    await this.terminal(node);
    if (node.status === 'COMPLETED') return this.bridge.execute('analysis_status', {run_id: runId});
    const job = await this.bridge.execute<JobView>('analysis_agent_resume', {run_id: runId});
    this.launch(runId, job.analysis_kind as 'exploration'|'knowledge');
    return job;
  }

  async whenIdle(): Promise<void> {await Promise.all([...this.tasks.values()].map(task => task.promise));}

  async dispose(): Promise<void> {
    const tasks = [...this.tasks];
    for (const [, task] of tasks) task.controller.abort();
    await this.whenIdle();
    for (const [runId] of tasks) {
      const job=await this.bridge.execute<JobView>('analysis_agent_interrupt',{run_id:runId});
      await this.terminal(job);
    }
  }
}
