import {auditMessages,auditReportTool} from './fixtures/audit-report.js';
import {respondFixtureTools} from './fixtures/analysis-finalization.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {Context} from '@deepseek-ai/cordis';
import {LlmRuntime} from '@deepseek-ai/dsh-llm';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';
import {NativeProviders} from '../lib/server/models/providers.js';
import {JobSessionHost} from '../lib/server/sessions/host.js';
import {AuditWorkflowScheduler} from '../lib/server/audit/scheduler.js';
import {auditSessionPath} from '../lib/server/audit/session-path.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';

test('mutual candidates keep marked, omitted and insufficient judgments in two audits with distinct frozen upstream jobs',{timeout:60000},async t=>{
  let bridge,host,scheduler,plugin,server;const errors=[],wire=[];
  let expectedConsistencyRun,insufficient=false;
  const upstream=await createConsistencyAgentHost({modelRouting:{execute:(operation,args,signal,dispatch)=>
    scheduler?scheduler.execute(operation,args,signal,dispatch):dispatch(operation,args,signal)}});
  const provider=http.createServer(async(req,res)=>{
    try {
      let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);
      if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:65536}));return;}
      wire.push(body);
      const {context,outputs,pages}=auditMessages(body);
      if(context?.phase){respondFixtureTools(res,[auditReportTool(context,outputs)]);return;}
      if(outputs.some(value=>value?.execution_status==='incomplete')){
        res.writeHead(200,{'Content-Type':'text/event-stream'});
        res.end('data: '+JSON.stringify({choices:[{index:0,delta:{role:'assistant',content:'必要观察未完成，已保存线索。'},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n');return;
      }
      assert.equal(context.consistency.job_id,expectedConsistencyRun);
      assert.equal(context.knowledge,null);assert.equal(context.consistency.result.reason,'MODEL_REVIEWED');
      assert.equal(context.consistency.anchor_id,context.sample_id);
      assert.equal(context.consistency.evidence.length,1);
      assert.equal(Object.hasOwn(context.consistency,'requests'),false);
      assert.equal(Object.hasOwn(context.consistency,'observations'),true);
      assert.ok(!JSON.stringify(context).includes('audit-only'));
      const candidate=context.consistency.evidence[0].candidate_id;
      assert.notEqual(candidate,context.sample_id);
      assert.ok(pages.length>=1&&pages.every(page=>!page.error));
      const actual=body.messages.flatMap(message=>Array.isArray(message.content)?message.content:[]).filter(part=>part.type==='image_url');
      assert.deepEqual(actual.map(part=>createHash('sha256').update(Buffer.from(part.image_url.url.split(',')[1],'base64')).digest('hex')).sort(),
        pages.at(-1).images.map(item=>item.image.sha256).sort(),'当前请求只携带新读取的图像，已观察的主图不重复发送');
      let call;
      if(pages.length===1)call={name:'audit_images',arguments:{sample_id:candidate}};
      else {
        assert.equal(pages[0].sample_id,context.sample_id);assert.equal(pages[1].sample_id,candidate);
        const marked=context.sample_id.endsWith(':A.png');
        assert.equal(context.target.annotations.length,marked?1:0);
        assert.equal(pages[1].images[0].model_context.annotations.length,marked?0:1);
        const ids=pages.map(page=>page.evidence_id);
        call={name:'audit_commit',arguments:{commit_key:'final',final:{execution_status:insufficient&&!marked?'incomplete':'completed',state:marked?'normal':insufficient?null:'suspect',
          consistency_review:context.consistency.result.issues.map(issue=>({source_issue_id:issue.issue_id,assessment:marked?'unsupported':insufficient?'insufficient':'supported',reason:'已依据本图像素独立核对，不能直接采纳候选标签。',evidence_ids:ids})),
          analysis:marked?'A-audit-only：本图已标出划痕，对照无框不能推翻本图可见标注。':insufficient?'B-insufficient-audit-only：细节不足，保留无法确认的标注范围。':'B-audit-only：本图划痕未标注，对照图提供同像素位置。',
          conclusion:marked?'本图划痕已经标注。':insufficient?'当前局部细节不足以判断标注完整性。':'本图存在划痕漏标疑点。',basis:['原图与同像素候选逐图核对。'],evidence_ids:ids,
          check_assessments:[],limitations:['对照图不是人工真值。',...(insufficient&&!marked?['当前细节无法消解标注范围的不确定性。']:[])],findings:marked||insufficient?[]:[{finding_id:'missing-scratch',type:'missing_annotation',annotation_ids:[],consistency_issue_refs:context.consistency.result.issues.map(issue=>issue.issue_id),description:'本图划痕没有对应标注。',
            location:'主体中央划痕',check_ids:[],evidence_ids:ids,normal_explanation:'需排除反光导致的外观变化。',limitations:['需要人工复核。']}]}}};
      }
      res.writeHead(200,{'Content-Type':'text/event-stream'});
      res.write('data: '+JSON.stringify({choices:[{index:0,delta:{role:'assistant',tool_calls:[{index:0,id:randomUUID(),type:'function',function:{name:call.name,arguments:JSON.stringify(call.arguments)}}]},finish_reason:null}]})+'\n\n');
      res.write('data: '+JSON.stringify({choices:[{index:0,delta:{},finish_reason:'tool_calls'}],usage:{prompt_tokens:500,completion_tokens:100,total_tokens:600}})+'\n\n');res.end('data: [DONE]\n\n');
    } catch(error){errors.push(String(error));res.writeHead(500);res.end(JSON.stringify({error:{message:String(error)}}));}
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{await scheduler?.dispose();await host?.dispose();await plugin?.dispose();if(server)await new Promise(resolve=>server.close(resolve));
    provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));await upstream.close();});
  execFileSync(resolvePythonPath(),['-c',`
from pathlib import Path
from PIL import Image,ImageDraw
import sys
for filename in (Path(sys.argv[1])/'images').glob('*.png'):
    image=Image.open(filename);ImageDraw.Draw(image).line((12,12,18,18),fill='white',width=2);image.save(filename)
`,upstream.root]);
  await upstream.bridge.execute('dataset_scan',{dataset_id:upstream.datasetId});
  const check=await upstream.scheduler.start({submission_id:randomUUID(),dataset_ids:[upstream.datasetId],mode:'exact'});
  await upstream.scheduler.whenIdle();
  const checked=await upstream.bridge.execute('analysis_status',{run_id:check.run_id});
  assert.equal(checked.status,'COMPLETED',JSON.stringify(checked));assert.equal(checked.completed,2);assert.deepEqual(upstream.errors,[]);
  const laterCheck=await upstream.scheduler.start({submission_id:randomUUID(),dataset_ids:[upstream.datasetId],mode:'exact'});
  await upstream.scheduler.whenIdle();
  assert.notEqual(laterCheck.run_id,check.run_id);
  assert.equal((await upstream.bridge.execute('analysis_status',{run_id:laterCheck.run_id})).status,'COMPLETED');
  expectedConsistencyRun=check.run_id;
  bridge=upstream.bridge;
  await bridge.execute('module_settings_save',{module:'audit',expected_revision:0,
    settings:{model:{provider_id:'audit-fixture',model_id:'native-audit'},concurrency:2}});
  host=await JobSessionHost.open(path.join(upstream.root,'audit-sessions'),async session_id=>auditSessionPath(upstream.root,
    await bridge.execute('audit_agent_session_location',{session_id})));
  const ctx=new Context();new LlmRuntime(ctx);
  const providers={'audit-fixture':{api:'openai-completions',baseURL:`http://127.0.0.1:${provider.address().port}/v1`,apiKeyEnv:'AUDIT_TEST_KEY',models:[{id:'native-audit',input:['text','image'],contextWindow:65536,maxTokens:4096}]}};
  ctx.provide('settings',{configure:()=>()=>{},describe:()=>[{ns:'llm-pi-ai',revision:1,value:{providers}}]});
  ctx.provide('credentials',{resolve:async()=>({value:'audit-test-key'})});plugin=await ctx.plugin(piAi,{providers});
  scheduler=new AuditWorkflowScheduler(bridge,new NativeProviders(()=>ctx),host,upstream.root,error=>errors.push(String(error)));
  server=http.createServer(createIadHttpHandler(bridge));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/iad`;
  for(const consistency_job_id of ['', [check.run_id,check.run_id]]){
    const response=await fetch(base+'/audit/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submission_id:randomUUID(),subset_ids:[upstream.datasetId],consistency_job_id})});
    assert.equal(response.status,422);assert.equal(wire.length,0);
  }
  const response=await fetch(base+'/audit/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submission_id:randomUUID(),subset_ids:[upstream.datasetId],consistency_job_id:check.run_id})});
  assert.equal(response.status,200,await response.clone().text());const job=await response.json();await scheduler.whenIdle();
  const status=await(await fetch(base+'/audit/status/'+job.run_id)).json();assert.equal(status.status,'COMPLETED',JSON.stringify(status));
  const page=await(await fetch(base+'/audit/jobs/'+job.run_id+'/samples')).json();assert.deepEqual(page.distribution,{suspect:1,normal:1,incomplete:0});
  for(const item of page.items){
    const detail=await(await fetch(base+'/audit/jobs/'+job.run_id+'/samples/'+encodeURIComponent(item.sample_id))).json();
    assert.equal(detail.final.state,item.sample_id.endsWith(':A.png')?'normal':'suspect');
    assert.equal(detail.consistency.job_id,check.run_id);
    assert.equal(new Set(detail.evidence.map(item=>item.sample_id)).size,2);
  }
  assert.equal(wire.length,7);assert.deepEqual(errors,[]);
  const html=await(await fetch(base+'/audit/jobs/'+job.run_id+'/export')).text();assert.ok(html.includes('覆盖范围需复核'));
  const firstReport=await(await fetch(base+'/audit/jobs/'+job.run_id+'/report')).json();
  insufficient=true;expectedConsistencyRun=laterCheck.run_id;
  const secondResponse=await fetch(base+'/audit/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    submission_id:randomUUID(),subset_ids:[upstream.datasetId],consistency_job_id:laterCheck.run_id})});
  assert.equal(secondResponse.status,200,await secondResponse.clone().text());const second=await secondResponse.json();await scheduler.whenIdle();
  const secondStatus=await(await fetch(base+'/audit/status/'+second.run_id)).json();
  assert.equal(secondStatus.status,'PARTIAL');assert.equal(secondStatus.completed,1);assert.equal(secondStatus.failed,1);
  const secondPage=await(await fetch(base+'/audit/jobs/'+second.run_id+'/samples')).json();
  assert.deepEqual(secondPage.distribution,{suspect:0,normal:1,incomplete:1});
  const secondReport=await(await fetch(base+'/audit/jobs/'+second.run_id+'/report')).json();
  assert.equal(secondReport.audited_samples,1);assert.equal(secondReport.insufficient_samples,1);assert.equal(secondReport.suspect_samples,0);
  const secondHtml=await(await fetch(base+'/audit/jobs/'+second.run_id+'/export')).text();
  assert.ok(secondHtml.includes('未完成范围不能视为正常。'));
  const incomplete=(await bridge.execute('audit_agent_samples',{run_id:second.run_id})).samples.find(item=>item.result?.execution_status==='incomplete');
  assert.equal(incomplete.result.conclusion,'当前局部细节不足以判断标注完整性。');
  assert.ok(!secondHtml.includes('划痕漏标疑点'));assert.notEqual(secondHtml,html);
  const expected=new Map([[job.run_id,check.run_id],[second.run_id,laterCheck.run_id]]),sessions=new Set();
  for(const body of wire){
    const {context}=auditMessages(body);
    sessions.add(context.session_id||context.job_id);
    if(context.phase)continue;
    assert.equal(context.consistency.job_id,expected.get(context.job_id));
  }
  assert.equal(sessions.size,6);
  for(const [runId,report,reportHtml] of [[job.run_id,firstReport,html],[second.run_id,secondReport,secondHtml]]){
    const {samples}=await bridge.execute('audit_agent_samples',{run_id:runId});
    for(const sample of samples)assert.equal((await bridge.execute('audit_agent_context',{run_id:runId,sample_id:sample.sample_id})).consistency.job_id,expected.get(runId));
    const location=await bridge.execute('audit_agent_session_location',{session_id:samples[0].session_id});
    const directory=path.dirname(auditSessionPath(upstream.root,location));
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(directory,'summary.json'),'utf8')),report);
    assert.equal(await fs.readFile(path.join(directory,'report.html'),'utf8'),reportHtml);
  }
  assert.equal(await(await fetch(base+'/audit/jobs/'+job.run_id+'/export')).text(),html);
  assert.deepEqual(await(await fetch(base+'/audit/jobs/'+job.run_id+'/report')).json(),firstReport);
  assert.equal(wire.length,14);assert.deepEqual(errors,[]);assert.deepEqual(upstream.errors,[]);
});
