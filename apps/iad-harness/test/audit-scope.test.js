import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createAuditAgentHost} from './fixtures/audit-agent-host.js';

test('consistency scope makes one text-only request for problems and exports frozen paired report',{timeout:60000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-audit-scope-'));
  const wire=[];
  const server=http.createServer(async(req,res)=>{
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const body=JSON.parse(Buffer.concat(chunks).toString());wire.push(body);
    assert.equal(req.url,'/v1/chat/completions');
    assert.equal(body.tools,undefined);
    assert.ok(!JSON.stringify(body.messages).includes('image_url'));
    const input=JSON.parse(body.messages.at(-1).content);
    assert.deepEqual(input.context.problem_groups.map(g=>g.issue_type),['image_label_mismatch']);
    assert.ok(!JSON.stringify(input).includes('NO_CANDIDATES'));
    const result={conclusion:'同内容图像具有不同整图标签。',consistency_analysis:'上游记录存在整图标签冲突。',
      analyses:[{issue_type:'image_label_mismatch',analysis:'正常与异常目录中的同内容图像标签冲突。'}]};
    res.writeHead(200,{'content-type':'text/event-stream'});
    res.end('data: '+JSON.stringify({id:'summary',choices:[{index:0,delta:{role:'assistant',content:JSON.stringify(result)},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let runtime;
  try{
    const source=JSON.parse(execFileSync(resolvePythonPath(),['apps/iad-harness/test/fixtures/audit_summary_dataset.py',root,path.join(root,'audit.db')],
      {cwd:findWorkspaceRoot(),env:{...process.env,PYTHONPATH:'python'},encoding:'utf8'}));
    runtime=await createAuditAgentHost(root,`http://127.0.0.1:${server.address().port}/v1`);
    const job=await runtime.scheduler.start({submission_id:randomUUID(),subset_ids:[source.dataset_id],consistency_job_id:source.consistency_job_id});
    await runtime.scheduler.whenIdle();
    const status=await runtime.bridge.execute('audit_status',{run_id:job.run_id});
    assert.equal(status.status,'COMPLETED',JSON.stringify(status));
    assert.equal(wire.length,1);
    const {samples}=await runtime.bridge.execute('audit_agent_samples',{run_id:job.run_id});
    assert.equal(samples.length,0);
    const report=await runtime.bridge.execute('audit_job_report',{run_id:job.run_id});
    assert.equal(report.audit_scope,'consistency');
    assert.equal(report.total_samples,3);
    assert.equal(report.statistics.normal_images,1);
    assert.deepEqual(report.distribution,{suspect:2,normal:1});
    assert.equal(report.evidence_pairs['consistency:image_label_mismatch'].length,1);
    assert.deepEqual(report.quality_score.weights,{consistency:1});
    const html=await runtime.bridge.execute('audit_job_export',{run_id:job.run_id});
    assert.ok(html.html.includes('data:image/png;base64,'));
    assert.ok(html.html.includes('上游记录存在整图标签冲突'));
  }finally{
    await runtime?.dispose();await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true});
  }
});

test('consistency scope with no problems completes without creating a model session',{timeout:60000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-audit-empty-scope-'));
  let runtime;
  try{
    const source=JSON.parse(execFileSync(resolvePythonPath(),['apps/iad-harness/test/fixtures/audit_dataset.py',root,path.join(root,'audit.db'),'none','http://127.0.0.1:9/v1'],
      {cwd:findWorkspaceRoot(),env:{...process.env,PYTHONPATH:'python'},encoding:'utf8'}));
    runtime=await createAuditAgentHost(root,'http://127.0.0.1:9/v1');
    await runtime.bridge.execute('module_settings_save',{module:'audit',expected_revision:1,settings:{audit_scope:'consistency'}});
    const job=await runtime.scheduler.start({submission_id:randomUUID(),subset_ids:[source.dataset_id],consistency_job_id:source.consistency_job_id});
    await runtime.scheduler.whenIdle();
    assert.equal((await runtime.bridge.execute('audit_status',{run_id:job.run_id})).status,'COMPLETED');
    const report=await runtime.bridge.execute('audit_job_report',{run_id:job.run_id});
    assert.equal(report.quality_score.total,100);
    assert.equal(report.statistics.normal_images,report.total_samples);
    assert.deepEqual(report.distribution,{suspect:0,normal:report.total_samples});
    assert.equal(report.report_session_id,null);
    assert.equal((await runtime.bridge.execute('audit_agent_report_state',{run_id:job.run_id})).session_created,false);
  }finally{await runtime?.dispose();await fs.rm(root,{recursive:true,force:true});}
});

test('cancelling a text analysis retains the job and its cancelled report',{timeout:60000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-audit-cancel-scope-'));
  let received;
  const started=new Promise(resolve=>{received=resolve;});
  const server=http.createServer(async(req,res)=>{for await(const _chunk of req){} received();});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let runtime;
  try{
    const source=JSON.parse(execFileSync(resolvePythonPath(),['apps/iad-harness/test/fixtures/audit_summary_dataset.py',root,path.join(root,'audit.db')],
      {cwd:findWorkspaceRoot(),env:{...process.env,PYTHONPATH:'python'},encoding:'utf8'}));
    runtime=await createAuditAgentHost(root,`http://127.0.0.1:${server.address().port}/v1`);
    const job=await runtime.scheduler.start({submission_id:randomUUID(),subset_ids:[source.dataset_id],consistency_job_id:source.consistency_job_id});
    await started;
    assert.equal((await runtime.scheduler.cancel(job.run_id)).status,'CANCELLED');
    const report=await runtime.bridge.execute('audit_job_report',{run_id:job.run_id});
    assert.equal(report.status,'CANCELLED');
    assert.equal(report.audit_scope,'consistency');
    assert.equal(report.quality_score,null);
    assert.ok((await runtime.bridge.execute('audit_job_export',{run_id:job.run_id})).html.includes('audit-offline-root'));
  }finally{await runtime?.dispose();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true});}
});
