import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('prompt drawers share geometry, immutable full text and keyboard dismissal', {timeout:60000},async()=>{
 const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';
import {PromptDrawer} from './src/client/components/PromptDrawer.tsx';import {workbenchStyles} from './src/client/styles.ts';
const text='用户完整提示词\\n{{response_schema}}\\n真实冻结范围';
function App(){const [title,setTitle]=React.useState('');return <><style>{workbenchStyles}</style><main className="iad-workbench"><button id="explore" onClick={()=>setTitle('探索提示词')}>探索</button><button id="knowledge" onClick={()=>setTitle('查看提示词')}>知识</button>{title&&<PromptDrawer title={title} text={text} onClose={()=>setTitle('')}/>}</main></>}
createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
 const server=http.createServer((req,res)=>{if(req.url==='/app.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].contents);}res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/app.js"></script>');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let driver;
 try{
  const options=new firefox.Options().addArguments('-headless');if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  await driver.manage().window().setRect({width:1600,height:1000});await driver.get(`http://127.0.0.1:${server.address().port}`);
  const el=id=>driver.wait(until.elementLocated(By.id(id)),5000), click=async id=>(await el(id)).click();
  const expanded=async(id,value)=>driver.wait(async()=>await(await el(id+'-trigger')).getAttribute('aria-expanded')===String(value),5000);
  for(const id of ['explore','knowledge']){
   await click(id);const dialog=await driver.wait(until.elementLocated(By.css('dialog:modal')),5000);
   const geometry=await driver.executeScript('const r=arguments[0].getBoundingClientRect();return [r.width,arguments[0].querySelector(".iad-dialog-header").getBoundingClientRect().height]',dialog);
   assert.deepEqual(geometry,[560,64]);
   const pre=await dialog.findElement(By.css('pre'));assert.equal(await pre.getAttribute('textContent'),'用户完整提示词\n{{response_schema}}\n真实冻结范围');
   assert.equal((await dialog.findElements(By.css('textarea,input'))).length,0);
   await driver.actions().sendKeys(Key.ESCAPE).perform();await driver.wait(async()=>(await driver.findElements(By.css('dialog:modal'))).length===0,5000);
   assert.equal(await driver.executeScript('return document.activeElement.id'),id);
  }
 }finally{await driver?.quit();await new Promise(r=>server.close(r));}
});
