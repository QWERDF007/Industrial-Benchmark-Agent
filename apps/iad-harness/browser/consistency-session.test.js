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
import {viewport,setTheme,verifySidebarLayout} from './workbench-layout.js';

const workspace=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');

test('native DSH explains frozen consistency attachments and returns to the selected difference',{timeout:120000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-native-consistency-session-'));
  const requests=[];
  const model=http.createServer(async(req,res)=>{
    const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=JSON.parse(Buffer.concat(chunks));
    const active=body.tools?.some(tool=>tool.function.name==='consistency_context');
    let call;let answer='比较证据解释';
    if(active){
      requests.push(body);
      const text=body.messages.filter(message=>message.role==='user').flatMap(message=>typeof message.content==='string' ? [message.content] : message.content.filter(block=>block.type==='text').map(block=>block.text)).join('\n');
      const reference=JSON.parse(text.split('一致性证据引用：')[1].split('\n')[0]);
      const outputs=body.messages.filter(message=>message.role==='tool');
      if(!outputs.length)call={name:'consistency_context',arguments:reference};
      else answer='原像素完全相同，双方标注类别不同。附件仅用于解释，未修改任何标注。返回比较证据：'+text.split('返回比较证据：')[1].split('\n')[0];
    }
    res.writeHead(200,{'Content-Type':'text/event-stream'});
    const delta=call ? {role:'assistant',tool_calls:[{index:0,id:'context-call',type:'function',function:{name:call.name,arguments:JSON.stringify(call.arguments)}}]} : {role:'assistant',content:answer};
    for(const choice of [{index:0,delta,finish_reason:null},{index:0,delta:{},finish_reason:call ? 'tool_calls' : 'stop'}])res.write('data: '+JSON.stringify({id:'consistency-session',object:'chat.completion.chunk',model:'test-context-model',choices:[choice]})+'\n\n');
    res.end('data: [DONE]\n\n');
  });
  await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));
  const endpoint=`http://127.0.0.1:${model.address().port}/v1`;
  const app=path.join(workspace,'apps/iad-harness'),profile=path.join(root,'home/profiles/web');
  await fs.mkdir(path.join(profile,'node_modules/@industrial-benchmark'),{recursive:true});
  await fs.symlink(app,path.join(profile,'node_modules/@industrial-benchmark/iad-harness'));
  await fs.writeFile(path.join(profile,'package.json'),JSON.stringify({name:'iad-consistency-session-browser',private:true,type:'module',dsh:{profile:{bundles:['@deepseek-ai/dsh-base','@deepseek-ai/dsh-web-app']}}}));
  await fs.writeFile(path.join(profile,'cordis.yml'),'[]\n');
  await fs.writeFile(path.join(profile,'cordis.patch.yml'),'- id: ui-settings-general\n  config:\n    welcomeNoticeVersion: 2026-09-28.1\n');
  const probe=http.createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
  const patch=path.join(root,'host.yml');
  await fs.writeFile(patch,`- id: webserver
  config:
    host: 127.0.0.1
    port: ${port}
- id: llm-pi-ai
  config:
    providers:
      context-test:
        api: openai-completions
        baseURL: ${endpoint}
        apiKeyEnv: IAD_CONTEXT_TEST_KEY
        models:
          - id: test-context-model
            input: [text, image]
            contextWindow: 262144
- id: agent-default-model
  config:
    provider: context-test
    model: test-context-model
- insert:
    - id: industrial-harness-plugin
      name: '@industrial-benchmark/iad-harness'
      config:
        cwd: ${workspace}
        dbPath: ${path.join(root,'benchmark.db')}
`);
  const host=spawn(process.env.IAD_NODE_PATH || process.execPath,[path.join(workspace,'node_modules/@deepseek-ai/dsh/lib/bin.js'),'--profile','web','--patch',patch,'--port',String(port),'--no-open'],
    {cwd:workspace,env:{...process.env,DSH_HOME:path.join(root,'home'),IAD_CONTEXT_TEST_KEY:'synthetic-local-only'},stdio:['ignore','pipe','pipe']});
  let log='';host.stdout.on('data',data=>{log+=data;});host.stderr.on('data',data=>{log+=data;});let driver;
  try{
    const base=`http://127.0.0.1:${port}`;const deadline=Date.now()+30000;
    while(Date.now()<deadline){try{if((await fetch(base)).ok)break;}catch{}if(host.exitCode!==null)throw new Error(log);await delay(200);}
    execFileSync(resolvePythonPath(),['-c',`import json,sys
from pathlib import Path
from PIL import Image
r=Path(sys.argv[1]);r.mkdir()
for name,label in [('left','scratch'),('right','dent')]:
 Image.new('RGB',(256,256),(90,110,130)).save(r/(name+'.png'))
 (r/(name+'.json')).write_text(json.dumps({'imageWidth':256,'imageHeight':256,'shapes':[{'label':label,'shape_type':'rectangle','points':[[20,20],[60,60]]}]}))
`,path.join(root,'images')]);
    const post=async(route,body)=>{const response=await fetch(base+'/api/iad'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(response.status,200,await response.clone().text());return response.json();};
    const dataset=await post('/datasets/import',{format:'labelme',name:'原生一致性会话',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'images'),annotation_policy:{policy_id:'same',annotation_role:'REFERENCE',annotation_coverage:'EXHAUSTIVE'}});
    const result=await post('/consistency/compare',{sample_a:dataset.dataset_id+':left.png',sample_b:dataset.dataset_id+':right.png'});
    const evidence=await (await fetch(base+'/api/iad/consistency/evidence/'+result.evidence_id)).json();
    const differenceId=evidence.result.annotation.differences[0].difference_id;
    const route={pageId:'industrial-consistency',tab:'groups',evidenceId:result.evidence_id,resultId:result.result_id,differenceId,groupPage:2,memberPage:3};
    const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || 'geckodriver')).build();
    const authenticated=log.match(/dsh web: (http[^\s]+)/)?.[1];assert.ok(authenticated,'Native host must publish its authentication URL');
    await driver.get(authenticated);await viewport(driver,1920,1080);
    await driver.wait(until.elementLocated(By.css('nav[aria-label="工业工作台导航"]')),10000);
    await driver.get(base+'/?'+new URLSearchParams({iad:JSON.stringify(route)}));
    const button=async text=>{const found=await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${text}']`)),10000);await driver.wait(until.elementIsEnabled(found),10000);await found.click();};
    await driver.wait(until.elementLocated(By.css('[data-evidence-id]')),10000);
    await button('在 DSH 中解释');
    await driver.wait(()=>driver.findElement(By.css('body')).getText().then(text=>text.includes('原像素完全相同，双方标注类别不同。')),30000);
    assert.ok(requests.length>=2);
    await verifySidebarLayout(driver,'/tmp/iad-consistency-sidebar-layout');
    await viewport(driver,1920,900);
    const workspaceRegion=await driver.findElement(By.css('.iad-native-workspace-content'));
    await driver.actions().scroll(0,0,0,400,workspaceRegion).perform();
    await driver.wait(()=>driver.executeScript('const content=document.querySelector(".iad-native-workspace-content"),title=[...content.querySelectorAll("*")].find(e=>!e.children.length&&e.textContent.trim()==="比较证据解释");if(!title)return false;const r=title.getBoundingClientRect(),hit=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);return title===hit||title.contains(hit)'),5000,'滚轮可以在受限会话区中找到当前会话，底部工具不遮挡条目');
    await fs.writeFile('/tmp/iad-consistency-sidebar-layout/sidebar-scrolled-900.png',await driver.takeScreenshot(),'base64');
    await viewport(driver,1920,1080);
    const images=requests.at(-1).messages.flatMap(message=>Array.isArray(message.content) ? message.content.filter(block=>block.type==='image_url') : []);
    assert.ok(images.length>=3,'实际模型请求必须携带真实图片附件');
    await button('Chat');
    for(const group of await driver.findElements(By.xpath("//button[contains(., 'Completed') and @aria-expanded='false']")))await group.click();
    for(const group of await driver.findElements(By.xpath("//button[contains(., 'Called tools') and @aria-expanded='false']")))await group.click();
    const returnButton=await driver.wait(until.elementLocated(By.css('[data-iad-tool="consistency_context"] button[data-iad-page="industrial-consistency"]')),10000);
    await driver.executeScript("arguments[0].scrollIntoView({block:'center'})",returnButton);
    await driver.wait(until.elementIsVisible(returnButton),5000);await returnButton.click();
    await driver.wait(until.elementLocated(By.css('[data-evidence-id]')),10000);
    const restored=await driver.executeScript('return JSON.parse(new URL(location.href).searchParams.get("iad"))');
    assert.equal(restored.evidenceId,result.evidence_id);assert.equal(restored.differenceId,differenceId);
    assert.equal(restored.groupPage,2);assert.equal(restored.memberPage,3);
    for(const theme of ['Light','Dark']){await setTheme(driver,theme);await fs.writeFile(`/tmp/iad-consistency-session-${theme.toLowerCase()}-1920.png`,await driver.takeScreenshot(),'base64');}
    await setTheme(driver,'Light');
    const report=await post('/consistency/report',{selection:{kind:'scope',subjects:{kind:'all_registered'}},relation:'EXACT'});
    const gallery=await post('/consistency/gallery',{query_id:report.page.query_id,kind:'groups'});
    const groupRoute={pageId:'industrial-consistency',tab:'groups',queryId:report.page.query_id,groupId:gallery.items[0].group_id};
    await driver.get(base+'/?'+new URLSearchParams({iad:JSON.stringify(groupRoute)}));
    await driver.wait(until.elementLocated(By.css('dialog[aria-label="图组详情"]')),10000);
    await driver.wait(()=>driver.executeScript('return document.querySelector("dialog[aria-label=图组详情] button.iad-primary")?.disabled===false'),5000);
    const groupBefore=await driver.executeScript('return JSON.parse(new URL(location.href).searchParams.get("iad"))');
    const beforeRequests=requests.length;await button('在 DSH 中解释');
    await driver.wait(()=>requests.length>=beforeRequests+2,30000);
    await driver.wait(()=>driver.findElement(By.css('body')).getText().then(text=>text.includes('原像素完全相同，双方标注类别不同。')),10000);
    const referenceBody=requests.at(-1).messages.filter(message=>message.role==='user').flatMap(message=>typeof message.content==='string'?[message.content]:message.content.filter(block=>block.type==='text').map(block=>block.text)).join('\n');
    assert.ok(referenceBody.includes('consistency_group_analyze'),'图组解释请求包含完整组模型验证意图');
    let returnLink;
    for(const anchor of await driver.findElements(By.css('a[href*="iad="]'))){
      const href=await anchor.getAttribute('href');const restoredRoute=JSON.parse(new URL(href).searchParams.get('iad'));
      if(restoredRoute.queryId===groupBefore.queryId&&restoredRoute.groupId===groupBefore.groupId&&!restoredRoute.evidenceId)returnLink=anchor;
    }
    assert.ok(returnLink,'模型返回链接应保留图组位置而非强制离开到独立证据页');
    const originalWindows=await driver.getAllWindowHandles();
    await driver.executeScript("arguments[0].scrollIntoView({block:'center'})",returnLink);await returnLink.click();
    const windows=await driver.getAllWindowHandles();
    if(windows.length>originalWindows.length)await driver.switchTo().window(windows.find(handle=>!originalWindows.includes(handle)));
    await driver.wait(until.elementLocated(By.css('dialog[aria-label="图组详情"]')),10000);
    const groupAfter=await driver.executeScript('return JSON.parse(new URL(location.href).searchParams.get("iad"))');
    assert.equal(groupAfter.groupId,groupBefore.groupId);assert.equal(groupAfter.memberId,groupBefore.memberId);
    await fs.writeFile('/tmp/iad-consistency-group-session-return-1920.png',await driver.takeScreenshot(),'base64');
  }catch(error){if(driver)console.error((await driver.findElement(By.css('body')).getText()).slice(-3000));console.error(JSON.stringify({modelRequests:requests.length}));console.error(log.slice(-1500).replace(/([?&]token=)[^&\s]+/g,'$1[redacted]'));throw error;}
  finally{if(driver)await driver.quit();if(host.exitCode===null){host.kill('SIGTERM');await new Promise(resolve=>host.once('exit',resolve));}await new Promise(resolve=>model.close(resolve));await fs.rm(root,{recursive:true,force:true});}
});
