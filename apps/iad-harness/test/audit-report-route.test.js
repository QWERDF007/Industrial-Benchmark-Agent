import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createAuditAgentHost} from './fixtures/audit-agent-host.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';

test('audit API has no separate report regeneration task',{timeout:30000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-audit-report-route-'));
  const runtime=await createAuditAgentHost(root,'http://127.0.0.1:9');
  const handler=createIadHttpHandler(runtime.bridge);
  const server=http.createServer((req,res)=>void handler(req,res));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await runtime.dispose();await fs.rm(root,{recursive:true,force:true});});
  const response=await fetch(`http://127.0.0.1:${server.address().port}/api/iad/audit/jobs/audit_unknown/report/regenerate`,{
    method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  assert.equal(response.status,404);
  assert.match((await response.json()).error.message,/No route/);
});
