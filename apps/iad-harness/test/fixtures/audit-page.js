import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {viewport} from '../../browser/workbench-layout.js';
import {verifyReportMetadata} from '../../browser/report-layout.js';

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

export async function verifyAuditPage(base,consistencyJobId,auditJobId,{withKnowledge=false,knowledgeVersion}={}) {
  const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');
  if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  const element=css=>driver.wait(until.elementLocated(By.css(css)),10000);
  const click=async label=>(await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${label}' or @aria-label='${label}']`)),10000)).click();
  const output=path.resolve(app,'../../runs/verification/audit-native-pages');
  const prefix=withKnowledge?'audit-weak-knowledge':'audit-zero-knowledge';
  try {
    await viewport(driver,1920,1080);await driver.get(base+'/audit-browser');
    await driver.wait(()=>driver.executeScript('return document.querySelectorAll("#audit-images [data-sample-id]").length===2'),10000);
    await(await element('#audit-images [data-sample-id$=":1.png"]')).click();
    await driver.wait(()=>driver.executeScript('return document.querySelector("[data-audit-section=analysis]")?.textContent.includes("本场第二张独立疑点")'),10000);
    assert.equal(await driver.executeScript('return document.querySelectorAll(".audit-dialog [data-finding-id]").length'),3);
    await driver.wait(()=>driver.executeScript('const images=[...document.querySelectorAll(".audit-dialog img")];return images.length>0&&images.every(image=>image.complete&&[40,10].includes(image.naturalWidth))'),10000);
    assert.ok((await(await element('.audit-dialog a[download]')).getAttribute('href')).endsWith('/session.jsonl'));
    await fs.mkdir(output,{recursive:true});
    await fs.writeFile(path.join(output,prefix+'-detail.png'),await driver.takeScreenshot(),'base64');
    await click('关闭图像审计详情');await click('报告');
    await element(`#audit-report[data-run-id="${auditJobId}"]`);
    await driver.wait(()=>driver.executeScript('return document.querySelector("#audit-report")?.textContent.includes("发现疑点")'),10000);
    assert.equal(await driver.executeScript('return document.querySelectorAll("#generate-scope-report").length'),0);
    await verifyReportMetadata(driver);
    await fs.writeFile(path.join(output,prefix+'-report.png'),await driver.takeScreenshot(),'base64');
    await click('模型审计');await click('新建审计');
    assert.equal(await(await element('#audit-create-submit')).isEnabled(),false);
    const radio=await element(`input[aria-label="选择一致性作业 ${consistencyJobId}"]`);
    assert.equal(await radio.getAttribute('type'),'radio');await radio.click();
    if(withKnowledge){
      await(await element(`tr[data-version-id="${knowledgeVersion}"] input[name="audit-knowledge-source"]`)).click();
      await(await element('input[aria-label="选择知识条目 表面变化"]')).click();
      await(await element('input[aria-label="选择知识条目 暂定外观"]')).click();
      assert.ok((await(await element('#audit-create-summary')).getText()).includes('2 条'));
    }
    await driver.wait(async()=>await(await element('#audit-create-submit')).isEnabled(),10000);
    await fs.writeFile(path.join(output,prefix+'-setup.png'),await driver.takeScreenshot(),'base64');
    await driver.executeScript('const frame=document.createElement("iframe");frame.id="audit-phone";frame.src=arguments[0];frame.style="width:375px;height:900px;position:fixed;top:0;left:0;border:0;z-index:999999";document.body.append(frame)',base+'/audit-browser');
    await driver.switchTo().frame(await element('#audit-phone'));
    await click('新建审计');
    await element('#audit-create-view');
    const mobile=await driver.executeScript('return {width:innerWidth,scroll:document.documentElement.scrollWidth,panels:[...document.querySelectorAll(".audit-source-panel")].map(panel=>({left:panel.getBoundingClientRect().left,right:panel.getBoundingClientRect().right}))}');
    assert.equal(mobile.width,375);assert.ok(mobile.scroll<=375,JSON.stringify(mobile));
    assert.ok(mobile.panels.every(panel=>panel.left>=0&&panel.right<=375),JSON.stringify(mobile));
    await fs.writeFile(path.join(output,'audit-zero-knowledge-mobile.png'),await(await element('#audit-create-view')).takeScreenshot(),'base64');
    await driver.switchTo().defaultContent();await driver.executeScript('document.getElementById("audit-phone").remove()');
    await(await element('#audit-create-submit')).click();
    await driver.wait(()=>driver.executeScript('return !document.querySelector("#audit-create-view")&&document.querySelectorAll(".audit-table tr[data-run-id]").length===2'),10000);
  } catch(error) {
    await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'audit-failure.png'),await driver.takeScreenshot(),'base64');
    await fs.writeFile(path.join(output,'audit-failure.txt'),await driver.findElement(By.css('body')).getText());throw error;
  } finally {await driver.quit();}
}
