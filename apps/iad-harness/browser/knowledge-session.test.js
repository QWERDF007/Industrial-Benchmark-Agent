import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';

const workspace=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
test('native knowledge workbench submits a continuous scope into the actual DSH Session',{timeout:120000},async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-native-knowledge-')),app=path.join(workspace,'apps/iad-harness'),profile=path.join(root,'home/profiles/web');
 await fs.mkdir(path.join(profile,'node_modules/@industrial-benchmark'),{recursive:true});await fs.symlink(app,path.join(profile,'node_modules/@industrial-benchmark/iad-harness'));
 await fs.writeFile(path.join(profile,'package.json'),JSON.stringify({name:'iad-native-knowledge',private:true,type:'module',dsh:{profile:{bundles:['@deepseek-ai/dsh-base','@deepseek-ai/dsh-web-app']}}}));
 await fs.writeFile(path.join(profile,'cordis.yml'),'[]\n');await fs.writeFile(path.join(profile,'cordis.patch.yml'),'- id: ui-settings-general\n  config:\n    welcomeNoticeVersion: 2026-09-28.1\n');
 execFileSync(resolvePythonPath(),[path.join(app,'test/fixtures/knowledge_scope_dataset.py'),root]);
 let completed=false,call=0;const requests=[];
 const model=http.createServer(async(req,res)=>{
  let text='';for await(const chunk of req)text+=chunk;const body=JSON.parse(text);
  if(body.stream){
   let tool,answer='知识任务';
   const scopeMessage=body.messages.findIndex(message=>message.role==='user'&&JSON.stringify(message.content).includes('范围引用：'));
   if(body.tools?.some(tool=>tool.function.name==='knowledge_scope_get')&&scopeMessage>=0){
    requests.push(body);const lastUser=scopeMessage,user=body.messages[lastUser];
    const question=typeof user.content==='string'?user.content:user.content.filter(item=>item.type==='text').map(item=>item.text).join('\n');
    const id=question.split('范围引用：')[1].split('\n')[0],outputs=body.messages.slice(lastUser+1).filter(item=>item.role==='tool'),last=outputs.at(-1);
    const value=last?.content.startsWith('{')?JSON.parse(last.content):null;
    const name=body.messages.flatMap(item=>item.tool_calls||[]).find(item=>item.id===last?.tool_call_id)?.function.name;
    if(!last)tool={name:'knowledge_scope_resume',arguments:{scope_run_id:id}};
    else if(name==='knowledge_scope_resume'||name==='knowledge_scope_get'){
     if(value.remaining)tool={name:'knowledge_sources',arguments:{dataset_id:value.dataset_id,kind:'normal',scope_run_id:id,page_size:20}};
     else{completed=true;answer=`已观察${value.observed}张。[返回知识工作台](${question.split('返回知识工作台：')[1].split('\n')[0]})`;}
    }else if(name==='knowledge_sources'){
     const scope=outputs.map(item=>item.content.startsWith('{')?JSON.parse(item.content):{}).findLast(item=>'current_version_id' in item);
     tool={name:'knowledge_mine_normal',arguments:{image_count:value.items.length,images:value.items.map(item=>item.sample_id),knowledge_preset:scope.current_version_id?[scope.current_version_id]:[]}};
    }else if(name==='knowledge_mine_normal'||(name==='knowledge_job_status'&&['PENDING','RUNNING'].includes(value.status)))tool={name:'knowledge_job_status',arguments:{run_id:value.run_id,wait_seconds:30}};
    else if(name==='knowledge_job_status'&&value.status==='COMPLETED')tool={name:'knowledge_scope_get',arguments:{scope_run_id:id}};
    else answer='作业未完成，保留实际状态。';
   }
   const delta=tool?{role:'assistant',tool_calls:[{index:0,id:`native-knowledge-${++call}`,type:'function',function:{name:tool.name,arguments:JSON.stringify(tool.arguments)}}]}:{role:'assistant',content:answer};
   res.writeHead(200,{'Content-Type':'text/event-stream'});for(const choice of [{index:0,delta,finish_reason:null},{index:0,delta:{},finish_reason:tool?'tool_calls':'stop'}])res.write(`data: ${JSON.stringify({id:'knowledge-native',object:'chat.completion.chunk',model:'native-test-model',choices:[choice]})}\n\n`);res.end('data: [DONE]\n\n');return;
  }
  res.setHeader('Content-Type','application/json');if(req.url==='/tokenize'){res.end(JSON.stringify({count:1000,max_model_len:32768}));return;}
  const content=body.messages[0].content,prompt=content[0].text,images=content.filter(item=>item.type==='text'&&item.text.startsWith('视觉证据：')).map(item=>JSON.parse(item.text.slice(5)));let result;
  if(body.response_format.json_schema.name==='KnowledgeObservations'){
   const scope=JSON.parse(prompt.split('冻结观察请求：')[1].split('\n请根据图像')[0]);result={observations:scope.sources.flatMap(source=>scope.checks.map(check=>({sample_id:source.sample_id,check_id:check.check_id,status:'supports',description:'实际结构观察',position_analysis:'主体',illumination_analysis:'均匀',normal_explanation:'允许变化',evidence_ids:source.raw_evidence_ids,suspects:[]})))};
  }else{const previous=JSON.parse(prompt.split('冻结父版本候选：')[1].split('\n')[0]);result={summary:'可见结构',checks:[{title:'结构',subject:'主体',location:'全图',criterion:'主体结构连续',allowed_variations:[],support_evidence_ids:images.map(item=>item.evidence_id),counter_evidence_ids:[],limitations:[],status:'supported'}],suspects:[],limitations:[],revisions:previous.checks.map(check=>({previous_check_id:check.check_id,current_check_titles:['结构'],reason:'追加同一判据支持'}))};}
  res.end(JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}]}));
 });
 await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));const endpoint=`http://127.0.0.1:${model.address().port}/v1`,reservation=http.createServer();await new Promise(resolve=>reservation.listen(0,'127.0.0.1',resolve));const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));
 const patch=path.join(root,'host.patch.yml');await fs.writeFile(patch,`- id: webserver\n  config:\n    host: 127.0.0.1\n    port: ${port}\n- id: llm-pi-ai\n  config:\n    providers:\n      knowledge:\n        api: openai-completions\n        baseURL: ${JSON.stringify(endpoint)}\n        apiKeyEnv: IAD_KNOWLEDGE_TEST_KEY\n        models:\n          - id: native-test-model\n            input: [text, image]\n            contextWindow: 32768\n- id: agent-default-model\n  config:\n    provider: knowledge\n    model: native-test-model\n- insert:\n    - id: industrial-harness-plugin\n      name: '@industrial-benchmark/iad-harness'\n      config:\n        cwd: ${JSON.stringify(workspace)}\n        dbPath: ${JSON.stringify(path.join(root,'test.db'))}\n`);
 const host=spawn(process.env.IAD_NODE_PATH||process.execPath,[path.join(workspace,'node_modules/@deepseek-ai/dsh/lib/bin.js'),'--profile','web','--patch',patch,'--port',String(port),'--no-open'],{cwd:workspace,env:{...process.env,DSH_HOME:path.join(root,'home'),LIVE_VLM_ENDPOINT:endpoint,LIVE_VLM_MODEL:'native-test-model',LIVE_VLM_CAPACITY_MODE:'vllm_tokenize',IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES:'2',IAD_KNOWLEDGE_TEST_KEY:'synthetic-test-credential'},stdio:['ignore','pipe','pipe']});
 let log='',driver;host.stdout.on('data',data=>{log+=data;});host.stderr.on('data',data=>{log+=data;});
 try{
  const deadline=Date.now()+30000;while(!log.match(/http:\/\/127\.0\.0\.1:[^\s)]+/)&&host.exitCode===null&&Date.now()<deadline)await delay(100);
  const url=log.match(/http:\/\/127\.0\.0\.1:[^\s)]+/)?.[0];assert.ok(url,log.replace(/(token=)[^\s&]+/g,'$1<redacted>'));
  const options=new firefox.Options().addArguments('-headless');if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();await driver.manage().window().setRect({width:1440,height:1100});await driver.get(url);
  const element=css=>driver.wait(until.elementLocated(By.css(css)),15000),button=async text=>(await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${text}']`)),15000)).click();
  await element("button[aria-label^='数据集管理']");for(const text of ['Configure later','Continue']){const controls=await driver.findElements(By.xpath(`//button[.='${text}']`));if(controls.length)await controls[0].click();}
  const api=async(url,body)=>{const result=await driver.executeAsyncScript("const done=arguments[arguments.length-1];fetch('/api/iad'+arguments[0],arguments[1]?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(arguments[1])}:undefined).then(async r=>done({status:r.status,value:await r.json()})).catch(e=>done({error:String(e)}))",url,body||null);assert.equal(result.status,200,JSON.stringify(result));return result.value;};
  const dataset=await api('/datasets/import',{format:'labelme',name:'原生连续知识',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
  await(await element("button[aria-label^='知识挖掘']")).click();await element('select[aria-label="当前数据集"]');await button('刷新');
  await driver.wait(async()=>!!(await driver.findElements(By.css(`select[aria-label="当前数据集"] option[value="${dataset.dataset_id}"]`))).length,10000);await(await element(`select[aria-label="当前数据集"] option[value="${dataset.dataset_id}"]`)).click();
  await(await element('input[aria-label="挖掘图像数量"]')).clear();await(await element('input[aria-label="挖掘图像数量"]')).sendKeys('20');
  await driver.executeScript('arguments[0].value="continuous";arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',await element('select[aria-label="知识执行方式"]'));
  await button('在Agent中连续挖掘');await driver.wait(()=>completed,60000,'Native Session must execute all three actual groups');
  await driver.wait(async()=>!(await driver.findElements(By.css('.iad-workbench'))).length,10000,'Host opens the actual conversation');
  const last=requests.at(-1),outputs=last.messages.filter(item=>item.role==='tool').map(item=>item.content.startsWith('{')?JSON.parse(item.content):{}),scope=outputs.findLast(item=>item.scope_run_id&&item.remaining===0);assert.ok(scope);assert.equal(scope.observed,43);
  const jobs=(await api(`/knowledge/jobs?dataset_id=${dataset.dataset_id}`)).jobs;assert.equal(jobs.length,3);assert.deepEqual(jobs.map(item=>item.completed).sort((a,b)=>b-a),[20,20,3]);assert.ok(jobs.every(item=>item.origin_session_id));
  await button('Chat');
  for(const group of await driver.findElements(By.xpath("//button[contains(., 'Completed') and @aria-expanded='false']")))await group.click();
  for(const group of await driver.findElements(By.xpath("//button[contains(., 'Called tools') and @aria-expanded='false']")))await group.click();
  const scopeLink=await element(`button[data-iad-scope-id="${scope.scope_run_id}"]`);await driver.executeScript("arguments[0].scrollIntoView({block:'center'})",scopeLink);await scopeLink.click();await element('[aria-label="连续范围进度"]');assert.match(await(await element('[aria-label="连续范围进度"]')).getText(),/已观察 43.*剩余 0/);
  assert.ok(await(await element('select[aria-label="知识预设"]')).getAttribute('value'));
 }catch(error){if(driver)console.error((await driver.findElement(By.css('body')).getText()).slice(-1600));console.error(log.slice(-1200).replace(/(token=)[^\s&]+/g,'$1<redacted>'));throw error;}
 finally{await driver?.quit();if(host.exitCode===null){host.kill('SIGTERM');await Promise.race([new Promise(resolve=>host.once('exit',resolve)),delay(3000)]);if(host.exitCode===null)host.kill('SIGKILL');}model.closeAllConnections();await new Promise(resolve=>model.close(resolve));await fs.rm(root,{recursive:true,force:true});}
});
