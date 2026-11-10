import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {Context} from '@deepseek-ai/cordis';
import {LlmRuntime} from '@deepseek-ai/dsh-llm';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import {NativeProviders} from '../lib/server/models/providers.js';
import {defaultModelLimits} from '../lib/shared/model-settings.generated.js';

test('review roles freeze native declarations without credential reads or provider requests', async () => {
  let requests = 0, credentials = 0;
  const server = http.createServer((_req, res) => {requests++;res.writeHead(500);res.end();});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const endpoint = `http://127.0.0.1:${server.address().port}/v1`;
  const providers = {isolated: {api: 'openai-completions', baseURL: endpoint, apiKeyEnv: 'ISOLATED_KEY',
    models: [{id: 'planner', input: ['text'], contextWindow: 32768, maxTokens: 4096},
      {id: 'vision', input: ['text', 'image'], contextWindow: 65536, maxTokens: 8192},
      {id:'undeclared-output',input:['text','image'],contextWindow:65536}]}};
  const ctx = new Context();
  new LlmRuntime(ctx);
  ctx.provide('settings', {configure: () => () => {}, describe: () => [{ns: 'llm-pi-ai', revision: 1, value: {providers}}]});
  ctx.provide('credentials', {resolve: async () => {credentials++;throw new Error('禁止提交阶段读凭据');},
    describe: async () => {credentials++;throw new Error('禁止提交阶段探测凭据');}});
  const fork = await ctx.plugin(piAi, {providers});
  try {
    const native = new NativeProviders(() => ctx);
    const limits = {...defaultModelLimits, capacity_mode: 'vllm_tokenize', max_output_tokens: 2048};
    const agent = await native.freeze({provider_id: 'isolated', model_id: 'planner'}, limits, 'agent');
    const vision = await native.freeze({provider_id: 'isolated', model_id: 'vision'}, limits, 'vision');
    assert.equal(agent.profile.endpoint, endpoint + '/chat/completions');
    assert.equal(agent.profile.model_id, 'planner');
    assert.equal(agent.profile.max_output_tokens, 2048);
    assert.equal(agent.profile.context_tokens, 32768);
    assert.deepEqual(agent.input_modalities, ['text']);
    assert.deepEqual(agent.native_profile.models.map(model => model.id), ['planner']);
    assert.equal(agent.native_profile.models[0].maxTokens, 2048);
    assert.deepEqual(vision.input_modalities, ['text', 'image']);
    assert.equal(vision.profile.credential_ref, 'ISOLATED_KEY');
    assert.equal(vision.profile.context_tokens, 65536);
    const invalid = await native.freeze({provider_id: 'isolated', model_id: 'planner'}, limits, 'vision');
    assert.equal(invalid.error, null);
    assert.equal(invalid.profile.model_id,'planner');
    assert.deepEqual(invalid.input_modalities,['text']);
    const unsupportedTemplate = await native.freeze({provider_id: 'isolated', model_id: 'planner'},
      {...limits, request_parameters: {chat_template_kwargs: {enable_thinking: false}}}, 'agent');
    assert.equal(unsupportedTemplate.profile, null);
    assert.match(unsupportedTemplate.error, /chat-template/);
    const missingOutput = await native.freeze({provider_id:'isolated',model_id:'undeclared-output'},defaultModelLimits,'agent');
    assert.equal(missingOutput.error,null);
    assert.equal(missingOutput.profile.max_output_tokens,null);
    assert.equal(missingOutput.native_profile.models[0].maxTokens,undefined);
    providers.isolated.baseURL = 'http://new.example/v1';
    assert.equal(agent.native_profile.baseURL, endpoint);
    assert.equal(agent.profile.endpoint, endpoint + '/chat/completions');
    assert.equal(requests, 0);
    assert.equal(credentials, 0);
    assert.ok(!JSON.stringify({agent, vision}).includes('api_key'));
  } finally {
    await fork.dispose();
    await new Promise(resolve => server.close(resolve));
  }
});

test('frozen Agent template arguments override model defaults on the actual SDK wire', async () => {
  let wire;
  const server = http.createServer(async (req, res) => {
    let source = '';for await (const chunk of req) source += chunk;
    wire = JSON.parse(source);
    res.writeHead(200, {'Content-Type': 'text/event-stream'});
    res.end('data: ' + JSON.stringify({id: 'native-template', object: 'chat.completion.chunk', model: 'planner',
      choices: [{index: 0, delta: {role: 'assistant', content: '完成'}, finish_reason: 'stop'}]}) + '\n\ndata: [DONE]\n\n');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const providers = {source: {api: 'openai-completions', baseURL: `http://127.0.0.1:${server.address().port}/v1`,
    apiKeyEnv: 'TEMPLATE_TEST_KEY', models: [{id: 'planner', contextWindow: 32768, maxTokens: 4096, input: ['text'],
      reasoningEfforts: {off: null, low: 'low'}, compat: {thinkingFormat: 'chat-template', supportsDeveloperRole: false,
        chatTemplateKwargs: {enable_thinking: true}}}]}};
  const ctx = new Context();new LlmRuntime(ctx);
  ctx.provide('settings', {configure: () => () => {}, describe: () => [{ns: 'llm-pi-ai', revision: 1, value: {providers}}]});
  ctx.provide('credentials', {resolve: async () => ({value: 'isolated-template-key'})});
  const original = await ctx.plugin(piAi, {providers});
  let frozen;
  try {
    const role = await new NativeProviders(() => ctx).freeze({provider_id: 'source', model_id: 'planner'},
      {...defaultModelLimits, max_output_tokens: 128, request_parameters: {chat_template_kwargs: {enable_thinking: false}}}, 'agent');
    assert.equal(role.error, null);
    const wireContext = new Context();new LlmRuntime(wireContext);
    wireContext.provide('credentials', {resolve: async () => ({value: 'isolated-template-key'})});
    frozen = await wireContext.plugin(piAi, {providers: {frozen: role.native_profile}});
    for await (const _chunk of wireContext.llm.stream({provider: 'frozen', model: 'planner', maxTokens: 128,
      messages: [{role: 'system', content: [{type: 'text', text: '遵循请求'}]},
        {role: 'user', content: [{type: 'text', text: '简短回答'}]}]})) {}
    assert.deepEqual(wire.chat_template_kwargs, {enable_thinking: false});
    assert.equal(wire.max_completion_tokens, 128);
    assert.equal(wire.messages[0].role, 'system');
  } finally {await frozen?.dispose();await original.dispose();await new Promise(resolve => server.close(resolve));}
});

test('Responses providers remain selectable and freeze their native image and Agent protocol',async()=>{
  const providers={pinai:{api:'openai-responses',baseURL:'https://provider.invalid/v1',apiKeyEnv:'PINAI_TEST_KEY',
    models:[{id:'gpt-6.1-sol',input:['text','image'],contextWindow:262144,maxTokens:32768,reasoningEfforts:{high:'high'}}]}};
  const ctx=new Context();new LlmRuntime(ctx);
  ctx.provide('settings',{configure:()=>()=>{},describe:()=>[{ns:'llm-pi-ai',revision:1,value:{providers}}]});
  ctx.provide('credentials',{describe:async()=>({configured:true,writable:true})});
  const fork=await ctx.plugin(piAi,{providers});
  try {
    const native=new NativeProviders(()=>ctx);
    const catalog=await native.catalog();
    assert.equal(catalog[0].error,null);
    assert.deepEqual(catalog[0].models[0].reasoning_efforts,['high']);
    const limits={...defaultModelLimits,max_output_tokens:4096};
    for(const kind of ['agent','vision']) {
      const role=await native.freeze({provider_id:'pinai',model_id:'gpt-6.1-sol'},limits,kind,'high');
      assert.equal(role.error,null);
      assert.equal(role.profile.api,'openai-responses');
      assert.equal(role.profile.endpoint,'https://provider.invalid/v1/responses');
      assert.equal(role.profile.capacity_mode,'provider_managed');
      assert.equal(role.native_profile.api,'openai-responses');
      assert.equal(role.native_profile.reasoning,'high');
      assert.equal(role.profile.reasoning_effort,'high');
      assert.deepEqual(role.input_modalities,['text','image']);
    }
    const invalid=await native.freeze({provider_id:'pinai',model_id:'gpt-6.1-sol'},limits,'vision','xhigh');
    assert.equal(invalid.profile,null);assert.match(invalid.error,/推理强度/);
  } finally {await fork.dispose();}
});
