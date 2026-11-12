import path from 'node:path';
import fs from 'node:fs/promises';
import type {AuditAgentConfiguration,AuditSampleRun,AuditReportSession,AuditWorkflowSnapshot,ImageSessionLocation,JobView} from '../../shared/domain.generated.js';
import type {BridgeDispatch,ModelRouting,PythonBridge} from '../python-bridge/index.js';
import type {NativeProviders} from '../models/providers.js';
import type {JobSessionHost} from '../sessions/host.js';
import {AuditMasterAgent} from './agent.js';
import {auditSessionPath} from './session-path.js';

export class AuditWorkflowScheduler implements ModelRouting {
  private readonly tasks=new Map<string,{controller:AbortController;promise:Promise<void>}>();
  constructor(private readonly bridge:PythonBridge,private readonly providers:NativeProviders,private readonly host:JobSessionHost,
    private readonly dataRoot:string,private readonly onError:(error:unknown)=>void) {}

  async execute(operation:string,args:Record<string,any>,signal:AbortSignal|undefined,dispatch:BridgeDispatch):Promise<any> {
    if(operation==='audit_start')return this.start(args.request);
    if(operation==='audit_cancel'||operation==='audit_retry') {
      const job=await dispatch('analysis_node',{run_id:args.run_id},signal);
      if(job.request?.audit_workflow_version)return operation==='audit_cancel'?this.cancel(args.run_id):this.resume(args.run_id);
    }
    if(operation==='audit_agent_report_session_export'){
      const report=await this.bridge.execute<AuditReportSession>('audit_agent_report_state',args);
      if(!report.session_created)throw new Error('报告Session尚未创建');
      return {filename:'audit-report-'+args.run_id+'.jsonl',jsonl:await this.host.exportJsonl(report.session_id)};
    }
    if(operation==='audit_agent_session_export') {
      const sample=await this.bridge.execute<AuditSampleRun>('audit_agent_sample',args);
      if(!sample.session_created)throw new Error('本图审计Session尚未创建');
      const location=await this.bridge.execute<ImageSessionLocation>('audit_agent_session_location',{session_id:sample.session_id});
      return {filename:path.basename(auditSessionPath(this.dataRoot,location)),jsonl:await this.host.exportJsonl(sample.session_id)};
    }
    return dispatch(operation,args,signal);
  }

  async start(request:Record<string,unknown>):Promise<JobView> {
    const configuration=await this.bridge.execute<AuditAgentConfiguration>('audit_agent_configuration');
    const agent=await this.providers.freeze(configuration.settings.model,configuration.settings.agent_limits,'agent',configuration.settings.reasoning_effort);
    const {created,...job}=await this.bridge.execute<JobView&{created:boolean}>('audit_agent_start',{request,configuration,agent});
    if(created&&['PENDING','RUNNING'].includes(job.status))this.launch(job.run_id);
    return job;
  }

  private launch(runId:string):void {
    const controller=new AbortController();
    const promise=this.run(runId,controller.signal).catch(async error=>{
      if(controller.signal.aborted)return;
      await this.bridge.execute('audit_agent_finish',{run_id:runId,error:{
        type:error instanceof Error?error.name:'Error',message:error instanceof Error?error.message:String(error),
      }});
    }).finally(()=>this.tasks.delete(runId));
    this.tasks.set(runId,{controller,promise});void promise.catch(this.onError);
  }

  private async run(runId:string,signal:AbortSignal):Promise<void> {
    const snapshot=await this.bridge.execute<AuditWorkflowSnapshot>('audit_agent_snapshot',{run_id:runId});
    const {samples}=await this.bridge.execute<{samples:AuditSampleRun[]}>('audit_agent_samples',{run_id:runId});
    const pending=samples.filter(sample=>sample.state!=='COMPLETED');
    const agent=new AuditMasterAgent(this.bridge,this.host,this.providers,this.dataRoot);
    if(pending.length)await this.bridge.execute('audit_agent_prepare_inputs',{run_id:runId},signal);
    if(!signal.aborted){
      try{await agent.run(runId,snapshot,signal);}
      catch(error){
        if(signal.aborted)return;
        await this.bridge.execute('audit_agent_report_failure',{run_id:runId,message:error instanceof Error?error.message:String(error)});
      }
      await this.bridge.execute('audit_agent_finish',{run_id:runId});
      await this.writeReport(runId);
    }
  }

  private async writeReport(runId:string):Promise<void> {
    const {samples}=await this.bridge.execute<{samples:AuditSampleRun[]}>('audit_agent_samples',{run_id:runId});
    for(const sample of samples)if(sample.state==='COMPLETED')await this.host.notice(sample.session_id,{type:'iad/job',summary:'图级审计已提交',
      value:{kind:'audit-final',job_id:sample.job_id,sample_id:sample.sample_id,final:sample.result},record_id:'audit-final:'+sample.sample_id});
    const location=await this.bridge.execute<ImageSessionLocation>('audit_agent_session_location',{session_id:samples[0].session_id});
    const directory=path.dirname(auditSessionPath(this.dataRoot,location));
    const summary=await this.bridge.execute('audit_job_report',{run_id:runId});
    const report=await this.bridge.execute<{html:string}>('audit_job_export',{run_id:runId});
    await fs.mkdir(directory,{recursive:true});
    await fs.writeFile(path.join(directory,'summary.json'),JSON.stringify(summary,null,2)+'\n');
    await fs.writeFile(path.join(directory,'report.html'),report.html);
  }

  async cancel(runId:string):Promise<JobView> {
    const task=this.tasks.get(runId);task?.controller.abort();await task?.promise;
    const job=await this.bridge.execute<JobView>('audit_agent_cancel',{run_id:runId});
    await this.writeReport(runId);return job;
  }

  async resume(runId:string):Promise<JobView> {
    if(this.tasks.has(runId))return this.bridge.execute('audit_status',{run_id:runId});
    const existing=await this.bridge.execute<JobView>('audit_status',{run_id:runId});
    if(existing.status==='COMPLETED')return existing;
    const job=await this.bridge.execute<JobView>('audit_agent_resume',{run_id:runId});this.launch(runId);return job;
  }

  async whenIdle():Promise<void>{await Promise.all([...this.tasks.values()].map(task=>task.promise));}
  async dispose():Promise<void>{
    const tasks=[...this.tasks];for(const[,task]of tasks)task.controller.abort();await this.whenIdle();
    for(const[runId]of tasks) {
      await this.bridge.execute('audit_agent_interrupt',{run_id:runId});
      await this.writeReport(runId);
    }
  }
}
