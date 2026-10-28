import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFile,execFileSync} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';

const execute=promisify(execFile);
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

for(const intent of ['query','check','retry'])test('native consistency intent CLI: '+intent,{timeout:60000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-query-intent-'));
  const requests=[];
  const model=http.createServer(async(req,res)=>{
    if(req.method==='GET')return res.end(JSON.stringify({data:[{id:'intent-model',max_model_len:262144}]}));
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const body=JSON.parse(Buffer.concat(chunks));requests.push(body);
    const input=body.messages.filter(item=>item.role==='user').flatMap(item=>typeof item.content==='string'?[item.content]:item.content.filter(block=>block.type==='text').map(block=>block.text)).join('\n');
    const query=input.match(/当前选中图像：(\S+)/)?.[1];
    const done=new Set(body.messages.filter(item=>item.role==='tool').map(item=>item.tool_call_id));
    let call;
    if(intent==='query')call=!done.has('query-skill')?{id:'query-skill',name:'skill',arguments:{name:'audit-data-consistency'}}:
      !done.has('query-retrieve')?{id:'query-retrieve',name:'image_retrieve',arguments:{query:{kind:'sample',sample_id:query},corpus_scope:{kind:'all_registered'},mode:'exact'}}:null;
    else if(intent==='check'){
      const outputs=body.messages.filter(item=>item.role==='tool');
      const started=outputs.find(item=>item.tool_call_id==='check-start');
      const latest=outputs.filter(item=>item.tool_call_id.startsWith('check-status-')).at(-1);
      call=!done.has('check-skill')?{id:'check-skill',name:'skill',arguments:{name:'audit-data-consistency'}}:
        !started?{id:'check-start',name:'consistency_start',arguments:{subjects:{kind:'all_registered'},corpus_scope:{kind:'all_registered'},mode:'exact',request_id:'intent-check'}}:
        !latest||JSON.parse(latest.content.split('\n')[0]).status!=='COMPLETED'?{id:'check-status-'+outputs.length,name:'consistency_status',arguments:{batch_id:JSON.parse(started.content.split('\n')[0]).batch_id}}:null;
    }else{
      const parent=input.match(/原批次：(\S+)/)[1],outputs=body.messages.filter(item=>item.role==='tool');
      const retried=outputs.find(item=>item.tool_call_id==='retry-action');
      const latest=outputs.filter(item=>item.tool_call_id.startsWith('retry-status-')).at(-1);
      call=!done.has('retry-skill')?{id:'retry-skill',name:'skill',arguments:{name:'audit-data-consistency'}}:
        !done.has('retry-parent')?{id:'retry-parent',name:'consistency_status',arguments:{batch_id:parent}}:
        !retried?{id:'retry-action',name:'consistency_retry',arguments:{batch_id:parent,request_id:'intent-retry'}}:
        !latest||JSON.parse(latest.content.split('\n')[0]).status!=='COMPLETED'?{id:'retry-status-'+outputs.length,name:'consistency_status',arguments:{batch_id:JSON.parse(retried.content.split('\n')[0]).batch_id}}:null;
    }
    const delta=call?{role:'assistant',tool_calls:[{index:0,id:call.id,type:'function',function:{name:call.name,arguments:JSON.stringify(call.arguments)}}]}:
      {role:'assistant',content:'查到另一数据集的严格同图候选，未启动批量检查。'};
    res.writeHead(200,{'Content-Type':'text/event-stream'});
    for(const choice of [{index:0,delta,finish_reason:null},{index:0,delta:{},finish_reason:call?'tool_calls':'stop'}])res.write('data: '+JSON.stringify({id:'intent',object:'chat.completion.chunk',model:'intent-model',choices:[choice]})+'\n\n');
    res.end('data: [DONE]\n\n');
  });
  await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));
  try{
    const image=path.join(root,'source.png'),control=path.join(root,'control.png');
    execFileSync(resolvePythonPath(),['-c',"from PIL import Image;import sys;Image.new('RGB',(222,415),(40,60,90)).save(sys.argv[1]);Image.new('RGB',(320,240),(205,205,205)).save(sys.argv[2])",image,control]);
    const result=await execute(process.execPath,[path.join(app,'scripts/verify-consistency-intents.js'),
      '--image',image,'--control',control,'--output',path.join(root,'output'),'--intent',intent],
      {cwd:app,timeout:45000,env:{...process.env,IAD_PYTHON_PATH:resolvePythonPath(),LIVE_VLM_ENDPOINT:`http://127.0.0.1:${model.address().port}/v1`,LIVE_VLM_KEY:'local-only'}});
    assert.equal(result.stderr,'');
    const report=JSON.parse(await fs.readFile(path.join(root,'output/result.json'),'utf8'));
    if(intent==='query'){
      assert.equal(report.cases.query.members,1);
      assert.equal(report.cases.query.cross_dataset,true);
      assert.equal(report.cases.query.started_batches,0);
      assert.deepEqual(report.cases.query.tools,['skill','image_retrieve']);
      assert.equal(requests.length,3);
      const schema=requests[0].tools.find(tool=>tool.function.name==='image_retrieve').function.parameters;
      assert.equal(schema.properties.query.type,'object');
      assert.equal(schema.properties.query.oneOf.length,2);
      assert.equal(schema.properties.corpus_scope.type,'object');
      const audit=requests[0].tools.find(tool=>tool.function.name==='model_audit_context').function.parameters;
      assert.equal(audit.properties.finding_id.type,undefined);
      const events=JSON.parse(await fs.readFile(path.join(root,'output/session-events.json'),'utf8'));
      const canonical=events.find(event=>event.data?.header?.tools)?.data.header.tools.find(tool=>tool.name==='image_retrieve');
      assert.equal(canonical.parameters.properties.query.type,undefined);
      assert.equal(canonical.parameters.properties.query.oneOf.length,2);
    }else if(intent==='check'){
      assert.equal(report.cases.check.total,3);
      assert.equal(report.cases.check.completed,3);
      assert.equal(report.cases.check.failed,0);
      assert.equal(report.cases.check.unprocessed,0);
      assert.equal(report.cases.check.corpus_samples,3);
      assert.equal(report.cases.check.started_batches,1);
    }else{
      assert.equal(report.cases.retry.parent_completed,1);
      assert.equal(report.cases.retry.parent_unprocessed,1);
      assert.equal(report.cases.retry.total,2);
      assert.equal(report.cases.retry.completed,2);
      assert.equal(report.cases.retry.newly_processed,1);
      assert.equal(report.cases.retry.parent_preserved,true);
      assert.equal(report.cases.retry.frozen_scope_preserved,true);
    }
    assert.equal(report.source_bytes_unchanged,true);
    assert.deepEqual(report.violations,[]);
  }finally{await new Promise(resolve=>model.close(resolve));await fs.rm(root,{recursive:true,force:true});}
});
