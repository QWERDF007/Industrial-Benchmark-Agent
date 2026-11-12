import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {viewport} from '../../browser/workbench-layout.js';

const app=fileURLToPath(new URL('../..',import.meta.url));

export async function auditPageBundle(dataset) {
  const bundle=await build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {AuditPage} from './src/client/components/AuditPage.tsx';
    import {WorkbenchProviders} from './src/client/host/WorkbenchProviders.tsx';
    import {Workspace} from './src/client/workspace.tsx';
    import {WorkbenchSession} from './src/client/workbench-session.ts';
    import {workbenchStyles} from './src/client/styles.ts';
    const style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
    const workspace=new Workspace(new WorkbenchSession({}));workspace.selectDataset(${JSON.stringify(dataset.dataset_id)});
    createRoot(document.getElementById('root')).render(<WorkbenchProviders workspace={workspace}>
      <div className="iad-workbench"><AuditPage dataset={${JSON.stringify(dataset)}} datasets={[${JSON.stringify(dataset)}]} groups={[]}
        refreshRevision={0} onDatasetsChanged={()=>{}}/></div></WorkbenchProviders>);
  `,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  return bundle.outputFiles[0].contents;
}

export async function verifyAuditPage(base,_consistencyJobId,auditJobId,{withKnowledge=false,reportHtml}={}) {
  const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');
  options.setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox');
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  const element=css=>driver.wait(until.elementLocated(By.css(css)),10000);
  const click=async css=>{const item=await element(css);await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',item);await item.click();};
  const output=path.resolve(app,'../../runs/verification/audit-native-pages');
  await fs.mkdir(output,{recursive:true});
  const verifyGallery=async()=>{
    await element('[data-audit-discovery]');
    assert.equal((await driver.findElements(By.css('#audit-report .iad-audit-gallery .iad-thumbnail-card'))).length,withKnowledge?2:1);
    assert.equal((await driver.findElements(By.css('.iad-audit-gallery [role="tab"],.iad-audit-gallery .iad-thumbnail-caption'))).length,0);
    await driver.wait(()=>driver.executeScript('return [...document.querySelectorAll("#audit-report img")].every(image=>image.complete&&image.naturalWidth===40)'),10000);
    await click('#audit-report .iad-audit-gallery .iad-thumbnail-card');await element('#annotation-toggle');await click('#annotation-toggle');await click('#full-close');
    assert.ok(!(await(await element('#audit-report')).getText()).includes(auditJobId));
  };
  try{
    await viewport(driver,1440,1080);await driver.get(base+'/audit-browser');
    await click('#audit-images [data-sample-id$=":1.png"]');
    await driver.wait(()=>driver.executeScript('return document.querySelector("[data-audit-section=analysis]")?.textContent.includes("本场第二张独立疑点")'),10000);
    assert.equal((await driver.findElements(By.css('[data-finding-id]'))).length,3);
    const references=await driver.findElements(By.css('[data-audit-section="references"] .iad-thumbnail-card'));
    assert.equal(references.length>0,withKnowledge);
    assert.equal(await driver.executeScript('return document.querySelector(".dc-compare-photo").getBoundingClientRect().height>=300'),true);
    for(const reference of references){await reference.click();await element('#full-close');await click('#full-close');}
    await fs.writeFile(path.join(output,'audit-'+withKnowledge+'-detail.png'),await driver.takeScreenshot(),'base64');
    await click('[aria-label="关闭图像审计详情"]');
    await click('button[role="tab"][id$="reports"]');await verifyGallery();
    await viewport(driver,800,844);await driver.setContext('chrome');
    await driver.executeScript("gBrowser.selectedBrowser.style.maxWidth='390px';gBrowser.selectedBrowser.style.width='390px';gBrowser.selectedBrowser.style.flex='none'");
    await driver.setContext('content');
    await driver.wait(()=>driver.executeScript('return innerWidth===390'),5000);
    assert.ok(await driver.executeScript('return document.documentElement.scrollWidth<=innerWidth+1'));
    const offline=path.join(output,'audit-'+withKnowledge+'-report.html');await fs.writeFile(offline,reportHtml);
    await driver.get('file://'+offline);await verifyGallery();
    assert.equal(await driver.executeScript('return performance.getEntriesByType("resource").filter(item=>/^https?:/.test(item.name)).length'),0);
    await fs.writeFile(path.join(output,'audit-'+withKnowledge+'-offline.png'),await driver.takeScreenshot(),'base64');
    await viewport(driver,1440,1080);await driver.get(base+'/audit-browser');
    await click(`tr[data-run-id="${auditJobId}"] button[title="查看提示词"]`);
    await driver.wait(async()=>(await driver.findElements(By.css('.iad-prompt-text'))).length===5,10000);
  }finally{await driver.quit();}
}
