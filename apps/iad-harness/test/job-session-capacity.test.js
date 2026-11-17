import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {LlmAdapter, LlmError, MessageId} from '@deepseek-ai/dsh-llm';
import {JobSessionHost} from '../lib/server/sessions/host.js';

for(const mode of ['oversized-first-input','failed-summary'])test(`shared capacity admission: ${mode}`,{timeout:30000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-capacity-'));
  const host=await JobSessionHost.open(root,async id=>path.join(root,id,'events.jsonl'),true);
  const calls=[], errors=[];
  class Provider extends LlmAdapter {
    async resolveModel(provider,id){return {provider,id,name:id,context:{contextWindow:16384},defaultMaxTokens:512};}
    async *stream(request){
      calls.push(request);
      if(request.purpose==='compaction')throw new LlmError('summary fixture unavailable','SUMMARY_FAILED');
      yield {type:'block-start',index:0,blockType:'text'};
      yield {type:'text-delta',index:0,text:'记录已读事实。'};
      yield {type:'block-end',index:0,block:{type:'text',text:'记录已读事实。'}};
      yield {type:'finish',reason:{kind:'stop'}};
    }
  }
  try{
    await host.create('capacity-job');
    await host.withAgent('capacity-job',{evidenceOnDemand:true,agentOptions:{provider:'fixture',model:'native',maxTokens:512},setup:async scope=>{
      scope.llm.registerAdapter(['fixture'],new Provider());
      scope.on('agent/error',event=>errors.push(String(event.error)));
    }},async agent=>{
      for(let index=0;index<(mode==='oversized-first-input'?1:12);index++){
        agent.followup({id:MessageId(`facts-${index}`),role:'user',source:{kind:'user'},content:[{type:'text',text:'缺陷事实和正常区别。'.repeat(mode==='oversized-first-input'?2000:180)}]});
        await agent.whenIdle();
        if(errors.length)break;
      }
    });
    assert.ok(errors.length>0);
    if(mode==='oversized-first-input')assert.equal(calls.length,0,'首个中文输入超预算必须在发给提供商前拒绝');
    else{
      const compact=calls.findIndex(call=>call.purpose==='compaction');
      assert.ok(compact>=0,'应在上下文耗尽前压缩: '+errors.join('; '));
      assert.equal(calls.length,compact+1,'压缩失败不能继续业务请求');
      assert.equal(calls.filter(call=>call.purpose==='compaction').length,1);
    }
  }finally{await host.dispose();await fs.rm(root,{recursive:true,force:true});}
});

test('cached input usage calibrates the next admission before another provider request',{timeout:30000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-capacity-cache-'));
  const host=await JobSessionHost.open(root,async id=>path.join(root,id,'events.jsonl'),true);
  const calls=[],errors=[];
  class Provider extends LlmAdapter {
    async resolveModel(provider,id){return {provider,id,name:id,context:{contextWindow:16384},defaultMaxTokens:512};}
    async *stream(request){
      calls.push(request);
      yield {type:'block-start',index:0,blockType:'text'};
      yield {type:'text-delta',index:0,text:'已保存事实。'};
      yield {type:'block-end',index:0,block:{type:'text',text:'已保存事实。'}};
      yield {type:'usage',usage:{inputTokens:1,cacheReadTokens:12500,outputTokens:5}};
      yield {type:'finish',reason:{kind:'stop'}};
    }
  }
  try{
    await host.create('cached-job');
    await host.withAgent('cached-job',{evidenceOnDemand:true,agentOptions:{provider:'fixture',model:'native',maxTokens:512},setup:async scope=>{
      scope.llm.registerAdapter(['fixture'],new Provider());
      scope.on('agent/error',event=>errors.push(String(event.error)));
    }},async agent=>{
      for(let index=0;index<2;index++){
        agent.followup({id:MessageId('cached-'+index),role:'user',source:{kind:'user'},content:[{type:'text',text:'继续读取本场事实。'}]});
        await agent.whenIdle();
      }
    });
    assert.equal(calls.length,1,'缓存读取同样占上下文，下一请求应在本地被拒绝');
    assert.ok(errors.some(error=>/容量预算/.test(error)));
  }finally{await host.dispose();await fs.rm(root,{recursive:true,force:true});}
});
