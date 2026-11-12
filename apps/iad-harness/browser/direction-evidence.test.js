import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {viewport} from './workbench-layout.js';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('direction prose omits image identities and keeps independent selected image galleries', {timeout:60000}, async()=>{
  const prefixes=['24503e','01f90a','1d642f','9a1ff8','abcdef1','abcdef2'];
  const files=['normal/good-a.png','normal/good-b.png','normal/good-c.png','abnormal/ng-a.png','abnormal/duplicate.png','outside/duplicate.png'];
  const evidence=prefixes.map((prefix,index)=>({evidence_id:'img_'+prefix.padEnd(64,'0'),filename:files[index],sample_id:`ds_refs:${files[index]}`,sampling_group:index<3?'normal':'abnormal',candidate_role:null,observed:true,
    image:{evidence_id:'img_'+prefix.padEnd(64,'0'),source_sha256:String(index),role:'overview',representation:'raw',crop_bbox:[0,0,160,100],original_size:[160,100],sent_size:[160,100]}}));
  const direction={direction_id:'direction_refs',title:'方向引用联动',applies_to:'both',
    instruction:`核对 ${evidence[0].image.evidence_id}、${evidence[0].sample_id}、normal/good-b.png 和 good-c.png。`,
    rationale:`良品 ${evidence[0].evidence_id}、${evidence[1].evidence_id}、${evidence[2].evidence_id} 的边框连续；异常 ${evidence[3].evidence_id} 顶部有亮带。未精选关联 ${evidence[5].evidence_id}。`,
    key_evidence:evidence.slice(0,4).map((item,index)=>({evidence_id:item.evidence_id,role:index===3?'counter':'support',reason:'独立可见关系'+index,locator_id:null})),
    dataset_ids:['ds_refs'],counter_evidence_ids:[],evidence_ids:evidence.slice(0,5).map(item=>item.image.evidence_id),limitations:['仅在外缘可辨时进行比较。']};
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
    else if(req.url.startsWith('/api/iad/analysis/publications/analysis_version_refs/evidence/')){res.writeHead(200,{'Content-Type':'image/svg+xml'});res.end(pixel);}
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
    await driver.wait(()=>driver.executeScript('return [...document.querySelectorAll(".exp-direction-evidence-card img")].every(img=>img.complete&&img.naturalWidth>0)'),5000,'真实缩略图已加载后验收独立图库');
    const rationale=await el('.exp-direction-rationale');
    assert.equal((await driver.findElements(By.css('.exp-evidence-ref, .iad-evidence-ref, [data-evidence-ref]'))).length,0);
    const prose=await driver.executeScript('return [...document.querySelectorAll(".exp-direction-goal,.exp-direction-rationale,.exp-direction-limitations")].map(node=>node.textContent).join("\\n")');
    assert.doesNotMatch(prose,/img_[a-f0-9]{6,}|ds_refs|\.png/);
    assert.match(await rationale.getText(),/边框连续/);assert.match(await rationale.getText(),/顶部有亮带/);
    assert.equal((await rationale.findElements(By.css('button,a'))).length,0,'正文直接描述比较关系，没有图像定位交互');
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
    assert.doesNotMatch(await(await el('.exp-direction-evidence')).getText(),/暂无可用/,
      '未精选原图不能表示完整论据中没有可用证据');
    await driver.executeScript('window.showEvidenceVersion("legacy")');
    await driver.wait(async()=>(await driver.findElements(By.css('.exp-direction-evidence-card'))).length===5,3000,
      '旧版本没有精选字段时只使用其明确的历史引用');
    await viewport(driver,800,844);await driver.setContext('chrome');
    await driver.executeScript("gBrowser.selectedBrowser.style.maxWidth='390px';gBrowser.selectedBrowser.style.width='390px';gBrowser.selectedBrowser.style.flex='none'");
    await driver.setContext('content');await driver.wait(()=>driver.executeScript('return innerWidth===390'),5000);
    assert.equal(await driver.executeScript('const d=document.querySelector("dialog.exp-direction-dialog");return d.scrollWidth>d.clientWidth+1'),false);
    assert.equal((await driver.findElements(By.css('[data-evidence-ref]'))).length,0);
    await fs.writeFile(path.join(output,'selected-mobile.png'),await driver.takeScreenshot(),'base64');
  }finally{
    if(driver)await driver.quit();
    await new Promise(resolve=>server.close(resolve));
  }
});
