import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PythonBridge,createIadHttpHandler} from '../../lib/server/index.js';

export async function explorationSources(t,serve=()=>false) {
  const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-exploration-sources-'));
  const bridge=new PythonBridge({cwd:path.resolve(app,'../..'),dbPath:path.join(root,'test.db')});
  const api=createIadHttpHandler(bridge);
  const server=http.createServer(async(req,res)=>{if(!await serve(req,res))await api(req,res);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{
    await new Promise(resolve=>server.close(resolve));
    bridge.destroy();await fs.rm(root,{recursive:true,force:true});
  });
  const base=`http://127.0.0.1:${server.address().port}`;
  const read=async(route,body)=>{
    const response=await fetch(base+'/api/iad/'+route,body===undefined?undefined:{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    assert.equal(response.status,200,await response.clone().text());
    return response.json();
  };
  execFileSync(bridge.pythonPath,[path.join(app,'test/fixtures/exploration_sources.py'),root]);
  const group=await read('datasets/groups',{name:'选图范围'}),datasets=[];
  for(const subset of ['labelme-a','labelme-b'])datasets.push(await read('datasets/import',{
    format:'labelme',name:subset,image_dir:path.join(root,subset,'images'),annotation_dir:path.join(root,subset,'labels'),
    unannotated_is_normal:false,group_id:group.group_id,
  }));
  const rules=[{path:'OK',role:'normal'},{path:'NG',role:'anomaly'},{path:'unknown',role:'unlabeled'}];
  const preview=await read('datasets/preview',{root_dir:path.join(root,'folder'),rules});
  datasets.push(await read('datasets/import',{format:'folder_classification',name:'folder',root_dir:path.join(root,'folder'),
    rules,preview_fingerprint:preview.preview_fingerprint,group_id:group.group_id}));
  datasets.push(await read('datasets/import',{format:'labelme',name:'convention',image_dir:path.join(root,'convention'),
    annotation_dir:path.join(root,'convention'),unannotated_is_normal:true,group_id:group.group_id}));
  return {app,base,read,datasets};
}
