import {SessionId} from '@deepseek-ai/dsh-session';
import {MessageId} from '@deepseek-ai/dsh-llm';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import type {AuditWorkflowSnapshot} from '../../shared/domain.generated.js';
import type {PythonBridge} from '../python-bridge/index.js';
import type {NativeProviders} from '../models/providers.js';
import type {JobSessionHost} from '../sessions/host.js';
import {NativeModelCalls} from '../sessions/model-calls.js';

export class ConsistencySummary {
  constructor(private readonly bridge:PythonBridge,private readonly host:JobSessionHost,private readonly providers:NativeProviders) {}

  async run(runId:string,snapshot:AuditWorkflowSnapshot,signal:AbortSignal):Promise<void> {
    const identity={run_id:runId};
    const input=await this.bridge.execute<{session_id:string;context:unknown;response_schema:unknown}>('audit_consistency_prepare',identity,signal);
    const {profile,native_profile}=snapshot.agent;
    if(!profile?.model_id||!native_profile)throw new Error('缺少冻结模型配置');
    const model=profile.model_id;
    await this.host.create(input.session_id);
    await this.bridge.execute('audit_agent_report_session_created',identity,signal);
    const instruction=snapshot.consistency_summary_instruction;
    const prompt=JSON.stringify({...(snapshot.consistency_summary_user_instruction
      ?{instruction:snapshot.consistency_summary_user_instruction}:{}),context:input.context,response_schema:input.response_schema});
    await this.host.notice(input.session_id,{type:'iad/job',summary:'分析上游一致性问题',value:{instruction,prompt}});
    let output='';
    await this.host.withModel(input.session_id,async scope=>{
      if(profile.credential_ref)scope.provide('credentials',this.providers.credentials);
      const provider='audit-summary-'+input.session_id;
      await scope.plugin(piAi,{providers:{[provider]:native_profile as piAi.PiAiProviderProfile}});
      new NativeModelCalls().attach(scope,{
        start:async request=>{await this.bridge.execute('audit_agent_model_call_start',{...identity,request,evidence_ids:[]});},
        end:async result=>{await this.bridge.execute('audit_agent_model_call_end',{...identity,result});},
      });
      await scope.inject(['llm'],async injected=>{
        let finished=false;
        for await(const chunk of injected.llm.stream({provider,model,sessionId:SessionId(input.session_id),
          system:instruction,messages:[{id:MessageId('summary-input'),role:'user',source:{kind:'user'},content:[{type:'text',text:prompt}]}],
          maxTokens:profile.max_output_tokens??undefined,
          ...(profile.request_parameters.temperature!==undefined?{temperature:profile.request_parameters.temperature as number}:{}),
          ...(profile.request_parameters.stop!==undefined?{stop:profile.request_parameters.stop as string[]}:{}),signal})){
          if(chunk.type==='text-delta')output+=chunk.text;
          if(chunk.type==='finish'){
            if(chunk.reason.kind!=='stop')throw new Error('一致性文本分析未正常完成：'+chunk.reason.kind);
            finished=true;
          }
        }
        if(!finished)throw new Error('一致性文本分析缺少完成标记');
      });
    });
    signal.throwIfAborted();
    await this.host.notice(input.session_id,{type:'iad/job',summary:'上游一致性分析完成',value:{output}});
    await this.bridge.execute('audit_consistency_commit',{...identity,narrative:JSON.parse(output)},signal);
  }
}
