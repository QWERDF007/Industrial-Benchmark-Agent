import path from 'node:path';
import {Context} from '@deepseek-ai/cordis';
import {LlmRuntime} from '@deepseek-ai/dsh-llm';
import {ToolRuntime} from '@deepseek-ai/dsh-tools';
import {SystemPrompt} from '@deepseek-ai/dsh-system-prompt';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import {PythonBridge,findWorkspaceRoot} from '../../lib/server/python-bridge/index.js';
import {NativeProviders} from '../../lib/server/models/providers.js';
import {JobSessionHost} from '../../lib/server/sessions/host.js';
import {AuditWorkflowScheduler} from '../../lib/server/audit/scheduler.js';
import {auditSessionPath} from '../../lib/server/audit/session-path.js';
import {createWorkbenchTools} from '../../lib/server/workbench-tools/index.js';
import {NativeMediaAttachments} from '../../lib/server/sessions/media.js';

export async function createAuditAgentHost(root,endpoint,{onCommit,onError=()=>{},protocol='openai-completions',optionalOutput=false}={}) {
  const bridge=new PythonBridge({cwd:findWorkspaceRoot(),dbPath:path.join(root,'audit.db')});
  await bridge.execute('workbench_initialize');
  if(onCommit){
    const execute=bridge.execute.bind(bridge);
    bridge.execute=async(operation,args,...rest)=>{
      const result=await execute(operation,args,...rest);
      if(operation==='audit_agent_commit')await onCommit(args,result);
      return result;
    };
  }
  const host=await JobSessionHost.open(path.join(root,'audit-sessions'),async session_id=>
    auditSessionPath(root,await bridge.execute('audit_agent_session_location',{session_id})));
  const ctx=new Context();new LlmRuntime(ctx);new SystemPrompt(ctx,{});new ToolRuntime(ctx);
  new NativeMediaAttachments(ctx,path.join(root,'public-evidence'));
  const providers={fixture:{api:protocol,baseURL:endpoint,apiKeyEnv:'AUDIT_TEST_KEY',
    models:[{id:'native-audit',input:['text','image'],contextWindow:65536,...(optionalOutput?{}:{maxTokens:4096}),...(protocol==='openai-responses'?{reasoningEfforts:{high:'high'}}:{})}]}};
  ctx.provide('settings',{configure:()=>()=>{},describe:()=>[{ns:'llm-pi-ai',revision:1,value:{providers}}]});
  ctx.provide('credentials',{resolve:async()=>({value:'audit-test-key'})});
  const plugin=await ctx.plugin(piAi,{providers});
  const scheduler=new AuditWorkflowScheduler(bridge,new NativeProviders(()=>ctx),host,root,onError);
  bridge.useModelRouting(scheduler);
  for(const tool of createWorkbenchTools(bridge,ctx))ctx.tools.register(tool);
  return {bridge,host,ctx,scheduler,dispose:async()=>{
    await scheduler.dispose();await host.dispose();bridge.destroy();await plugin.dispose();
  }};
}
