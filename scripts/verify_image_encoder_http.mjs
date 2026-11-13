import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {PythonBridge,createIadHttpHandler} from '../apps/iad-harness/lib/server/index.js';

const [configurationsPath,outputPath]=process.argv.slice(2);
if (!configurationsPath || !outputPath) throw new Error('Usage: node scripts/verify_image_encoder_http.mjs <configurations.json> <output.json>');
const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-real-image-http-'));
const bridge=new PythonBridge({dbPath:path.join(root,'test.db')});
const server=http.createServer(createIadHttpHandler(bridge));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/api/iad`;
async function post(endpoint,body) {
  const response=await fetch(base+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));return data;
}
const results=[];
try {
  let revision=0;
  for(const input of JSON.parse(await fs.readFile(configurationsPath,'utf8'))) {
    const saved=await post('/images/settings',{...input,expected_revision:revision});
    revision=saved.revision;
    const profile=saved.selection.profile;
    const checked=await post('/images/settings/check',{});
    assert.equal(checked.profile_id,profile.profile_id);assert.equal(checked.dim,profile.dim);
    assert.ok(Math.abs(checked.norm-1)<.001);
    results.push(checked);console.log(JSON.stringify(checked));
  }
  await fs.writeFile(outputPath,JSON.stringify({results},null,2)+'\n');
} finally {
  await new Promise(resolve=>server.close(resolve));bridge.destroy();await fs.rm(root,{recursive:true,force:true});
}
