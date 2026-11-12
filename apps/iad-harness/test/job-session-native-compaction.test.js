import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {MessageId} from '@deepseek-ai/dsh-llm';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import {LocalAttachmentStore} from '@deepseek-ai/dsh-attachment-local';
import {JobSessionHost} from '../lib/server/sessions/host.js';
import {NativeModelCalls} from '../lib/server/sessions/model-calls.js';

for(const mode of ['pressure','overflow','images','bounded-overflow'])test(`official DSH ${mode} recovery uses the native HTTP adapter and durable business Session`,{timeout:30000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-native-compaction-'));
  const locate=async id=>path.join(root,id,'session','events.jsonl');
  let host=await JobSessionHost.open(root,locate);
  const requests=[],starts=[],ends=[],errors=[];let rejected=false,businessRequests=0;
  const provider=http.createServer(async(req,res)=>{
    let raw='';for await(const chunk of req)raw+=chunk;
    const body=JSON.parse(raw);requests.push(body);
    const summary=JSON.stringify(body.messages.at(-1)).includes('compaction engine');
    if(!summary)businessRequests++;
    if(((mode==='overflow'&&requests.length===3)||(mode==='bounded-overflow'&&businessRequests===3))&&!summary&&!rejected){
      rejected=true;res.writeHead(400,{'Content-Type':'application/json'});
      res.end(JSON.stringify({error:{code:'context_length_exceeded',message:'maximum context length exceeded'}}));return;
    }
    const content=summary?'Counterexample NG-7; pending sample-13; progress 12/100.':'Continue.';
    res.writeHead(200,{'Content-Type':'text/event-stream'});
    res.write('data: '+JSON.stringify({choices:[{index:0,delta:{role:'assistant',content},finish_reason:null}]})+'\n\n');
    res.write('data: '+JSON.stringify({choices:[{index:0,delta:{},finish_reason:'stop'}],usage:{prompt_tokens:Math.ceil(JSON.stringify(body.messages).length/4),completion_tokens:1}})+'\n\n');res.end('data: [DONE]\n\n');
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  let attachment;
  const setup=async scope=>{
    scope.provide('credentials',{resolve:async()=>({value:'fixture-key'})});
    new LocalAttachmentStore(scope,{dshHome:root});
    attachment=await scope.attachments.saveImage({data:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGNsaGhgYGBgYmBgYGBgAAASKgGEzwCOrgAAAABJRU5ErkJggg==','base64'),mediaType:'image/png',name:'whole.png'});
    await scope.plugin(piAi,{providers:{fixture:{api:'openai-completions',baseURL:`http://127.0.0.1:${provider.address().port}/v1`,apiKeyEnv:'FIXTURE_KEY',maxRequestImageBytes:mode==='images'?200:10485760,
      models:[{id:'native',input:['text','image'],contextWindow:['pressure','bounded-overflow'].includes(mode)?8192:65536,maxTokens:128}]}}});
    new NativeModelCalls().attach(scope,{start:async request=>{starts.push(request);},end:async result=>{ends.push(result);}});
    scope.on('agent/error',event=>errors.push(String(event.error)));
  };
  const options={agentOptions:{provider:'fixture',model:'native',maxTokens:128},setup,evidenceOnDemand:mode==='bounded-overflow'};
  try{
    await host.create('native-job');
    await host.withAgent('native-job',options,async agent=>{
      for(let index=0;index<3;index++){
        agent.followup({id:MessageId('part-'+index),role:'user',source:{kind:'user'},content:[{type:'text',text:index<2?'Counterexample NG-7, pending sample-13. '+'observed appearance '.repeat(1200):'Continue sample-13.'},...(mode==='images'?[{type:'image',attachment}]:[])]});
        await agent.whenIdle();
      }
    });
    if(mode==='bounded-overflow'){
      assert.ok(errors.some(error=>error.includes('context')));assert.ok(rejected);
      assert.equal(starts.filter(call=>call.request.purpose==='compaction').length,1,'已有摘要无法修复当前请求时不再次压缩旧摘要');
      assert.equal(businessRequests,3,'容量错误须保留为实际失败，不进行无效重试');
    }else assert.deepEqual(errors,[]);
    assert.equal(starts.length,ends.length);
    const events=(await host.read('native-job')).events;
    if(mode==='images'){
      assert.ok(events.some(event=>event.type==='image/offload'));
      assert.ok(requests.every(body=>body.messages.flatMap(message=>Array.isArray(message.content)?message.content:[]).filter(block=>block.type==='image_url').length<=1));
      assert.ok(JSON.stringify(requests.at(-1)).includes('image omitted to fit request image limits'));
    }else{
      assert.ok(events.some(event=>event.type==='compaction/summary'));
      assert.ok(starts.some(call=>call.request.purpose==='compaction'),'官方摘要进入业务模型调用记录');
      assert.ok(JSON.stringify(requests.at(-1)).includes('<compacted-summary>'));
      if(mode==='overflow'){assert.ok(rejected);assert.ok(ends.some(call=>call.error));}
    }
    const count=requests.length;
    await host.dispose();host=await JobSessionHost.open(root,locate);
    await host.withAgent('native-job',options,agent=>{
      const messages=agent.session.deriveMessages();
      if(mode==='images')assert.ok(messages.some(message=>message.content.some(block=>block.type==='image'&&block.offloaded)));
      else assert.ok(JSON.stringify(messages).includes('<compacted-summary>'));
    });
    assert.equal(requests.length,count,'恢复投影不发起额外推理');
    assert.equal(await host.exportJsonl('native-job'),await fs.readFile(await locate('native-job'),'utf8'));
  }finally{await host.dispose();provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));await fs.rm(root,{recursive:true,force:true});}
});
