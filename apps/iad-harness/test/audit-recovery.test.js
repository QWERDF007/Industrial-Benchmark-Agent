import {auditMessages,auditReportTool} from './fixtures/audit-report.js';
import {respondFixtureTools} from './fixtures/analysis-finalization.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {fork,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createAuditAgentHost} from './fixtures/audit-agent-host.js';

test('killing the audit owner after a committed image preserves its final and resumes only remaining images',{timeout:60000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-audit-recovery-'));
  const errors=[],wire=[];let child,runtime;
  const provider=http.createServer(async(req,res)=>{
    try {
      let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);
      if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:65536}));return;}
      const {context,outputs,pages}=auditMessages(body);
      if(context?.phase==='report'){wire.push({sample_id:null,body});respondFixtureTools(res,[auditReportTool(context,outputs)]);return;}
      assert.equal(context.knowledge,null);assert.ok(!JSON.stringify(context).includes('首图独立观察'));
      wire.push({sample_id:context.sample_id,body});
      let call;
      {
        assert.ok(pages.every(page=>!page.error));
        assert.ok(body.messages.some(message=>Array.isArray(message.content)&&message.content.some(part=>part.type==='image_url')));
        call={name:'audit_commit',arguments:{commit_key:'final',final:{execution_status:'completed',state:'normal',consistency_review:[],analysis:context.sample_id.endsWith(':0.png')?'首图独立观察。':'次图独立观察。',
          conclusion:'当前可见范围未发现需复核项。',basis:['已实际观察本图整图及必需局部。'],
          evidence_ids:pages.map(page=>page.evidence_id),check_assessments:[],findings:[],limitations:['零知识仍保留视觉范围限制。']}}};
      }
      res.writeHead(200,{'Content-Type':'text/event-stream'});
      res.write('data: '+JSON.stringify({choices:[{index:0,delta:{role:'assistant',tool_calls:[{index:0,id:randomUUID(),type:'function',function:{name:call.name,arguments:JSON.stringify(call.arguments)}}]},finish_reason:null}]})+'\n\n');
      res.write('data: '+JSON.stringify({choices:[{index:0,delta:{},finish_reason:'tool_calls'}],usage:{prompt_tokens:500,completion_tokens:100,total_tokens:600}})+'\n\n');res.end('data: [DONE]\n\n');
    } catch(error){errors.push(String(error));res.writeHead(500);res.end(JSON.stringify({error:{message:String(error)}}));}
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{if(child&&child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');await runtime?.dispose();
    provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));await fs.rm(root,{recursive:true,force:true});});
  const endpoint=`http://127.0.0.1:${provider.address().port}/v1`;
  const data=JSON.parse(execFileSync(resolvePythonPath(),[fileURLToPath(new URL('./fixtures/audit_dataset.py',import.meta.url)),root,path.join(root,'audit.db'),'none',endpoint],
    {cwd:findWorkspaceRoot(),env:{...process.env,PYTHONPATH:path.join(findWorkspaceRoot(),'python')},encoding:'utf8'}));
  const submission={submission_id:randomUUID(),subset_ids:[data.dataset_id],consistency_job_id:data.consistency_job_id,knowledge:null};
  child=fork(new URL('./fixtures/audit-recovery-child.js',import.meta.url),[root,endpoint,JSON.stringify(submission)],
    {execPath:process.env.IAD_NODE_PATH||process.execPath,stdio:['ignore','pipe','pipe','ipc']});
  let output='';child.stdout.on('data',data=>{output+=data;});child.stderr.on('data',data=>{output+=data;});
  const committed=await new Promise((resolve,reject)=>{child.once('message',resolve);child.once('error',reject);
    child.once('exit',(code,signal)=>reject(new Error(`Audit child exited ${code}/${signal}: ${output}`)));});
  assert.equal(committed.sample.state,'COMPLETED');assert.equal(wire.length,1);
  const exited=once(child,'exit');child.kill('SIGKILL');assert.deepEqual(await exited,[null,'SIGKILL']);
  runtime=await createAuditAgentHost(root,endpoint,{onError:error=>errors.push(String(error))});
  const interrupted=await runtime.bridge.execute('audit_status',{run_id:committed.run_id});
  assert.equal(interrupted.status,'INTERRUPTED');assert.deepEqual([interrupted.completed,interrupted.failed,interrupted.unprocessed],[1,0,1]);
  const settings=await runtime.bridge.execute('module_settings_get',{module:'audit'});
  await runtime.bridge.execute('module_settings_save',{module:'audit',expected_revision:settings.revision,settings:{model:null,concurrency:2}});
  await runtime.scheduler.resume(committed.run_id);await runtime.scheduler.whenIdle();
  await runtime.scheduler.resume(committed.run_id);await runtime.scheduler.whenIdle();
  const status=await runtime.bridge.execute('audit_status',{run_id:committed.run_id});
  assert.equal(status.status,'COMPLETED',JSON.stringify(status));assert.equal(status.completed,2);assert.equal(status.failed,0);
  assert.deepEqual(await runtime.bridge.execute('audit_agent_snapshot',{run_id:committed.run_id}),committed.snapshot);
  const {samples}=await runtime.bridge.execute('audit_agent_samples',{run_id:committed.run_id});
  assert.equal(samples.length,2);assert.equal(new Set(samples.map(item=>item.session_id)).size,2);
  assert.deepEqual(samples.find(item=>item.sample_id===committed.sample.sample_id).result,committed.final);
  assert.equal(wire.filter(item=>item.sample_id===committed.sample.sample_id).length,1);
  assert.equal(wire.length,4);assert.deepEqual(errors,[]);
  for(const sample of samples){
    const trace=await runtime.host.read(sample.session_id);
    assert.equal(trace.events.filter(event=>event.type==='iad/job'&&event.data.value?.kind==='audit-final').length,1);
  }
  assert.ok((await runtime.host.exportJsonl(committed.sample.session_id)).startsWith(committed.jsonl));
  const report=await runtime.bridge.execute('audit_job_report',{run_id:committed.run_id});assert.equal(report.audited_samples,2);
  const html=await runtime.bridge.execute('audit_job_export',{run_id:committed.run_id});
  assert.ok(html.html.includes('首图独立观察'));assert.ok(html.html.includes('次图独立观察'));
  assert.deepEqual(await runtime.bridge.execute('audit_job_export',{run_id:committed.run_id}),html);
});
