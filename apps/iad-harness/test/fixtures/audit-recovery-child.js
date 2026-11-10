import fs from 'node:fs/promises';
import {createAuditAgentHost} from './audit-agent-host.js';
import {auditSessionPath} from '../../lib/server/audit/session-path.js';

const [root,endpoint,submission]=process.argv.slice(2);
let runtime;
runtime=await createAuditAgentHost(root,endpoint,{onCommit:async(identity,final)=>{
  const sample=await runtime.bridge.execute('audit_agent_sample',identity);
  const location=await runtime.bridge.execute('audit_agent_session_location',{session_id:sample.session_id});
  process.send({run_id:identity.run_id,sample,final,snapshot:await runtime.bridge.execute('audit_agent_snapshot',identity),
    jsonl:await fs.readFile(auditSessionPath(root,location),'utf8')});
  await new Promise(()=>{});
}});
const settings=await runtime.bridge.execute('module_settings_get',{module:'audit'});
await runtime.bridge.execute('module_settings_save',{module:'audit',expected_revision:settings.revision,settings:{concurrency:1}});
await runtime.scheduler.start(JSON.parse(submission));
await runtime.scheduler.whenIdle();
