import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PythonBridge,createIadHttpHandler} from '../lib/server/index.js';

test('HTTP historical group analysis reads saved conclusions and never launches a model',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-analysis-http-'));
  const bridge=new PythonBridge({dbPath:path.join(root,'test.db')});
  execFileSync(bridge.pythonPath,[fileURLToPath(new URL('fixtures/knowledge_dataset.py',import.meta.url)),root]);
  await fs.copyFile(path.join(root,'images/part-0.png'),path.join(root,'images/copy.png'));
  await fs.copyFile(path.join(root,'labels/part-2.json'),path.join(root,'labels/copy.json'));
  const api=createIadHttpHandler(bridge);let citation,generated=0;
  const server=http.createServer(async(req,res)=>{
    if(req.url==='/tokenize'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({count:1000,max_model_len:262144}));}
    if(req.url==='/v1/chat/completions'){
      generated++;res.writeHead(500);res.end('Historical reads must not invoke a model');return;
    }
    return api(req,res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const settings={LIVE_VLM_ENDPOINT:base+'/v1',LIVE_VLM_MODEL:'protocol-model',LIVE_VLM_CAPACITY_MODE:'vllm_tokenize'};
  const previous=Object.fromEntries(Object.keys(settings).map(key=>[key,process.env[key]]));Object.assign(process.env,settings);
  const post=(route,body)=>fetch(base+'/api/iad'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  try{
    const dataset=await bridge.execute('dataset_import',{format:'labelme',name:'组级视觉核对',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
    const a=dataset.dataset_id+':part-0.png',b=dataset.dataset_id+':copy.png';
    const compared=await bridge.execute('consistency_compare',{sample_a:a,sample_b:b});
    citation={candidate_id:b,comparison:{result_id:compared.result_id,evidence_id:compared.evidence_id,difference_id:null}};
    const report=await (await post('/consistency/report',{selection:{kind:'scope',subjects:{kind:'all_registered'}}})).json();
    const gallery=await (await post('/consistency/gallery',{query_id:report.page.query_id,kind:'conflicts'})).json();
    const reference={query_id:report.page.query_id,kind:'conflicts',group_id:gallery.items[0].group_id};
    const retired=await post('/consistency/gallery/analyze',{...reference,request_id:'http-group-analysis'});
    assert.equal(retired.status,404);
    execFileSync(bridge.pythonPath,['-c',`import sys,json
from iad_core.storage.database import Database
from tests.consistency_history import save_group_history
save_group_history(Database(sys.argv[1]),json.loads(sys.argv[2]),{'copy.png':'类别不一致','part-0.png':'类别不一致'})`,path.join(root,'test.db'),JSON.stringify(reference)],{env:{...process.env,PYTHONPATH:path.resolve('../..','python')+':'+path.resolve('../..')}});
    const saved=await (await post('/consistency/gallery/analysis',reference)).json();
    assert.equal(saved.status,'COMPLETED',JSON.stringify(saved));
    assert.deepEqual(saved.result.conclusions[0].references,[citation]);
    const repeated=await (await post('/consistency/gallery/analysis',reference)).json();
    assert.equal(repeated.run_id,saved.run_id);assert.equal(generated,0);
  }finally{
    for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
    await new Promise(resolve=>server.close(resolve));bridge.destroy();await fs.rm(root,{recursive:true,force:true});
  }
});
