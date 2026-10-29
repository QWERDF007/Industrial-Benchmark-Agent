import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PythonBridge,createIadHttpHandler} from '../lib/server/index.js';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';

test('HTTP result reads use a separate process without taking ownership of background jobs',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-query-isolation-'));
  const python=resolvePythonPath();
  execFileSync(python,[fileURLToPath(new URL('fixtures/knowledge_dataset.py',import.meta.url)),root]);
  await fs.copyFile(path.join(root,'images/part-0.png'),path.join(root,'images/copy.png'));
  const launcher=path.join(root,'python'),pidsFile=path.join(root,'processes');
  await fs.writeFile(launcher,`#!${python}\nimport os,sys\nwith open(${JSON.stringify(pidsFile)},'a') as stream:stream.write(str(os.getpid())+'\\n')\nos.execv(${JSON.stringify(python)},[${JSON.stringify(python)},*sys.argv[1:]])\n`,{mode:0o700});
  const bridge=new PythonBridge({pythonPath:launcher,dbPath:path.join(root,'test.db')});
  const server=http.createServer(createIadHttpHandler(bridge));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/iad`;
  const post=(route,body)=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  try{
    await bridge.execute('dataset_import',{format:'labelme',name:'查询进程隔离',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
    const start=await post('/consistency/start',{subjects:{kind:'all_registered'},mode:'exact',request_id:'isolation-batch'});
    assert.equal(start.status,200,await start.clone().text());
    const started=await start.json();
    const reportResponse=await post('/consistency/report',{selection:{kind:'scope',subjects:{kind:'all_registered'}}});
    assert.equal(reportResponse.status,200,await reportResponse.clone().text());
    const report=await reportResponse.json();assert.equal(report.page.scopes.subjects.sample_count,4);
    const pids=(await fs.readFile(pidsFile,'utf8')).trim().split('\n').map(Number);
    assert.equal(pids.length,2,'页面读取必须与后台作业使用独立真实Python进程');
    assert.equal(new Set(pids).size,2);
    process.kill(pids[1],'SIGTERM');
    for(let attempt=0;attempt<100;attempt++){
      try{process.kill(pids[1],0);}catch{break;}
      await new Promise(resolve=>setTimeout(resolve,10));
    }
    const reopened=await post('/consistency/report',{selection:{kind:'scope',subjects:{kind:'all_registered'}}});
    assert.equal(reopened.status,200,await reopened.clone().text());
    const activePids=(await fs.readFile(pidsFile,'utf8')).trim().split('\n').map(Number);
    assert.equal(activePids.length,3);assert.equal(activePids[0],pids[0]);assert.notEqual(activePids[2],pids[1]);
    let job;
    for(let attempt=0;attempt<200;attempt++){
      const response=await fetch(base+'/consistency/runs/'+started.batch_id);
      assert.equal(response.status,200,await response.clone().text());job=await response.json();
      if(!['PENDING','RUNNING'].includes(job.status))break;
      await new Promise(resolve=>setTimeout(resolve,10));
    }
    assert.equal(job.status,'COMPLETED');assert.equal(job.completed,4);assert.equal(job.failed,0);
    const pageResponse=await post('/consistency/query',{selection:{kind:'batch',batch_id:started.batch_id}});
    assert.equal(pageResponse.status,200,await pageResponse.clone().text());const page=await pageResponse.json();
    assert.equal(page.total,1);
    const image=await fetch(base+'/consistency/evidence/'+page.items[0].result.evidence_id+'/media/left-preview?max_side=96');
    assert.equal(image.status,200);assert.match(image.headers.get('content-type'),/^image\//);assert.ok((await image.arrayBuffer()).byteLength>0);
  }finally{await new Promise(resolve=>server.close(resolve));bridge.destroy();await fs.rm(root,{recursive:true,force:true});}
});
