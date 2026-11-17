import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createAuditAgentHost} from './fixtures/audit-agent-host.js';
import {auditMessages,auditReportTool,respondAuditSummary} from './fixtures/audit-report.js';
import {respondFixtureTools} from './fixtures/analysis-finalization.js';

for(const mode of ['completed','failed','silent'])test(`natural child stop has one image-free structured finalization: ${mode}`,{timeout:60000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-audit-finalize-'));
  const wire=[],errors=[];let runtime;
  const provider=http.createServer(async(req,res)=>{
    try{
      let text='';for await(const chunk of req)text+=chunk;
      const body=JSON.parse(text);
      if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:65536}));return;}
      if(respondAuditSummary(res,body))return;
      const {context,outputs,pages}=auditMessages(body);
      wire.push(body);
      if(context?.phase){respondFixtureTools(res,[auditReportTool(context,outputs)]);return;}
      const finalize=body.messages.some(message=>JSON.stringify(message.content).includes('audit_finalize'));
      if(!finalize||mode==='silent'){
        res.writeHead(200,{'Content-Type':'text/event-stream'});
        res.end('data: '+JSON.stringify({choices:[{index:0,delta:{content:'可见短线，但区分正常结构与缺陷的依据不足。'},finish_reason:'stop'}],usage:{prompt_tokens:500,completion_tokens:20}})+'\n\ndata: [DONE]\n\n');return;
      }
      assert.equal(body.messages.flatMap(message=>Array.isArray(message.content)?message.content:[]).filter(part=>part.type==='image_url').length,0);
      const completed=mode==='completed';
      respondFixtureTools(res,[{name:'audit_commit',arguments:{commit_key:'final',final:{execution_status:completed?'completed':'failed',
        state:completed?'normal':null,analysis:'可见结构连续，缺少确认为缺陷的证据。',conclusion:completed?'当前证据未支持标注错误。':'',
        basis:['已发送的主图及局部。'],evidence_ids:completed?[pages[0].evidence_id]:[],findings:[],check_assessments:[],consistency_review:[],limitations:[]}}}]);
    }catch(error){errors.push(String(error));res.writeHead(500);res.end(JSON.stringify({error:{message:String(error)}}));}
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  try{
    const endpoint=`http://127.0.0.1:${provider.address().port}/v1`;
    const dataset=JSON.parse(execFileSync(resolvePythonPath(),[fileURLToPath(new URL('./fixtures/audit_dataset.py',import.meta.url)),root,path.join(root,'audit.db'),'none',endpoint],
      {cwd:findWorkspaceRoot(),env:{...process.env,PYTHONPATH:path.join(findWorkspaceRoot(),'python')},encoding:'utf8'}));
    runtime=await createAuditAgentHost(root,endpoint,{onError:error=>errors.push(String(error))});
    const job=await runtime.scheduler.start({submission_id:randomUUID(),subset_ids:[dataset.dataset_id],consistency_job_id:dataset.consistency_job_id});
    await runtime.scheduler.whenIdle();
    assert.deepEqual(errors,[]);
    const {samples}=await runtime.bridge.execute('audit_agent_samples',{run_id:job.run_id});
    assert.ok(samples.every(sample=>sample.state===(mode==='completed'?'COMPLETED':'FAILED')),JSON.stringify(await runtime.bridge.execute('audit_status',{run_id:job.run_id})));
    const imageRequests=wire.filter(body=>auditMessages(body).context?.target);
    assert.equal(imageRequests.length,samples.length*2,'每图自然停止后只补一次收尾请求: '+JSON.stringify(await runtime.bridge.execute('audit_status',{run_id:job.run_id})));
    if(mode==='failed')assert.ok(samples.every(sample=>sample.result.execution_status==='failed'&&sample.result.analysis.includes('证据')));
    if(mode==='completed'){const status=await runtime.bridge.execute('audit_status',{run_id:job.run_id});assert.equal(status.status,'COMPLETED',JSON.stringify({error:status.execution_error,errors:status.errors}));}
  }finally{await runtime?.dispose();provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));await fs.rm(root,{recursive:true,force:true});}
});
