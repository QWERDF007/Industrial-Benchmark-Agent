import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
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

export async function verifyAuditPage(base,consistencyJobId,auditJobId,{withKnowledge=false,knowledgeVersion,reportHtml}={}) {
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
    assert.equal((await driver.findElements(By.css(`tr[data-run-id="${auditJobId}"] button[title="删除审计作业"]`))).length,1,'操作列提供删除审计作业');
    const search=await element('input[aria-label="搜索审计图像"]');
    await search.sendKeys('no-matching-filename');
    await driver.wait(()=>driver.executeScript('return document.querySelectorAll("#audit-images [data-sample-id]").length===0'),10000);
    assert.ok(await driver.executeScript('return arguments[0].isConnected',search),'筛选结果读取期间不得卸载输入框并丢失焦点');
    await search.clear();await search.sendKeys(Key.SPACE,Key.BACK_SPACE);
    await driver.wait(()=>driver.executeScript('return document.querySelectorAll("#audit-images [data-sample-id]").length===2'),10000);
    await(await element('#audit-images [data-sample-id$=":1.png"]')).click();
    await driver.wait(()=>driver.executeScript('return document.querySelector("[data-audit-section=analysis]")?.textContent.includes("本场第二张独立疑点")'),10000);
    assert.equal(await driver.executeScript('return document.querySelectorAll(".audit-dialog [data-finding-id]").length'),3);
    await driver.wait(()=>driver.executeScript('const images=[...document.querySelectorAll(".audit-dialog img")];return images.length>0&&images.every(image=>image.complete&&[40,10].includes(image.naturalWidth))'),10000);
    const layout=await driver.executeScript('const body=document.querySelector(".audit-dialog-body");return {first:body.firstElementChild?.dataset.auditSection,heights:[...body.querySelectorAll(".dc-compare-photo")].map(e=>Math.round(e.getBoundingClientRect().height)),headings:[...body.querySelectorAll("h3")].map(e=>e.textContent)}');
    assert.equal(layout.first,'images');assert.deepEqual(layout.heights,[450]);
    assert.ok(layout.headings.includes('判定结论')&&layout.headings.includes('模型分析'));
    assert.ok(!layout.headings.includes('图像证据'));
    const references=await driver.findElements(By.css('.audit-dialog [aria-label="参考图像证据"] button.iad-thumbnail-card'));
    if(withKnowledge)assert.ok(references.length>0,'已补看的参考原图应可用缩略图切换');
    const beforeAnalysis=await(await element('[data-audit-section="analysis"]')).getText();
    const beforeConclusion=await(await element('[data-audit-section="conclusion"]')).getText();
    for(const reference of references){
      await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',reference);await reference.click();
      await element('[aria-label="大图查看区域"]');
      await(await element('#full-close')).click();
      assert.equal(await(await element('[data-audit-section="analysis"]')).getText(),beforeAnalysis);
      assert.equal(await(await element('[data-audit-section="conclusion"]')).getText(),beforeConclusion);
    }
    if(!references.length){
      assert.equal(await driver.executeScript('return document.querySelectorAll(".audit-dialog .dc-compare-cell:nth-child(2)").length'),0);
      assert.equal(await(await element('[data-audit-section="references"]')).getText(),'参考图');
    }

    assert.equal(await driver.executeScript('return document.querySelectorAll(".audit-dialog details").length'),0,'详情不额外展示上游原始结果分栏');
    assert.equal(await driver.executeScript('return [...document.querySelectorAll(".audit-dialog a")].some(a=>a.hasAttribute("download")||a.textContent.includes("完整一致性记录"))'),false,'详情不额外展示一致性跳转或Session下载');
    await fs.mkdir(output,{recursive:true});
    await fs.writeFile(path.join(output,prefix+'-detail.png'),await driver.takeScreenshot(),'base64');
    await click('关闭图像审计详情');await click('报告');
    await element(`#audit-report[data-run-id="${auditJobId}"]`);
    await driver.wait(()=>driver.executeScript('return document.querySelector("#audit-report")?.textContent.includes("独立质量疑点")'),10000);
    assert.equal(await driver.executeScript('return document.querySelectorAll("#generate-scope-report").length'),0);
    assert.equal(await driver.executeScript('return document.querySelectorAll("#audit-report table").length'),0);
    assert.ok(!(await(await element('#audit-report')).getText()).includes('完整图级明细'),'报告不罗列逐图明细');
    assert.equal(await driver.executeScript('return document.querySelectorAll("#audit-report details").length'),0);
    await driver.wait(()=>driver.executeScript('return document.querySelectorAll("#audit-report .iad-audit-chart svg").length>=5'),10000);
    assert.ok(!(await(await element('#audit-report')).getText()).includes(auditJobId),'业务报告不展示作业ID');
    assert.equal(await driver.executeScript('return [...document.querySelectorAll("#audit-report a")].some(a=>a.textContent.includes("Session"))'),false,'报告页不增加Session下载入口');
    await fs.writeFile(path.join(output,prefix+'-report.png'),await driver.takeScreenshot(),'base64');
    assert.equal(await driver.executeScript('return [...document.querySelectorAll("#audit-report button")].some(b=>b.textContent.includes("查看全部涉及图像"))'),false);
    const evidence=await element('#audit-report [data-audit-evidence-role="representative"] .iad-thumbnail-card');
    const location=await driver.getCurrentUrl();
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',evidence);await evidence.click();
    await element('[aria-label="大图查看区域"]');
    assert.equal(await driver.getCurrentUrl(),location);
    assert.equal(await driver.executeScript('return document.querySelectorAll(".audit-dialog").length'),0);
    await(await element('#full-close')).click();
    await verifyReportEvidence(driver,{withKnowledge});
    const onlineCharts=await driver.executeScript('return [...document.querySelectorAll("#audit-report .iad-audit-chart")].map(e=>({key:e.dataset.chart,summary:e.querySelector("[role=img]").getAttribute("aria-label")}))');
    await verifyChartInteractions(driver);
    const offline=path.join(output,prefix+'-report.html');await fs.writeFile(offline,reportHtml);
    const handle=await driver.getWindowHandle();await driver.switchTo().newWindow('tab');
    await driver.get('file://'+offline);
    await driver.wait(()=>driver.executeScript('return document.querySelectorAll("#audit-report .iad-audit-chart svg").length>=5'),15000);
    assert.equal(await driver.executeScript('return document.querySelectorAll("#audit-report details").length'),0,'导出HTML不罗列逐图明细');
    assert.deepEqual(await driver.executeScript('return [...document.querySelectorAll("#audit-report .iad-audit-chart")].map(e=>({key:e.dataset.chart,summary:e.querySelector("[role=img]").getAttribute("aria-label")}))'),onlineCharts);
    await verifyChartInteractions(driver);
    await verifyReportEvidence(driver,{withKnowledge});
    const card=await element('#audit-report [data-audit-evidence-role="representative"] .iad-thumbnail-card');
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',card);await card.click();await element('[aria-label="大图查看区域"]');
    assert.ok(await driver.executeScript('return document.querySelector(".full-image-world img")?.src.startsWith("data:image/")'));
    assert.equal(await driver.executeScript('return performance.getEntriesByType("resource").filter(e=>/^https?:/.test(e.name)).length'),0,'离线报告不访问HTTP图像、脚本或API');
    await(await element('#full-close')).click();
    await fs.writeFile(path.join(output,prefix+'-offline.png'),await driver.takeScreenshot(),'base64');
    await driver.close();await driver.switchTo().window(handle);
    await click('模型审计');
    await(await element(`button[aria-label="查看作业提示词 ${auditJobId}"]`)).click();
    await driver.wait(()=>driver.executeScript('return document.querySelectorAll(".iad-prompt-drawer pre").length===3'),10000);
    assert.ok((await(await element('.iad-prompt-drawer')).getText()).includes('报告用户提示词'));
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await click('新建审计');
    assert.equal(await(await element('#audit-create-submit')).isEnabled(),false);
    assert.deepEqual(await driver.executeScript('return [...document.querySelectorAll(".iad-prompt-editor")].map(node=>Math.round(node.getBoundingClientRect().height))'),[300,300,300]);
    const promptEdges=await driver.executeScript('return [...document.querySelectorAll(".iad-prompt-editor")].map(node=>{const rect=node.getBoundingClientRect();return [Math.round(rect.left),Math.round(rect.right)];})');
    assert.deepEqual(promptEdges,[promptEdges[0],promptEdges[0],promptEdges[0]],'系统、逐图和报告提示词左右边距一致');
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
    const createdId=await driver.executeScript('return [...document.querySelectorAll(".audit-table tr[data-run-id]")].map(row=>row.dataset.runId).find(id=>id!==arguments[0])',auditJobId);
    const removeSelector=`tr[data-run-id="${createdId}"] button[title="删除审计作业"]`;
    await driver.wait(async()=>await(await element(removeSelector)).isEnabled(),20000);
    await(await element(`tr[data-run-id="${createdId}"] td`)).click();
    await(await element(removeSelector)).click();await element('dialog[open] #confirm-accept');
    await click('取消删除');
    assert.equal((await driver.findElements(By.css(`tr[data-run-id="${createdId}"]`))).length,1,'取消删除保留作业');
    await(await element(removeSelector)).click();await(await element('#confirm-accept')).click();
    await driver.wait(()=>driver.executeScript('return document.querySelectorAll(".audit-table tr[data-run-id]").length===1'),10000);
    assert.equal((await(await element('.audit-table tr[data-run-id]')).getAttribute('data-run-id')),auditJobId);
    await driver.wait(()=>driver.executeScript('return document.querySelectorAll("#audit-images [data-sample-id]").length===2'),10000);
    await click('报告');await element(`#audit-report[data-run-id="${auditJobId}"]`);
  } catch(error) {
    await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'audit-failure.png'),await driver.takeScreenshot(),'base64');
    await fs.writeFile(path.join(output,'audit-failure.txt'),await driver.findElement(By.css('body')).getText());throw error;
  } finally {await driver.quit();}
}

async function verifyReportEvidence(driver,{withKnowledge}) {
  const tabs=await driver.findElements(By.xpath('//*[@id="audit-report"]//button[normalize-space(.)="对照证据"]'));
  assert.ok(tabs.length);await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',tabs[0]);await tabs[0].click();
  assert.equal(await driver.executeScript('return document.querySelectorAll("#audit-report [data-audit-evidence-role=counter] .iad-thumbnail-card").length'),withKnowledge?1:0);
  if(!withKnowledge)assert.equal(await driver.executeScript('return document.querySelector("#audit-report [data-audit-evidence-role=counter]").textContent'),'', '无对照证据时留白');
  const typical=await driver.findElement(By.xpath('//*[@id="audit-report"]//button[normalize-space(.)="典型证据"]'));await typical.click();
  assert.equal(await driver.executeScript('return document.querySelectorAll("#audit-report [data-audit-evidence-role=representative] .iad-thumbnail-card").length'),1);
}

async function verifyChartInteractions(driver) {
  const chart=await driver.findElement(By.css('#audit-report [data-chart="coverage"]'));
  await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',chart);
  const arc=await chart.findElement(By.css('path[fill="#3278c7"]'));
  await driver.actions().move({origin:arc,x:85,y:0}).perform();
  await driver.wait(async()=>{const tips=await chart.findElements(By.css('.iad-audit-chart-tooltip'));return tips.length&&await tips[0].isDisplayed();},5000);
  assert.ok((await(await chart.findElement(By.css('.iad-audit-chart-tooltip'))).getText()).includes('2 张'));
  const texts=await chart.findElements(By.xpath('.//*[local-name()="text" and text()="已完成"]'));
  let legend;for(const text of texts)if(await driver.executeScript('return arguments[0].getBoundingClientRect().top>arguments[1].getBoundingClientRect().top+270',text,chart))legend=text;
  assert.ok(legend,'覆盖图具有可切换图例');await legend.click();
  await driver.wait(async()=>(await chart.findElements(By.css('path[fill="#3278c7"]'))).length===0,5000);
  await(await chart.findElements(By.xpath('.//*[local-name()="text" and text()="已完成"]'))).at(-1).click();
  await driver.wait(async()=>(await chart.findElements(By.css('path[fill="#3278c7"]'))).length>0,5000);
}
