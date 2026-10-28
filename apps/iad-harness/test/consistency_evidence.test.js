import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PythonBridge,createIadHttpHandler} from '../lib/server/index.js';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';

test('frozen consistency HTTP survives replaced sources and exports real images',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-evidence-http-'));
  execFileSync(resolvePythonPath(),[fileURLToPath(new URL('fixtures/knowledge_dataset.py',import.meta.url)),root]);
  await fs.copyFile(path.join(root,'images/part-0.png'),path.join(root,'images/copy.png'));
  await fs.writeFile(path.join(root,'labels/copy.json'),JSON.stringify({imageWidth:320,imageHeight:240,shapes:[{label:'dent',shape_type:'rectangle',points:[[10,10],[30,30]]}]}));
  const bridge=new PythonBridge({dbPath:path.join(root,'test.db')});t.after(()=>bridge.destroy());
  const server=http.createServer(createIadHttpHandler(bridge));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/iad`;
  const post=(route,body)=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  try {
    const dataset=await bridge.execute('dataset_import',{format:'labelme',name:'冻结证据',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels'),annotation_policy:{policy_id:'same',annotation_role:'REFERENCE',annotation_coverage:'EXHAUSTIVE'}});
    const request={sample_a:dataset.dataset_id+':part-0.png',sample_b:dataset.dataset_id+':copy.png'};
    const compared=await post('/consistency/compare',request);
    assert.equal(compared.status,200,await compared.clone().text());
    const result=await compared.json();assert.equal(result.verification.relation,'EXACT');assert.equal(result.annotation.confirmed_conflict,true);
    const reviewEndpoint='/consistency/review';
    const difference=result.annotation.differences.find(item=>item.type==='ONE_SIDED_REGION');
    const disposition={client_request_id:crypto.randomUUID(),evidence_id:result.evidence_id,result_id:result.result_id,
      difference_ids:[difference.difference_id],reviewer:'HTTP复核人',comment:'规范差异已核对',action:{kind:'EXPECTED_POLICY_DIFFERENCE'}};
    const submitted=await post(reviewEndpoint+'/submit',disposition);assert.equal(submitted.status,200,await submitted.clone().text());
    const decision=await submitted.json();assert.deepEqual(await (await post(reviewEndpoint+'/submit',disposition)).json(),decision);
    const context=await post(reviewEndpoint+'/context',{evidence_id:result.evidence_id});assert.equal(context.status,200);
    const review=await context.json();assert.equal(review.decisions.length,1);
    assert.equal(review.differences.find(item=>item.difference_id===difference.difference_id).review_state,'RESOLVED');
    const endpoint='/consistency/evidence/'+result.evidence_id;
    const original=Buffer.from(await (await fetch(base+endpoint+'/media/left-original')).arrayBuffer());
    assert.deepEqual([...original.subarray(0,8)],[137,80,78,71,13,10,26,10]);
    await fs.copyFile(path.join(root,'images/part-1.png'),path.join(root,'images/part-0.png'));
    const reopened=await fetch(base+endpoint);assert.equal(reopened.status,200);
    const bundle=await reopened.json();assert.equal(bundle.source_states.left,'CHANGED');assert.equal(bundle.result.result_id,result.result_id);
    assert.deepEqual(Buffer.from(await (await fetch(base+endpoint+'/media/left-original')).arrayBuffer()),original);
    const archive=await fetch(base+endpoint+'/export');assert.equal(archive.status,200);assert.equal(archive.headers.get('content-type'),'application/zip');
    const zip=path.join(root,'export.zip');await fs.writeFile(zip,Buffer.from(await archive.arrayBuffer()));
    execFileSync(resolvePythonPath(),['-c',`import io,json,sys,zipfile
from PIL import Image
with zipfile.ZipFile(sys.argv[1]) as z:
 m=json.loads(z.read('evidence.json'));assert m['evidence']['result']['verification']['relation']=='EXACT'
 with Image.open(io.BytesIO(z.read(m['files']['left-original']))) as image: assert image.size==(320,240)
`,zip]);
    const invalid=await post('/consistency/compare',{...request,left_path:'/etc/passwd'});assert.equal(invalid.status,422);
    assert.equal((await fetch(base+'/consistency/evidence/missing')).status,404);
    const info=await bridge.execute('consistency_evidence_media',{evidence_id:result.evidence_id,media_id:'left-original'});
    await fs.writeFile(info.path,'changed');
    const broken=await fetch(base+endpoint);assert.equal(broken.status,409);assert.equal((await broken.json()).error.code,'SOURCE_UNAVAILABLE');
  } finally {await new Promise(resolve=>server.close(resolve));bridge.destroy();await fs.rm(root,{recursive:true,force:true});}
});
