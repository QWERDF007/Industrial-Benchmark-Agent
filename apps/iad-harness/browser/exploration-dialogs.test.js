import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {PythonBridge,createIadHttpHandler} from '../lib/server/index.js';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('exploration uses shared modal selection, preset form and deletion with real resources',{timeout:90000},async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-exploration-dialogs-'));
 const bridge=new PythonBridge({cwd:path.resolve(app,'../..'),dbPath:path.join(root,'test.db')});
 t.after(()=>bridge.destroy());
 execFileSync(bridge.pythonPath,[path.join(app,'test/fixtures/knowledge_dataset.py'),root]);
 for(let i=0;i<25;i++)await fs.copyFile(path.join(root,'images/part-0.png'),path.join(root,`images/normal-${i}.png`));
 await fs.cp(path.resolve(app,'../../python/iad_core/exploration/presets'),path.join(root,'presets'),{recursive:true});
 const bundle=await build({stdin:{contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';
 import {ExplorationPage} from './src/client/components/ExplorationPage.tsx';
 import {WorkbenchModelProvider} from './src/client/models.tsx';
 import {Workspace,WorkspaceContext} from './src/client/workspace.tsx';
 import {workbenchStyles} from './src/client/styles.ts';
 const workspace=new Workspace(null),style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
 function App(){const [dataset,setDataset]=React.useState(null);React.useEffect(()=>{fetch('/api/iad/datasets').then(r=>r.json()).then(data=>setDataset(data.datasets[0]));},[]);
 return <WorkspaceContext.Provider value={workspace}><WorkbenchModelProvider><main className="iad-workbench">{dataset&&<ExplorationPage dataset={dataset} refreshRevision={0}/>}</main></WorkbenchModelProvider></WorkspaceContext.Provider>}
 createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
 let failPreset=false,modelCalls=0;
 const reads=[],api=createIadHttpHandler(bridge);
 const server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname.endsWith('/tokenize')){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({count:1000,max_model_len:262144}));return;}
  if(pathname.endsWith('/chat/completions')){modelCalls++;res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:'模型暂不可用'}}));return;}
  if(pathname==='/browser.js'){res.setHeader('Content-Type','application/javascript');res.end(bundle.outputFiles[0].contents);return;}
  if(pathname==='/'){res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<meta charset="utf-8"><div id="root"></div><script src="/browser.js"></script>');return;}
  if(req.method==='GET')reads.push(pathname);
  if(req.method==='POST'&&pathname==='/api/iad/exploration/presets'&&failPreset){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:'预设暂不可写'}}));return;}
  await api(req,res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const base=`http://127.0.0.1:${server.address().port}`;
 const env={LIVE_VLM_ENDPOINT:base+'/model/v1',LIVE_VLM_MODEL:'fixture-model',LIVE_VLM_CAPACITY_MODE:'vllm_tokenize',IAD_EXPLORATION_PRESETS_DIR:path.join(root,'presets')};
 const before=Object.fromEntries(Object.keys(env).map(key=>[key,process.env[key]]));Object.assign(process.env,env);
 t.after(()=>{for(const [key,value] of Object.entries(before)){if(value===undefined)delete process.env[key];else process.env[key]=value;}});
 const read=async route=>{const response=await fetch(base+'/api/iad/'+route);assert.equal(response.status,200,await response.clone().text());return response.json();};
 const post=async(route,body)=>{const response=await fetch(base+'/api/iad/'+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(response.status,200,await response.clone().text());return response.json();};
 const dataset=await post('datasets/import',{format:'labelme',name:'探索弹窗验证',image_dir:path.join(root,'images'),annotation_dir:path.join(root,'labels')});
 let failed=await post('analysis/start',{analysis_kind:'exploration',dataset_ids:[dataset.dataset_id]});
 const deadline=Date.now()+15000;
 while(['PENDING','RUNNING'].includes(failed.status)&&Date.now()<deadline){await new Promise(resolve=>setTimeout(resolve,30));failed=await read('analysis/status/'+failed.run_id);}
 assert.equal(failed.status,'FAILED');assert.ok(modelCalls);
 reads.length=0;
 let driver;
 try{
  const options=new firefox.Options().addArguments('-headless');options.setBinary('/tmp/iad-firefox128/firefox/firefox');
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  await driver.manage().window().setRect({width:1440,height:1000});await driver.get(base);
  const el=selector=>driver.wait(until.elementLocated(By.css(selector)),10000);
  const click=async element=>{await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',element);await element.click();};
  const button=async(label,within=driver)=>within.findElement(By.xpath(`.//button[normalize-space(.)="${label}"]`));
  const close=async()=>{await driver.actions().sendKeys(Key.ESCAPE).perform();await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,5000);};
  const native=async(dialog,width)=>{
   const geometry=await driver.executeScript('const r=arguments[0].getBoundingClientRect();return {modal:arguments[0].matches("dialog:modal"),width:r.width,x:r.x+r.width/2-innerWidth/2,y:r.y+r.height/2-innerHeight/2}',dialog);
   assert.equal(geometry.modal,true,'探索弹窗必须使用共享原生Modal');assert.equal(geometry.width,width);
   assert.ok(Math.abs(geometry.x)<=1&&Math.abs(geometry.y)<=1,JSON.stringify(geometry));
  };
  const row=await el('tr[data-action="select-job"]');
  assert.equal(await(await el('.exp-selected-result')).getText(),'探索结果\n当前作业下没有对应的探索结果。','失败详情统一在状态抽屉，结果区只保留简短空态');
  const status=await row.findElement(By.css('.iad-job-status-button'));await click(status);
  let drawer=await el('dialog[aria-label="作业状态"][open]');
  assert.ok((await drawer.getText()).includes('503'));
  assert.ok((await drawer.getText()).includes(failed.errors[0].source_run_id),'抽屉保留实际失败步骤');
  await close();assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',status),true);
  const remove=await row.findElement(By.css('button[data-icon="delete"]'));
  await click(remove);let dialog=await el('[aria-label="删除探索作业"]');await native(dialog,530);
  assert.equal(await driver.executeScript('return document.activeElement.getAttribute("aria-label")'),'取消删除');
  await close();assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',remove),true);
  assert.equal((await read('analysis/jobs?'+new URLSearchParams({dataset_id:dataset.dataset_id,analysis_kind:'exploration'}))).jobs.length,1);
  await click(await button('新建探索'));assert.equal(reads.filter(route=>route==='/api/iad/knowledge/sources').length,0,'打开设置不预先枚举图像');
  const add=await el('button[aria-label="继续添加良品图像"]');await click(add);
  dialog=await el('[aria-label="选择良品图像"]');await native(dialog,960);
  assert.equal(await driver.executeScript('return document.activeElement.id'),'exp-source-search');
  await driver.wait(async()=>(await dialog.findElements(By.css('.iad-thumbnail-card'))).length===24,10000);
  const selected=await dialog.findElements(By.css('.iad-thumbnail-option input'));
  assert.equal(selected.length,24);assert.ok(!(await selected[0].isSelected()));await click(selected[0]);
  assert.equal(await driver.executeScript('return getComputedStyle(arguments[0]).objectFit',await dialog.findElement(By.css('.iad-thumbnail-card img'))),'contain');
  await click(await button('下一页',dialog));assert.equal((await dialog.findElements(By.css('.iad-thumbnail-card'))).length,3);
  await click(await button('完成选择',dialog));await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,5000);
  assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',add),true);
  assert.equal((await driver.findElements(By.css('.exp-preview .iad-thumbnail-card'))).length,1);
  await click(add);dialog=await el('dialog[aria-label="选择良品图像"][open]');
  assert.equal(await(await dialog.findElement(By.css('.iad-thumbnail-option input'))).isSelected(),true);
  await close();
  const prompt=await el('#exp-prompt');await prompt.sendKeys(' 当前验证提示词。');const text=await prompt.getAttribute('value');
  const save=await button('另存为预设');await click(save);dialog=await el('[aria-label="另存为提示词预设"]');await native(dialog,530);
  assert.equal(await driver.executeScript('return document.activeElement.id'),'exp-new-preset');
  await(await dialog.findElement(By.css('input'))).sendKeys('弹窗验证预设');failPreset=true;
  await click(await button('保存',dialog));await driver.wait(async()=>(await dialog.findElements(By.css('[role="alert"]'))).length===1,5000);
  assert.ok((await dialog.getText()).includes('预设暂不可写'));failPreset=false;
  await click(await button('保存',dialog));await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,5000);
  const presets=(await read('exploration/presets')).presets;assert.equal(presets.find(item=>item.name==='弹窗验证预设').text,text);
  assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',save),true);
  await click(await button('返回作业与结果'));const trigger=await el('.exp-job-icon-actions button[data-icon="delete"]');await click(trigger);
  dialog=await el('dialog[aria-label="删除探索作业"][open]');await click(await dialog.findElement(By.css('button[data-variant="danger"]')));
  await driver.wait(async()=>(await read('analysis/jobs?'+new URLSearchParams({dataset_id:dataset.dataset_id,analysis_kind:'exploration'}))).jobs.length===0,5000);
  await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,5000);
  assert.equal(await driver.executeScript('return document.activeElement.id'),'exp-jobsearch');
 }catch(error){if(driver)await fs.writeFile('/tmp/iad-exploration-dialogs-failure.png',await driver.takeScreenshot(),'base64');throw error;}
 finally{await driver?.quit();}
});
