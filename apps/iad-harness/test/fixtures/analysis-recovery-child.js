import {createAnalysisAgentHost} from './analysis-agent-host.js';

const [root,endpoint,submission]=process.argv.slice(2);
let runtime;
runtime=await createAnalysisAgentHost(root,endpoint,{onCommit:async(args,receipt)=>{
  const context=await runtime.bridge.execute('analysis_agent_context',{run_id:args.run_id});
  const trace=await runtime.host.read(context.session_id);
  process.send({run_id:args.run_id,session_id:context.session_id,receipt,
    observed:context.media_progress[0].observed_evidence_ids.length,
    native_commit_calls:trace.events.filter(event=>event.type==='tool/call'&&event.data.name==='knowledge_commit').length});
  await new Promise(()=>{});
}});
await runtime.scheduler.start(JSON.parse(submission));
await runtime.scheduler.whenIdle();
