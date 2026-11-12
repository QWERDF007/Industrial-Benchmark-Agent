import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createAuditAgentHost} from './fixtures/audit-agent-host.js';
import {findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {chatRequest} from './fixtures/responses.js';
import {respondFixtureTools} from './fixtures/analysis-finalization.js';
import {auditIssueTypesByFormat} from '../lib/shared/audit.generated.js';

test('native audit publishes fixed batch clues through one master and independent image children',{timeout:120000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-audit-delegation-'));
  const count=Number(process.env.IAD_AUDIT_IMAGE_COUNT||17),wire=[];
  t.after(()=>fs.writeFile(path.join(root,'wire.json'),JSON.stringify(wire)));
  let active=0,peak=0;const attempts=new Map(),references=new Set();
  const provider=http.createServer(async(req,res)=>{
    try{
      assert.ok(!req.url.includes('tokenize'),'完整原图直接请求提供商');
      let raw='';for await(const chunk of req)raw+=chunk;
      const body=chatRequest(JSON.parse(raw));wire.push(body);
      const values=body.messages.map((message,index)=>({message,index})).flatMap(({message,index})=>{
        const parts=typeof message.content==='string'?[{type:'text',text:message.content}]:message.content||[];
        return parts.flatMap(part=>{if(part.type!=='text')return [];try{return [{role:message.role,index,value:JSON.parse(part.text.trim().split('\n')[0])}];}catch{return [];}});
      });
      const latest=values.filter(item=>item.role==='user'&&(item.value.target||item.value.kind==='audit_records')).at(-1);
      const context=latest?.value;
      assert.ok(context,'实际请求必须包含当前角色的完整材料');
      const attemptKey=context.target?.sample.sample_id||`${context.phase}:${context.batch?.number}:${context.revision}`;
      attempts.set(attemptKey,(attempts.get(attemptKey)||0)+1);
      if(attempts.get(attemptKey)>3){
        res.writeHead(200,{'Content-Type':'text/event-stream'});
        res.end('data: '+JSON.stringify({choices:[{index:0,delta:{content:'当前工具提交未被接纳。'},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n');return;
      }
      const outputs=values.filter(item=>item.role==='tool'&&item.index>latest.index).map(item=>item.value);
      let tool;
      if(context.target){
        active++;peak=Math.max(peak,active);
        await new Promise(resolve=>setTimeout(resolve,30));
        const images=body.messages.flatMap(message=>Array.isArray(message.content)?message.content.filter(part=>part.type==='image_url'):[]);
        assert.equal(images.length,3,'一张完整原图和全部两个标注局部首次一起发送');
        assert.ok(!body.tools.some(tool=>tool.function?.name==='audit_batch_commit'));
        const evidence=values.find(item=>item.value.images?.length)?.value.evidence_id;
        assert.ok(evidence);
        tool={name:'audit_commit',arguments:{commit_key:'image-final',final:{execution_status:'completed',state:'normal',
          analysis:'主体边缘与现有标注关系未形成充分矛盾。',conclusion:'未发现有充分依据的标注疑点。',basis:[],
          evidence_ids:[evidence],selected_evidence:[{evidence_id:evidence,reason:'主体与背景关系清晰，可用于跨图比较。'}],findings:[],observations:[{description:'可见规则背景和主体边缘。',annotation_ids:[],evidence_ids:[evidence]}],
          visual_features:[{kind:'morphology',description:'主体呈规则矩形轮廓。',annotation_ids:[],evidence_ids:[evidence]}],
          hypothesis_assessments:(context.batch?.clues||[]).map(clue=>({group_id:clue.group_id,assessment:'counter',
            reason:'相近可见现象没有独立标注矛盾，不能由线索判为少标。',evidence_ids:[evidence]})),
          consistency_review:[],check_assessments:[],limitations:[]}}};
        active--;
      }else if(context.phase==='review'){
        assert.ok(!body.tools.some(tool=>tool.function?.name==='audit_commit'));
        const first=context.items.find(item=>item.final);
        if(!outputs.some(output=>output?.images?.length))tool={name:'audit_report_evidence',arguments:{sample_id:first.sample_id,evidence_id:first.final.evidence_ids[0]}};
        else{
          const prior=context.discoveries[0];
          const ref={sample_id:first.sample_id,result_revision:first.result_revision,kind:'observation',index:0};
          const discovery={group_id:'pattern',kind:'visual_pattern',dimension:'visual_coverage',status:prior?'disputed':'pending',
            title:'规则背景中的主体轮廓',description:'相似外观本身不足以判为标注质量问题。',visual_signature:'规则背景和矩形边缘',
            annotation_relation:'已有原始框，尚未发现独立覆盖矛盾。',scope:'冻结已审图像',
            support_refs:prior?.support_refs||[ref],counter_refs:prior?[ref]:[],key_difference:'相近外观不自动产生少标判断。',
            unresolved_question:'当前只能归纳可见现象。',next_batch_focus:'检查相似轮廓是否具有独立标注矛盾。',
            representatives:prior?[prior.representatives[0],{sample_id:first.sample_id,role:'counter',reason:'相似现象仍未形成质量疑点。'}]:
              [{sample_id:first.sample_id,role:'representative',reason:'完整原图保留了主体与背景的关系。'}]};
          const {support_refs,counter_refs,representatives,...body}=discovery;
          const role=prior?'counter':'support',key=JSON.stringify(ref);
          tool={name:'audit_batch_commit',arguments:{commit_key:'batch-'+context.batch.number+'-'+context.revision,batch_number:context.batch.number,
            base_revision:context.revision,discoveries:[body],
            evidence_changes:references.has(key)?[]:[{group_id:'pattern',action:'add',role,reference:ref,reason:'依据本批保存的原图观察核对当前现象。'}],
            representative_changes:[{group_id:'pattern',representatives}],review_requests:[]}};
          references.add(key);
        }
      }else{
        if(!context.revision){res.writeHead(503);res.end('没有执行跨批联合分析');return;}
        const records=outputs.find(output=>output?.kind==='audit_records')?.items;
        if(!records)tool={name:'audit_records',arguments:{page:1,page_size:100}};
        else tool={name:'audit_report_commit',arguments:{commit_key:'report-'+context.revision,discovery_ids:['pattern'],conclusion:'可用于视觉探索和内部调试。',
          consistency_analysis:'上游无候选的图像也已独立审计。',knowledge_analysis:'',coverage_analysis:'覆盖规则轮廓及多框标注。',
          coverage_topics:[{title:'规则轮廓与多框覆盖',analysis:'实际轮廓保持规则，框数变化不自动证明实例组织错误。',
            evidence_refs:records.filter(item=>item.final?.execution_status==='completed').map(item=>({sample_id:item.sample_id,result_revision:item.result_revision,kind:'image'})),representatives:[]}],
          consistency_analyses:auditIssueTypesByFormat[context.dataset_profile.dataset_format].map(issue_type=>({
            issue_type,analysis:'本轮没有保留该类质量疑点，缺少跨图候选不能证明标注无误。',evidence_refs:[],representatives:[]})),
          independence_analysis:'缺少可确认的物理件、批次和序列身份。',capabilities:[],usability:
            ['exploration','training_experiment','debug','image_evaluation','bbox_evaluation','pixel_evaluation','formal_benchmark'].map(purpose=>({
              purpose,status:['exploration','training_experiment','debug'].includes(purpose)?'candidate':'not_evaluated',
              reason:'仅依据实际原图、原标注和已有检查评价用途。'})),review_priorities:[],limitations:[]}};
      }
      respondFixtureTools(res,[tool],{protocol:'openai-completions',model:'native-audit'});
    }catch(error){res.writeHead(500);res.end(JSON.stringify({error:{message:error.stack}}));}
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>provider.close(resolve)));
  const endpoint=`http://127.0.0.1:${provider.address().port}/v1`;
  const dataset=JSON.parse(execFileSync(resolvePythonPath(),['test/fixtures/audit-delegation-dataset.py',root,path.join(root,'audit.db'),String(count)],{
    cwd:path.join(findWorkspaceRoot(),'apps/iad-harness'),env:{...process.env,PYTHONPATH:path.join(findWorkspaceRoot(),'python')},encoding:'utf8'}));
  const runtime=await createAuditAgentHost(root,endpoint);t.after(()=>runtime.dispose());
  const job=await runtime.scheduler.start({submission_id:randomUUID(),subset_ids:[dataset.dataset_id],consistency_job_id:dataset.consistency_job_id});
  await runtime.scheduler.whenIdle();
  const status=await runtime.bridge.execute('audit_status',{run_id:job.run_id});
  assert.equal(status.status,'COMPLETED',JSON.stringify({root,completed:status.completed,failed:status.failed,execution_error:status.execution_error,errors:status.errors}));
  assert.equal(status.completed,count);assert.equal(peak,2);
  const snapshot=await runtime.bridge.execute('audit_agent_snapshot',{run_id:job.run_id});
  assert.equal(snapshot.settings.batch_size,8);assert.equal(snapshot.settings.concurrency,2);
  assert.equal(snapshot.context_policy,'evidence-on-demand-v1');
  const {samples}=await runtime.bridge.execute('audit_agent_samples',{run_id:job.run_id});
  for(const sample of samples){
    const session=await runtime.host.read(sample.session_id);
    assert.equal(session.header.delegationDepth,1);
    assert.equal(sample.result.state,'normal');
    assert.equal(session.events.filter(event=>event.type==='image/offload').length,1);
  }
  const parent=await runtime.bridge.execute('audit_agent_report_state',{run_id:job.run_id});
  const masterSession=await runtime.host.read(parent.session_id);
  assert.equal(masterSession.events.filter(event=>event.type==='image/offload').length,Math.ceil(count/8));
  assert.equal(parent.revision,Math.ceil(count/8));assert.equal(parent.discoveries[0].status,'disputed');
  const report=await runtime.bridge.execute('audit_job_report',{run_id:job.run_id});
  assert.equal(report.statistics.issue_occurrences,0);assert.equal(report.usability.length,7);
  assert.equal(report.coverage_topics[0]?.title,'规则轮廓与多框覆盖');
  assert.deepEqual(report.consistency_analyses.map(item=>item.issue_type),
    ['category_mismatch','extra_annotation','missing_annotation','position_difference','split','merge']);
  for(const item of Object.values(report.evidence_groups).flat()){
    assert.deepEqual(item.image.crop_bbox,[0,0,40,30]);
    assert.equal(item.image.role,'overview');assert.equal(item.image.representation,'raw');
  }
  assert.ok(wire.filter(body=>JSON.stringify(body).includes('hypothesis_assessments')).length>=count);
  if(process.env.IAD_AUDIT_BROWSER==='1'){
    const {verifyAuditDelegationPage}=await import('./fixtures/audit-delegation-page.js');
    await verifyAuditDelegationPage(runtime,dataset,job,root);
  }
  const {auditMessages}=await import('./fixtures/audit-report.js');
  const childrenBefore=wire.filter(body=>auditMessages(body).context?.target).length;
  const frozenChildren=await Promise.all(samples.map(sample=>runtime.host.exportJsonl(sample.session_id)));
  const frozenSnapshot=await runtime.bridge.execute('audit_agent_snapshot',{run_id:job.run_id});
  const prompts={master_prompt:{system_prompt:'跨图归纳现象和规律。',user_prompt:'重新整理全部发现和代表原图。'},report_instruction:'生成综合报告，不拼接逐图详情。'};
  const resumed=await runtime.bridge.execute('audit_report_regenerate',{run_id:job.run_id,prompts});
  assert.equal(resumed.status,'RUNNING');await runtime.scheduler.whenIdle();
  const regenerated=await runtime.bridge.execute('audit_status',{run_id:job.run_id});
  assert.equal(regenerated.status,'COMPLETED',JSON.stringify(regenerated.execution_error));
  assert.equal(wire.filter(body=>auditMessages(body).context?.target).length,childrenBefore,'报告重生成不重跑子 Agent');
  assert.deepEqual(await runtime.bridge.execute('audit_agent_snapshot',{run_id:job.run_id}),frozenSnapshot);
  assert.deepEqual(await Promise.all(samples.map(sample=>runtime.host.exportJsonl(sample.session_id))),frozenChildren);
  const updated=await runtime.bridge.execute('audit_agent_report_state',{run_id:job.run_id});
  assert.equal(updated.session_id,parent.session_id);assert.equal(updated.revision,parent.revision+1);
  assert.deepEqual(updated.prompts,prompts);
});

test('a later batch rechecks an earlier child and a retry only observes the failed image',{timeout:60000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-audit-recheck-')),wire=[],errors=[];
  let failed=false,earlier;
  const {auditMessages,auditReportTool}=await import('./fixtures/audit-report.js');
  const provider=http.createServer(async(req,res)=>{
    try{
      let raw='';for await(const chunk of req)raw+=chunk;
      const body=JSON.parse(raw),{context,outputs,pages}=auditMessages(body);wire.push(context);
      let tool;
      if(context.target){
        assert.equal(context.target.dataset_format,'folder_classification');
        assert.equal(pages[0].images.length,1,'图像级标注不生成矩形局部');
        if(context.sample_id.endsWith('001.png')&&!failed){failed=true;res.writeHead(503);res.end(JSON.stringify({error:{message:'本图视觉服务临时不可用'}}));return;}
        if(context.sample_id.endsWith('000.png'))earlier=context.sample_id;
        const evidence=pages[0].evidence_id;
        if(context.review){assert.equal(context.prior_result.state,'normal');assert.ok(context.review.reason.includes('后批'));
          assert.equal(context.review.result_revision,1);}
        tool={name:'audit_commit',arguments:{commit_key:context.review?'reviewed-final':'initial-final',final:{
          execution_status:'completed',state:'normal',analysis:context.review?'复核后仍未形成覆盖矛盾。':'本图未形成独立标注矛盾。',
          conclusion:'当前可见范围未发现疑点。',basis:[],evidence_ids:[evidence],findings:[],observations:[],
          visual_features:[],hypothesis_assessments:[],consistency_review:[],check_assessments:[],limitations:[]}}};
      }else if(context.phase==='review'&&context.batch.number===2&&context.revision===1){
        tool={name:'audit_batch_commit',arguments:{commit_key:'request-earlier',batch_number:2,base_revision:1,discoveries:[],review_requests:[{
          sample_id:earlier,result_revision:1,reason:'后批观察与前图的覆盖解释冲突，定向复核。',conflict_refs:[{
            sample_id:context.items[0].sample_id,result_revision:1,kind:'image'}]}]}};
      }else{
        if(context.phase==='review'&&context.batch.number===2&&context.revision===2){
          assert.equal(context.items.find(item=>item.sample_id===earlier).result_revision,2);
        }
        tool=auditReportTool(context,outputs);
      }
      respondFixtureTools(res,[tool]);
    }catch(error){errors.push(String(error));res.writeHead(500);res.end(JSON.stringify({error:{message:String(error)}}));}
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  const endpoint=`http://127.0.0.1:${provider.address().port}/v1`;
  const dataset=JSON.parse(execFileSync(resolvePythonPath(),['test/fixtures/audit-delegation-dataset.py',root,path.join(root,'audit.db'),'3','folder_classification'],{
    cwd:path.join(findWorkspaceRoot(),'apps/iad-harness'),env:{...process.env,PYTHONPATH:path.join(findWorkspaceRoot(),'python')},encoding:'utf8'}));
  const runtime=await createAuditAgentHost(root,endpoint);
  t.after(async()=>{await runtime.dispose();provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));await fs.rm(root,{recursive:true,force:true});});
  await runtime.bridge.execute('module_settings_save',{module:'audit',expected_revision:1,settings:{batch_size:2}});
  const job=await runtime.scheduler.start({submission_id:randomUUID(),subset_ids:[dataset.dataset_id],consistency_job_id:dataset.consistency_job_id});
  await runtime.scheduler.whenIdle();
  const partial=await runtime.bridge.execute('audit_status',{run_id:job.run_id});
  assert.equal(partial.status,'PARTIAL',JSON.stringify({partial,errors}));
  assert.equal(partial.completed,2);assert.equal(partial.failed,1);
  const history=await runtime.bridge.execute('audit_agent_versions',{run_id:job.run_id,sample_id:earlier});
  assert.deepEqual(history.versions.map(item=>item.revision),[1,2]);
  await runtime.scheduler.resume(job.run_id);await runtime.scheduler.whenIdle();
  const completed=await runtime.bridge.execute('audit_status',{run_id:job.run_id});
  assert.equal(completed.status,'COMPLETED',JSON.stringify({completed,errors}));
  assert.equal(completed.completed,3);assert.equal(completed.failed,0);
  for(const [suffix,count] of [['000.png',2],['001.png',2],['002.png',1]])assert.equal(wire.filter(context=>context.target&&context.sample_id.endsWith(suffix)).length,count);
  const {samples}=await runtime.bridge.execute('audit_agent_samples',{run_id:job.run_id});
  assert.equal(samples.find(item=>item.sample_id===earlier).result_revision,2);
  assert.equal((await runtime.host.read(samples[0].session_id)).header.delegationDepth,1);
  assert.deepEqual(errors,[]);
});
