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

for(const withKnowledge of [false,true])test(`${withKnowledge?'selected weak knowledge and counter evidence':'zero knowledge'} with no consistency candidates audits every image in independent native Sessions`, {timeout:60000}, async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-audit-native-'));
  const workspace=findWorkspaceRoot(), database=path.join(root,'audit.db'), wire=[], errors=[];
  let runtime,bridge,host,ctx,scheduler,server;
  const provider=http.createServer(async(req,res)=>{
    try {
      assert.equal(req.headers.authorization,'Bearer audit-test-key');
      let text='';for await(const chunk of req)text+=chunk;
      const body=JSON.parse(text);
      if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:65536}));return;}
      wire.push(body);
      const parse=value=>{try{return JSON.parse((typeof value==='string'?value:value.find(part=>part.type==='text').text).split('\n')[0]);}catch{return null;}};
      const context=body.messages.filter(message=>message.role==='user')
        .map(message=>parse(message.content)).find(value=>value?.target);
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
      const pages=body.messages.filter(message=>message.role==='tool').map(message=>parse(message.content));
      assert.ok(pages.every(page=>!page.error));
      let call;
      if(!pages.length)call={name:'audit_images',arguments:{sample_id:context.sample_id}};
      else if(withKnowledge&&pages.length===1)call={name:'audit_reference',arguments:{evidence_id:context.knowledge.entries[0].check.counter_evidence_ids[0]}};
      else if(withKnowledge&&pages.length===2)call={name:'audit_crop',arguments:{sample_id:context.sample_id,bbox:[1,2,11,12]}};
      else {
        const actual=body.messages.flatMap(message=>Array.isArray(message.content)?message.content:[]).filter(part=>part.type==='image_url');
        const images=pages.flatMap(page=>page.images);
        assert.equal(actual.length,images.length);
        assert.deepEqual(actual.map(part=>createHash('sha256').update(Buffer.from(part.image_url.url.split(',')[1],'base64')).digest('hex')).sort(),
          images.map(image=>image.image.sha256).sort());
        for (const page of pages) {
          assert.ok(page.evidence_id, 'the original image owns the media bundle reference');
          assert.ok(page.images.every(item => !Object.hasOwn(item.image,'evidence_id')&&!Object.hasOwn(item.model_context,'evidence_id')));
        }
        const suspect=context.sample_id.endsWith(':1.png'), ids=[...new Set(pages.map(page=>page.evidence_id))];
        call={name:'audit_commit',arguments:{commit_key:'final',final:{state:suspect?'suspect':'normal',
          analysis:suspect?'本场第二张独立疑点，需核对三处可见现象。':'本场第一张的独立观察。',conclusion:suspect?'三处现象待复核。':'当前可见范围未发现疑点。',
          basis:['已观察本张原图及全部必需局部。'],evidence_ids:ids,
          check_assessments:context.knowledge?context.knowledge.entries.map(entry=>({check_id:entry.check.check_id,status:'unobservable',description:'本图不足以消解该暂定关系。',evidence_ids:ids})):[],limitations:['候选角色不是质量真值。'],
          findings:suspect?[1,2,3].map(index=>({finding_id:'F'+index,description:'本图现象'+index,location:'主体',check_ids:[],
            evidence_ids:ids,normal_explanation:'需排除成像变化。',limitations:[]})):[]}}};
      }
      res.writeHead(200,{'Content-Type':'text/event-stream'});
      res.write('data: '+JSON.stringify({id:'audit-fixture',choices:[{index:0,delta:{role:'assistant',tool_calls:[{index:0,id:randomUUID(),type:'function',function:{name:call.name,arguments:JSON.stringify(call.arguments)}}]},finish_reason:null}]})+'\n\n');
      res.write('data: '+JSON.stringify({id:'audit-fixture',choices:[{index:0,delta:{},finish_reason:'tool_calls'}],usage:{prompt_tokens:500,completion_tokens:200,total_tokens:700}})+'\n\n');
      res.end('data: [DONE]\n\n');
    } catch(error){errors.push(String(error));res.writeHead(500);res.end(JSON.stringify({error:{message:String(error)}}));}
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{await runtime?.dispose();
    if(server)await new Promise(resolve=>server.close(resolve));provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));await fs.rm(root,{recursive:true,force:true});});
  const data=JSON.parse(execFileSync(resolvePythonPath(),[fileURLToPath(new URL('./fixtures/audit_dataset.py',import.meta.url)),
    root,database,withKnowledge?'knowledge':'none',`http://127.0.0.1:${provider.address().port}/v1`],
    {cwd:workspace,env:{...process.env,PYTHONPATH:path.join(workspace,'python')},encoding:'utf8'}));
  runtime=await createAuditAgentHost(root,`http://127.0.0.1:${provider.address().port}/v1`,{onError:error=>errors.push(String(error))});
  ({bridge,host,ctx,scheduler}=runtime);
  const notice=host.notice.bind(host);let noticeInterrupted=false;
  host.notice=async(id,record)=>{
    if(withKnowledge&&record.value?.kind==='audit-final'&&!noticeInterrupted){noticeInterrupted=true;throw new Error('interrupted after the image final committed');}
    return notice(id,record);
  };
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
  const submission={submission_id:randomUUID(),subset_ids:[data.dataset_id],consistency_job_id:data.consistency_job_id,knowledge:data.knowledge,
    system_prompt:promptDefaults.system.audit+'\n系统自定义：审计工具流程。',instruction:'用户自定义：逐图比较边缘。'};
  const started=await ctx.tools.execute({name:'model_audit_start',arguments:submission,callId:'native-audit-start',signal:new AbortController().signal});
  assert.equal(started.isError,false,JSON.stringify(started));
  const response=await fetch(base+'/audit/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(submission)});
  assert.equal(response.status,200,await response.clone().text());const job=await response.json();await scheduler.whenIdle();
  assert.equal(started.value.run_id,job.run_id);
  const status=await(await fetch(base+'/audit/status/'+job.run_id)).json();
  assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));assert.equal(status.completed,2);assert.equal(status.failed,0);
  assert.equal(wire.length,withKnowledge?8:4);assert.deepEqual(errors,[]);
  for(const body of wire){
    assert.ok(body.messages.some(message=>message.role==='system'&&message.content.includes('系统自定义：审计工具流程。')));
    assert.ok(!body.messages.some(message=>message.role==='system'&&message.content.includes('用户自定义：逐图比较边缘。')));
    assert.ok(body.messages.some(message=>message.role==='user'&&JSON.stringify(message.content).includes('用户自定义：逐图比较边缘。')));
  }
  assert.equal(noticeInterrupted,withKnowledge);
  const samples=await(await fetch(base+'/audit/jobs/'+job.run_id+'/samples')).json();
  assert.deepEqual(samples.distribution,{suspect:1,insufficient:0,normal:1,unprocessed:0});
  const {samples:internal}=await bridge.execute('audit_agent_samples',{run_id:job.run_id});
  assert.equal(new Set(internal.map(sample=>sample.session_id)).size,2);
  const nativeCalls=status.model_calls.filter(call=>call.source==='native_llm');
  assert.equal(nativeCalls.length,withKnowledge?8:4);
  assert.ok(nativeCalls.every(call=>internal.some(sample=>sample.sample_id===call.sample_id&&sample.session_id===call.session_id)));
  assert.ok(status.model_calls.filter(call=>call.operation==='tokenize').every(call=>internal.some(sample=>sample.sample_id===call.sample_id)));
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
  const report=await(await fetch(base+'/audit/jobs/'+job.run_id+'/report')).json();assert.equal(report.suspect_samples,1);
  const callsBeforeReport=wire.length;
  const reportRead=await ctx.tools.execute({name:'model_audit_report',arguments:{run_id:job.run_id},
    callId:'read-current-audit-report',signal:new AbortController().signal});
  assert.equal(reportRead.isError,false,JSON.stringify(reportRead));
  assert.deepEqual(reportRead.value,report);
  assert.equal(reportRead.value.audited_samples,2);
  assert.equal(reportRead.value.knowledge_version_id,data.knowledge?.version_id||null);
  assert.equal(wire.length,callsBeforeReport);
  const html=await(await fetch(base+'/audit/jobs/'+job.run_id+'/export')).text();assert.ok(html.includes('本图现象3'));
  assert.equal(await(await fetch(base+'/audit/jobs/'+job.run_id+'/export')).text(),html);
  const location=await bridge.execute('audit_agent_session_location',{session_id:internal[0].session_id});
  const directory=path.dirname(auditSessionPath(root,location));
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(directory,'summary.json'),'utf8')),report);
  assert.equal(await fs.readFile(path.join(directory,'report.html'),'utf8'),html);
  if(browser){await browser.verifyAuditPage(base.replace('/api/iad',''),data.consistency_job_id,job.run_id,{withKnowledge,knowledgeVersion:data.knowledge?.version_id});await scheduler.whenIdle();
    assert.equal(wire.length,withKnowledge?16:8);assert.deepEqual(errors,[]);
    assert.equal(await(await fetch(base+'/audit/jobs/'+job.run_id+'/export')).text(),html);}
});
