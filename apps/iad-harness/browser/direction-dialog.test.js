import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('direction details share modal focus, prototype geometry and nested whole-image viewing', {timeout:60000},async()=>{
 const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';
import {DirectionDetailDialog} from './src/client/components/DirectionDetailDialog.tsx';import {FullscreenViewer} from './src/client/components/FullscreenViewer.tsx';import {workbenchStyles} from './src/client/styles.ts';
const picture={evidenceId:'evidence-normal',sampleId:'sample-normal',ref:'N1',label:'N1',kind:'normal',url:'/image.png',fullUrl:'/image.png',filename:'source-normal.png'};
const abnormal={...picture,evidenceId:'evidence-abnormal',sampleId:'sample-abnormal',ref:'A1',label:'A1',kind:'defect'};
const direction={id:'direction',versionId:'version',datasetId:'dataset',title:'轮廓连续性',applies:'通用',brief:'联合观察完整轮廓',rationale:'对照N1与A1观察边缘的连续性',limitations:['本组对照范围'],evidences:[picture,abnormal],references:new Map([['N1',{id:'N1',label:'N1'}],['A1',{id:'A1',label:'A1'}]])};
function App(){const [open,setOpen]=React.useState(false),[viewer,setViewer]=React.useState(false);return <><style>{workbenchStyles}</style><main className="iad-workbench"><button id="launch" onClick={()=>setOpen(true)}>查看方向</button>{open&&<DirectionDetailDialog direction={direction} onOpenFullscreen={()=>setViewer(true)} onClose={()=>setOpen(false)}/>}<FullscreenViewer open={viewer} item={{id:'normal',sampleId:'sample-normal',title:'N1',imageUrl:'/image.png'}} onClose={()=>setViewer(false)}/></main></>}
createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
 const server=http.createServer((req,res)=>{if(req.url==='/image.png'){res.setHeader('Content-Type','image/png');return res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jC14AAAAASUVORK5CYII=','base64'));}if(req.url==='/app.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].contents);}res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/app.js"></script>');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let driver;
 try{
  const options=new firefox.Options().addArguments('-headless');if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  await driver.manage().window().setRect({width:1920,height:1080});await driver.get(`http://127.0.0.1:${server.address().port}`);
  const el=id=>driver.wait(until.elementLocated(By.id(id)),5000), click=async id=>(await el(id)).click();
  const expanded=async(id,value)=>driver.wait(async()=>await(await el(id+'-trigger')).getAttribute('aria-expanded')===String(value),5000);
  await click('launch');const dialog=await driver.wait(until.elementLocated(By.css('dialog.exp-direction-dialog:modal')),5000);
  const geometry=await driver.executeScript('const r=arguments[0].getBoundingClientRect();return [r.width,r.height]',dialog);
  assert.deepEqual(geometry,[1380,820]);
  for(let i=0;i<12;i++){await driver.actions().sendKeys(Key.TAB).perform();assert.equal(await driver.executeScript('return document.activeElement===document.body || arguments[0].contains(document.activeElement)',dialog),true);}
  const card=await driver.findElement(By.css('[data-evidence-card="N1"]'));await card.click();
  await driver.wait(async()=>(await driver.findElements(By.css('dialog:modal'))).length===2,5000);
  await driver.actions().sendKeys(Key.ESCAPE).perform();await driver.wait(async()=>(await driver.findElements(By.css('dialog:modal'))).length===1,5000);
  assert.equal(await dialog.isDisplayed(),true);assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',card),true);
  await driver.actions().sendKeys(Key.ESCAPE).perform();await driver.wait(async()=>(await driver.findElements(By.css('dialog:modal'))).length===0,5000);
  assert.equal(await driver.executeScript('return document.activeElement.id'),'launch');
  await click('launch');await driver.wait(until.elementLocated(By.css('dialog.exp-direction-dialog:modal')),5000);
  await driver.actions().move({origin:'viewport',x:8,y:8}).click().perform();
  await driver.wait(async()=>(await driver.findElements(By.css('dialog:modal'))).length===0,5000);
  assert.equal(await driver.executeScript('return document.activeElement.id'),'launch');
 }finally{await driver?.quit();await new Promise(r=>server.close(r));}
});
