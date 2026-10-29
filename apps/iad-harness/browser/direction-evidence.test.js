import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {viewport} from './workbench-layout.js';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('direction citations resolve filenames and unique short IDs and link pointer and keyboard selection', {timeout:60000}, async()=>{
  const prefixes=['24503e','01f90a','1d642f','9a1ff8','abcdef1','abcdef2'];
  const files=['normal/good-a.png','normal/good-b.png','normal/good-c.png','abnormal/ng-a.png','abnormal/duplicate.png','outside/duplicate.png'];
  const evidence=prefixes.map((prefix,index)=>({sample_id:`ds_refs:${files[index]}`,image:{evidence_id:'img_'+prefix.padEnd(64,'0'),original_size:[160,100],sent_size:[160,100]}}));
  const direction={direction_id:'direction_refs',title:'方向引用联动',applies_to:'both',
    instruction:`核对 ${evidence[0].image.evidence_id}、${evidence[0].sample_id}、normal/good-b.png 和 good-c.png。`,
    rationale:'良品 img_24503e、img_01f90a、img_1d642f 的边框连续；异常 img_9a1ff8 顶部有亮带。无法定位 img_abcdef、duplicate.png 和 img_deadbeef。',
    evidence_ids:evidence.slice(0,5).map(item=>item.image.evidence_id),limitations:['保留未解析引用 unknown-evidence-id。']};
  const snapshot={dataset_id:'ds_refs',version_id:'exploration_refs',run_id:'explore_refs',created_at:'2026-10-29T02:30:16',request:{prompt:null},
    normal_sources:evidence.slice(0,3),defect_sources:evidence.slice(3),evidence};
  const bundle=await build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {DirectionDetail} from './src/client/components/DirectionDetail.tsx';
    import {workbenchStyles} from './src/client/styles.ts';
    const style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
    createRoot(document.getElementById('root')).render(<DirectionDetail snapshot={${JSON.stringify(snapshot)}} direction={${JSON.stringify(direction)}} onClose={()=>{}}/>);
  `,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const pixel=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100"><rect width="160" height="100" fill="#168ed4"/><circle cx="45" cy="50" r="15" fill="#b7f6fa"/><circle cx="115" cy="50" r="15" fill="#b7f6fa"/></svg>');
  const server=http.createServer((req,res)=>{
    if(req.url==='/browser.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(bundle.outputFiles[0].contents);}
    else if(req.url.startsWith('/api/iad/exploration/evidence/')){res.writeHead(200,{'Content-Type':'image/svg+xml'});res.end(pixel);}
    else{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<div id="root"></div><script src="/browser.js"></script>');}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let driver;
  try{
    const options=new firefox.Options().addArguments('-headless').setPreference('ui.primaryPointerCapabilities',6);
    if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    await viewport(driver,1920,1080);await driver.get(`http://127.0.0.1:${server.address().port}`);
    const el=selector=>driver.wait(until.elementLocated(By.css(selector)),5000);
    await el('dialog.iad-direction-dialog[open]');
    await driver.wait(()=>driver.executeScript('return [...document.querySelectorAll(".iad-direction-evidence-item img")].every(img=>img.complete&&img.naturalWidth>0)'),5000,'真实缩略图已加载后验收引用联动');
    const rationale=await el('.iad-direction-text-grid>section:first-child');
    assert.deepEqual(await driver.executeScript('return [...arguments[0].querySelectorAll(".iad-evidence-ref")].map(e=>e.textContent)',rationale),['good-a.png','good-b.png','good-c.png','ng-a.png'],'正文中的真实唯一缩写应显示为可交互文件名');
    assert.equal((await driver.findElements(By.css('.iad-direction-objective .iad-evidence-ref'))).length,4,'完整ID、sample_id、相对路径和唯一文件名均可引用');
    assert.match(await rationale.getText(),/img_abcdef、duplicate\.png 和 img_deadbeef/,'歧义缩写、重名文件及未知引用保留原文');
    const links=await rationale.findElements(By.css('.iad-evidence-ref'));
    const selected=()=>driver.executeScript('return [...document.querySelectorAll(".iad-direction-evidence-item[data-focused=true]")].map(e=>e.getAttribute("aria-label"))');
    const focusBefore=await driver.executeScript('return document.activeElement.getAttribute("aria-label")');
    await driver.actions().move({origin:links[1]}).perform();
    await driver.wait(async()=>JSON.stringify(await selected())===JSON.stringify(['查看证据 良品 N2']),3000);
    assert.equal(await driver.executeScript('return document.activeElement.getAttribute("aria-label")'),focusBefore,'悬浮仅预览，不能抢走键盘焦点');
    await driver.actions().move({origin:await el('.iad-direction-objective h3')}).perform();
    await driver.wait(async()=>(await selected()).length===0,3000);
    await(await el('button[aria-label="关闭方向引用联动"]')).sendKeys(Key.TAB);
    await driver.wait(async()=>await driver.executeScript('return document.activeElement.getAttribute("aria-label")')==='定位证据 良品 N1',3000);
    assert.deepEqual(await selected(),['查看证据 良品 N1'],'键盘聚焦引用应突出对应图像');
    await driver.actions().sendKeys(Key.ENTER).perform();
    await driver.wait(async()=>await driver.executeScript('return document.activeElement.getAttribute("aria-label")')==='查看证据 良品 N1',3000);
    await driver.actions().move({origin:links[1]}).perform();
    await driver.wait(async()=>JSON.stringify(await selected())===JSON.stringify(['查看证据 良品 N2']),3000);
    await driver.actions().move({origin:await el('.iad-direction-objective h3')}).perform();
    await driver.wait(async()=>JSON.stringify(await selected())===JSON.stringify(['查看证据 良品 N1']),3000,'结束悬浮后恢复点击选中的图像');
    await links[2].click();
    await driver.wait(async()=>await driver.executeScript('return document.activeElement.getAttribute("aria-label")')==='查看证据 良品 N3',3000);
    assert.deepEqual(await selected(),['查看证据 良品 N3']);
    await links[2].click();
    await driver.wait(async()=>await driver.executeScript('return document.activeElement.getAttribute("aria-label")')==='查看证据 良品 N3',3000,'重复点击同一引用仍应定位对应图像');
    assert.equal((await driver.findElements(By.css('dialog.iad-viewer-dialog'))).length,0,'正文引用定位图像，不额外打开大图');
    const card=await el('.iad-direction-evidence-item[data-focused=true]');
    assert.equal(await driver.executeScript('return getComputedStyle(arguments[0]).outlineStyle',card),'solid','选中边框真实可见');
    const output=path.resolve(app,'../../runs/browser/direction-references');await fs.mkdir(output,{recursive:true});
    await fs.writeFile(path.join(output,'selected-1920.png'),await driver.takeScreenshot(),'base64');
    assert.equal(await driver.executeScript('const d=document.querySelector("dialog.iad-direction-dialog");return d.scrollWidth>d.clientWidth+1'),false,'1920桌面文件引用不产生横向溢出');
  }finally{
    if(driver)await driver.quit();
    await new Promise(resolve=>server.close(resolve));
  }
});
