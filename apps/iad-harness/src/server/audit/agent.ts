import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {LlmError,MessageId,type ContentBlock} from '@deepseek-ai/dsh-llm';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import {defineTool} from '@deepseek-ai/dsh-tools';
import type {AuditBatch,AuditMasterContext,AuditReportSession,AuditSampleRun,AuditWorkflowSnapshot,ImageSessionLocation,RegistrationMediaPage} from '../../shared/domain.generated.js';
import {auditBatchParameters,auditRecordParameters,auditReportParameters,auditReportEvidenceParameters} from '../../shared/audit.parameters.generated.js';
import {auditBatchDeltaParameters,auditDiscoveryParameters} from '../../shared/audit-context.parameters.generated.js';
import {auditDistributionParameters} from '../../shared/distribution.parameters.generated.js';
import type {PythonBridge} from '../python-bridge/index.js';
import type {NativeProviders} from '../models/providers.js';
import {JobSessionHost} from '../sessions/host.js';
import {NativeMediaAttachments,nativeMediaOutput} from '../sessions/media.js';
import {NativeModelCalls} from '../sessions/model-calls.js';
import {workbenchJsonOutput} from '../tool-output.js';
import {auditSessionPath} from './session-path.js';
import {AuditImageAgents} from './images.js';

const masterTools=['audit_statistics','audit_distribution','audit_records','audit_report_evidence','audit_batch_commit','audit_report_commit'];

export class AuditMasterAgent {
  constructor(private readonly bridge:PythonBridge,private readonly host:JobSessionHost,
    private readonly providers:NativeProviders,private readonly dataRoot:string) {}

  async run(runId:string,snapshot:AuditWorkflowSnapshot,signal:AbortSignal):Promise<void> {
    const identity={run_id:runId};
    const state=await this.bridge.execute<AuditReportSession>('audit_agent_report_state',identity);
    if(state.state==='COMPLETED')return;
    const master=snapshot.master_prompt;
    const reportInstruction=snapshot.report_instruction;
    const location=await this.bridge.execute<ImageSessionLocation>('audit_agent_session_location',{session_id:state.session_id});
    const {profile,native_profile}=snapshot.agent;
    if(!profile?.model_id||!native_profile)throw new Error('审计缺少冻结的原生模型');
    if(!state.session_created){
      await this.host.create(state.session_id);
      await this.host.notice(state.session_id,{type:'iad/job',summary:'数据集联合审计已受理',value:{job_id:runId}});
      await this.bridge.execute('audit_agent_report_session_created',identity);
    }
    const provider='audit-'+state.session_id;
    const onDemand=snapshot.context_policy==='evidence-on-demand-v1';
    const failures=new Map<string,unknown>();
    let observers!:AuditImageAgents;
    await this.host.withAgent(state.session_id,{signal,subagents:snapshot.settings.concurrency,evidenceOnDemand:onDemand,
      agentOptions:{provider,model:profile.model_id,maxTokens:profile.max_output_tokens??undefined},
      setup:async scope=>{scope.tools.restrict({allow:onDemand?[...masterTools,'audit_discovery']:masterTools});},
      sharedSetup:async scope=>{
        const attachments=new NativeMediaAttachments(scope,path.dirname(auditSessionPath(this.dataRoot,location)));
        if(profile.credential_ref)scope.provide('credentials',this.providers.credentials);
        await scope.plugin(piAi,{providers:{[provider]:{...native_profile,requestImagePixelBudget:Number.MAX_SAFE_INTEGER,
          requestImageMaxBytes:Number.MAX_SAFE_INTEGER} as piAi.PiAiProviderProfile}});
        const {samples}=await this.bridge.execute<{samples:AuditSampleRun[]}>('audit_agent_samples',identity);
        await scope.inject(['subagents'],injected=>{observers=new AuditImageAgents(this.bridge,runId,attachments,injected.subagents,snapshot,samples,failures);});
        observers.register(scope);
        new NativeModelCalls().attach(scope,{
          start:async request=>{
            const messages=request.request.messages as {content:ContentBlock[]}[];
            const evidence_ids=[...new Set(messages.flatMap(message=>message.content).flatMap(block=>
              block.type==='image'&&!block.offloaded&&block.attachment.name?.endsWith('.png')?[block.attachment.name.slice(0,-4)]:[]))];
            await this.bridge.execute('audit_agent_model_call_start',{...identity,request,evidence_ids});
          },
          end:async result=>{await this.bridge.execute('audit_agent_model_call_end',{...identity,result});},
        });
        scope.on('agent/error',event=>{failures.set(event.agent.id,event.error);});
        scope.on('session/event',(session,event)=>{
          if(event.type==='turn/end'&&event.data.reason.kind==='max-tokens')
            failures.set(session.id,new LlmError('审计输出达到本次请求上限，尚未提交当前结果','MAX_TOKENS'));
        });
        scope.on('agent/request',async(event,next)=>{
          const request=await next();
          return {...request,
            ...(profile.request_parameters.temperature!==undefined?{temperature:profile.request_parameters.temperature as number}:{}),
            ...(profile.request_parameters.stop!==undefined?{stop:profile.request_parameters.stop as string[]}:{}),
          };
        });
        scope.systemPrompt.section({name:'audit-role',order:100,interpolate:false,
          text:({agent})=>(agent?.id===state.session_id?master:snapshot.observer_prompt)!.system_prompt||''});
        scope.tools.register(defineTool({name:'audit_statistics',description:'读取按有效图级版本计算的覆盖、疑点、观察、一致性交叉和知识作用统计。',parameters:{},output:workbenchJsonOutput,
          execute:(_args,execution)=>this.bridge.execute('audit_agent_report_statistics',identity,execution.signal)}));
        scope.tools.register(defineTool({name:'audit_distribution',description:'读取程序从冻结原图尺寸和原始标注计算的类别图数、框数、几何分布、分位数、密度和来源分布。可按子数据集和类别筛选，数字直接采用工具结果。',
          parameters:auditDistributionParameters,output:workbenchJsonOutput,
          execute:(query,execution)=>this.bridge.execute('audit_agent_distribution',{...identity,query},execution.signal)}));
        scope.tools.register(defineTool({name:'audit_records',description:'分页读取冻结范围的有效图级结果及上游记录，压缩后可重读。',parameters:auditRecordParameters,output:workbenchJsonOutput,
          execute:(query,execution)=>this.bridge.execute('audit_agent_report_records',{...identity,query},execution.signal)}));
        if(onDemand)scope.tools.register(defineTool({name:'audit_discovery',description:'分页读取指定发现的完整业务正文、正式精选和支持或反例引用。修改主张或范围前读齐旧引用，逐项明确保留、移除或迁移角色；图级详情通过audit_records读取。',
          parameters:auditDiscoveryParameters,output:workbenchJsonOutput,
          execute:(query,execution)=>this.bridge.execute('audit_agent_discovery',{...identity,query},execution.signal)}));
        scope.tools.register(defineTool({name:'audit_report_evidence',description:'打开冻结主图的完整原图与原始人工标注，用于跨图比较和选择典型或对照证据。',parameters:auditReportEvidenceParameters,output:nativeMediaOutput,
          execute:async(query,execution)=>attachments.prepare(await this.bridge.execute<RegistrationMediaPage>('audit_agent_report_evidence',{...identity,...query},execution.signal),execution.signal)}));
        scope.tools.register(defineTool({name:'audit_batch_commit',description:onDemand?
          '一次提交本批联合分析的发现增量和必要定向复审。discoveries仅新增或正文改变的完整条目；evidence_changes只提交支持、反例引用的add/remove/keep；representative_changes按条目独立替换精选。改变主张或范围须逐项复核旧引用，未改变条目省略。保留撤回历史，不把子报告自动接纳为正式依据。原子成功后结束本轮。':
          '提交本批联合分析后的完整全局发现账本和必要的定向复审请求。保留支持、反例、范围及撤回记录，下一批只接收发布后的短线索。成功结束本轮。',
          parameters:onDemand?auditBatchDeltaParameters:auditBatchParameters,output:workbenchJsonOutput,execute:async(submission,execution)=>{
            if(execution.agent?.id!==state.session_id)throw new Error('仅主 Agent 可以发布全局发现');
            const result=await this.bridge.execute('audit_agent_batch_commit',{...identity,submission},execution.signal);
            execution.concludeTurn();return result;
          }}));
        scope.tools.register(defineTool({name:'audit_report_commit',description:'完成全部批次后提交六维分析和分用途评价，只选择有真实原图的有效全局发现。数量和正式就绪来自程序。成功结束报告。',
          parameters:auditReportParameters,output:workbenchJsonOutput,execute:async(submission,execution)=>{
            if(execution.agent?.id!==state.session_id)throw new Error('仅主 Agent 可以提交整体报告');
            const result=await this.bridge.execute<{job_id:string;state:string;revision:number}>('audit_agent_report_commit',{...identity,submission},execution.signal);
            execution.concludeTurn();return onDemand?{job_id:result.job_id,state:result.state,revision:result.revision}:result;
          }}));
      }},async agent=>{
        const abort=()=>agent.cancel({kind:'parent'});
        signal.addEventListener('abort',abort,{once:true});
        try{
          while(true){
            signal.throwIfAborted();
            const batch=await this.bridge.execute<AuditBatch|null>('audit_agent_batch',identity,signal);
            if(batch)await agent.runMaintenance(async()=>{
              try{await observers.wave(agent,batch,signal);}
              finally{
                for(const message of [...agent.inbox.nextTurn,...agent.inbox.nextStep])
                  if(message.source.kind==='subagent-settled')agent.inbox.remove(message.id);
              }
            });
            else await this.bridge.execute('audit_agent_report_begin',identity,signal);
            const context=await this.bridge.execute<AuditMasterContext>('audit_agent_batch_context',identity,signal);
            failures.delete(state.session_id);
            agent.followup({id:MessageId(randomUUID()),role:'user',source:{kind:'user'},content:[
              {type:'text',text:JSON.stringify(context)+'\n\n'},
              {type:'text',text:batch?master.user_prompt:reportInstruction},
            ]});
            await agent.whenIdle();
            if(failures.has(state.session_id))throw failures.get(state.session_id);
            const saved=await this.bridge.execute<AuditReportSession>('audit_agent_report_state',identity);
            if(!batch){
              if(saved.state!=='COMPLETED')throw new Error('主 Agent 结束但未提交整体报告');
              break;
            }
            if(saved.revision===context.revision)throw new Error('主 Agent 结束但未发布本批联合分析');
          }
        }finally{signal.removeEventListener('abort',abort);}
      });
  }
}
