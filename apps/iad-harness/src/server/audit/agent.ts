import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {LlmError,MessageId,type ContentBlock} from '@deepseek-ai/dsh-llm';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import {defineTool} from '@deepseek-ai/dsh-tools';
import type {AuditAgentContext,AuditSampleRun,AuditReportSession,AuditWorkflowSnapshot,ImageSessionLocation,RegistrationMediaPage,TokenBudget} from '../../shared/domain.generated.js';
import {analysisMediaParameters} from '../../shared/analysis-agent.parameters.generated.js';
import {evidenceReferenceParameters} from '../../shared/media-reference.parameters.generated.js';
import {auditCommitParameters,auditCropParameters,auditRecordParameters,auditGroupParameters,auditReportParameters,auditReportEvidenceParameters} from '../../shared/audit.parameters.generated.js';
import type {PythonBridge} from '../python-bridge/index.js';
import type {NativeProviders} from '../models/providers.js';
import {JobSessionHost} from '../sessions/host.js';
import {NativeMediaAttachments,nativeMediaOutput} from '../sessions/media.js';
import {NativeModelBudget} from '../sessions/model-budget.js';
import {NativeModelCalls} from '../sessions/model-calls.js';
import {workbenchJsonOutput} from '../tool-output.js';
import {auditSessionPath} from './session-path.js';

export class AuditWorkflowAgent {
  constructor(private readonly bridge:PythonBridge,private readonly host:JobSessionHost,
    private readonly providers:NativeProviders,private readonly dataRoot:string) {}

  async run(runId:string,sampleId:string|null,snapshot:AuditWorkflowSnapshot,signal:AbortSignal):Promise<void> {
    const report=sampleId===null,identity={run_id:runId,sample_id:sampleId};
    const stateOperation=report?'audit_agent_report_state':'audit_agent_sample';
    const state=await this.bridge.execute<AuditSampleRun|AuditReportSession>(stateOperation,identity);
    if(state.state==='COMPLETED')return;
    const location=await this.bridge.execute<ImageSessionLocation>('audit_agent_session_location',{session_id:state.session_id});
    const {profile,native_profile}=snapshot.agent;
    if (!profile?.model_id || !native_profile) throw new Error('审计缺少冻结的原生模型');
    if (!state.session_created) {
      await this.host.create(state.session_id);
      await this.host.notice(state.session_id,{type:'iad/job',summary:report?'数据集审计报告已受理':'独立图像审计已受理',value:{job_id:runId,sample_id:sampleId}});
      await this.bridge.execute(report?'audit_agent_report_session_created':'audit_agent_session_created',identity);
    }
    const provider='audit-'+state.session_id;
    let failure:unknown,attachments:NativeMediaAttachments;
    await this.host.withAgent(state.session_id,{signal,agentOptions:{provider,model:profile.model_id,maxTokens:profile.max_output_tokens ?? undefined},
      setup:async scope=>{
        attachments=new NativeMediaAttachments(scope,path.join(path.dirname(auditSessionPath(this.dataRoot,location)),location.image_id));
        if(profile.credential_ref)scope.provide('credentials',this.providers.credentials);
        const execution=await this.providers.credentialsFor(profile);
        const budget=await NativeModelBudget.open({...native_profile, requestImagePixelBudget:Number.MAX_SAFE_INTEGER,
          requestImageMaxBytes:Number.MAX_SAFE_INTEGER} as piAi.PiAiProviderProfile,
          (body,cancellation)=>this.bridge.execute<TokenBudget>('audit_agent_capacity',{...identity,body,_model_execution:execution},cancellation));
        scope.effect(()=>()=>budget.close());
        await scope.plugin(piAi,{providers:{[provider]:budget.profile}});
        new NativeModelCalls().attach(scope,{
          start:async request=>{
            const messages=request.request.messages as {content:ContentBlock[]}[];
            const evidence_ids=[...new Set(messages.flatMap(message=>message.content).flatMap(block=>block.type==='image'&&!block.offloaded&&block.attachment.name?.endsWith('.png')
              ?[block.attachment.name.slice(0,-4)]:[]))];
            await this.bridge.execute('audit_agent_model_call_start',{...identity,request,evidence_ids});
          },
          end:async result=>{await this.bridge.execute('audit_agent_model_call_end',{...identity,result});},
        });
        scope.on('agent/error',event=>{failure=event.error;});
        scope.on('session/event',(_session,event)=>{
          if(event.type==='turn/end'&&event.data.reason.kind==='max-tokens') failure=new LlmError('审计输出达到本次请求上限，未提交终稿','MAX_TOKENS');
        });
        scope.on('agent/request',async(_event,next)=>({...await next(),
          ...(profile.request_parameters.temperature!==undefined?{temperature:profile.request_parameters.temperature as number}:{}),
          ...(profile.request_parameters.stop!==undefined?{stop:profile.request_parameters.stop as string[]}:{}),
        }));
        scope.systemPrompt.section({name:'audit-instruction',order:100,text:snapshot.system_prompt ?? snapshot.instruction});
        if(report){
          scope.tools.register(defineTool({name:'audit_statistics',description:'读取程序统计：完成覆盖、两类业务结论、未完成、独立问题次数、涉及图数、子集分布、上游一致性交叉表和知识作用。不自行估计数量。',parameters:{},output:workbenchJsonOutput,
            execute:(_args,execution)=>this.bridge.execute('audit_agent_report_statistics',identity,execution.signal)}));
          scope.tools.register(defineTool({name:'audit_records',description:'分页读取本作业图级结果、全部疑点及关联的一致性原始分析和逐项处理意见。total用于遍历全部记录，不用候选代替主图统计。',parameters:auditRecordParameters,output:workbenchJsonOutput,
            execute:(query,execution)=>this.bridge.execute('audit_agent_report_records',{...identity,query},execution.signal)}));
          scope.tools.register(defineTool({name:'audit_group_issues',description:'分批保存、按group_id更新或用remove_group_ids删除主题，可在一次提交中重组；issue_refs必须完整引用真实完成图级疑点，每项只归一个主主题。每组1至3张代表图，可加1张判断边界对照图，数量由程序计算。',parameters:auditGroupParameters,output:workbenchJsonOutput,
            execute:(submission,execution)=>this.bridge.execute('audit_agent_report_groups',{...identity,submission},execution.signal)}));
          scope.tools.register(defineTool({name:'audit_report_evidence',description:'补看本作业逐图已经实际观察的冻结原图或局部；不新增图级发现，不检索全库。',parameters:auditReportEvidenceParameters,output:nativeMediaOutput,
            execute:async(query,execution)=>attachments.prepare(await this.bridge.execute<RegistrationMediaPage>('audit_agent_report_evidence',{...identity,...query},execution.signal),execution.signal)}));
          scope.tools.register(defineTool({name:'audit_report_commit',description:'提交范围与方法、问题分析、一致性交叉分析、知识作用、整体结论和限制。程序核验全部疑点已归组、引用真实、统计可复算。成功保存后结束报告；失败未保存，可修正重提。',parameters:auditReportParameters,output:workbenchJsonOutput,
            execute:async(submission,execution)=>{const result=await this.bridge.execute('audit_agent_report_commit',{...identity,submission},execution.signal);execution.concludeTurn();return result;}}));
        } else {
          scope.tools.register(defineTool({name:'audit_context',description:'重读本图冻结主图、已选知识与一致性完整分析，不含其他主图审计终稿。首次输入已联合提供主图及全部局部。',parameters:{},output:workbenchJsonOutput,
            execute:(_args,execution)=>this.bridge.execute('audit_agent_context',identity,execution.signal)}));
          scope.tools.register(defineTool({name:'audit_images',description:'按需补看本主图或其已登记一致性候选的原图和标注局部。首次审核所需主图材料已经一次发送，无需分批取齐。',parameters:analysisMediaParameters,output:nativeMediaOutput,
            execute:async(query,execution)=>attachments.prepare(await this.bridge.execute<RegistrationMediaPage>('audit_agent_media',{...identity,query},execution.signal),execution.signal)}));
          scope.tools.register(defineTool({name:'audit_crop',description:'主动补看主图或已登记候选的原像素裁窗，bbox为[x0,y0,x1,y1]半开区间，不新增审计主图。',parameters:auditCropParameters,output:nativeMediaOutput,
            execute:async(query,execution)=>attachments.prepare(await this.bridge.execute<RegistrationMediaPage>('audit_agent_crop',{...identity,query},execution.signal),execution.signal)}));
          scope.tools.register(defineTool({name:'audit_reference',description:'按真实evidence_id补看已选知识的冻结支持或反例，不读取未选知识或全库图片。',parameters:evidenceReferenceParameters,output:nativeMediaOutput,
            execute:async(args,execution)=>attachments.prepare(await this.bridge.execute<RegistrationMediaPage>('audit_agent_reference',{...identity,...args},execution.signal),execution.signal)}));
          scope.tools.register(defineTool({name:'audit_commit',description:'保存本图执行状态、两类业务结论、全部疑点、上游差异逐项处理、知识适用性与真实证据。未完成记录可保存线索；completed必须完成必要观察、逐项覆盖上游差异和已选知识。成功保存completed终稿后结束本图，校验失败未保存。',parameters:auditCommitParameters,output:workbenchJsonOutput,
            execute:async(submission,execution)=>{const result=await this.bridge.execute<{execution_status:string}>('audit_agent_commit',{...identity,submission},execution.signal);if(result.execution_status==='completed')execution.concludeTurn();return result;}}));
        }
      }},async agent=>{
        const abort=()=>agent.cancel({kind:'parent'});signal.addEventListener('abort',abort,{once:true});
        try {
          const content:ContentBlock[]=[];
          if(report){
            content.push({type:'text',text:JSON.stringify(await this.bridge.execute('audit_agent_report_context',identity))+'\n\n'},
              {type:'text',text:snapshot.report_instruction||''});
          }else{
            const context=await this.bridge.execute<AuditAgentContext>('audit_agent_context',identity);
            const input=await this.bridge.execute<RegistrationMediaPage>('audit_agent_media',{...identity,query:{sample_id:sampleId}},signal);
            if(input.error)throw new Error(input.error);
            if(!input.images.length||input.images.length!==input.total)throw new Error('主图完整输入缺失，不能分批审核');
            content.push({type:'text',text:JSON.stringify(context)},...nativeMediaOutput.render({},await attachments!.prepare(input,signal)),
              {type:'text',text:snapshot.instruction});
          }
          agent.followup({id:MessageId(randomUUID()),role:'user',source:{kind:'user'},content});
          await agent.whenIdle();if(failure)throw failure;
          if((await this.bridge.execute<AuditSampleRun|AuditReportSession>(stateOperation,identity)).state!=='COMPLETED')throw new Error(report?'Agent已结束但未提交完整审计报告':'Agent已结束但未提交本图审计终稿');
        } finally {signal.removeEventListener('abort',abort);}
      });
  }
}
