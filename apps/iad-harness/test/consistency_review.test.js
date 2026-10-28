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

test('HTTP review separates explicit quality decisions, proposed annotation fixes and verified rescans',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-review-http-'));
  execFileSync(resolvePythonPath(),[fileURLToPath(new URL('fixtures/knowledge_dataset.py',import.meta.url)),root]);
  await fs.copyFile(path.join(root,'images/part-2.png'),path.join(root,'images/copy.png'));
  const label=JSON.parse(await fs.readFile(path.join(root,'labels/part-2.json'),'utf8'));label.shapes[0].label='different';
  const sourcePath=path.join(root,'labels/copy.json');await fs.writeFile(sourcePath,JSON.stringify(label));
  const sourceBytes=await fs.readFile(sourcePath);
  const bridge=new PythonBridge({dbPath:path.join(root,'test.db')});
  const server=http.createServer(createIadHttpHandler(bridge));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/iad`;
  const post=async(route,body)=>{const response=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(response.status,200,await response.clone().text());return response.json();};
  const get=async route=>{const response=await fetch(base+route);assert.equal(response.status,200,await response.clone().text());return response.json();};
  try {
    const dataset=await post('/datasets/import',{format:'labelme',name:'复核事务',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels'),annotation_policy:{policy_id:'same',annotation_role:'REFERENCE',annotation_coverage:'EXHAUSTIVE'}});
    const pair={sample_a:dataset.dataset_id+':part-2.png',sample_b:dataset.dataset_id+':copy.png'};
    let compared=await post('/consistency/compare',pair),difference=compared.annotation.differences.find(item=>item.type==='CATEGORY');
    const explicit={client_request_id:crypto.randomUUID(),evidence_id:compared.evidence_id,result_id:compared.result_id,difference_ids:[difference.difference_id],
      reviewer:'HTTP复核人',comment:'仅裁决明确选择的副本',action:{kind:'SET_EFFECTIVE_QUALITY',targets:[{sample_id:pair.sample_b,quality:'PASS'}]}};
    const qualityDecision=await post('/consistency/review/submit',explicit);assert.deepEqual(await post('/consistency/review/submit',explicit),qualityDecision);
    const detail=await get('/sample/'+encodeURIComponent(pair.sample_b));assert.equal(detail.review_history.length,1);assert.equal(detail.review_decision.decision,'PASS');assert.equal(detail.sample.quality_status,'UNCERTAIN');
    compared=await post('/consistency/compare',pair);difference=compared.annotation.differences.find(item=>item.type==='CATEGORY');
    const proposal={client_request_id:crypto.randomUUID(),evidence_id:compared.evidence_id,result_id:compared.result_id,
      difference_ids:[difference.difference_id],reviewer:'HTTP复核人',comment:'按原图核实类别',action:{kind:'PROPOSE_REGION_CHANGE',changes:[{operation:'relabel',sample_id:pair.sample_b,annotation_id:difference.right[0].annotation_id,category:'待核实区域'}]}};
    const [first,second]=await Promise.all([post('/consistency/review/submit',proposal),post('/consistency/review/submit',proposal)]);assert.deepEqual(first,second);
    assert.deepEqual(await fs.readFile(sourcePath),sourceBytes);
    const awaiting=await post('/consistency/review/verify',{client_request_id:crypto.randomUUID(),decision_id:first.decision_id,evidence_id:compared.evidence_id,reviewer:'HTTP复核人'});
    assert.equal(awaiting.correction_state,'AWAITING_RESCAN');
    label.shapes[0].label='待核实区域';await fs.writeFile(sourcePath,JSON.stringify(label));
    await post('/datasets/'+encodeURIComponent(dataset.dataset_id)+'/rescan',{});
    const corrected=await post('/consistency/compare',pair);assert.equal(corrected.annotation.differences.length,0);
    const verify={client_request_id:crypto.randomUUID(),decision_id:first.decision_id,evidence_id:corrected.evidence_id,reviewer:'HTTP复核人'};
    const verified=await post('/consistency/review/verify',verify);assert.equal(verified.correction_state,'VERIFIED');assert.deepEqual(await post('/consistency/review/verify',verify),verified);
    const context=await post('/consistency/review/context',{evidence_id:compared.evidence_id});
    assert.equal(context.decisions.length,1);assert.equal(context.differences[0].correction_state,'VERIFIED');
    const frozen=await get('/consistency/evidence/'+compared.evidence_id);assert.equal(frozen.result.annotation.differences.length,1);
    const quality={client_request_id:crypto.randomUUID(),evidence_id:compared.evidence_id,result_id:compared.result_id,
      difference_ids:[difference.difference_id],reviewer:'HTTP复核人',comment:'旧来源不能用于新质量裁决',action:{kind:'SET_EFFECTIVE_QUALITY',targets:[{sample_id:pair.sample_b,quality:'PASS'}]}};
    const stale=await fetch(base+'/consistency/review/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(quality)});assert.equal(stale.status,409);
    assert.equal((await get('/sample/'+encodeURIComponent(pair.sample_b))).review_history.length,1);
    assert.equal((await get('/sample/'+encodeURIComponent(pair.sample_a))).review_history.length,0);
  }finally{await new Promise(resolve=>server.close(resolve));bridge.destroy();await fs.rm(root,{recursive:true,force:true});}
});
