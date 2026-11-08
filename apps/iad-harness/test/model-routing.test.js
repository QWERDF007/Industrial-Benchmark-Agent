import test from 'node:test';
import assert from 'node:assert/strict';
import {WorkbenchModelRouting} from '../lib/server/models/index.js';

for (const [operation,query] of Object.entries({analysis_retry:'analysis_node',direction_exploration_retry:'direction_exploration_status',
  knowledge_retry:'knowledge_status',audit_retry:'audit_status'})) {
  test(`${operation} uses the frozen model profile exposed by the job view`,async()=>{
    const profile={endpoint:'http://frozen.example/v1/chat/completions',provider_id:'original-provider',provider_name:'原模型',
      model_id:'original-model',credential_ref:'IAD_FROZEN_TEST_KEY',api:'openai-completions',capacity_mode:'vllm_tokenize',
      request_parameters:{temperature:0.7,enable_thinking:false,response_format:{type:'json_object'}}};
    let credentials=0;
    const routing=new WorkbenchModelRouting({credentials:{resolve:async()=>{credentials++;return {value:'isolated-test-key'};}}});
    const calls=[];
    const args={run_id:'frozen-job',sample_ids:['selected-sample']};
    const result=await routing.execute(operation,args,undefined,async(name,values)=>{
      calls.push({name,values});
      if(name===query)return {run_id:args.run_id,model_profile:structuredClone(profile)};
      assert.equal(name,operation);
      assert.deepEqual(values,{...args,_model_execution:{profile,api_key:'isolated-test-key'}});
      return {run_id:'retry-job'};
    });
    assert.deepEqual(result,{run_id:'retry-job'});
    assert.deepEqual(calls.map(call=>call.name),[query,operation]);
    assert.equal(credentials,1);
  });
}
