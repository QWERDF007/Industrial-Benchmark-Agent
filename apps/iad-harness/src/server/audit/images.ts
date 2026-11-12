import type {Context} from '@deepseek-ai/cordis';
import type {Agent} from '@deepseek-ai/dsh-agent';
import {SessionId} from '@deepseek-ai/dsh-session';
import type {SubagentRuntime} from '@deepseek-ai/dsh-subagent';
import type {ContentBlock} from '@deepseek-ai/dsh-llm';
import {defineTool} from '@deepseek-ai/dsh-tools';
import type {AuditAgentContext,AuditBatch,AuditRecheck,AuditSampleRun,AuditWorkflowSnapshot,RegistrationMediaPage} from '../../shared/domain.generated.js';
import {analysisMediaParameters} from '../../shared/analysis-agent.parameters.generated.js';
import {evidenceReferenceParameters} from '../../shared/media-reference.parameters.generated.js';
import {auditCommitParameters,auditCropParameters} from '../../shared/audit.parameters.generated.js';
import {auditEvidenceCommitParameters,auditMediaParameters} from '../../shared/audit-context.parameters.generated.js';
import {analysisEvidenceReferenceParameters} from '../../shared/analysis-context.parameters.generated.js';
import type {PythonBridge} from '../python-bridge/index.js';
import {NativeMediaAttachments,nativeMediaOutput} from '../sessions/media.js';
import {workbenchJsonOutput} from '../tool-output.js';
import {runConcurrent} from '../jobs/concurrency.js';

export const auditImageTools=['audit_context','audit_images','audit_crop','audit_reference','audit_commit'];

export class AuditImageAgents {
  private readonly samples:Map<string,AuditSampleRun>;
  constructor(private readonly bridge:PythonBridge,private readonly runId:string,
    private readonly attachments:NativeMediaAttachments,private readonly subagents:SubagentRuntime,
    private readonly snapshot:AuditWorkflowSnapshot,samples:AuditSampleRun[],private readonly failures:Map<string,unknown>) {
    this.samples=new Map(samples.map(sample=>[sample.session_id,sample]));
  }

  private identity(sessionId:string|undefined):{run_id:string;sample_id:string} {
    const sample=sessionId?this.samples.get(sessionId):undefined;
    if(!sample)throw new Error('图级工具只属于本图独立子 Agent');
    return {run_id:this.runId,sample_id:sample.sample_id};
  }

  register(scope:Context):void {
    const onDemand=this.snapshot.context_policy==='evidence-on-demand-v1';
    scope.tools.register(defineTool({name:'audit_context',description:'重读当前图的冻结材料、当批线索及定向复审原因。',parameters:{},output:workbenchJsonOutput,
      execute:(_args,execution)=>this.bridge.execute('audit_agent_context',this.identity(execution.agent?.id),execution.signal)}));
    scope.tools.register(defineTool({name:'audit_images',description:'补看当前主图或其已登记一致性候选。首次已一次提供全部主图材料；按需选择完整原图或标注局部，主动裁窗使用audit_crop。',parameters:onDemand?auditMediaParameters:analysisMediaParameters,output:nativeMediaOutput,
      execute:async(query,execution)=>this.attachments.prepare(await this.bridge.execute<RegistrationMediaPage>('audit_agent_media',
        {...this.identity(execution.agent?.id),query},execution.signal),execution.signal)}));
    scope.tools.register(defineTool({name:'audit_crop',description:'按原图像素坐标补看当前图或登记候选的完整裁窗，仅供内部观察。',parameters:auditCropParameters,output:nativeMediaOutput,
      execute:async(query,execution)=>this.attachments.prepare(await this.bridge.execute<RegistrationMediaPage>('audit_agent_crop',
        {...this.identity(execution.agent?.id),query},execution.signal),execution.signal)}));
    scope.tools.register(defineTool({name:'audit_reference',description:'补看已选知识的冻结证据，默认完整原图及标注元数据，标注局部须显式请求。',parameters:onDemand?analysisEvidenceReferenceParameters:evidenceReferenceParameters,output:nativeMediaOutput,
      execute:async(query,execution)=>this.attachments.prepare(await this.bridge.execute<RegistrationMediaPage>('audit_agent_reference',
        {...this.identity(execution.agent?.id),...query},execution.signal),execution.signal)}));
    scope.tools.register(defineTool({name:'audit_commit',description:'提交当前图的独立结果、全部疑点、简短观察与视觉特征，逐项回应上游差异、所选知识和本批线索。证据只引用实际观察的完整原图。',
      parameters:onDemand?auditEvidenceCommitParameters:auditCommitParameters,output:workbenchJsonOutput,execute:async(submission,execution)=>{
        const result=await this.bridge.execute<{execution_status:string}>('audit_agent_commit',
          {...this.identity(execution.agent?.id),submission},execution.signal);
        if(result.execution_status==='completed')execution.concludeTurn();
        return onDemand?{execution_status:result.execution_status}:result;
      }}));
  }

  async wave(parent:Agent,batch:AuditBatch,signal:AbortSignal):Promise<void> {
    const {samples}=await this.bridge.execute<{samples:AuditSampleRun[]}>('audit_agent_samples',{run_id:this.runId});
    const {reviews}=await this.bridge.execute<{reviews:AuditRecheck[]}>('audit_agent_rechecks',{run_id:this.runId});
    const requested=new Set(reviews.map(review=>review.sample_id));
    const pending=samples.filter(sample=>requested.has(sample.sample_id)||(batch.sample_ids.includes(sample.sample_id)&&sample.state!=='COMPLETED'));
    await runConcurrent(pending,this.snapshot.settings.concurrency,signal,async sample=>{
      const identity={run_id:this.runId,sample_id:sample.sample_id};
      const childId=SessionId(sample.session_id);
      const abort=()=>this.subagents.interrupt(childId,{kind:'ancestor',agent:parent});
      try{
        this.failures.delete(sample.session_id);
        const context=await this.bridge.execute<AuditAgentContext>('audit_agent_context',identity,signal);
        const page=await this.bridge.execute<RegistrationMediaPage>('audit_agent_media',{...identity,
          query:{sample_id:sample.sample_id,...(this.snapshot.context_policy==='evidence-on-demand-v1'?{view:'all'}:{})}},signal);
        if(page.error)throw new Error(page.error);
        if(!page.images.length||page.images.length!==page.total)throw new Error('当前图像完整输入缺失');
        const content:ContentBlock[]=[{type:'text',text:JSON.stringify(context)+'\n\n'},
          ...nativeMediaOutput.render({},await this.attachments.prepare(page,signal)),
          {type:'text',text:this.snapshot.observer_prompt!.user_prompt}];
        signal.addEventListener('abort',abort,{once:true});
        if(await parent.ctx.sessionPersistence.stat(childId)){
          await this.bridge.execute('audit_agent_session_created',identity);
          await this.subagents.sendMessage(parent,childId,content,{signal});
        }else{
          await this.subagents.startContinuable({provider:'spawn',label:'图像审计',childId,signal,
            request:{parent,prompt:content,maxDepth:1,toolFilter:{allow:auditImageTools}}});
          await this.bridge.execute('audit_agent_session_created',identity);
        }
        const child=parent.ctx.agents.get(childId);
        if(!child)throw new Error('原生子 Agent 未创建执行实例');
        await child.whenIdle();signal.throwIfAborted();
        if(this.failures.has(sample.session_id))throw this.failures.get(sample.session_id);
        const saved=await this.bridge.execute<AuditSampleRun>('audit_agent_sample',identity);
        if(saved.state!=='COMPLETED'||saved.result_revision<=sample.result_revision)throw new Error('子 Agent 结束但未提交当前图级终稿');
      }catch(error){
        if(!signal.aborted)await this.bridge.execute('audit_agent_failure',{...identity,message:error instanceof Error?error.message:String(error)});
      }finally{
        signal.removeEventListener('abort',abort);
        await this.subagents.drainContinuableChildren(parent,[childId]);
      }
    });
  }
}
