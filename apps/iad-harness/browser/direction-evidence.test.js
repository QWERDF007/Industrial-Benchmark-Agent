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

test('direction citations display compact labels and link pointer and keyboard selection', {timeout:60000}, async()=>{
  const prefixes=['24503e','01f90a','1d642f','9a1ff8','abcdef1','abcdef2'];
  const files=['normal/good-a.png','normal/good-b.png','normal/good-c.png','abnormal/ng-a.png','abnormal/duplicate.png','outside/duplicate.png'];
  const evidence=prefixes.map((prefix,index)=>({evidence_id:'img_'+prefix.padEnd(64,'0'),filename:files[index],sample_id:`ds_refs:${files[index]}`,sampling_group:index<3?'normal':'abnormal',candidate_role:null,observed:true,
    image:{evidence_id:'img_'+prefix.padEnd(64,'0'),source_sha256:String(index),role:'overview',representation:'raw',crop_bbox:[0,0,160,100],original_size:[160,100],sent_size:[160,100]}}));
  const direction={direction_id:'direction_refs',title:'方向引用联动',applies_to:'both',
    instruction:`核对 ${evidence[0].image.evidence_id}、${evidence[0].sample_id}、normal/good-b.png 和 good-c.png。`,
    rationale:`良品 ${evidence[0].evidence_id}、${evidence[1].evidence_id}、${evidence[2].evidence_id} 的边框连续；异常 ${evidence[3].evidence_id} 顶部有亮带。未精选关联 ${evidence[5].evidence_id}。不解析 img_24503e、img_abcdef、duplicate.png 和 img_deadbeef。`,
    key_evidence:evidence.slice(0,4).map((item,index)=>({evidence_id:item.evidence_id,role:index===3?'counter':'support',reason:'独立可见关系'+index,locator_id:null})),
    dataset_ids:['ds_refs'],counter_evidence_ids:[],evidence_ids:evidence.slice(0,5).map(item=>item.image.evidence_id),limitations:['保留未解析引用 unknown-evidence-id。']};
  const snapshot={version_id:'analysis_version_refs',removed_direction_ids:[],catalog:{directions:[direction]},evidence};
  const bundle=await build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {DirectionDetailDialog} from './src/client/components/DirectionDetailDialog.tsx';
    import {explorationDirections} from './src/client/exploration-view.ts';
    import {workbenchStyles} from './src/client/styles.ts';
    const style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
    const snapshot=${JSON.stringify(snapshot)};
    function App(){
      const [mode,setMode]=React.useState('selected');window.showEvidenceVersion=setMode;
      const published=mode==='selected'?snapshot:{...snapshot,finalization:mode==='legacy'?null:{complete:false},
        catalog:{directions:[{...snapshot.catalog.directions[0],key_evidence:null}]}};
      return <DirectionDetailDialog direction={explorationDirections(published)[0]} onOpenFullscreen={()=>{}} onClose={()=>{}}/>;
    }
    createRoot(document.getElementById('root')).render(<App/>);
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
    await el('dialog.exp-direction-dialog[open]');
    await driver.wait(()=>driver.executeScript('return [...document.querySelectorAll(".exp-direction-evidence-card img")].every(img=>img.complete&&img.naturalWidth>0)'),5000,'真实缩略图已加载后验收引用联动');
    const rationale=await el('.exp-direction-rationale');
    assert.deepEqual(await driver.executeScript('return [...arguments[0].querySelectorAll(".exp-evidence-ref")].map(e=>e.textContent)',rationale),['良品 N1','良品 N2','良品 N3','异常 A1'],'正文引用应显示与缩略图一致的短标签');
    assert.equal((await driver.findElements(By.css('.exp-direction-goal .exp-evidence-ref'))).length,1,'只解析完整登记证据ID，不从sample_id、路径或文件名推断引用');
    assert.match(await rationale.getText(),/img_abcdef、duplicate\.png 和 img_deadbeef/,'歧义缩写、重名文件及未知引用保留原文');
    const links=await rationale.findElements(By.css('.exp-evidence-ref'));
    assert.deepEqual(await Promise.all(links.map(link=>link.getDomAttribute('title'))),[null,null,null,null],'正文不重复展示完整文件名悬浮提示');
    const selected=()=>driver.executeScript('return [...document.querySelectorAll(".exp-direction-evidence-card[data-highlighted=true]")].map(e=>e.getAttribute("aria-label"))');
    const focusBefore=await driver.executeScript('return document.activeElement.getAttribute("aria-label")');
    await driver.actions().move({origin:links[1]}).perform();
    await driver.wait(async()=>JSON.stringify(await selected())===JSON.stringify(['查看良品 N2大图']),3000);
    assert.equal(await driver.executeScript('return document.activeElement.getAttribute("aria-label")'),focusBefore,'悬浮仅预览，不能抢走键盘焦点');
    await driver.actions().move({origin:await el('.exp-direction-goal h3')}).perform();
    await driver.wait(async()=>(await selected()).length===0,3000);
    await driver.executeScript('arguments[0].focus()',links[0]);
    await driver.wait(async()=>JSON.stringify(await selected())===JSON.stringify(['查看良品 N1大图']),3000);
    await driver.actions().sendKeys(Key.ENTER).perform();
    assert.equal(await driver.executeScript('return document.activeElement===arguments[0]',links[0]),true,'定位引用保留键盘焦点');
    await links[2].click();
    await driver.wait(async()=>JSON.stringify(await selected())===JSON.stringify(['查看良品 N3大图']),3000);
    await links[2].click();
    assert.deepEqual(await selected(),['查看良品 N3大图']);
    assert.equal((await driver.findElements(By.css('dialog.iad-viewer-dialog'))).length,0,'正文引用定位图像，不额外打开大图');
    const card=await el('.exp-direction-evidence-card[data-highlighted=true]');
    assert.equal(await card.getAttribute('data-highlighted'),'true');
    assert.equal((await driver.findElements(By.css('.exp-direction-evidence-card'))).length,4,'只展示版本精选，不从完整支持或正文补图');
    assert.equal((await driver.findElements(By.css('[data-evidence-kind=normal] .exp-direction-evidence-card'))).length,3);
    assert.equal((await driver.findElements(By.css('[data-evidence-kind=defect] .exp-direction-evidence-card'))).length,1);
    const output=path.resolve(app,'../../runs/browser/direction-references');await fs.mkdir(output,{recursive:true});
    await fs.writeFile(path.join(output,'selected-1920.png'),await driver.takeScreenshot(),'base64');
    assert.equal(await driver.executeScript('const d=document.querySelector("dialog.exp-direction-dialog");return d.scrollWidth>d.clientWidth+1'),false,'1920桌面文件引用不产生横向溢出');
    await driver.executeScript('window.showEvidenceVersion("draft")');
    await driver.wait(async()=>(await driver.findElements(By.css('.exp-direction-evidence-card'))).length===0,3000,
      '新部分版本尚未精选时保留空栏，不把全量支持当精选');
    assert.equal((await driver.findElements(By.css('.exp-evidence-ref'))).length,0);
    await driver.executeScript('window.showEvidenceVersion("legacy")');
    await driver.wait(async()=>(await driver.findElements(By.css('.exp-direction-evidence-card'))).length===5,3000,
      '旧版本没有精选字段时只使用其明确的历史引用');
  }finally{
    if(driver)await driver.quit();
    await new Promise(resolve=>server.close(resolve));
  }
});
