import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('scope controls share selection, exclusive menus, dismissal and modal focus', {timeout:60000},async()=>{
 const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';
import {Select} from './src/client/components/Select.tsx';import {DatasetScopeSelector} from './src/client/components/DatasetScopeSelector.tsx';import {Modal} from './src/client/components/Modal.tsx';import {workbenchStyles} from './src/client/styles.ts';
const groups=[{group_id:'a',name:'真实数据集'}],children=[{dataset_id:'one',name:'子集一'},{dataset_id:'two',name:'子集二'}];
function Scope({id,disabled=false}){const [ids,setIds]=React.useState([]);return <DatasetScopeSelector groups={groups} selectedGroupId="a" onGroupChange={()=>{}} childDatasets={children} selectedChildIds={ids} onChildToggle={id=>setIds(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id])} groupId={id+'-parent'} childId={id+'-trigger'} childMenuId={id+'-menu'} disabled={disabled}/>}
function App(){const [open,setOpen]=React.useState(false);return <><style>{workbenchStyles}</style><main className="iad-workbench"><div style={{display:"flex",gap:32}}><Scope id="first"/><Scope id="second"/></div><Scope id="disabled" disabled/><section id="audit-page"><label className="audit-field"><Select id="audit-select"><option>状态</option></Select></label></section><section id="knowledge-page"><div className="kb-v45"><Select className="f wide select" id="knowledge-select"><option>状态</option></Select></div></section><button id="outside">外部</button><button id="launch" onClick={()=>setOpen(true)}>打开</button>{open&&<Modal title="范围选择" onClose={()=>setOpen(false)}><Scope id="modal"/></Modal>}</main></>}
createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
 const server=http.createServer((req,res)=>{if(req.url==='/app.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].contents);}res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/app.js"></script>');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let driver;
 try{
  const options=new firefox.Options().addArguments('-headless');if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  await driver.manage().window().setRect({width:1600,height:1000});await driver.get(`http://127.0.0.1:${server.address().port}`);
  const el=id=>driver.wait(until.elementLocated(By.id(id)),5000), click=async id=>(await el(id)).click();
  const expanded=async(id,value)=>driver.wait(async()=>await(await el(id+'-trigger')).getAttribute('aria-expanded')===String(value),5000);
  await click('first-trigger');await expanded('first',true);
  const option=await driver.findElement(By.css('#first-menu input[value=one]'));assert.equal(await option.isDisplayed(),true);
  const checkStyle=await driver.executeScript('const s=getComputedStyle(arguments[0]);return [s.width,s.height,s.appearance]',option);
  assert.deepEqual(checkStyle,['15px','15px','auto']);
  await option.click();assert.equal(await option.isSelected(),true);
  await click('first-trigger');await expanded('first',false);
  await(await el('first-trigger')).sendKeys(Key.SPACE);await expanded('first',true);
  await(await el('first-trigger')).sendKeys(Key.ENTER);await expanded('first',false);
  await click('first-trigger');await expanded('first',true);assert.equal(await option.isSelected(),true);
  await click('second-trigger');await expanded('second',true);await expanded('first',false);
  await(await el('second-trigger')).sendKeys(Key.ESCAPE);await expanded('second',false);
  assert.equal(await driver.executeScript('return document.activeElement.id'),'second-trigger');
  await click('first-trigger');assert.equal(await option.isSelected(),true);await click('outside');await expanded('first',false);
  assert.equal(await(await el('disabled-trigger')).isEnabled(),false);
  const styles=await driver.executeScript(`return ['first-parent','first-trigger','second-parent','second-trigger','audit-select','knowledge-select'].map(id=>{const s=getComputedStyle(document.getElementById(id));return [s.height,s.fontSize,s.borderTopColor]})`);
  assert.ok(styles.every(s=>JSON.stringify(s)===JSON.stringify(styles[0])),JSON.stringify(styles));assert.equal(styles[0][0],'38px');assert.equal(styles[0][1],'13px');
  await click('launch');await click('modal-trigger');await expanded('modal',true);
  await(await el('modal-trigger')).sendKeys(Key.TAB);assert.equal(await driver.executeScript('return document.activeElement.type'),'checkbox');
  await driver.actions().sendKeys(Key.ESCAPE).perform();await expanded('modal',false);assert.equal((await driver.findElements(By.css('dialog[open]'))).length,1,'Esc closes the menu before its dialog');
  await driver.actions().sendKeys(Key.ESCAPE).perform();await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,5000);
  assert.equal(await driver.executeScript('return document.activeElement.id'),'launch');
 }finally{await driver?.quit();await new Promise(r=>server.close(r));}
});
