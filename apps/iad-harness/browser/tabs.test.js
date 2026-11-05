import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder, By, Key, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('tabs keep the prototype underline and keyboard interaction across pages and dialogs', {timeout:60000},async()=>{
  const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';
import {PageTabs} from './src/client/components/layout/PageTabs.tsx';import {workbenchStyles} from './src/client/styles.ts';
function Tabs({className}){const [value,setValue]=React.useState('support');return <PageTabs className={className} label="知识图像证据"
  items={[{id:'support',label:'支持证据'},{id:'counter',label:'反对证据'}]} value={value} onChange={setValue}><p>{value}</p></PageTabs>}
createRoot(document.getElementById('root')).render(<><style>{workbenchStyles}</style><main className="iad-workbench"><Tabs/>
  <section id="audit-page"><Tabs className="audit-tabs"/></section></main><section className="iad-detail-dialog"><Tabs/></section></>);`,
    loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const server=http.createServer((req,res)=>{if(req.url==='/browser.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].contents);}
    res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/browser.js"></script>');});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let driver;
  try{
    const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    await driver.get(`http://127.0.0.1:${server.address().port}`);await driver.wait(until.elementLocated(By.css('[role=tab]')),10000);
    for(const bar of await driver.findElements(By.css('[role=tablist]'))){
      const tabs=await bar.findElements(By.css('[role=tab]'));
      for(const tab of tabs){const css=await driver.executeScript(`const s=getComputedStyle(arguments[0]);return {left:s.borderLeftWidth,top:s.borderTopWidth,bottom:s.borderBottomWidth,radius:s.borderRadius,background:s.backgroundColor,height:s.height}`,tab);
        assert.deepEqual(css,{left:'0px',top:'0px',bottom:'2px',radius:'0px',background:'rgba(0, 0, 0, 0)',height:'44px'});}
      await tabs[0].click();await tabs[0].sendKeys(Key.ARROW_RIGHT);
      assert.equal(await tabs[1].getAttribute('aria-selected'),'true');assert.equal(await tabs[0].getAttribute('tabindex'),'-1');
      assert.equal(await driver.switchTo().activeElement().then(e=>e.getId()),await tabs[1].getId());
      const panel=await driver.findElement(By.id(await tabs[1].getAttribute('aria-controls')));assert.equal(await panel.getText(),'counter');
      await tabs[1].sendKeys(Key.HOME);assert.equal(await tabs[0].getAttribute('aria-selected'),'true');
      await tabs[0].sendKeys(Key.ARROW_LEFT);assert.equal(await tabs[1].getAttribute('aria-selected'),'true');
      await tabs[1].sendKeys(Key.END);assert.equal(await tabs[1].getAttribute('aria-selected'),'true');
      const focus=await driver.executeScript('return getComputedStyle(arguments[0]).outlineStyle',tabs[1]);assert.equal(focus,'solid');
    }
  }finally{await driver?.quit();await new Promise(resolve=>server.close(resolve));}
});
