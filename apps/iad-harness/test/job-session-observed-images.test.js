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
import {defineTool} from '@deepseek-ai/dsh-tools';
import {respondFixtureTools} from './fixtures/analysis-finalization.js';

for(const outcome of ['stop','error','length','abort','timeout','recover','tool'])test(`observed images are released only after durable successful business requests: ${outcome}`,async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-observed-images-'));
  const locate=async id=>path.join(root,id,'session','events.jsonl');
  let host=await JobSessionHost.open(root,locate);
  const requests=[];let attachment;
  const provider=http.createServer(async(req,res)=>{
    let raw='';for await(const chunk of req)raw+=chunk;
    requests.push(JSON.parse(raw));
    if(outcome==='tool'&&requests.length===1){respondFixtureTools(res,[{name:'image_again',arguments:{}}]);return;}
    if(outcome==='error'&&requests.length===1){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:'fixture unavailable'}}));return;}
    res.writeHead(200,{'Content-Type':'text/event-stream'});
    res.write('data: '+JSON.stringify({choices:[{index:0,delta:{role:'assistant',content:'Observed the edge.'},finish_reason:null}]})+'\n\n');
    if(['abort','timeout'].includes(outcome)&&requests.length===1)return;
    res.write('data: '+JSON.stringify({choices:[{index:0,delta:{},finish_reason:requests.length===1&&outcome==='length'?'length':'stop'}],usage:{prompt_tokens:100,completion_tokens:5}})+'\n\n');res.end('data: [DONE]\n\n');
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  const setup=async scope=>{
    scope.provide('credentials',{resolve:async()=>({value:'fixture-key'})});
    new LocalAttachmentStore(scope,{dshHome:root});
    attachment=await scope.attachments.saveImage({data:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGNsaGhgYGBgYmBgYGBgAAASKgGEzwCOrgAAAABJRU5ErkJggg==','base64'),mediaType:'image/png',name:'whole.png'});
    await scope.plugin(piAi,{providers:{fixture:{api:'openai-completions',baseURL:`http://127.0.0.1:${provider.address().port}/v1`,apiKeyEnv:'FIXTURE_KEY',streamIdleTimeoutMs:300,models:[{id:'native',input:['text','image'],contextWindow:65536,maxTokens:128}]}}});
    scope.on('agent/error',()=>{});
    scope.tools.register(defineTool({name:'image_again',description:'Explicitly open an image.',parameters:{},
      output:{schema:{type:'json'},render:()=>[{type:'text',text:'Opened image.'},{type:'image',attachment}]},execute:async()=>({opened:true})}));
  };
  const options={agentOptions:{provider:'fixture',model:'native',maxTokens:128},setup,evidenceOnDemand:true};
  const send=async (withImage,id)=>host.withAgent('observed-job',{...options,evidenceOnDemand:outcome!=='recover'||id!=='first'},async agent=>{
    agent.followup({id:MessageId(id),role:'user',source:{kind:'user'},content:[{type:'text',text:'Describe the visible edge.'},...(withImage?[{type:'image',attachment}]:[])]});
    const timer=outcome==='abort'&&id==='first'?setTimeout(()=>agent.cancel({kind:'user'}),100):null;
    try{await agent.whenIdle();}finally{if(timer)clearTimeout(timer);}
  });
  try{
    await host.create('observed-job');await send(true,'first');
    let events=(await host.read('observed-job')).events;
    assert.equal(events.filter(event=>event.type==='image/offload').length,outcome==='tool'?2:outcome==='stop'?1:0);
    await host.dispose();host=await JobSessionHost.open(root,locate);
    await send(false,'continue');await send(true,'explicit-reopen');await send(false,'after-reopen');
    const imageCounts=requests.map(body=>body.messages.flatMap(message=>Array.isArray(message.content)?message.content:[]).filter(block=>block.type==='image_url').length);
    assert.deepEqual(imageCounts,outcome==='tool'?[1,1,0,1,0]:['stop','recover'].includes(outcome)?[1,0,1,0]:[1,1,1,0]);
    events=(await host.read('observed-job')).events;
    assert.equal(events.filter(event=>event.type==='image/offload').length,outcome==='tool'?3:2);
    assert.equal(await host.exportJsonl('observed-job'),await fs.readFile(await locate('observed-job'),'utf8'));
    assert.equal(events.filter(event=>event.type==='user/message').flatMap(event=>event.data.content).filter(block=>block.type==='image'&&!block.offloaded).length,2,'original attachment records remain intact');
  }finally{await host.dispose();provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));await fs.rm(root,{recursive:true,force:true});}
});

for(const outcome of ['success','rejected','recover','commit-recover'])test(`comparison images survive tool steps until facts are committed: ${outcome}`,async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-image-handoff-'));
  const locate=async id=>path.join(root,id,'session','events.jsonl');
  let host=await JobSessionHost.open(root,locate),attachment,attempts=0;
  const requests=[];
  const provider=http.createServer(async(req,res)=>{
    let raw='';for await(const chunk of req)raw+=chunk;requests.push(JSON.parse(raw));
    if(requests.length===1)respondFixtureTools(res,[{name:'image_again',arguments:{}},...(outcome==='commit-recover'?[{name:'save_observation',arguments:{fact:'The top edge is continuous; the left edge has a bright irregular trace.'}}]:[])]);
    else if(outcome==='recover'&&requests.length===2){
      res.writeHead(200,{'Content-Type':'text/event-stream'});res.end('data: '+JSON.stringify({choices:[{index:0,delta:{content:'Continue the comparison.'},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n');
    }else if(attempts===0||(outcome==='rejected'&&attempts===1)||(outcome==='commit-recover'&&requests.length===2))respondFixtureTools(res,[{name:'save_observation',arguments:{fact:'The top edge is continuous; the left edge has a bright irregular trace.'}}]);
    else{res.writeHead(200,{'Content-Type':'text/event-stream'});res.end('data: '+JSON.stringify({choices:[{index:0,delta:{content:'Use the saved edge comparison.'},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n');}
  });
  await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
  const setup=async scope=>{
    scope.provide('credentials',{resolve:async()=>({value:'fixture-key'})});new LocalAttachmentStore(scope,{dshHome:root});
    attachment=await scope.attachments.saveImage({data:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGNsaGhgYGBgYmBgYGBgAAASKgGEzwCOrgAAAABJRU5ErkJggg==','base64'),mediaType:'image/png',name:'whole.png'});
    await scope.plugin(piAi,{providers:{fixture:{api:'openai-completions',baseURL:`http://127.0.0.1:${provider.address().port}/v1`,apiKeyEnv:'FIXTURE_KEY',models:[{id:'native',input:['text','image'],contextWindow:65536,maxTokens:128}]}}});
    scope.tools.register(defineTool({name:'image_again',description:'Read a comparison image.',parameters:{},output:{schema:{type:'json'},render:()=>[{type:'text',text:'Comparison image.'},{type:'image',attachment}]},execute:async()=>({opened:true})}));
    scope.tools.register(defineTool({name:'save_observation',description:'Commit visible facts.',parameters:{fact:{type:'string'}},output:{schema:{type:'json'},render:()=>[{type:'text',text:'Facts committed.'}]},execute:async(_args,execution)=>{attempts++;if(outcome==='rejected'&&attempts===1)throw new Error('Observation rejected.');execution.concludeTurn();return {saved:true};}}));
  };
  const send=async image=>host.withAgent('handoff-job',{evidenceOnDemand:outcome!=='commit-recover'||requests.length>0,imageHandoffTools:['save_observation'],agentOptions:{provider:'fixture',model:'native'},setup},async agent=>{
    agent.followup({id:MessageId('handoff-'+requests.length),role:'user',source:{kind:'user'},content:[{type:'text',text:'Compare the two edges and commit visible facts.'},...(image?[{type:'image',attachment}]:[])]});await agent.whenIdle();
  });
  try{
    await host.create('handoff-job');await send(true);
    if(['recover','commit-recover'].includes(outcome)){await host.dispose();host=await JobSessionHost.open(root,locate);await send(false);}
    await send(false);
    const counts=requests.map(body=>body.messages.flatMap(m=>Array.isArray(m.content)?m.content:[]).filter(b=>b.type==='image_url').length);
    assert.deepEqual(counts,outcome==='commit-recover'?[1,1,0]:outcome==='success'?[1,2,0]:[1,2,2,0],'a successful media read is not a durable observation handoff');
    assert.ok(JSON.stringify(requests.at(-1)).includes('The top edge is continuous'));
    const events=(await host.read('handoff-job')).events;
    assert.equal(events.filter(e=>e.type==='image/offload').length,outcome==='commit-recover'?2:1);
    assert.equal(events.filter(e=>e.type==='image/offload')[0].data.targets.length,outcome==='commit-recover'?1:2);
  }finally{await host.dispose();provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve));await fs.rm(root,{recursive:true,force:true});}
});
