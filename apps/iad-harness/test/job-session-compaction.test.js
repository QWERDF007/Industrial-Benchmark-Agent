import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {LlmAdapter,MessageId} from '@deepseek-ai/dsh-llm';
import {JobSessionHost} from '../lib/server/sessions/host.js';

test('business Sessions automatically compact with the official DSH summarizer and replay the same durable result',{timeout:30000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-official-compaction-'));
  const locate=async id=>path.join(root,'exploration-sessions',id,'session','events.jsonl');
  let host=await JobSessionHost.open(root,locate);
  const calls=[];const errors=[];
  class Provider extends LlmAdapter{
    async resolveModel(provider,id){return {provider,id,name:id,context:{contextWindow:262144},defaultMaxTokens:1024};}
    async *stream(request){
      calls.push(request);
      if(request.purpose==='compaction'){const input=JSON.stringify(request.messages);assert.match(input,/NG-7/);assert.match(input,/sample-13/);}
      const text=request.purpose==='compaction'?'Progress: 12/100. Counterexample: NG-7. Pending: sample-13. Evidence: image-7.':'继续当前作业。';
      yield {type:'block-start',index:0,blockType:'text'};
      yield {type:'text-delta',index:0,text};
      yield {type:'block-end',index:0,block:{type:'text',text}};
      yield {type:'finish',reason:{kind:'stop'}};
    }
  }
  const setup=async scope=>{scope.on('agent/error',event=>errors.push(String(event.error)));
    scope.llm.registerAdapter(['fixture'],new Provider());
    scope.systemPrompt.section({name:'analysis',order:100,text:'Keep progress, counterexamples and pending work.'});
  };
  try{
    await host.create('official-job');
    await host.withAgent('official-job',{agentOptions:{provider:'fixture',model:'native',maxTokens:1024},setup},async agent=>{
      agent.followup({id:MessageId('long-history'),role:'user',source:{kind:'user'},content:[{type:'text',text:'Progress=12/100; Counterexample=NG-7; Pending=sample-13; Evidence=image-7.\n'+'observed appearance '.repeat(26000)}]});
      await agent.whenIdle();
      agent.followup({id:MessageId('recent-history'),role:'user',source:{kind:'user'},content:[{type:'text',text:'Recent observations. '+'observed recent appearance '.repeat(21000)}]});
      await agent.whenIdle();
      agent.followup({id:MessageId('continue'),role:'user',source:{kind:'user'},content:[{type:'text',text:'Continue with sample-13.'}]});
      await agent.whenIdle();
      agent.followup({id:MessageId('new-history'),role:'user',source:{kind:'user'},content:[{type:'text',text:'New observations. '+'newly observed appearance '.repeat(22000)}]});
      await agent.whenIdle();
      agent.followup({id:MessageId('continue-again'),role:'user',source:{kind:'user'},content:[{type:'text',text:'Continue with sample-13.'}]});
      await agent.whenIdle();
    });
    assert.deepEqual(errors,[]);
    const summaries=calls.filter(call=>call.purpose==='compaction');
    assert.equal(summaries.length,2,'自动压力触发官方摘要模型请求');
    assert.equal(summaries[0].provider,'fixture');assert.equal(summaries[0].model,'native');
    assert.ok(summaries[0].messages.at(-1).content.some(block=>block.type==='text'&&block.text.includes('compaction engine')));
    const last=calls.at(-1).messages.flatMap(message=>message.content).filter(block=>block.type==='text').map(block=>block.text).join('\n');
    assert.match(last,/<compacted-summary>/);assert.match(last,/Counterexample: NG-7/);assert.match(last,/Continue with sample-13/);
    assert.ok(last.length<('newly observed appearance '.length*22000+2000));assert.ok(!last.includes('observed appearance '.repeat(100)));
    const saved=await host.read('official-job');
    for(const type of ['compaction/start','compaction/summary','compaction/end'])assert.equal(saved.events.filter(event=>event.type===type).length,2,type);
    assert.ok(!saved.events.some(event=>event.type==='user/message'&&event.data.source.kind==='analysis-checkpoint'));
    const log=await host.exportJsonl('official-job');assert.equal(log,await fs.readFile(await locate('official-job'),'utf8'));
    assert.ok(log.includes('observed appearance '.repeat(100)),'原始历史保留在业务JSONL');
    await host.dispose();host=await JobSessionHost.open(root,locate);
    await host.withAgent('official-job',{agentOptions:{provider:'fixture',model:'native',maxTokens:1024},setup},async agent=>{
      const replay=agent.session.deriveMessages().flatMap(message=>message.content).filter(block=>block.type==='text').map(block=>block.text).join('\n');
      assert.match(replay,/<compacted-summary>/);assert.match(replay,/Counterexample: NG-7/);assert.ok(replay.length<('newly observed appearance '.length*22000+2000));
    });
    assert.equal(calls.filter(call=>call.purpose==='compaction').length,2,'恢复读取不重复摘要');
  }finally{await host.dispose();await fs.rm(root,{recursive:true,force:true});}
});
