import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder, By, Key, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {PythonBridge, createIadHttpHandler} from '../lib/server/index.js';
import {Context} from '@deepseek-ai/cordis';
import {NativeProviders} from '../lib/server/models/providers.js';
import {JobSessionHost} from '../lib/server/sessions/host.js';
import {imageSessionPath} from '../lib/server/sessions/image-path.js';
import {ConsistencyCheckScheduler} from '../lib/server/consistency/scheduler.js';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('new consistency checks submit and retry without native randomUUID over HTTP', {timeout:45000}, async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-consistency-submission-'));
  const bridge=new PythonBridge({cwd:path.resolve(app,'../..'),dbPath:path.join(root,'test.db')});
  const sessions=await JobSessionHost.open(path.join(root,'sessions'), async session_id => imageSessionPath(path.join(root,'sessions'),await bridge.execute('consistency_agent_session_location', {session_id})));
  const failures=[];
  const scheduler=new ConsistencyCheckScheduler(bridge,sessions,new NativeProviders(() => new Context()),
    async()=>{throw new Error('零候选不应进入模型审核');},failure=>failures.push(failure));
  const removeRouting=bridge.useModelRouting(scheduler);
  let server,driver;
  t.after(async()=>{
    if(driver){t.diagnostic(JSON.stringify(await driver.executeScript('return window.renderErrors')));await fs.writeFile('/tmp/consistency-dsh-submission-browser.png',await driver.takeScreenshot(),'base64');await driver.quit();}
    if(server?.listening)await new Promise(resolve=>server.close(resolve));
    await scheduler.dispose();removeRouting();bridge.destroy();await sessions.dispose();await fs.rm(root,{recursive:true,force:true});
  });
  const bundle=await build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {ConsistencyPage} from './src/client/components/ConsistencyPage.tsx';
    import {Workspace,WorkspaceContext} from './src/client/workspace.tsx';
    const workspace=new Workspace(null);
    createRoot(document.getElementById('root')).render(<WorkspaceContext.Provider value={workspace}><ConsistencyPage/></WorkspaceContext.Provider>);
  `,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const api=createIadHttpHandler(bridge), submissions=[];
  server=http.createServer(async(req,res)=>{
    if(req.url==='/browser.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].contents);}
    if(req.url==='/api/iad/analysis/start'){
      const chunks=[];
      req.on('data',chunk=>chunks.push(chunk));
      req.on('end',()=>submissions.push(JSON.parse(Buffer.concat(chunks))));
      if(submissions.length<2){
        await new Promise(resolve=>req.on('end',resolve));
        res.writeHead(503,{'Content-Type':'application/json'});
        return res.end(JSON.stringify({error:{message:'提交暂时不可用，请重试'}}));
      }
    }
    if(req.url.startsWith('/api/iad'))return api(req,res);
    res.setHeader('Content-Type','text/html;charset=utf-8');
    res.end('<!doctype html><meta charset="utf-8"><style>html,body,#root{height:100%;margin:0}</style><div id="root"></div><script>window.renderErrors=[];addEventListener("error",event=>renderErrors.push(event.message));if(isSecureContext)Object.defineProperty(crypto,"randomUUID",{value:undefined});</script><script src="/browser.js"></script>');
  });
  const host=process.env.IAD_CONSISTENCY_BROWSER_HOST||'127.0.0.1';
  await new Promise(resolve=>server.listen(0,host,resolve));
  const names=['LIVE_VLM_ENDPOINT','LIVE_VLM_MODEL','LIVE_VLM_CAPACITY_MODE'];
  const before=Object.fromEntries(names.map(name=>[name,process.env[name]]));
  process.env.LIVE_VLM_ENDPOINT=`http://${host}:${server.address().port}/v1`;
  process.env.LIVE_VLM_MODEL='isolated-http-fixture';process.env.LIVE_VLM_CAPACITY_MODE='vllm_tokenize';
  t.after(()=>{for(const name of names)if(before[name]===undefined)delete process.env[name];else process.env[name]=before[name];});
  execFileSync(bridge.pythonPath,['-c',`
import json,sys
from pathlib import Path
from PIL import Image
p=Path(sys.argv[1]);(p/'images').mkdir();(p/'labels').mkdir()
for i,color in enumerate(['red','blue']):
 Image.new('RGB',(64,64),color).save(p/'images'/f'{i}.png')
 (p/'labels'/f'{i}.json').write_text(json.dumps({'imageWidth':64,'imageHeight':64,'shapes':[]}))
`,root]);
  const group=await bridge.execute('dataset_group_create',{name:'HTTP提交验收'});
  const dataset=await bridge.execute('dataset_import',{format:'labelme',group_id:group.group_id,name:'无重复图像',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
  await bridge.execute('module_settings_save',{module:'consistency',expected_revision:0,settings:{mode:'exact'}});
  const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');
  options.setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  await driver.manage().window().setRect({width:1440,height:1100});
  await driver.get(`http://${host}:${server.address().port}/`);
  const environment=await driver.executeScript('return {secureContext:isSecureContext,randomUUID:typeof crypto.randomUUID,getRandomValues:typeof crypto.getRandomValues}');
  assert.equal(environment.randomUUID,'undefined');assert.equal(environment.getRandomValues,'function');
  if(host!=='127.0.0.1'&&host!=='localhost')assert.equal(environment.secureContext,false);
  t.diagnostic(JSON.stringify(environment));
  const click=async label=>(await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${label}']`)),5000)).click();
  await click('新建检查');
  assert.equal((await driver.findElements(By.css('dialog[aria-label="新建一致性检查"]'))).length,0);
  await driver.wait(until.elementLocated(By.id('dc-create-page')),5000);
  assert.equal((await driver.findElements(By.css('.dc-jobs-section'))).length,0);
  await click('开始检查');
  await driver.wait(async()=>{
    for(const alert of await driver.findElements(By.css('[role="alert"]')))
      assert.doesNotMatch(await alert.getText(),/crypto\.randomUUID is not a function/);
    return submissions.length===1;
  },5000);
  assert.match(submissions[0].submission_id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  const failure=await driver.wait(until.elementLocated(By.css('dialog[aria-label="创建检查失败"][open]')),5000);
  assert.match(await failure.getText(),/提交暂时不可用，请重试/);
  await fs.writeFile('/tmp/consistency-create-error-dialog.png',await driver.takeScreenshot(),'base64');
  assert.equal((await driver.findElements(By.css('#dc-create-page > [role="alert"]'))).length,0);
  assert.equal(await driver.executeScript('return [...document.querySelectorAll(".iad-workbench > .dc-root > [role=alert]")].length'),0);
  assert.equal(await driver.executeScript('return document.activeElement.closest("dialog")?.getAttribute("aria-label")'),'创建检查失败');
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  await driver.wait(async()=>(await driver.findElements(By.css('dialog[aria-label="创建检查失败"]'))).length===0,5000);
  assert.equal(await driver.executeScript('return document.activeElement?.getAttribute("data-dc")'),'create-job');
  assert.equal((await driver.findElements(By.id('dc-create-page'))).length,1);
  assert.equal((await driver.findElements(By.css('#dc-create-page > [role="alert"]'))).length,0);
  await click('开始检查');
  await driver.wait(until.elementLocated(By.css('dialog[aria-label="创建检查失败"][open]')),5000);
  await click('知道了');
  await driver.wait(async()=>(await driver.findElements(By.css('dialog[aria-label="创建检查失败"]'))).length===0,5000);
  assert.equal(await driver.executeScript('return document.activeElement?.getAttribute("data-dc")'),'create-job');
  await click('开始检查');
  await driver.wait(async()=>(await driver.findElements(By.id('dc-create-page'))).length===0,10000);
  assert.equal(submissions.length,3);assert.equal(new Set(submissions.map(item=>item.submission_id)).size,1);
  assert.deepEqual(submissions[1].dataset_ids,[dataset.dataset_id]);
  const jobs=await bridge.execute('analysis_list',{dataset_id:dataset.dataset_id,analysis_kind:'consistency'});
  assert.equal(jobs.jobs.length,1,'重试只创建一个实际作业');
  await scheduler.whenIdle();
  const finished=await bridge.execute('analysis_status',{run_id:jobs.jobs[0].run_id});
  assert.equal(finished.status,'COMPLETED');assert.equal(finished.completed,2);
  assert.equal(finished.consistency_check_version,1);assert.deepEqual(failures,[]);
  await driver.wait(async()=>{
    const rows=await driver.findElements(By.css(`[data-run-id="${finished.run_id}"]`));
    return rows.length&&(await rows[0].getText()).includes('已完成')&&await rows[0].findElement(By.css('td:nth-child(4)')).getText()==='2 / 2';
  },10000,'新主图作业实时读取真实完成进度');
  assert.equal((await driver.findElements(By.css('[data-dc="open-conflict"]'))).length,0,'零候选通过不出现在原始冲突网格');
});
