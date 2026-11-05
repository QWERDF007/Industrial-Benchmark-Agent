import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {viewport} from './workbench-layout.js';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('fullscreen restores the shared fit-relative transform and reports the same units', {timeout:60000},async()=>{
  const bundle=await build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {FullscreenViewer} from './src/client/components/FullscreenViewer.tsx';
    import {workbenchStyles} from './src/client/styles.ts';
    const style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
    const root=createRoot(document.getElementById('root'));
    const remember=value=>window.latestTransform=value;
    const items=['wide','second'].map(id=>({id,title:id+'.svg',imageUrl:'/wide.svg',width:1000,height:500,
      bboxes:[{raw_label:'缺陷',bbox:[200,100,300,150]}]}));
    function App(){const [index,setIndex]=React.useState(0);window.latestIndex=index;
      return <FullscreenViewer open item={items[index]} items={items} currentIndex={index} onNavigate={setIndex}
        initialTransform={{zoom:2,x:17,y:-11}} onTransform={remember} onClose={()=>root.unmount()}/>}
    root.render(<App/>);
  `,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const server=http.createServer((req,res)=>{
    if(req.url==='/browser.js'){res.setHeader('Content-Type','application/javascript');res.end(bundle.outputFiles[0].contents);}
    else if(req.url==='/wide.svg'){res.setHeader('Content-Type','image/svg+xml');res.end('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="500"><rect width="1000" height="500" fill="#4683a6"/></svg>');}
    else{res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<div id="root"></div><script src="/browser.js"></script>');}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let driver;
  try{
    const options=new firefox.Options().addArguments('-headless');options.setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    await viewport(driver,1790,900);await driver.get(`http://127.0.0.1:${server.address().port}`);
    await driver.wait(until.elementLocated(By.css('dialog.iad-fullscreen-dialog[open]')),10000);
    await driver.wait(()=>driver.executeScript(()=>document.querySelector('#big-image')?.naturalWidth===1000&&window.latestTransform?.x===17),5000);
    const measure=()=>driver.executeScript(()=>{
      const stage=document.querySelector('#stage'),world=document.querySelector('#image-world');
      const image=document.querySelector('#big-image');
      const fit=Math.min(Math.max(100,stage.clientWidth-128)/image.naturalWidth,Math.max(100,stage.clientHeight-40)/image.naturalHeight);
      return {fit,scale:new DOMMatrix(getComputedStyle(world).transform).a,transform:window.latestTransform};
    });
    let actual=await measure();
    assert.ok(Math.abs(actual.scale-2*actual.fit)<0.001,JSON.stringify(actual));
    assert.deepEqual(actual.transform,{zoom:2,x:17,y:-11});
    await viewport(driver,980,830);
    await driver.wait(async()=>{actual=await measure();return Math.abs(actual.scale-2*actual.fit)<0.001;},5000);
    assert.deepEqual(actual.transform,{zoom:2,x:17,y:-11});
    const zoom=await driver.findElement(By.css('#zoom'));
    await zoom.findElement(By.css('option[value="fit"]')).click();
    await driver.wait(()=>driver.executeScript(()=>window.latestTransform?.zoom===0),5000);
    actual=await measure();assert.ok(Math.abs(actual.scale-actual.fit)<0.001);
    assert.deepEqual(actual.transform,{zoom:0,x:0,y:0});
    await zoom.findElement(By.css('option[value="1"]')).click();
    await driver.wait(async()=>Math.abs((await measure()).scale-1)<0.001,5000);
    actual=await measure();assert.ok(Math.abs(actual.transform.zoom-1/actual.fit)<0.001);
    const world=await driver.findElement(By.css('#image-world'));
    assert.equal((await world.findElements(By.css('svg[aria-label="Labelme 标注"] rect'))).length,1);
    await zoom.sendKeys(Key.ARROW_RIGHT);
    assert.equal(await driver.executeScript('return window.latestIndex'),0,'调整下拉框不切换图像');
    await (await driver.findElement(By.id('next-img'))).sendKeys(Key.ARROW_RIGHT);
    await driver.wait(()=>driver.executeScript('return window.latestIndex===1'),5000);
    await (await driver.findElement(By.id('prev-img'))).sendKeys(Key.PAGE_UP);
    await driver.wait(()=>driver.executeScript('return window.latestIndex===0'),5000);
    await (await driver.findElement(By.id('next-img'))).sendKeys(Key.ESCAPE);
    await driver.wait(async()=>(await driver.findElements(By.css('dialog.iad-fullscreen-dialog[open]'))).length===0,5000);
  }finally{if(driver)await driver.quit();await new Promise(resolve=>server.close(resolve));}
});
