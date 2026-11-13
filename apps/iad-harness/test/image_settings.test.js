import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {PythonBridge,createIadHttpHandler} from '../lib/server/index.js';

test('image settings expose fixed DINOv3 options and revision-checked writes',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-image-settings-'));
  const bridge=new PythonBridge({dbPath:path.join(root,'test.db')});
  const server=http.createServer(createIadHttpHandler(bridge));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/iad`;
  const post=(endpoint,data)=>fetch(base+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  try{
    const initial=await fetch(base+'/images/settings');
    assert.equal(initial.status,200);
    const initialSettings=await initial.json();
    assert.equal(initialSettings.revision,0);assert.equal(initialSettings.selection,null);
    assert.equal(initialSettings.resources.decode_workers,2);assert.equal(initialSettings.resources.decode_memory_mb,512);
    assert.deepEqual(initialSettings.models.map(model=>model.model_id),['dinov3_vits16','dinov3_vits16plus','dinov3_vitb16','dinov3_vitl16']);
    const unavailable=await post('/images/settings/check',{});
    assert.equal(unavailable.status,409);
    assert.equal((await unavailable.json()).error.code,'PROFILE_NOT_CONFIGURED');
    const model=initialSettings.models.find(model=>model.available);
    const values={expected_revision:0,model_id:model?.model_id??'dinov3_vits16',batch_size:8,input_size:224};
    assert.equal((await post('/images/settings',{...values,input_size:225})).status,422);
    assert.equal((await post('/images/settings',{...values,batch_size:0})).status,422);
    assert.equal((await post('/images/settings',{...values,weights_ref:'/client/path'})).status,422);
    if(model){
      const saved=await post('/images/settings',values);assert.equal(saved.status,200,await saved.clone().text());
      const current=await saved.json();assert.equal(current.revision,1);
      assert.equal(current.selection.profile.model_id,model.model_id);
      assert.equal(current.selection.compute_dtype,'float16');
      assert.equal((await post('/images/settings',{...values,batch_size:16})).status,422);
      const response=await post('/images/settings',{...values,expected_revision:1,batch_size:16});
      assert.equal(response.status,200,await response.clone().text());
      const batched=await response.json();
      assert.equal(batched.selection.profile.profile_id,current.selection.profile.profile_id);
      assert.equal((await bridge.execute('feature_settings_view',{})).resources.batch_size,16);
    }else{
      assert.equal((await post('/images/settings',values)).status,409);
      assert.equal((await (await fetch(base+'/images/settings')).json()).revision,0);
    }
  }finally{
    await new Promise(resolve=>server.close(resolve));bridge.destroy();await fs.rm(root,{recursive:true,force:true});
  }
});
