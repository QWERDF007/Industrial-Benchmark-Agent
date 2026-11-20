import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';

test('independent image pairs fill the frozen concurrency pool',{timeout:60000},async()=>{
  const entered=Promise.withResolvers(),release=Promise.withResolvers();let active=0,peak=0;
  const fixture=await createConsistencyAgentHost({candidateCount:5,withSimilarCandidate:true,annotatedCandidates:true,
    modelRouting:{execute:async(operation,args,signal,dispatch)=>{
      if(operation==='consistency_agent_pair_review_many')assert.equal(args.pair_keys.length,1);
      return dispatch(operation,args,signal);
    }},onGeneration:async body=>{
      const context=JSON.parse(body.messages.find(message=>message.role==='user').content[1].text);
      assert.notEqual(context.scope,'pairs');
      if(context.scope==='joint'){
        active++;peak=Math.max(peak,active);
        if(active===4)entered.resolve();
        await release.promise;active--;
      }
    }});
  try{
    await fixture.bridge.execute('module_settings_save',{module:'consistency',expected_revision:1,settings:{concurrency:4}});
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId]});
    await Promise.race([entered.promise,delay(15000).then(()=>{throw new Error('Independent image pairs left model workers idle: '+peak);})]);
    release.resolve();await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));assert.equal(status.failed,0);
    assert.equal(peak,4);
    assert.deepEqual(fixture.errors,[]);
  }finally{release.resolve();await fixture.close();}
});


test('annotation observations and actual calls are shared by both directions',{timeout:60000},async()=>{
  const annotations=[];
  const fixture=await createConsistencyAgentHost({candidateCount:3,annotatedCandidates:true,onGeneration:async body=>{
    const context=JSON.parse(body.messages.find(message=>message.role==='user').content[1].text);
    const facts=context.facts;
    assert.ok(facts);assert.equal(Object.keys(facts.candidates).length,1);
    annotations.push(Object.values(facts.sources).map(source=>source.name).sort().join('\n'));
  }});
  try{
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId]});
    await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:job.run_id});
    assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));assert.equal(status.failed,0);
    assert.equal(annotations.length,6);assert.equal(new Set(annotations).size,6);
    const {anchors}=await fixture.bridge.execute('consistency_agent_anchors',{run_id:job.run_id});
    const details=await Promise.all(anchors.map(anchor=>fixture.bridge.execute('consistency_agent_detail',
      {run_id:job.run_id,anchor_id:anchor.anchor_id})));
    const observations=details.flatMap(detail=>detail.observations);
    assert.equal(observations.length,12);
    assert.equal(new Set(observations.map(observation=>observation.shared_source.observation_id)).size,6);
    assert.equal(observations.filter(observation=>observation.shared_source.reversed).length,6);
    assert.deepEqual(fixture.errors,[]);
  }finally{await fixture.close();}
});
