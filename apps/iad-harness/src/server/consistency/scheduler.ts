import {createHash} from 'node:crypto';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import type {AnchorCandidates, AnchorRetrievalResult, AnchorTraceEvent, ConsistencyAnchorRun, ConsistencyBatchSummary, ConsistencyCheckConfiguration, ConsistencyCheckSnapshot, ImageSessionLocation, JobFailure, JobSnapshot, JobView, PairReviewTask, PairReviewReceipt} from '../../shared/domain.generated.js';
import type {BridgeDispatch, ModelRouting, PythonBridge} from '../python-bridge/index.js';
import {JobSessionHost} from '../sessions/host.js';
import {imageSessionPath} from '../sessions/image-path.js';
import type {NativeProviders} from '../models/providers.js';
import {runConcurrent,runDependencies,type DependencyTask} from '../jobs/concurrency.js';
import {pairReviewBatchSize,pairReviewMinBatchSize} from '../../shared/consistency.parameters.generated.js';

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
    private readonly review: (task: AnchorReviewTask) => Promise<boolean>,
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
      vision: await this.providers.freeze(configuration.settings.model, configuration.settings.vision_limits, 'vision',configuration.settings.reasoning_effort),
    };
    const {created, ...job} = await this.bridge.execute<JobView & {created: boolean}>('consistency_agent_start', {request, configuration, roles});
    if (created && ['PENDING', 'RUNNING'].includes(job.status)) {
      await this.bridge.execute('consistency_agent_index',{run_id:job.run_id});
      this.launch(job.run_id);
    }
    return job;
  }

  private launch(runId: string): void {
    const controller = new AbortController();
    const promise = this.run(runId, controller.signal).catch(error => {
      if (!controller.signal.aborted) throw error;
    }).finally(() => this.tasks.delete(runId));
    this.tasks.set(runId, {promise, controller});
    void promise.catch(this.onError);
  }

  private async run(runId: string, signal: AbortSignal): Promise<void> {
    const snapshot = await this.bridge.execute<ConsistencyCheckSnapshot>('consistency_agent_snapshot', {run_id: runId});
    const {anchors} = await this.bridge.execute<{anchors: ConsistencyAnchorRun[]}>('consistency_agent_anchors', {run_id: runId});
    await runConcurrent(anchors.filter(anchor => anchor.state === 'COMPLETED' && anchor.trace_state !== 'CLOSED'),
      snapshot.concurrency, signal, anchor => this.closeTrace(runId, anchor.anchor_id));
    const ready = anchors.filter(anchor => anchor.state !== 'COMPLETED');
    let preparationError: unknown;
    if (ready.length && !signal.aborted) {
      try {
        while (true) {
          const {preparation} = await this.bridge.execute<{preparation: ConsistencyBatchSummary}>(
            'consistency_agent_prepare', {run_id: runId}, signal);
          if (preparation.status === 'COMPLETED') break;
          await delay(250, undefined, {signal});
        }
      } catch(error) {preparationError=error;}
    }
    if(preparationError){
      if(signal.aborted)return;
      await runConcurrent(ready,snapshot.concurrency,signal,anchor=>this.failure(
        {run_id:runId,anchor_id:anchor.anchor_id,attempt:anchor.attempt},preparationError,signal,'PREPARING_SHARED_INDEX'));
      const node=await this.bridge.execute<JobSnapshot>('analysis_node',{run_id:runId});
      if(node.status==='RUNNING')await this.bridge.execute('consistency_agent_finish',{run_id:runId});
      throw preparationError;
    }
    const retrieved=new Map<string,AnchorRetrievalResult>();let retrievalError:unknown;
    if(!preparationError&&!signal.aborted&&ready.length){
      try{
        const result=await this.bridge.execute<{items:AnchorRetrievalResult[]}>('consistency_agent_retrieve_many',
          {run_id:runId,anchor_ids:ready.map(anchor=>anchor.anchor_id)},signal,{timeoutMs:0});
        for(const item of result.items)retrieved.set(item.anchor_id,item);
      }catch(error){retrievalError=error;}
    }
    const work: AnchorReviewTask[] = [];
    await runConcurrent(ready, snapshot.concurrency, signal, async anchor => {
      const identity = {run_id: runId, anchor_id: anchor.anchor_id, attempt: anchor.attempt};
      try {
        signal.throwIfAborted();
        if (!anchor.session_created) {
          await this.host.create(anchor.session_id);
          await this.host.notice(anchor.session_id, {type: 'iad/consistency', summary: '主图审核会话已创建',
            record_id: anchor.session_id + ':created', value: {job_id: runId, anchor_id: anchor.anchor_id}});
          await this.bridge.execute('consistency_agent_session_created', identity, signal);
        }
        if(retrievalError)throw retrievalError;
        const selected=retrieved.get(anchor.anchor_id);
        if(selected?.error)throw Object.assign(new Error(selected.error.message),{code:selected.error.code});
        const candidates=selected?.candidates;
        if(!candidates)throw new Error('候选检索未返回当前主图的结果');
        await this.host.notice(anchor.session_id, {type: 'iad/consistency', summary: '主图候选检索已完成', value: {job_id: runId, anchor_id: anchor.anchor_id, retrieval: candidates}});
        if (candidates.candidates.length === 0) {
          await this.bridge.execute('consistency_agent_submit_empty', identity);
          await this.closeTrace(runId, anchor.anchor_id);
        }else work.push({runId,anchorId:anchor.anchor_id,sessionId:anchor.session_id,snapshot,candidates,attempt:anchor.attempt,signal});
      } catch (error) {
        await this.failure(identity, error, signal, preparationError ? 'PREPARING_SHARED_INDEX' : retrievalError ? 'RETRIEVING_ANCHOR' : undefined);
      }
    });
    const byAnchor=new Map(work.map(task=>[task.anchorId,task]));
    const neighbors=new Map(work.map(task=>[task.anchorId,new Set<string>()]));
    for(const task of work)for(const candidate of task.candidates.candidates){
      if(!byAnchor.has(candidate.sample_id))continue;
      neighbors.get(task.anchorId)!.add(candidate.sample_id);
      neighbors.get(candidate.sample_id)!.add(task.anchorId);
    }
    const components:string[][]=[],componentOf=new Map<string,number>();
    for(const task of work){
      if(componentOf.has(task.anchorId))continue;
      const members:string[]=[],queue=[task.anchorId],index=components.length;
      while(queue.length){
        const id=queue.pop()!;
        if(componentOf.has(id))continue;
        componentOf.set(id,index);members.push(id);queue.push(...neighbors.get(id)!);
      }
      components.push(members);
    }
    const finalized=new Set<string>();
    const failed = new Set<string>();
    let pending: PairReviewTask[] = [];
    for (let pass = 0; pass < 3 && !signal.aborted && work.length; pass++) {
      const {tasks} = await this.bridge.execute<{tasks:PairReviewTask[]}>('consistency_agent_pair_tasks',{run_id:runId});
      type Work={kind:'pair_inputs';tasks:PairReviewTask[]}|{kind:'pairs';tasks:PairReviewTask[]}
        |{kind:'prepare'|'audit'|'finalize';task:AnchorReviewTask}|{kind:'settle';index:number};
      const active=work.filter(task=>!failed.has(task.anchorId)&&!finalized.has(task.anchorId));
      const audited=new Set<string>(),settled=new Set<number>();
      const activeIds=new Set(active.map(task=>task.anchorId));
      const visualCount=tasks.filter(task=>(task.estimated_annotation_count??0)>0).length;
      const batchSize=Math.min(pairReviewBatchSize,Math.max(pairReviewMinBatchSize,Math.floor(visualCount/(snapshot.concurrency*2))));
      const batches=Array.from({length:Math.ceil(tasks.length/batchSize)},
        (_,index)=>tasks.slice(index*batchSize,(index+1)*batchSize));
      const preparationOrder=new Map<string,number>();
      for(const batch of batches)for(const task of batch)for(const link of task.links)
        if(!preparationOrder.has(link.anchor_id))preparationOrder.set(link.anchor_id,preparationOrder.size);
      const preparing=[...active].sort((a,b)=>(preparationOrder.get(a.anchorId)??Infinity)-(preparationOrder.get(b.anchorId)??Infinity));
      const dependencies=new Map(work.map(task=>[task.anchorId,['prepare:'+task.anchorId]]));
      for(const [index,batch] of batches.entries())for(const task of batch)for(const link of task.links)
        dependencies.get(link.anchor_id)?.push('pairs:'+index);
      const graph:DependencyTask<Work>[]=[
        ...preparing.map(task=>({id:'prepare:'+task.anchorId,resource:'local',dependencies:[],value:{kind:'prepare' as const,task}})),
        ...batches.map((batch,index)=>({id:'pair_inputs:'+index,resource:'local',priority:1,
          dependencies:[...new Set(batch.flatMap(task=>task.links.map(link=>link.anchor_id)).filter(id=>activeIds.has(id)))].map(id=>'prepare:'+id),
          value:{kind:'pair_inputs' as const,tasks:batch}})),
        ...batches.map((batch,index)=>({id:'pairs:'+index,resource:'model',dependencies:['pair_inputs:'+index],
          value:{kind:'pairs' as const,tasks:batch}})),
        ...active.map(task=>({id:'audit:'+task.anchorId,resource:'model',
          dependencies:dependencies.get(task.anchorId)!,priority:1,value:{kind:'audit' as const,task}})),
        ...components.map((members,index)=>({id:'settle:'+index,resource:'local',
          dependencies:members.filter(id=>activeIds.has(id)).map(id=>'audit:'+id),
          priority:1,value:{kind:'settle' as const,index}})),
        ...active.map(task=>({id:'finalize:'+task.anchorId,resource:'local',dependencies:['settle:'+componentOf.get(task.anchorId)!],
          priority:1,value:{kind:'finalize' as const,task}})),
      ];
      await runDependencies(graph,{local:Math.min(snapshot.concurrency,4),model:snapshot.concurrency},signal,async item=>{
        if(item.kind==='prepare'){
          const task=item.task;
          try{
            const prepared=await this.bridge.execute<{completed:boolean}>('consistency_agent_verify',
              {run_id:runId,anchor_id:task.anchorId,attempt:task.attempt},signal,{timeoutMs:0});
            if(prepared.completed){await this.closeTrace(runId,task.anchorId);finalized.add(task.anchorId);}
            else if(snapshot.roles.vision.error||!snapshot.roles.vision.profile)
              throw new Error('视觉模型角色不可用：'+(snapshot.roles.vision.error||'未配置'));
          }catch(error){
            failed.add(task.anchorId);await this.failure({run_id:runId,anchor_id:task.anchorId,attempt:task.attempt},error,signal);
          }
        }else if(item.kind==='pair_inputs'||item.kind==='pairs'){
          const current=item.tasks.filter(task=>task.links.some(link=>!failed.has(link.anchor_id)&&!finalized.has(link.anchor_id)));
          if(!current.length)return;
          try{
            if(item.kind==='pair_inputs'){
              await this.bridge.execute('consistency_agent_pair_prepare_many',
                {run_id:runId,pair_keys:current.map(task=>task.pair_key)},signal,{timeoutMs:0});
              return;
            }
            const {receipts}=await this.bridge.execute<{receipts:PairReviewReceipt[]}>('consistency_agent_pair_review_many',
              {run_id:runId,pair_keys:current.map(task=>task.pair_key),_model_execution:await this.providers.credentialsFor(snapshot.roles.vision.profile!)},
              signal,{timeoutMs:0});
            for(const receipt of receipts)for(const link of receipt.links){
              const anchor=byAnchor.get(link.anchor_id);
              if(anchor)await this.host.notice(anchor.sessionId,{type:'iad/consistency',summary:'图像内容核对已完成',
                value:{job_id:runId,anchor_id:anchor.anchorId,comparisons:[receipt]}});
            }
          }catch(error){
            const unresolved=item.kind==='pairs'?new Set((await this.bridge.execute<{tasks:PairReviewTask[]}>(
              'consistency_agent_pair_tasks',{run_id:runId})).tasks.map(task=>task.pair_key)):undefined;
            for(const task of current)for(const link of task.links){
              if(unresolved&&!unresolved.has(task.pair_key))continue;
              const anchor=byAnchor.get(link.anchor_id);
              if(anchor&&!failed.has(anchor.anchorId)){
                failed.add(anchor.anchorId);
                await this.failure({run_id:runId,anchor_id:anchor.anchorId,attempt:anchor.attempt},error,signal);
              }
            }
          }
        }else if(item.kind==='settle'){
          if(components[item.index].every(id=>failed.has(id)||finalized.has(id)||audited.has(id)))settled.add(item.index);
        }else{
          const task=item.task;
          if(failed.has(task.anchorId)||finalized.has(task.anchorId))return;
          try{
            if(item.kind==='audit'){
              if(await this.review(task))audited.add(task.anchorId);
            }else if(settled.has(componentOf.get(task.anchorId)!)){
              await this.bridge.execute('consistency_agent_finalize',{run_id:runId,anchor_id:task.anchorId,attempt:task.attempt});
              await this.closeTrace(runId,task.anchorId);
              finalized.add(task.anchorId);
            }
          }catch(error){
            failed.add(task.anchorId);
            await this.failure({run_id:runId,anchor_id:task.anchorId,attempt:task.attempt},error,signal);
          }
        }
      });
      if (signal.aborted) break;
      pending=(await this.bridge.execute<{tasks:PairReviewTask[]}>('consistency_agent_pair_tasks',{run_id:runId})).tasks;
      if (!pending.length) break;
    }
    await runConcurrent(work.filter(task=>!failed.has(task.anchorId)&&!finalized.has(task.anchorId)),snapshot.concurrency,signal,async task=>{
      const identity={run_id:runId,anchor_id:task.anchorId,attempt:task.attempt};
      try {
        if (pending.some(pair=>pair.links.some(link=>link.anchor_id===task.anchorId)))
          throw new Error('图像内容核对与标注观察仍有矛盾，主图未完成');
        await this.bridge.execute('consistency_agent_finalize',identity);
        await this.closeTrace(runId,task.anchorId);
      } catch(error) {await this.failure(identity,error,signal);}
    });
    const node = await this.bridge.execute<JobSnapshot>('analysis_node', {run_id: runId});
    if (node.status === 'RUNNING') await this.bridge.execute('consistency_agent_finish', {run_id: runId});
  }

  private async failure(identity: {run_id: string; anchor_id: string; attempt: number}, error: unknown, signal: AbortSignal, sourcePhase?:string): Promise<void> {
    const current = await this.bridge.execute<ConsistencyAnchorRun>('consistency_agent_anchor', identity);
    if (current.state === 'COMPLETED') {
      await this.pendingTrace(identity.run_id, identity.anchor_id, error);
    } else if (!signal.aborted && ['PENDING','RUNNING'].includes(current.state)) {
      const details = error instanceof Error && 'details' in error ? error.details as Partial<JobFailure> : undefined;
      const failed = await this.bridge.execute<ConsistencyAnchorRun>('consistency_agent_failure', {...identity,
        message: error instanceof Error ? error.message : String(error),
        code: error instanceof Error && 'code' in error ? error.code : undefined,
        source_run_id: details?.source_run_id, source_phase: details?.source_phase || sourcePhase});
      if (failed.state === 'FAILED' && failed.session_created) {
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
