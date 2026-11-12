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

test('audit evidence combines all originals in one paginated gallery without tabs or an annotation toolbar',{timeout:60000},async()=>{
  const items=Array.from({length:14},(_,index)=>({
    sample_id:`sample_${index}`,role:index<12?'representative':'counter',
    caption:index<12?`典型原图 ${index+1}`:`对照原图 ${index-11}`,reason:'单张图像的详细分析只留在结构化记录，不放在缩略图下。',
    image:{evidence_id:`evidence_${index}`,role:'overview',representation:'raw',crop_bbox:[0,0,160,100],original_size:[160,100],sent_size:[160,100]},
    source:{dataset_format:'labelme',sample:{sample_id:`sample_${index}`,relative_path:`internal/${index}.svg`,width:160,height:100},
      annotations:[{annotation_id:`annotation_${index}`,raw_label:'缺陷',bbox:[20,20,70,60],geometry_status:'VALID'}]},
  }));
  const bundle=await build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {AuditEvidenceGallery} from './src/client/components/AuditEvidenceGallery.tsx';
    import {workbenchStyles} from './src/client/styles.ts';
    const style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
    function App(){const [items,setItems]=React.useState(${JSON.stringify(items)});
      return <main className="iad-workbench" style={{width:'min(780px,100%)',margin:'auto',padding:0}}>
      <button id="few-images" onClick={()=>setItems(items.slice(0,2))}>查看两张证据</button>
      <section id="audit-report" className="iad-dataset-report"><AuditEvidenceGallery items={items}
        imageUrl={item=>'/original/'+item.sample_id+'.svg'}/></section></main>;}
    createRoot(document.getElementById('root')).render(<App/>);
  `,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const original='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100"><rect width="160" height="100" fill="#168ed4"/><circle cx="10" cy="10" r="8" fill="white"/><circle cx="150" cy="90" r="8" fill="black"/></svg>';
  const server=http.createServer((req,res)=>{
    if(req.url==='/page.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(bundle.outputFiles[0].contents);}
    else if(req.url.startsWith('/original/')){res.writeHead(200,{'Content-Type':'image/svg+xml'});res.end(original);}
    else{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}</style><div id="root"></div><script src="/page.js"></script>');}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let driver;
  try{
    const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');
    options.setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    await viewport(driver,1000,900);await driver.get(`http://127.0.0.1:${server.address().port}`);
    const element=css=>driver.wait(until.elementLocated(By.css(css)),5000);
    await element('#audit-report img');
    assert.equal((await driver.findElements(By.xpath('//button[normalize-space(.)="原始标注"]'))).length,0,'证据图库没有额外的原始标注按钮');
    assert.equal((await driver.findElements(By.css('#audit-report [role=tab]'))).length,0,'典型和对照证据不分栏');
    assert.equal(await(await element('h4')).getText(),'图像证据');
    const text=await(await element('#audit-report')).getText();
    assert.ok(!text.includes('单张图像的详细分析')&&!text.includes('典型原图'),'图像下不显示图注或逐图分析');
    const labels=()=>driver.executeScript('return [...document.querySelectorAll(".iad-thumbnail-card")].map(e=>e.getAttribute("aria-label").replace(/^放大/,""))');
    await driver.wait(async()=>(await labels()).length===8,5000,'四列两行，每页八张');
    assert.deepEqual(await labels(),['0.svg','1.svg','2.svg','3.svg','4.svg','5.svg','6.svg','7.svg']);
    await driver.wait(()=>driver.executeScript('return [...document.querySelectorAll("#audit-report img")].every(i=>i.complete&&i.naturalWidth===160&&i.naturalHeight===100&&getComputedStyle(i).objectFit==="contain")'),5000);
    await(await element('nav[aria-label="图像证据分页"] button[aria-label="第 2 页"]')).click();
    assert.deepEqual(await labels(),['8.svg','9.svg','10.svg','11.svg','12.svg','13.svg'],'两类证据共用分页');
    const thumbnail=await element('.iad-thumbnail-card[aria-label="放大12.svg"]');
    await driver.executeScript('arguments[0].focus()',thumbnail);await driver.actions().sendKeys(Key.ENTER).perform();
    await element('#full-close');
    const image=await element('.full-image-world img');
    await driver.wait(()=>driver.executeScript('return arguments[0].complete&&arguments[0].naturalWidth===160',image),5000);
    assert.match(await image.getAttribute('src'),/\/original\/sample_12\.svg$/,'放大使用同一张完整原图');
    assert.equal(await image.getAttribute('alt'),'12.svg','大图显示原文件名');
    assert.ok((await(await element('dialog.iad-fullscreen-dialog')).getText()).includes('12.svg'),'大图标题显示文件名');
    assert.equal((await driver.findElements(By.css('.full-image-world .iad-annotation-layer'))).length,1);
    await(await element('#annotation-toggle')).click();
    assert.equal((await driver.findElements(By.css('.full-image-world .iad-annotation-layer'))).length,0);
    await(await element('#annotation-toggle')).click();
    assert.equal((await driver.findElements(By.css('.full-image-world .iad-annotation-layer'))).length,1);
    await(await element('#next-img')).click();
    await driver.wait(async()=>(await(await element('.full-image-world img')).getAttribute('alt'))==='13.svg',5000,'点击下一张后显示对应原文件名');
    await driver.actions().sendKeys(Key.ARROW_LEFT).perform();
    await driver.wait(async()=>(await(await element('.full-image-world img')).getAttribute('alt'))==='12.svg',5000,'到达末张后仍可用方向键返回');
    await(await element('#full-close')).click();
    await(await element('nav[aria-label="图像证据分页"] button[aria-label="第 1 页"]')).click();
    assert.equal((await labels())[0],'0.svg');
    await viewport(driver,800,844);await driver.setContext('chrome');
    await driver.executeScript("gBrowser.selectedBrowser.style.maxWidth='390px';gBrowser.selectedBrowser.style.width='390px';gBrowser.selectedBrowser.style.flex='none'");
    await driver.setContext('content');
    await driver.wait(async()=>(await labels()).length===4,5000,'窄屏两列两行');
    assert.equal(await driver.executeScript('return document.documentElement.scrollWidth<=innerWidth+1'),true);
    await(await element('#few-images')).click();
    await driver.wait(async()=>(await driver.findElements(By.css('#audit-report .iad-thumbnail-card'))).length===2,5000);
    assert.equal((await driver.findElements(By.css('nav[aria-label="图像证据分页"]'))).length,0,'只有一页时隐藏整条分页栏');
  }finally{
    if(driver)await driver.quit();
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  }
});
