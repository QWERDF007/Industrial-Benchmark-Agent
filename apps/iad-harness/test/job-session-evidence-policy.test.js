import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {MessageId} from '@deepseek-ai/dsh-llm';
import * as piAi from '@deepseek-ai/dsh-llm-pi-ai';
import {LocalAttachmentStore} from '@deepseek-ai/dsh-attachment-local';
import {defineTool} from '@deepseek-ai/dsh-tools';
import {JobSessionHost} from '../lib/server/sessions/host.js';
import {NativeModelCalls} from '../lib/server/sessions/model-calls.js';
import {nativeMediaOutput} from '../lib/server/sessions/media.js';
import {respondFixtureTools} from './fixtures/analysis-finalization.js';

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGNsaGhgYGBgYmBgYGBgAAASKgGEzwCOrgAAAABJRU5ErkJggg==','base64');

for(const evidenceOnDemand of [true,false])test(`unseen images exceeding the adapter budget follow the frozen policy: ${evidenceOnDemand}`,async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-evidence-budget-'));
  const requests=[],errors=[];let attachment;
  const provider=http.createServer(async(req,res)=>{
    let raw='';for await(const chunk of req)raw+=chunk;requests.push(JSON.parse(raw));
    res.writeHead(200,{'Content-Type':'text/event-stream'});
    res.end('data: '+JSON.stringify({choices:[{index:0,delta:{content:'Observed.'},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n');
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  const host=await JobSessionHost.open(root,async id=>path.join(root,id,'events.jsonl'));
  t.after(async()=>{await host.dispose();provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));await fs.rm(root,{recursive:true,force:true});});
  await host.create('budget');
  await host.withAgent('budget',{evidenceOnDemand,agentOptions:{provider:'fixture',model:'native',maxTokens:128},setup:async scope=>{
    scope.provide('credentials',{resolve:async()=>({value:'fixture-key'})});
    new LocalAttachmentStore(scope,{dshHome:root});
    attachment=await scope.attachments.saveImage({data:png,mediaType:'image/png',name:'whole.png'});
    await scope.plugin(piAi,{providers:{fixture:{api:'openai-completions',baseURL:`http://127.0.0.1:${provider.address().port}/v1`,apiKeyEnv:'FIXTURE_KEY',
      maxRequestImageBytes:80,models:[{id:'native',input:['text','image'],contextWindow:65536,maxTokens:128}]}}});
    scope.on('agent/error',event=>errors.push(event.error));
    scope.systemPrompt.section({name:'fixture',order:100,text:'Observe every supplied original.'});
  }},async agent=>{
    agent.followup({id:MessageId('first'),role:'user',source:{kind:'user'},content:[{type:'image',attachment}]});await agent.whenIdle();
  });
  const events=(await host.read('budget')).events;
  if(evidenceOnDemand){
    assert.equal(requests.length,0,'a required unseen image must not be silently omitted to make a provider request');
    assert.equal(events.filter(event=>event.type==='image/offload').length,0);
    assert.equal(errors.length,1);assert.match(String(errors[0]),/image|图片/i);
  }else{
    assert.equal(requests.length,1,'historical policy keeps native image-budget recovery');
    assert.equal(events.filter(event=>event.type==='image/offload').length,1);
  }
});

test('tool images are sent once after the originating response is saved, and explicit rereads are new occurrences',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-evidence-tools-'));
  const requests=[];let saved=false,attachment;
  const provider=http.createServer(async(req,res)=>{
    let raw='';for await(const chunk of req)raw+=chunk;requests.push(JSON.parse(raw));
    if(requests.length===1)respondFixtureTools(res,[{name:'open_original',arguments:{}}],{protocol:'openai-completions',model:'native'});
    else{
      res.writeHead(200,{'Content-Type':'text/event-stream'});
      res.end('data: '+JSON.stringify({choices:[{index:0,delta:{content:'Compared the originals.'},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n');
    }
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  let host=await JobSessionHost.open(root,async id=>path.join(root,id,'events.jsonl'));
  t.after(async()=>{await host.dispose();provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));await fs.rm(root,{recursive:true,force:true});});
  const options={evidenceOnDemand:true,agentOptions:{provider:'fixture',model:'native',maxTokens:128},setup:async scope=>{
    scope.provide('credentials',{resolve:async()=>({value:'fixture-key'})});new LocalAttachmentStore(scope,{dshHome:root});
    attachment=await scope.attachments.saveImage({data:png,mediaType:'image/png',name:'whole.png'});
    await scope.plugin(piAi,{providers:{fixture:{api:'openai-completions',baseURL:`http://127.0.0.1:${provider.address().port}/v1`,apiKeyEnv:'FIXTURE_KEY',models:[{id:'native',input:['text','image'],contextWindow:65536,maxTokens:128}]}}});
    new NativeModelCalls().attach(scope,{start:async()=>{saved=false;},end:async result=>{await fs.writeFile(path.join(root,'response.json'),JSON.stringify(result));saved=true;}});
    scope.on('session/event',(_session,event)=>{if(event.type==='image/offload')assert.ok(saved,'response persistence precedes image release');});
    scope.tools.register(defineTool({name:'open_original',description:'Explicitly open the original again.',parameters:{},output:nativeMediaOutput,
      execute:()=>({sample_id:'sample',evidence_id:'original',total:1,offset:0,error:null,
        images:[{sample_id:'sample',dataset_id:'dataset',attachment,image:{role:'overview',representation:'raw'},model_context:{}}]})}));
  }};
  await host.create('tools');
  await host.withAgent('tools',options,async agent=>{
    agent.followup({id:MessageId('first'),role:'user',source:{kind:'user'},content:[{type:'image',attachment}]});await agent.whenIdle();
    agent.followup({id:MessageId('continue'),role:'user',source:{kind:'user'},content:[{type:'text',text:'Continue the synthesis.'}]});await agent.whenIdle();
  });
  await host.dispose();host=await JobSessionHost.open(root,async id=>path.join(root,id,'events.jsonl'));
  await host.withAgent('tools',options,async agent=>{
    agent.followup({id:MessageId('reopen'),role:'user',source:{kind:'user'},content:[{type:'image',attachment}]});await agent.whenIdle();
  });
  const counts=requests.map(body=>body.messages.flatMap(message=>Array.isArray(message.content)?message.content:[]).filter(block=>block.type==='image_url').length);
  assert.deepEqual(counts,[1,1,0,1]);
  assert.match(JSON.stringify(requests[0].messages),/历史图片占位不表示读取失败/);
  const metadata=requests[2].messages.filter(message=>message.role==='tool').flatMap(message=>
    typeof message.content==='string'?[message.content]:message.content.filter(block=>block.type==='text').map(block=>block.text))
    .find(text=>text.startsWith('{"sample_id"'));
  assert.equal(JSON.parse(metadata.split('\n')[0]).evidence_id,'original','卸载占位与媒体JSON保持分行，历史元数据仍可读取');
  const events=(await host.read('tools')).events;
  assert.equal(events.filter(event=>event.type==='image/offload').length,3);
});

test('one native overflow summary preserves unobserved tool material and reports its real capacity failure',{timeout:15000},async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-evidence-pressure-'));
  const requests=[],starts=[],errors=[];
  const provider=http.createServer(async(req,res)=>{
    let raw='';for await(const chunk of req)raw+=chunk;
    const body=JSON.parse(raw);requests.push(body);
    if(JSON.stringify(body.messages.at(-1)).includes('compaction engine')){
      res.writeHead(200,{'Content-Type':'text/event-stream'});
      res.end('data: '+JSON.stringify({choices:[{index:0,delta:{content:'Opened the required next original; it has not been observed yet.'},finish_reason:'stop'}],usage:{prompt_tokens:200,completion_tokens:16}})+'\n\ndata: [DONE]\n\n');
    }else if(requests.length===1)respondFixtureTools(res,[{name:'required_material',arguments:{}}],{protocol:'openai-completions',model:'native'});
    else{
      res.writeHead(400,{'Content-Type':'application/json'});
      res.end(JSON.stringify({error:{code:'context_length_exceeded',message:'maximum context length exceeded by required current material'}}));
    }
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  const host=await JobSessionHost.open(root,async id=>path.join(root,id,'events.jsonl'));
  t.after(async()=>{await host.dispose();provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));await fs.rm(root,{recursive:true,force:true});});
  let attachment;
  await host.create('pressure');
  await host.withAgent('pressure',{evidenceOnDemand:true,agentOptions:{provider:'fixture',model:'native',maxTokens:128},setup:async scope=>{
    scope.provide('credentials',{resolve:async()=>({value:'fixture-key'})});new LocalAttachmentStore(scope,{dshHome:root});
    attachment=await scope.attachments.saveImage({data:png,mediaType:'image/png',name:'whole.png'});
    await scope.plugin(piAi,{providers:{fixture:{api:'openai-completions',baseURL:`http://127.0.0.1:${provider.address().port}/v1`,apiKeyEnv:'FIXTURE_KEY',models:[{id:'native',input:['text','image'],contextWindow:8192,maxTokens:128}]}}});
    new NativeModelCalls().attach(scope,{start:async request=>{starts.push(request);},end:async()=>{}});
    scope.on('agent/error',event=>errors.push(String(event.error)));
    scope.tools.register(defineTool({name:'required_material',description:'Read the complete next original and its required metadata.',parameters:{},
      output:{schema:{type:'json'},render:()=>[{type:'text',text:'Required original metadata. '.repeat(5000)},{type:'image',attachment}]},execute:()=>({})}));
  }},async agent=>{
    agent.followup({id:MessageId('first'),role:'user',source:{kind:'user'},content:[{type:'image',attachment}]});await agent.whenIdle();
  });
  assert.equal(starts.filter(call=>call.request.purpose==='compaction').length,1);
  assert.equal(requests.length,3);
  assert.equal(errors.length,1);assert.match(errors[0],/above threshold|maximum context length exceeded/);
  const events=(await host.read('pressure')).events;
  const initial=events.find(event=>event.type==='user/message'&&event.data.id==='first');
  const offloads=events.filter(event=>event.type==='image/offload');
  assert.equal(offloads.length,1);
  assert.ok(offloads[0].data.targets.every(target=>target.seq===initial.seq));
  assert.ok((await host.exportJsonl('pressure')).includes('Required original metadata. '.repeat(5000)));
});
