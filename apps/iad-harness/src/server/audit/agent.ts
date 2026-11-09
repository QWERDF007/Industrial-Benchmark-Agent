import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {LlmError,MessageId,type ContentBlock} from '@deepseek-ai/dsh-llm';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import {defineTool} from '@deepseek-ai/dsh-tools';
import type {AuditAgentContext,AuditSampleRun,AuditWorkflowSnapshot,ImageSessionLocation,RegistrationMediaPage,TokenBudget} from '../../shared/domain.generated.js';
import {analysisMediaParameters} from '../../shared/analysis-agent.parameters.generated.js';
import {evidenceReferenceParameters} from '../../shared/media-reference.parameters.generated.js';
import {auditCommitParameters,auditCropParameters} from '../../shared/audit.parameters.generated.js';
import type {PythonBridge} from '../python-bridge/index.js';
import type {NativeProviders} from '../models/providers.js';
import {JobSessionHost} from '../sessions/host.js';
import {NativeMediaAttachments,nativeMediaOutput} from '../sessions/media.js';
import {NativeModelBudget} from '../sessions/model-budget.js';
import {NativeModelCalls} from '../sessions/model-calls.js';
import {workbenchJsonOutput} from '../tool-output.js';
import {auditSessionPath} from './session-path.js';

export class AuditImageAgent {
  constructor(private readonly bridge:PythonBridge,private readonly host:JobSessionHost,
    private readonly providers:NativeProviders,private readonly dataRoot:string) {}

  async run(runId:string,sampleId:string,snapshot:AuditWorkflowSnapshot,signal:AbortSignal):Promise<void> {
    const identity={run_id:runId,sample_id:sampleId};
    const sample=await this.bridge.execute<AuditSampleRun>('audit_agent_sample',identity);
    const location=await this.bridge.execute<ImageSessionLocation>('audit_agent_session_location',{session_id:sample.session_id});
    const {profile,native_profile}=snapshot.agent;
    if (!profile?.model_id || !native_profile || !profile.max_output_tokens) throw new Error('审计缺少冻结的原生模型');
    if (!sample.session_created) {
      await this.host.create(sample.session_id);
      await this.host.notice(sample.session_id,{type:'iad/job',summary:'独立图像审计已受理',value:{job_id:runId,sample_id:sampleId}});
      await this.bridge.execute('audit_agent_session_created',identity);
    }
    const provider='audit-'+sample.session_id;
    let failure:unknown;
    await this.host.withAgent(sample.session_id,{signal,agentOptions:{provider,model:profile.model_id,maxTokens:profile.max_output_tokens},
      setup:async scope=>{
        const attachments=new NativeMediaAttachments(scope,path.join(path.dirname(auditSessionPath(this.dataRoot,location)),location.image_id));
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
          if(event.type==='turn/end'&&event.data.reason.kind==='max-tokens') failure=new LlmError('审计达到冻结输出上限，未提交本图终稿','MAX_TOKENS');
        });
        scope.on('agent/request',async(_event,next)=>({...await next(),
          ...(profile.request_parameters.temperature!==undefined?{temperature:profile.request_parameters.temperature as number}:{}),
          ...(profile.request_parameters.stop!==undefined?{stop:profile.request_parameters.stop as string[]}:{}),
        }));
        scope.systemPrompt.section({name:'audit-instruction',order:100,text:snapshot.system_prompt ?? snapshot.instruction});
        scope.tools.register(defineTool({name:'audit_context',description:'读取本图冻结主图、已选知识及本图一致性anchor，不含其他主图审计终稿。',parameters:{},output:workbenchJsonOutput,
          execute:(_args,execution)=>this.bridge.execute('audit_agent_context',identity,execution.signal)}));
        scope.tools.register(defineTool({name:'audit_images',description:'读取主图或本anchor已登记候选的整图与全部标注局部，可用offset/limit分页。total用于核对全部必需附件。',
          parameters:analysisMediaParameters,output:nativeMediaOutput,execute:async(query,execution)=>attachments.prepare(
            await this.bridge.execute<RegistrationMediaPage>('audit_agent_media',{...identity,query},execution.signal),execution.signal)}));
        scope.tools.register(defineTool({name:'audit_crop',description:'补看主图或已登记候选的原图像素裁窗，bbox为[x0,y0,x1,y1]半开区间，不新增审计主图。',
          parameters:auditCropParameters,output:nativeMediaOutput,execute:async(query,execution)=>attachments.prepare(
            await this.bridge.execute<RegistrationMediaPage>('audit_agent_crop',{...identity,query},execution.signal),execution.signal)}));
        scope.tools.register(defineTool({name:'audit_reference',description:'按真实evidence_id打开已选知识的冻结支持或反例，不读取未选择知识或全库图片。',
          parameters:evidenceReferenceParameters,output:nativeMediaOutput,execute:async(args,execution)=>attachments.prepare(
            await this.bridge.execute<RegistrationMediaPage>('audit_agent_reference',{...identity,...args},execution.signal),execution.signal)}));
        scope.tools.register(defineTool({name:'audit_commit',description:'原子提交本图图级状态、分析、结论、全部疑点及实际观察证据；逐项记录全部已选知识。不写预测框、建议标签或人工核实。',
          parameters:auditCommitParameters,output:workbenchJsonOutput,execute:async(submission,execution)=>{
            const result=await this.bridge.execute('audit_agent_commit',{...identity,submission},execution.signal);
            execution.concludeTurn();return result;
          }}));
      }},async agent=>{
        const abort=()=>agent.cancel({kind:'parent'});signal.addEventListener('abort',abort,{once:true});
        try {
          const context=await this.bridge.execute<AuditAgentContext>('audit_agent_context',identity);
          agent.followup({id:MessageId(randomUUID()),role:'user',source:{kind:'user'},content:[{type:'text',text:JSON.stringify(context)},
            ...(snapshot.system_prompt?[{type:'text' as const,text:'\n'+snapshot.instruction}]:[])]});
          await agent.whenIdle();if(failure)throw failure;
          if(!(await this.bridge.execute<AuditSampleRun>('audit_agent_sample',identity)).result) throw new Error('Agent已结束但未提交本图审计终稿');
        } finally {signal.removeEventListener('abort',abort);}
      });
  }
}
