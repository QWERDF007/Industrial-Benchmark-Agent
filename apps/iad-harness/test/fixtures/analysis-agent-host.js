import path from 'node:path';
import {Context} from '@deepseek-ai/cordis';
import {LlmRuntime} from '@deepseek-ai/dsh-llm';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import {PythonBridge,findWorkspaceRoot} from '../../lib/server/python-bridge/index.js';
import {NativeProviders} from '../../lib/server/models/providers.js';
import {JobSessionHost} from '../../lib/server/sessions/host.js';
import {analysisSessionPath} from '../../lib/server/analysis/agent.js';
import {AnalysisWorkflowScheduler} from '../../lib/server/analysis/scheduler.js';

export async function createAnalysisAgentHost(root,endpoint,{onCommit,onError=()=>{}}={}) {
  const bridge=new PythonBridge({cwd:findWorkspaceRoot(),dbPath:path.join(root,'pages.db')});
  await bridge.execute('workbench_initialize');
  if(onCommit){
    const execute=bridge.execute.bind(bridge);
    bridge.execute=async(operation,args,...rest)=>{
      const result=await execute(operation,args,...rest);
      if(operation==='analysis_agent_commit')await onCommit(args,result);
      return result;
    };
  }
  const host=await JobSessionHost.open(path.join(root,'knowledge-sessions'),async session_id=>
    analysisSessionPath(root,await bridge.execute('analysis_agent_session_location',{session_id})));
  const ctx=new Context();new LlmRuntime(ctx);
  const providers={fixture:{api:'openai-completions',baseURL:endpoint,apiKeyEnv:'PAGES_TEST_KEY',
    models:[{id:'native-image',input:['text','image'],contextWindow:65536,maxTokens:4096}]}};
  ctx.provide('settings',{configure:()=>()=>{},describe:()=>[{ns:'llm-pi-ai',revision:1,value:{providers}}]});
  ctx.provide('credentials',{resolve:async()=>({value:'pages-test-key'})});
  const plugin=await ctx.plugin(piAi,{providers});
  const scheduler=new AnalysisWorkflowScheduler(bridge,new NativeProviders(()=>ctx),{knowledge:host,exploration:host},root,onError);
  bridge.useModelRouting(scheduler);
  return {bridge,host,scheduler,dispose:async()=>{
    await scheduler.dispose();await host.dispose();bridge.destroy();await plugin.dispose();
  }};
}
