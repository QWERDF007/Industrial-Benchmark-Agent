import {auditMessages,auditReportTool} from './fixtures/audit-report.js';
import {chatRequest} from './fixtures/responses.js';
import {respondFixtureTools} from './fixtures/analysis-finalization.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import {findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {auditSessionPath} from '../lib/server/audit/session-path.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';
import {fileURLToPath} from 'node:url';
import {createAuditAgentHost} from './fixtures/audit-agent-host.js';

for(const {withKnowledge,protocol='openai-completions',optionalOutput=false,failReportOnce=false,correctKnowledgeOnce=false,withDistribution=false} of [{withKnowledge:false,withDistribution:true},{withKnowledge:false,failReportOnce:true},{withKnowledge:false},{withKnowledge:true},{withKnowledge:false,protocol:'openai-responses'},
  ...['openai-completions','openai-responses'].map(protocol=>({withKnowledge:false,protocol,optionalOutput:true})),{withKnowledge:false,correctKnowledgeOnce:true}])test(`${withDistribution?'frozen dataset distribution: ':''}${withKnowledge?'selected weak knowledge and counter evidence':'zero knowledge'} with no consistency candidates audits every image in independent native Sessions${protocol==='openai-responses'?' with Responses reasoning':''}${optionalOutput?' without a configured output limit':''}${failReportOnce?' and a report-only retry':''}${correctKnowledgeOnce?' correcting an invented knowledge ID from tool feedback':''}`, {timeout:process.env.IAD_AUDIT_BROWSER==='1'?120000:60000}, async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-audit-native-'));
  const workspace=findWorkspaceRoot(), database=path.join(root,'audit.db'), wire=[], errors=[];
  let runtime,bridge,host,ctx,scheduler,server,reportFailed=false;
  const provider=http.createServer(async(req,res)=>{
    try {
      assert.equal(req.headers.authorization,'Bearer audit-test-key');
      let text='';for await(const chunk of req)text+=chunk;
      const body=chatRequest(JSON.parse(text));
      if(protocol==='openai-responses')assert.equal(body.responses.reasoning.effort,'high');
      if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:65536}));return;}
      wire.push(body);
      const {context,outputs,pages}=auditMessages(body);
      if(context?.phase){
        if(context.phase==='report'&&failReportOnce&&!reportFailed){reportFailed=true;res.writeHead(503);res.end(JSON.stringify({error:{message:'报告模型临时不可用'}}));return;}
        respondFixtureTools(res,[auditReportTool(context,outputs,{includeCounter:withKnowledge,includeDistribution:withDistribution})],{protocol,model:'native-audit'});return;
      }
      if(withKnowledge) {
        assert.deepEqual(context.knowledge.entries.map(entry=>[entry.check.check_id,entry.check.status,entry.review.status]),
          [['C1','conflicted','rejected'],['C2','provisional','pending']]);
        assert.ok(context.knowledge.selection.version_id.startsWith('analysis_version_'));
        assert.ok(!JSON.stringify(context.knowledge).includes('未选'));
        assert.equal(context.knowledge.source_scope.coverage.completed,2);
        assert.equal(context.knowledge.source_scope.finalization_complete,false);
        assert.deepEqual(context.knowledge.directions.map(direction=>direction.ref),['D1']);
        assert.ok(!('summary' in context.knowledge));
        assert.ok(!('source_summary' in context.knowledge.directions[0]));
      } else assert.equal(context.knowledge,null);
      assert.equal(context.consistency.result.reason,'NO_CANDIDATES');
      assert.ok(!JSON.stringify(context).includes('本场第二张独立疑点'));
      const actual=body.messages.flatMap(message=>Array.isArray(message.content)?message.content:[]).filter(part=>part.type==='image_url');
      assert.equal(context.target.annotations.length,2);
      if(!body.messages.some(message=>message.role==='assistant'))
        assert.equal(actual.length,3,'首次请求必须联合发送主图、全部标注10%局部与一致性分析');
      else if(actual.length)assert.equal(actual.length,pages.at(-1).images.length,'后续请求只发送本次新返回的图片');
      assert.ok(pages.every(page=>!page.error));
      let call;
      if(withKnowledge&&pages.length===1)call={name:'audit_reference',arguments:{evidence_id:context.knowledge.entries[0].check[context.sample_id.endsWith(':1.png')?'support_evidence_ids':'counter_evidence_ids'][0]}};
      else if(withKnowledge&&pages.length===2)call={name:'audit_crop',arguments:{sample_id:context.sample_id,bbox:[1,2,11,12]}};
      else {
        const images=actual.length?pages.at(-1).images:[];
        assert.equal(actual.length,images.length);
        assert.deepEqual(pages[0].images.map(image=>image.image.sent_size),[[40,30],[9,11],[19,19]]);
        assert.ok(pages[0].images.every(image=>image.image.representation==='raw'));
        assert.deepEqual(actual.map(part=>createHash('sha256').update(Buffer.from(part.image_url.url.split(',')[1],'base64')).digest('hex')).sort(),
          images.map(image=>image.image.sha256).sort());
        for (const page of pages) {
          assert.ok(page.evidence_id, 'the original image owns the media bundle reference');
          assert.ok(page.images.every(item => !Object.hasOwn(item.image,'evidence_id')&&!Object.hasOwn(item.model_context,'evidence_id')));
        }
        const suspect=context.sample_id.endsWith(':1.png'), ids=[...new Set(pages.map(page=>page.evidence_id))];
        call={name:'audit_commit',arguments:{commit_key:'final',final:{execution_status:'completed',state:suspect?'suspect':'normal',consistency_review:[],
          analysis:suspect?'本场第二张独立疑点，需核对三处可见现象。':'本场第一张的独立观察。',conclusion:suspect?'三处现象待复核。':'当前可见范围未发现疑点。',
          basis:['已观察本张原图及全部必需局部。'],evidence_ids:ids,
          check_assessments:context.knowledge?context.knowledge.entries.map(entry=>({check_id:entry.check.check_id,status:'unobservable',description:'本图不足以消解该暂定关系。',evidence_ids:ids})):[],limitations:['候选角色不是质量真值。'],
          findings:suspect?[1,2,3].map(index=>({finding_id:'F'+index,type:['extra_annotation','category_mismatch','missing_annotation'][index-1],annotation_ids:index<3?[context.target.annotations[index-1].annotation_id]:[],consistency_issue_refs:[],description:'本图现象'+index,location:'主体',check_ids:[],
            evidence_ids:ids,normal_explanation:'需排除成像变化。',limitations:[]})):[]}}};
      }
      if(correctKnowledgeOnce&&call.name==='audit_commit'){
        const feedback=body.messages.filter(message=>message.role==='tool').flatMap(message=>typeof message.content==='string'?[message.content]:message.content.filter(part=>part.type==='text').map(part=>part.text));
        if(feedback.length)assert.ok(feedback.some(text=>text.includes('check_id=[]')&&text.includes('未选知识时填写[]')),'零知识提交反馈须明确允许的ID及空数组');
        else call.arguments.final.check_assessments=[{check_id:'annotation_coverage',status:'consistent',description:'普通图像检查应写入分析。',evidence_ids:call.arguments.final.evidence_ids}];
      }
      respondFixtureTools(res,[call],{protocol,model:'native-audit'});
    } catch(error){errors.push(String(error));res.writeHead(500);res.end(JSON.stringify({error:{message:String(error)}}));}
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{await runtime?.dispose();
    if(server)await new Promise(resolve=>server.close(resolve));provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));await fs.rm(root,{recursive:true,force:true});});
  const data=JSON.parse(execFileSync(resolvePythonPath(),[fileURLToPath(new URL('./fixtures/audit_dataset.py',import.meta.url)),
    root,database,withKnowledge?'knowledge':'none',`http://127.0.0.1:${provider.address().port}/v1`],
    {cwd:workspace,env:{...process.env,PYTHONPATH:path.join(workspace,'python')},encoding:'utf8'}));
  runtime=await createAuditAgentHost(root,`http://127.0.0.1:${provider.address().port}/v1`,{protocol,optionalOutput,onError:error=>errors.push(String(error))});
  ({bridge,host,ctx,scheduler}=runtime);
  if(protocol==='openai-responses')await bridge.execute('module_settings_save',{module:'audit',expected_revision:1,settings:{reasoning_effort:'high'}});
  const browser=process.env.IAD_AUDIT_BROWSER==='1'?await import('./fixtures/audit-page.js'):null;
  const page=browser?await browser.auditPageBundle(await bridge.execute('dataset_get',{dataset_id:data.dataset_id})):null;
  const handler=createIadHttpHandler(bridge);
  server=http.createServer((req,res)=>{
    if(page&&req.url==='/audit-browser.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(page);}
    else if(page&&req.url==='/audit-browser'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<div id="root"></div><script src="/audit-browser.js"></script>');}
    else void handler(req,res);
  });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/iad`;
  const {promptDefaults}=await import('../lib/shared/prompt-defaults.generated.js');
  const submission={submission_id:randomUUID(),subset_ids:[data.dataset_id],consistency_job_id:data.consistency_job_id,...(data.knowledge?{knowledge:data.knowledge}:{}),
    master_prompt:{system_prompt:promptDefaults.auditMasterSystem+'\n系统自定义：审计工具流程。',user_prompt:promptDefaults.auditBatch},observer_prompt:{system_prompt:promptDefaults.system.audit+'\n系统自定义：审计工具流程。',user_prompt:'用户自定义：逐图比较边缘。'}};
  const started=await ctx.tools.execute({name:'model_audit_start',arguments:submission,callId:'native-audit-start',signal:new AbortController().signal});
  assert.equal(started.isError,false,JSON.stringify(started));
  const response=await fetch(base+'/audit/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(submission)});
  assert.equal(response.status,200,await response.clone().text());const job=await response.json();await scheduler.whenIdle();
  assert.equal(started.value.run_id,job.run_id);
  let status=await(await fetch(base+'/audit/status/'+job.run_id)).json();
  if(failReportOnce){
    assert.equal(status.status,'PARTIAL',JSON.stringify({execution_error:status.execution_error,errors:status.errors,provider:errors,
      tools:wire.flatMap(body=>body.messages.filter(message=>message.role==='tool').map(message=>JSON.stringify(message.content).slice(0,500))).slice(0,8)}));assert.equal(status.completed,2);assert.equal(status.failed,0);
    const before=(await bridge.execute('audit_agent_samples',{run_id:job.run_id})).samples;
    await scheduler.resume(job.run_id);await scheduler.whenIdle();
    assert.deepEqual((await bridge.execute('audit_agent_samples',{run_id:job.run_id})).samples,before);
    status=await(await fetch(base+'/audit/status/'+job.run_id)).json();
  }
  assert.equal(status.status,'COMPLETED',JSON.stringify({errors:status.errors,execution_error:status.execution_error,provider:errors}));assert.equal(status.completed,2);assert.equal(status.failed,0);
  if(optionalOutput)assert.equal((await bridge.execute('audit_agent_snapshot',{run_id:job.run_id})).agent.profile.max_output_tokens,null);
  assert.deepEqual(errors,[]);
  const parseReport=content=>JSON.stringify(content).includes('report');
  for(const body of wire){
    assert.ok(body.messages.some(message=>(message.role==='system'||message.role==='developer')&&message.content.includes('系统自定义：审计工具流程。')));
    assert.ok(!body.messages.some(message=>(message.role==='system'||message.role==='developer')&&message.content.includes('用户自定义：逐图比较边缘。')));
    assert.ok(body.messages.some(message=>message.role==='user'&&(JSON.stringify(message.content).includes('用户自定义：逐图比较边缘。')||auditMessages(body).context?.phase)));
  }
  const samples=await(await fetch(base+'/audit/jobs/'+job.run_id+'/samples')).json();
  assert.deepEqual(samples.distribution,{suspect:1,normal:1,incomplete:0});
  const {samples:internal}=await bridge.execute('audit_agent_samples',{run_id:job.run_id});
  assert.equal(new Set(internal.map(sample=>sample.session_id)).size,2);
  const nativeCalls=status.model_calls.filter(call=>call.source==='native_llm');
  assert.equal(nativeCalls.length,wire.length);
  const reportSession=await bridge.execute('audit_agent_report_state',{run_id:job.run_id});
  assert.ok(nativeCalls.every(call=>call.sample_id===null?call.session_id===reportSession.session_id:internal.some(sample=>sample.sample_id===call.sample_id&&sample.session_id===call.session_id)));
  assert.equal(reportSession.state,'COMPLETED');
  assert.ok(status.model_calls.filter(call=>call.operation==='tokenize').every(call=>call.sample_id===null||internal.some(sample=>sample.sample_id===call.sample_id)));
  for(const sample of internal){
    const detail=await(await fetch(base+'/audit/jobs/'+job.run_id+'/samples/'+encodeURIComponent(sample.sample_id))).json();
    assert.equal(detail.final.findings.length,sample.sample_id.endsWith(':1.png')?3:0);
    const read=await ctx.tools.execute({name:'model_audit_sample',arguments:{run_id:job.run_id,sample_id:sample.sample_id},
      callId:'read-'+sample.sample_id,signal:new AbortController().signal});
    assert.equal(read.isError,false,JSON.stringify(read));assert.deepEqual(read.value,detail);
    const evidence_id=detail.evidence[0].image.evidence_id;
    const image=await ctx.tools.execute({name:'model_audit_evidence',arguments:{run_id:job.run_id,sample_id:sample.sample_id,evidence_id},
      callId:'image-'+sample.sample_id,signal:new AbortController().signal});
    assert.equal(image.isError,false,JSON.stringify(image));assert.equal(image.value.attachment.width,40);
    const location=await bridge.execute('audit_agent_session_location',{session_id:sample.session_id});
    const filename=auditSessionPath(root,location);assert.ok(filename.startsWith(path.join(root,'audit-sessions')));
    const downloaded=await(await fetch(base+'/audit/jobs/'+job.run_id+'/samples/'+encodeURIComponent(sample.sample_id)+'/session.jsonl')).text();
    assert.equal(downloaded,await fs.readFile(filename,'utf8'));
    assert.equal((await host.read(sample.session_id)).events.filter(event=>event.type==='iad/job'&&event.data.value?.kind==='audit-final').length,1);
  }
  const report=await(await fetch(base+'/audit/jobs/'+job.run_id+'/report')).json();assert.equal(report.suspect_samples,1);assert.equal(report.statistics.issue_occurrences,3);assert.equal(report.discoveries[0].affected_image_count,withKnowledge?2:1);assert.equal(report.evidence_groups.G1.length,withKnowledge?2:1);
  const callsBeforeReport=wire.length;
  if(withDistribution){
    const aggregates=wire.flatMap(body=>auditMessages(body).outputs).find(output=>Array.isArray(output?.classes)&&output?.image_count!==undefined);
    assert.equal(aggregates.image_count,2);assert.equal(aggregates.box_count,4);
    assert.deepEqual(aggregates,report.data_distribution.slices[0]);
  }
  const reportRead=await ctx.tools.execute({name:'model_audit_report',arguments:{run_id:job.run_id},
    callId:'read-current-audit-report',signal:new AbortController().signal});
  assert.equal(reportRead.isError,false,JSON.stringify(reportRead));
  assert.deepEqual(reportRead.value,report);
  assert.equal(reportRead.value.audited_samples,2);
  assert.equal(reportRead.value.knowledge_version_id,data.knowledge?.version_id||null);
  assert.equal(wire.length,callsBeforeReport);
  const html=await(await fetch(base+'/audit/jobs/'+job.run_id+'/export')).text();assert.ok(html.includes('覆盖范围需复核'));
  assert.ok(!html.includes('本图现象3'),'HTML只保留汇总分析，逐图内容在现有审计详情查看');
  assert.equal(await(await fetch(base+'/audit/jobs/'+job.run_id+'/export')).text(),html);
  const location=await bridge.execute('audit_agent_session_location',{session_id:internal[0].session_id});
  const directory=path.dirname(auditSessionPath(root,location));
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(directory,'summary.json'),'utf8')),report);
  assert.equal(await fs.readFile(path.join(directory,'report.html'),'utf8'),html);
  if(browser){await browser.verifyAuditPage(base.replace('/api/iad',''),data.consistency_job_id,job.run_id,{withKnowledge,knowledgeVersion:data.knowledge?.version_id,reportHtml:html});await scheduler.whenIdle();
    assert.equal(wire.length,callsBeforeReport);assert.deepEqual(errors,[]);
    assert.equal(await(await fetch(base+'/audit/jobs/'+job.run_id+'/export')).text(),html);}
});

test('oversized joint image input fails without splitting resizing or hidden compaction requests',{timeout:60000},async t=>{
  const {auditMessages,auditReportTool}=await import('./fixtures/audit-report.js');
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-audit-capacity-')),wire=[],tokenizations=[],errors=[];
  let runtime;
  const provider=http.createServer(async(req,res)=>{
    try {
      let raw='';for await(const part of req)raw+=part;
      const body=JSON.parse(raw),hasImages=body.messages?.some(message=>Array.isArray(message.content)&&message.content.some(part=>part.type==='image_url'));
      if(req.url==='/tokenize'){
        tokenizations.push(body);res.end(JSON.stringify({count:hasImages?70000:1000,max_model_len:65536}));return;
      }
      wire.push(body);
      const {context,outputs}=auditMessages(body);
      if(hasImages){res.writeHead(413);res.end(JSON.stringify({error:{message:'context input capacity exceeded'}}));return;}
      assert.ok(context?.phase,'超限图级请求不得改为摘要或拆批请求');
      respondFixtureTools(res,[auditReportTool(context,outputs)]);
    }catch(error){errors.push(String(error));res.writeHead(500);res.end(JSON.stringify({error:{message:String(error)}}));}
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{await runtime?.dispose();provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));await fs.rm(root,{recursive:true,force:true});});
  const endpoint=`http://127.0.0.1:${provider.address().port}/v1`;
  const data=JSON.parse(execFileSync(resolvePythonPath(),[fileURLToPath(new URL('./fixtures/audit_dataset.py',import.meta.url)),root,path.join(root,'audit.db'),'none',endpoint],
    {cwd:findWorkspaceRoot(),env:{...process.env,PYTHONPATH:path.join(findWorkspaceRoot(),'python')},encoding:'utf8'}));
  runtime=await createAuditAgentHost(root,endpoint,{onError:error=>errors.push(String(error))});
  const job=await runtime.scheduler.start({submission_id:randomUUID(),subset_ids:[data.dataset_id],consistency_job_id:data.consistency_job_id});
  await runtime.scheduler.whenIdle();
  const status=await runtime.bridge.execute('audit_status',{run_id:job.run_id});
  assert.equal(status.status,'FAILED');assert.equal(status.completed,0);assert.equal(status.failed,2);
  assert.ok(status.errors.every(error=>/context|上下文/i.test(error.message)));
  assert.equal(tokenizations.length,0);
  assert.equal(wire.filter(body=>auditMessages(body).context?.target).length,2);assert.deepEqual(errors,[]);
});

test('a startup input validation failure terminates the audit and remains retryable without model requests',{timeout:60000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-audit-startup-'));
  const workspace=findWorkspaceRoot(),database=path.join(root,'audit.db');
  const endpoint='http://127.0.0.1:9/v1';
  const data=JSON.parse(execFileSync(resolvePythonPath(),[path.join(workspace,'apps/iad-harness/test/fixtures/audit_dataset.py'),root,database,'none',endpoint],
    {cwd:workspace,env:{...process.env,PYTHONPATH:path.join(workspace,'python')},encoding:'utf8'}));
  const runtime=await createAuditAgentHost(root,endpoint);t.after(async()=>{await runtime.dispose();await fs.rm(root,{recursive:true,force:true});});
  const {NativeProviders}=await import('../lib/server/models/providers.js');
  const configuration=await runtime.bridge.execute('audit_agent_configuration');
  const agent=await new NativeProviders(()=>runtime.ctx).freeze(configuration.settings.model,configuration.settings.agent_limits,'agent',configuration.settings.reasoning_effort);
  const job=await runtime.bridge.execute('audit_agent_start',{configuration,agent,request:{submission_id:randomUUID(),subset_ids:[data.dataset_id],consistency_job_id:data.consistency_job_id}});
  await runtime.bridge.execute('audit_agent_cancel',{run_id:job.run_id});
  execFileSync(resolvePythonPath(),['-c',`import sqlite3,json,sys
from iad_core.workbench.job_models import JobFailure
c=sqlite3.connect(sys.argv[1]);row=c.execute('SELECT sample_id,consistency_json FROM audit_sample_runs WHERE job_id=? ORDER BY ordinal LIMIT 1',(sys.argv[2],)).fetchone()
value=json.loads(row[1]);value['error_history']=[JobFailure(sample_id=row[0],message='保留的上游错误').model_dump(mode='json')]
c.execute('UPDATE audit_sample_runs SET consistency_json=? WHERE job_id=? AND sample_id=?',(json.dumps(value),sys.argv[2],row[0]));c.commit()
`,database,job.run_id],{cwd:workspace,env:{...process.env,PYTHONPATH:path.join(workspace,'python')}});
  await runtime.scheduler.resume(job.run_id);await runtime.scheduler.whenIdle().catch(()=>{});
  const status=await runtime.bridge.execute('audit_status',{run_id:job.run_id});
  assert.equal(status.status,'FAILED','启动输入失败不能使作业永久显示执行中');
  assert.equal(status.completed,0);assert.equal(status.failed,2);assert.equal(status.model_calls.length,0);
  assert.match(status.execution_error.message,/sample_uuid/);
  assert.ok(status.errors.every(error=>error.message.includes('sample_uuid')));
  execFileSync(resolvePythonPath(),['-c',`import sqlite3,json,sys
c=sqlite3.connect(sys.argv[1])
for sample_id,raw in c.execute('SELECT sample_id,consistency_json FROM audit_sample_runs WHERE job_id=?',(sys.argv[2],)).fetchall():
    value=json.loads(raw)
    for error in value['error_history']:error.pop('sample_uuid',None)
    c.execute('UPDATE audit_sample_runs SET consistency_json=? WHERE job_id=? AND sample_id=?',(json.dumps(value),sys.argv[2],sample_id))
c.commit()
`,database,job.run_id],{cwd:workspace});
  assert.equal((await runtime.bridge.execute('audit_agent_resume',{run_id:job.run_id})).status,'RUNNING');
  assert.ok((await runtime.bridge.execute('audit_agent_samples',{run_id:job.run_id})).samples.every(sample=>sample.state==='PENDING'));
});
