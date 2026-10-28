import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {createUserMessage} from '@deepseek-ai/dsh-llm';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createDatasetSession} from './fixtures/dataset_session.js';

test('DSH imports different discovered structures before one explicitly scoped cross-dataset check', {timeout:60000}, async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-multi-structure-'));
  execFileSync(resolvePythonPath(),['-c',`
from pathlib import Path
from PIL import Image
import json,sys
r=Path(sys.argv[1])
for folder in ['collection/first/pixels','collection/first/regions','collection/second/mixed','classification/OK','classification/NG','unrelated']:
 (r/folder).mkdir(parents=True)
for folder,name in [('collection/first/pixels','a'),('collection/second/mixed','b'),('classification/OK','good'),('classification/NG','bad')]:
 Image.new('RGB',(32,32),'blue').save(r/folder/(name+'.png'))
for folder,name,label in [('collection/first/regions','a','scratch'),('collection/second/mixed','b','dent')]:
 (r/folder/(name+'.json')).write_text(json.dumps({'imageWidth':32,'imageHeight':32,'shapes':[{'label':label,'shape_type':'rectangle','points':[[2,2],[10,10]]}]}))
Image.new('RGB',(32,32),'red').save(r/'unrelated/kept.png')
`,root]);
  const requests=[],trace=[];
  const server=http.createServer(async(req,res)=>{
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const body=JSON.parse(Buffer.concat(chunks));requests.push(body);
    const outputs=body.messages.filter(m=>m.role==='tool');
    const done=new Map(outputs.map(m=>[m.tool_call_id,m]));
    const value=id=>JSON.parse(done.get(id).content.split('\n')[0]);
    const steps=[
      ['skill','skill',{name:'audit-data-consistency'}],['list','dataset_list',{}],
      ...['collection','collection/first','collection/first/pixels','collection/first/regions','collection/second','collection/second/mixed','classification','classification/OK','classification/NG'].map((p,i)=>['inspect-'+i,'dataset_directory_inspect',{path:path.join(root,p)}]),
      ['preview','dataset_preview',{root_dir:path.join(root,'classification')}],
      ['first','dataset_import',{format:'labelme',name:'first',image_dir:path.join(root,'collection/first/pixels'),annotation_dir:path.join(root,'collection/first/regions')}],
      ['second','dataset_import',{format:'labelme',name:'second',image_dir:path.join(root,'collection/second/mixed'),annotation_dir:path.join(root,'collection/second/mixed')}],
    ];
    let call=steps.find(([id])=>!done.has(id));
    if(!call&&!done.has('classification')){
      const preview=value('preview');
      call=['classification','dataset_import',{format:'folder_classification',name:'classification',root_dir:preview.root_dir,rules:preview.items.map(({path,role})=>({path,role})),preview_fingerprint:preview.preview_fingerprint}];
    }else if(!call&&!done.has('start')){
      const ids=['first','second','classification'].map(id=>value(id).dataset_id);
      call=['start','consistency_start',{subjects:{kind:'datasets',dataset_ids:ids},corpus_scope:{kind:'datasets',dataset_ids:ids},mode:'exact',request_id:'multi-structure'}];
    }else if(!call){
      const latest=outputs.filter(m=>m.tool_call_id.startsWith('status-')).at(-1);
      if(!latest||['PENDING','RUNNING'].includes(JSON.parse(latest.content.split('\n')[0]).status))call=['status-'+outputs.length,'consistency_status',{batch_id:value('start').batch_id}];
      else if(!done.has('report'))call=['report','consistency_report',{selection:{kind:'batch',batch_id:value('start').batch_id}}];
    }
    const delta=call?{role:'assistant',tool_calls:[{index:0,id:call[0],type:'function',function:{name:call[1],arguments:JSON.stringify(call[2])}}]}:{role:'assistant',content:'三套数据已接入，指定范围的一致性检查已完成；目录原始标签与人工质量真值分别保留。'};
    res.writeHead(200,{'Content-Type':'text/event-stream'});
    for(const choice of [{index:0,delta,finish_reason:null},{index:0,delta:{},finish_reason:call?'tool_calls':'stop'}])res.write('data: '+JSON.stringify({id:'multi',object:'chat.completion.chunk',model:'local-protocol',choices:[choice]})+'\n\n');
    res.end('data: [DONE]\n\n');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  process.env.IAD_MULTI_STRUCTURE_KEY='local-only';let session;
  try{
    session=await createDatasetSession({root:path.join(root,'session'),dbPath:path.join(root,'test.db'),endpoint:`http://127.0.0.1:${server.address().port}/v1`,model:'local-protocol',apiKeyEnv:'IAD_MULTI_STRUCTURE_KEY'});
    const unrelated=await session.ctx.iadPythonBridge.execute('dataset_import',{format:'labelme',name:'无关集',image_dir:path.join(root,'unrelated'),annotation_dir:path.join(root,'unrelated')});
    session.ctx.on('tools/result',(exec,result)=>trace.push({name:exec.name,args:exec.arguments,result}));
    session.handle.agent.followup(createUserMessage({source:{kind:'user'},content:[{type:'text',text:`请检查 ${path.join(root,'collection')} 和 ${path.join(root,'classification')}，自行识别结构、逐套添加，完成这些数据集之间的一致性检查。`}]}));
    await session.handle.agent.whenIdle();
    assert.ok(trace.every(t=>!t.result.isError),JSON.stringify(trace.filter(t=>t.result.isError)));
    const imported=trace.filter(t=>t.name==='dataset_import');assert.equal(imported.length,3);
    assert.deepEqual(imported.map(t=>t.result.value.format),['labelme','labelme','folder_classification']);
    const starts=trace.filter(t=>t.name==='consistency_start');assert.equal(starts.length,1);
    const ids=imported.map(t=>t.result.value.dataset_id).sort();
    assert.deepEqual(starts[0].args.subjects.dataset_ids.slice().sort(),ids);
    assert.deepEqual(starts[0].args.corpus_scope.dataset_ids.slice().sort(),ids);
    assert.ok(!ids.includes(unrelated.dataset_id));
    assert.ok(trace.findIndex(t=>t.name==='consistency_start')>trace.findLastIndex(t=>t.name==='dataset_import'));
    const batch=await session.ctx.iadPythonBridge.execute('consistency_status',{batch_id:starts[0].result.value.batch_id});
    assert.equal(batch.status,'COMPLETED');assert.equal(batch.completed,4);assert.equal(batch.total,4);assert.equal(batch.failed,0);
    const report=trace.find(t=>t.name==='consistency_report').result.value;
    assert.equal(report.page.total,6);assert.equal(report.statistics.current.strict_groups,1);assert.equal(report.statistics.current.strict_members,4);
    assert.ok(requests.some(r=>r.messages.some(m=>m.role==='tool'&&m.content.includes('不预设目录名称'))),'原生技能实际进入模型上下文');
    assert.ok(trace.every(t=>['skill','dataset_list','dataset_directory_inspect','dataset_preview','dataset_import','consistency_start','consistency_status','consistency_report'].includes(t.name)));
  }finally{
    await session?.dispose();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true});delete process.env.IAD_MULTI_STRUCTURE_KEY;
  }
});
