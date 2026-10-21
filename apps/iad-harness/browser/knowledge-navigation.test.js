import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import { PythonBridge, createIadHttpHandler } from '../lib/server/index.js';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = path.resolve(app, '../..');

test('knowledge navigation: one entry preserves each type and dataset through history and refresh without starting jobs', {timeout: 60000}, async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-knowledge-navigation-'));
  const bridge = new PythonBridge({cwd: workspace, dbPath: path.join(root, 'test.db')});
  execFileSync(bridge.pythonPath, ['-c', "from PIL import Image;import sys;from pathlib import Path;p=Path(sys.argv[1]);(p/'images').mkdir();(p/'labels').mkdir();Image.new('RGB',(120,80),'blue').save(p/'images'/'normal.png')", root]);
  const bundle = await build({stdin: {contents: `
    import React from 'react';import {createRoot} from 'react-dom/client';import {apply} from './src/client/index.ts';
    const entries=[],mains=new Map(),listeners=new Set();let panel=null;
    const layout={panelInfo:{getSnapshot:()=>({activePanelId:panel}),subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}},selectPanel:id=>{panel=id;listeners.forEach(f=>f())}};
    apply({layout,slots:{inject:(_,f)=>f(),register:(o,c)=>{if(o.name==='main')mains.set(o.key,c);else if(o.name==='sidebar.panellist')entries.push({...o,c});}}});
    function App(){const [id,setId]=React.useState(panel||entries[0].id);React.useEffect(()=>layout.panelInfo.subscribe(()=>setId(panel)),[]);const Page=mains.get(id);return <><nav aria-label="主导航">{entries.map(e=><button key={e.id} onClick={()=>layout.selectPanel(e.id)}>{e.label}</button>)}</nav>{Page&&<Page/>}</>};
    createRoot(document.getElementById('root')).render(<App/>);
  `,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const api = createIadHttpHandler(bridge);
  const starts=[];
  const server=http.createServer((req,res)=>{
    if(req.method==='POST' && /\/(knowledge|audit)\/(start|retry)/.test(req.url)) starts.push(req.url);
    if(req.url==='/browser.js'){res.setHeader('Content-Type','application/javascript');res.end(bundle.outputFiles[0].contents);}
    else if(new URL(req.url,'http://localhost').pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<div id="root"></div><script src="/browser.js"></script>');}
    else api(req,res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  let driver;
  try{
    const datasets=[];
    for(const name of ['甲数据集','乙数据集']){
      await fs.cp(path.join(root,'images'),path.join(root,name,'images'),{recursive:true});await fs.mkdir(path.join(root,name,'labels'));
      const response=await fetch(base+'/api/iad/datasets/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({format:'labelme',name,image_dir:path.join(root,name,'images'),annotation_dir:path.join(root,name,'labels')})});
      assert.equal(response.status,200,await response.clone().text());datasets.push(await response.json());
    }
    const options=new firefox.Options().addArguments('-headless');if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    await driver.get(base);
    const element=css=>driver.wait(until.elementLocated(By.css(css)),8000);
    const click=async text=>{await(await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${text}']`)),8000)).click();};
    await element('nav[aria-label="主导航"]');
    assert.deepEqual(await driver.executeScript('return [...document.querySelectorAll("nav[aria-label=主导航] button")].map(e=>e.textContent)'),['数据集管理','图像浏览','知识挖掘','模型审计','人工复核']);
    await click('知识挖掘');
    await element('[data-page="industrial-knowledge"]');
    const model=async()=>{const input=await element('input[aria-label="知识挖掘模型"]');if(!await input.isDisplayed())await(await element('.iad-model-settings summary')).click();return input;};
    await(await model()).sendKeys('normal-custom');await click('版本');
    await click('异常');
    await driver.wait(async()=>await(await model()).getAttribute('value')==='',5000);
    await(await model()).sendKeys('defect-custom');await click('作业记录');
    await click('良品');
    assert.equal(await(await model()).getAttribute('value'),'normal-custom');
    assert.equal(await(await element('nav[aria-label="知识视图"] button.active')).getText(),'版本');
    await driver.navigate().back();
    await driver.wait(async()=>await(await model()).getAttribute('value')==='defect-custom',5000);
    assert.equal(await(await element('nav[aria-label="知识类型"] button[aria-pressed="true"]')).getText(),'异常');
    await driver.navigate().refresh();
    await driver.wait(async()=>await(await model()).getAttribute('value')==='defect-custom',5000);
    const datasetSelect=await element('select[aria-label="当前数据集"]');
    await driver.executeScript('arguments[0].value=arguments[1];arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',datasetSelect,datasets[1].dataset_id);
    await driver.wait(async()=>await(await model()).getAttribute('value')==='',5000);
    await driver.executeScript('arguments[0].value=arguments[1];arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',await element('select[aria-label="当前数据集"]'),datasets[0].dataset_id);
    await driver.wait(async()=>await(await model()).getAttribute('value')==='defect-custom',5000);
    assert.deepEqual(starts,[],'navigation and refresh must never create jobs');
    for(const dataset of datasets){
      const jobs=await(await fetch(base+`/api/iad/knowledge/jobs?dataset_id=${dataset.dataset_id}`)).json();assert.deepEqual(jobs.jobs,[]);
    }
  }finally{if(driver)await driver.quit();bridge.destroy();await new Promise(resolve=>server.close(resolve));await fs.rm(root,{recursive:true,force:true});}
});
