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

for(const compare of [false,true])test(`audit originals show filenames and inline evidence${compare?' with comparison tabs':' with responsive pagination'}`,{timeout:60000},async()=>{
  const items=Array.from({length:8},(_,index)=>({
    sample_id:`sample_${index}`,role:compare&&index>=4?'counter':'representative',caption:'原图',reason:`查看第${index+1}处边缘。`,
    image:{evidence_id:`evidence_${index}`,role:'overview',representation:'raw',crop_bbox:[0,0,160,100],original_size:[160,100],sent_size:[160,100]},
    source:{dataset_format:'labelme',sample:{sample_id:`sample_${index}`,relative_path:`internal/${index}.svg`,width:160,height:100},
      annotations:[{annotation_id:`annotation_${index}`,raw_label:'缺陷',bbox:[20,20,70,60],geometry_status:'VALID'}]},
  }));
  const bundle=await build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {AuditEvidenceGallery} from './src/client/components/AuditEvidenceGallery.tsx';
    import {AuditCaseGallery} from './src/client/components/AuditReportCases.tsx';
    import {workbenchStyles} from './src/client/styles.ts';
    const style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
    const originals=${JSON.stringify(items)};
    function App(){const [items,setItems]=React.useState(originals),[related,setRelated]=React.useState(false);
      return <main className="iad-workbench" style={{width:'min(780px,100%)',margin:'auto',padding:0}}>
        <button id="few-images" onClick={()=>setItems(items.slice(0,3))}>查看三张证据</button>
        <button id="related-images" onClick={()=>setRelated(true)}>查看对应分析</button>
        <section id="audit-report" className="iad-dataset-report"><AuditEvidenceGallery items={items}
          imageUrl={item=>'/original/'+item.sample_id+'.svg'}/></section>
        {related&&<section id="related-analysis"><h3>比较不同方向的边缘</h3><p>查看横向边缘和转弯处的形态。</p>
          <AuditCaseGallery ids={['edge','corner']} report={{evidence_groups:{'case:edge':originals.slice(0,4),'case:corner':originals.slice(2,5)}}}
            imageUrl={item=>'/original/'+item.sample_id+'.svg'}/></section>}
      </main>;}
    createRoot(document.getElementById('root')).render(<App/>);
  `,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const original='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100"><rect width="160" height="100" fill="#168ed4"/><circle cx="10" cy="10" r="8" fill="white"/></svg>';
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
    const element=css=>driver.wait(until.elementLocated(By.css(css)),10000);
    const click=async css=>{const node=await element(css);await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',node);await node.click();};
    await viewport(driver,1000,900);await driver.get(`http://127.0.0.1:${server.address().port}`);
    await element('#audit-report img');
    assert.equal((await driver.findElements(By.css('#audit-report .iad-thumbnail-card'))).length,compare?4:8);
    assert.equal((await driver.findElements(By.css('#audit-report [role="tab"]'))).length,compare?2:0);
    assert.equal((await driver.findElements(By.css('#audit-report nav'))).length,0);
    await click('#audit-report .iad-thumbnail-card');
    assert.equal(await(await element('#full-file-name')).getText(),'0.svg');
    assert.equal(await(await element('.full-image-world img')).getAttribute('alt'),'0.svg');
    await driver.wait(()=>driver.executeScript('return document.querySelector(".full-image-world img").complete'),5000);
    await click('#annotation-toggle');assert.equal((await driver.findElements(By.css('.full-image-world .iad-annotation-layer'))).length,0);
    await click('#annotation-toggle');assert.equal((await driver.findElements(By.css('.full-image-world .iad-annotation-layer'))).length,1);
    await click('#next-img');assert.equal(await(await element('#full-file-name')).getText(),'1.svg');
    await driver.actions().sendKeys(Key.ARROW_LEFT).perform();
    await driver.wait(async()=>(await(await element('#full-file-name')).getText())==='0.svg',5000);
    await click('#full-close');
    assert.equal(await driver.executeScript('return document.activeElement===document.querySelector("#audit-report .iad-thumbnail-card")'),true);
    if(compare){
      await click('#audit-report [role="tab"]:last-child');
      assert.deepEqual(await driver.executeScript('return [...document.querySelectorAll("#audit-report img")].map(i=>i.alt)'),['4.svg','5.svg','6.svg','7.svg']);
      await click('#audit-report .iad-thumbnail-card');assert.equal(await(await element('#full-file-name')).getText(),'4.svg');await click('#full-close');
      await click('#audit-report [role="tab"]:first-child');
    }
    await viewport(driver,800,844);await driver.setContext('chrome');
    await driver.executeScript("gBrowser.selectedBrowser.style.maxWidth='390px';gBrowser.selectedBrowser.style.width='390px';gBrowser.selectedBrowser.style.flex='none'");
    await driver.setContext('content');
    await driver.wait(async()=>(await driver.findElements(By.css('#audit-report .iad-thumbnail-card'))).length===4,5000);
    if(!compare){await click('#audit-report nav button[aria-label="第 2 页"]');assert.equal(await(await element('#audit-report img')).getAttribute('alt'),'4.svg');}
    await click('#few-images');
    await driver.wait(async()=>(await driver.findElements(By.css('#audit-report .iad-thumbnail-card'))).length===3,5000);
    assert.equal((await driver.findElements(By.css('#audit-report nav,#audit-report [role="tab"]'))).length,0);
    await click('#related-images');
    await element('#related-analysis .iad-audit-gallery img');
    assert.equal((await driver.findElements(By.css('#related-analysis .iad-thumbnail-card'))).length,4,'相同原图在当前分析内去重');
    assert.equal((await driver.findElements(By.css('a[href^="#audit-"],table,.iad-thumbnail-caption'))).length,0);
    assert.equal(await driver.executeScript('return document.documentElement.scrollWidth<=innerWidth+1'),true);
  }finally{
    if(driver)await driver.quit();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  }
});
