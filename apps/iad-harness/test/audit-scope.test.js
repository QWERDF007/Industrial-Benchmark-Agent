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

function sendSummary(res,input) {
  const result={conclusion:input.context.problem_groups.length?'同内容图像具有不同整图标签。':'本次未发现标注冲突。',
    consistency_analysis:input.context.problem_groups.length?'上游记录存在整图标签冲突。':'图像标注没有冲突。',
    distribution_analysis:'图像尺寸一致。',
    analyses:input.context.problem_groups.map(g=>({issue_type:g.issue_type,analysis:'正常与异常目录中的同内容图像标签冲突。'})),
    consistency_reviews:input.context.consistency_scoring.flatMap(scope=>scope.items.map(item=>({
      scope_id:scope.scope_id,code:item.code,coefficient:1,evidence_refs:[item.ref],analysis:'不同标签会直接影响识别。'}))),
    distribution_reviews:input.context.distribution_facts.flatMap(scope=>Object.entries(scope.axes).map(([axis,facts])=>({
      scope_id:scope.scope_id,axis,status:facts.base_deduction>0?'problem':facts.metrics.length?'normal':'not_applicable',
      coefficient:facts.base_deduction>0?1:null,grouping:'当前范围按真实统计评价。',
      evidence_refs:[facts.ref],analysis:'当前范围未见明显失衡。'})))};
  res.writeHead(200,{'content-type':'text/event-stream'});
  res.end('data: '+JSON.stringify({id:'summary',choices:[{index:0,delta:{role:'assistant',content:JSON.stringify(result)},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n');
}

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
    sendSummary(res,input);
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
    assert.ok(Math.abs(report.quality_score.weights.consistency-.9)<1e-12);
    assert.ok(Math.abs(report.quality_score.weights.diversity-.1)<1e-12);
    assert.equal(report.quality_score.dimensions.consistency.score,0);
    assert.equal(report.quality_score.dimensions.diversity.score,100);
    const html=await runtime.bridge.execute('audit_job_export',{run_id:job.run_id});
    assert.ok(html.html.includes('data:image/png;base64,'));
    assert.ok(html.html.includes('上游记录存在整图标签冲突'));
  }finally{
    await runtime?.dispose();await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true});
  }
});

test('consistency scope with no annotation problems still obtains a model distribution assessment',{timeout:60000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-audit-empty-scope-'));
  let calls=0;
  const server=http.createServer(async(req,res)=>{const chunks=[];for await(const chunk of req)chunks.push(chunk);
    calls++;sendSummary(res,JSON.parse(JSON.parse(Buffer.concat(chunks).toString()).messages.at(-1).content));});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let runtime;
  try{
    const source=JSON.parse(execFileSync(resolvePythonPath(),['apps/iad-harness/test/fixtures/audit_dataset.py',root,path.join(root,'audit.db'),'none','http://127.0.0.1:9/v1'],
      {cwd:findWorkspaceRoot(),env:{...process.env,PYTHONPATH:'python'},encoding:'utf8'}));
    runtime=await createAuditAgentHost(root,`http://127.0.0.1:${server.address().port}/v1`);
    await runtime.bridge.execute('module_settings_save',{module:'audit',expected_revision:1,settings:{audit_scope:'consistency'}});
    const job=await runtime.scheduler.start({submission_id:randomUUID(),subset_ids:[source.dataset_id],consistency_job_id:source.consistency_job_id});
    await runtime.scheduler.whenIdle();
    assert.equal((await runtime.bridge.execute('audit_status',{run_id:job.run_id})).status,'COMPLETED');
    const report=await runtime.bridge.execute('audit_job_report',{run_id:job.run_id});
    assert.equal(report.quality_score.total,100);
    assert.equal(report.statistics.normal_images,report.total_samples);
    assert.deepEqual(report.distribution,{suspect:0,normal:report.total_samples});
    assert.ok(report.report_session_id);assert.equal(calls,1);
    assert.equal((await runtime.bridge.execute('audit_agent_report_state',{run_id:job.run_id})).session_created,true);
  }finally{await runtime?.dispose();await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true});}
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
