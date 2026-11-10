import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {Context} from '@deepseek-ai/cordis';
import {LlmRuntime} from '@deepseek-ai/dsh-llm';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import {NativeModelBudget} from '../lib/server/sessions/model-budget.js';
import {sendResponses} from './fixtures/responses.js';
import {createConsistencyAgentHost} from './fixtures/consistency-agent-host.js';
import {randomUUID} from 'node:crypto';

test('a Responses Agent uses the native adapter and actual usage without a vLLM counting endpoint',async()=>{
  const wires=[];
  const server=http.createServer(async(req,res)=>{
    let source='';for await(const chunk of req)source+=chunk;
    wires.push({path:req.url,body:JSON.parse(source)});
    sendResponses(res,'gpt-6.1-sol',{content:'已核对'},{input_tokens:24,output_tokens:3,total_tokens:27});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let budget,fork,measures=0;
  try {
    budget=await NativeModelBudget.open({api:'openai-responses',baseURL:`http://127.0.0.1:${server.address().port}/v1`,
      apiKeyEnv:'RESPONSES_KEY',models:[{id:'gpt-6.1-sol',input:['text','image'],contextWindow:32768,maxTokens:4096}]},
      async()=>{measures++;throw new Error('Responses 不使用 vLLM 容量端点');});
    const ctx=new Context();new LlmRuntime(ctx);
    ctx.provide('credentials',{resolve:async()=>({value:'isolated-responses-key'})});
    fork=await ctx.plugin(piAi,{providers:{pinai:budget.profile}});
    const chunks=[];
    for await(const chunk of ctx.llm.stream({provider:'pinai',model:'gpt-6.1-sol',maxTokens:4096,
      messages:[{role:'user',content:[{type:'text',text:'核对冻结图组。'}]}]}))chunks.push(chunk);
    assert.equal(measures,0);
    assert.equal(wires.length,1);assert.equal(wires[0].path,'/v1/responses');
    assert.equal(wires[0].body.max_output_tokens,4096);
    const usage=chunks.find(chunk=>chunk.type==='usage');
    assert.equal(usage.usage.inputTokens,24);assert.equal(usage.usage.outputTokens,3);
    assert.ok(JSON.stringify(chunks).includes('已核对'));
  } finally {await fork?.dispose();await budget?.close();await new Promise(resolve=>server.close(resolve));}
});

for(const similar of [false,true]) test(`a complete Responses consistency check covers ${similar?'identity verification and':'exact candidates and'} annotation review`,{timeout:30000},async()=>{
  const fixture=await createConsistencyAgentHost({protocol:'openai-responses',multiCandidate:similar,withSimilarCandidate:similar});
  try {
    if(similar){
      const settings=await fixture.bridge.execute('module_settings_get',{module:'consistency'});
      await fixture.bridge.execute('module_settings_save',{module:'consistency',expected_revision:settings.revision,
        settings:{reasoning_effort:'xhigh'}});
    }
    const started=await fixture.scheduler.start({submission_id:randomUUID(),analysis_kind:'consistency',
      dataset_ids:[fixture.datasetId],mode:similar?'combined':'exact',subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A]}});
    await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:started.run_id});
    assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));
    assert.deepEqual(fixture.errors,[]);
    assert.equal(fixture.tokenizations.length,0);
    assert.ok(fixture.wires.every(body=>body.responses));
    for(const body of fixture.wires)assert.equal(body.responses.reasoning?.effort,similar?'xhigh':undefined);
    for(const body of fixture.wires.filter(body=>body.test_role==='vision'))assert.equal(body.responses.temperature,0.2);
    assert.ok(fixture.wires.some(body=>body.test_role==='vision' && body.responses.input.some(item=>
      Array.isArray(item.content)&&item.content.some(part=>part.type==='input_image'))));
    const {anchors:[anchor]}=await fixture.bridge.execute('consistency_agent_anchors',{run_id:started.run_id});
    const detail=await fixture.bridge.execute('consistency_agent_detail',{run_id:started.run_id,anchor_id:anchor.anchor_id});
    assert.equal(detail.state,'COMPLETED');
    const diagnostics=await fixture.bridge.execute('consistency_agent_diagnostics',{run_id:started.run_id,anchor_id:anchor.anchor_id});
    assert.equal(diagnostics.roles.vision.input_tokens,similar?2000:1000);
    assert.equal(diagnostics.roles.vision.output_tokens,similar?200:100);
  } finally {await fixture.close();}
});

test('a Responses consistency check uses only its module-owned Agent and vision parameters',{timeout:30000},async()=>{
  const fixture=await createConsistencyAgentHost({protocol:'openai-responses',multiCandidate:true,withSimilarCandidate:true,
    onGeneration(body,res){
      const unsupported=['min_p','top_k','chat_template_kwargs','presence_penalty','repetition_penalty'].find(key=>Object.hasOwn(body,key));
      if(unsupported){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:'Unsupported parameter: '+unsupported,type:'invalid_request_error'}}));}
    }});
  try {
    const module=await fixture.bridge.execute('module_settings_get',{module:'consistency'});
    await fixture.bridge.execute('module_settings_save',{module:'consistency',expected_revision:module.revision,
      settings:{agent_limits:{max_output_tokens:4096,request_parameters:{temperature:0.4}},
        vision_limits:{capacity_mode:'vllm_tokenize',max_output_tokens:4096,request_parameters:{temperature:0.25}}}});
    const started=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],
      subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A]}});
    await fixture.scheduler.whenIdle();
    const status=await fixture.bridge.execute('analysis_status',{run_id:started.run_id});
    assert.equal(status.status,'COMPLETED',JSON.stringify(status.errors));
    assert.ok(fixture.wires.some(body=>body.test_role==='vision'));
    for(const body of fixture.wires){
      if(body.test_role==='vision'){
        assert.equal(body.responses.temperature,0.25);
        assert.equal(body.responses.text.format.type,'json_schema');
      }else if(body.test_role==='agent')assert.equal(body.responses.temperature,0.4);
      assert.equal(Object.hasOwn(body.responses,'min_p'),false);
    }
    assert.deepEqual(status.model_profile.request_parameters,{temperature:0.25});
    assert.equal(status.model_profile.max_output_tokens,4096);
    assert.deepEqual(fixture.errors,[]);
  } finally {await fixture.close();}
});
