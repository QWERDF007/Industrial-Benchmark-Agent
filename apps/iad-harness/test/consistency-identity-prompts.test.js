import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {createIadHttpHandler} from '../lib/server/routes/index.js';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';

test('a consistency check freezes editable identity prompts and uses them on the vision wire',{timeout:45000},async()=>{
  const fixture=await createConsistencyAgentHost({taskType:'anomaly_detection',multiCandidate:true,withSimilarCandidate:true});
  const handler=createIadHttpHandler(fixture.bridge);
  const server=http.createServer((req,res)=>{void handler(req,res);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const api=async(route,body)=>{
    const response=await fetch(`http://127.0.0.1:${server.address().port}/api/iad${route}`,body?{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);
    return {status:response.status,data:await response.json()};
  };
  const identityPrompts={gate_system:' 自定义身份验证系统原文\n按真实图像判断。 ',
    gate_user:'自定义身份验证用户原文\n核对全部实际细节。',gate_examples:'自定义示例：细微黑点不同则内容不同。'};
  const request={submission_id:randomUUID(),analysis_kind:'consistency',dataset_ids:[fixture.datasetId],
    subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A]},identity_prompts:identityPrompts};
  try {
    const started=await api('/analysis/start',request);
    assert.equal(started.status,200,JSON.stringify(started.data));
    assert.deepEqual(started.data.consistency_identity_prompts,identityPrompts);
    await fixture.scheduler.whenIdle();
    const status=await api('/analysis/status/'+started.data.run_id);
    assert.equal(status.data.status,'COMPLETED',JSON.stringify(status.data.errors));
    assert.deepEqual(status.data.consistency_identity_prompts,identityPrompts);
    const listed=await api('/analysis/jobs?'+new URLSearchParams({dataset_id:fixture.datasetId,analysis_kind:'consistency'}));
    assert.equal(listed.status,200);
    assert.deepEqual(listed.data.jobs.find(job=>job.run_id===started.data.run_id).consistency_identity_prompts,identityPrompts);
    const vision=fixture.wires.filter(body=>body.test_role==='vision');
    assert.ok(vision.length>0);
    for(const body of vision) {
      assert.equal(body.messages.find(message=>message.role==='system').content[0].text,identityPrompts.gate_system);
      const user=body.messages.find(message=>message.role==='user');
      assert.equal(user.content[0].text,identityPrompts.gate_user);
      assert.equal(JSON.parse(user.content[1].text).examples,identityPrompts.gate_examples);
    }
    const calls=fixture.wires.length;
    assert.equal((await api('/analysis/start',request)).data.run_id,started.data.run_id);
    await fixture.scheduler.whenIdle();
    assert.equal(fixture.wires.length,calls);
    const changed=await api('/analysis/start',{...request,identity_prompts:{...identityPrompts,gate_user:'另一份用户提示词'}});
    assert.ok(changed.status>=400);
    const invalid=await api('/analysis/start',{...request,submission_id:randomUUID(),
      identity_prompts:{...identityPrompts,gate_system:' \n '}});
    assert.ok(invalid.status>=400);
    assert.deepEqual(fixture.errors,[]);
  } finally {
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
    await fixture.close();
  }
});
