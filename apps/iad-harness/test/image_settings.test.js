import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {PythonBridge,createIadHttpHandler} from '../lib/server/index.js';

test('image settings use independent persisted profiles and structured encoder errors',async()=>{
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
    const resourceOnly=await post('/images/settings',{expected_revision:0,selection:null,
      resources:{...initialSettings.resources,decode_workers:3,decode_memory_mb:64}});
    assert.equal(resourceOnly.status,200,await resourceOnly.clone().text());
    const resourceSettings=await resourceOnly.json();assert.equal(resourceSettings.selection,null);
    assert.equal(resourceSettings.resources.decode_workers,3);assert.equal(resourceSettings.resources.decode_memory_mb,64);
    const unavailable=await post('/images/settings/check',{});
    assert.equal(unavailable.status,409);
    assert.equal((await unavailable.json()).error.code,'PROFILE_NOT_CONFIGURED');
    const weights=path.join(root,'model.pt');await fs.writeFile(weights,'invalid-model');
    const profileResponse=await post('/images/profiles',{model_id:'sscd_disc_mixup',weights_ref:weights});
    assert.equal(profileResponse.status,200,await profileResponse.clone().text());
    const profile=await profileResponse.json();assert.equal(profile.dim,512);
    const selection={profile,device:'cpu',batch_size:2,gpu_memory_mb:2048,compute_dtype:'float32',decode_workers:3,decode_memory_mb:64};
    const saved=await post('/images/settings',{expected_revision:1,selection});
    assert.equal(saved.status,200,await saved.clone().text());
    assert.deepEqual((await saved.json()).selection,selection);
    assert.deepEqual((await bridge.execute('feature_settings_view',{})).selection,selection);
    assert.equal((await bridge.execute('model_settings_get',{})).selection,null);
    const failed=await post('/images/settings/check',{});
    assert.equal(failed.status,409);
    assert.equal((await failed.json()).error.code,'ENCODER_UNAVAILABLE');
    const missing=await post('/images/profiles',{model_id:'sscd_disc_mixup',weights_ref:path.join(root,'missing.pt')});
    assert.equal(missing.status,409);
    assert.equal((await missing.json()).error.code,'ENCODER_UNAVAILABLE');
    const reread=await fetch(base+'/images/settings');assert.equal((await reread.json()).revision,2);
  }finally{
    await new Promise(resolve=>server.close(resolve));bridge.destroy();await fs.rm(root,{recursive:true,force:true});
  }
});
