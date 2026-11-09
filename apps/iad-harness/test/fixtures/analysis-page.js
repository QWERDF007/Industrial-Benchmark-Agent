import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder, By, Key, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {viewport} from '../../browser/workbench-layout.js';

const app = fileURLToPath(new URL('../..', import.meta.url));

export async function analysisPageBundle(module, dataset, initialLocation = {}) {
  const bundle = await build({stdin: {contents: `
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {ExplorationPage} from './src/client/components/ExplorationPage.tsx';
    import {KnowledgePage} from './src/client/components/KnowledgePage.tsx';
    import {WorkbenchProviders} from './src/client/host/WorkbenchProviders.tsx';
    import {Workspace,useWorkspace} from './src/client/workspace.tsx';
    import {WorkbenchSession} from './src/client/workbench-session.ts';
    import {workbenchStyles} from './src/client/styles.ts';
    const style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
    const workspace=new Workspace(new WorkbenchSession({}));workspace.openLocation({pageId:${JSON.stringify(module==='exploration'?'industrial-exploration':'industrial-knowledge')},datasetId:${JSON.stringify(dataset.dataset_id)},...${JSON.stringify(initialLocation)}});
    function Pages(){const{state}=useWorkspace();const Page=state.pageId==='industrial-exploration'?ExplorationPage:KnowledgePage;return <Page dataset={${JSON.stringify(dataset)}} refreshRevision={0}/>;}
    createRoot(document.getElementById('root')).render(<WorkbenchProviders workspace={workspace}>
      <Pages/></WorkbenchProviders>);
  `, loader: 'tsx', resolveDir: app}, bundle: true, format: 'iife', write: false, target: 'es2022',
    define: {'process.env.NODE_ENV': '"production"'}});
  return bundle.outputFiles[0].contents;
}

export async function verifyAnalysisRoiPage(base) {
  const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');
  if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  const element=css=>driver.wait(until.elementLocated(By.css(css)),10000);
  const output=path.resolve(app,'../../runs/verification/analysis-native-pages');
  try {
    await viewport(driver,1920,1080);await driver.get(base+'/analysis-browser');
    await(await driver.wait(until.elementLocated(By.css('button[aria-label="查看知识条目 边缘关系"]')),10000)).click();
    const version=await(await element('button[aria-label="导出当前作业成果"]')).getAttribute('data-version-id');
    const publication=await(await fetch(base+'/api/iad/analysis/publications/'+version)).json();
    const lastRoi=publication.evidence.filter(item=>item.image.role==='roi'&&item.image.representation==='raw').at(-1);
    await(await element('button[aria-label="放大支持证据 1"]')).click();
    await element('#full-overlay');
    await driver.wait(async()=>!!await(await element('button[aria-label="下一张图像"]')).isDisplayed(),10000);
    for(let index=0;index<59;index++)await driver.actions().sendKeys(Key.ARROW_RIGHT).perform();
    await driver.wait(()=>driver.executeScript('const image=document.querySelector("#full-overlay img");return image?.complete&&image.naturalWidth===7&&decodeURIComponent(new URL(image.src).pathname.split("/").at(-1))===arguments[0]',lastRoi.evidence_id),10000);
    assert.equal(await driver.executeScript('return document.querySelectorAll("#full-overlay .iad-annotation-layer rect").length'),30);
    await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'knowledge-thirtieth-roi.png'),await driver.takeScreenshot(),'base64');
  } catch(error) {
    await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'knowledge-roi-failure.png'),await driver.takeScreenshot(),'base64');throw error;
  } finally {await driver.quit();}
}

export async function verifyAnalysisPage(base, module, {partialVersionId,emptyCatalog,initialFailure} = {}) {
  const downloads=await fs.mkdtemp(path.join(os.tmpdir(),'iad-analysis-download-'));
  const options = new firefox.Options().addArguments('-headless', '--remote-allow-system-access');
  options.setPreference('browser.download.folderList',2).setPreference('browser.download.dir',downloads)
    .setPreference('browser.helperApps.neverAsk.saveToDisk','application/zip');
  if (process.env.FIREFOX_PATH) options.setBinary(process.env.FIREFOX_PATH);
  const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || '/tmp/geckodriver')).build();
  const element = css => driver.wait(until.elementLocated(By.css(css)), 10000);
  const click = async label => (await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${label}' or @aria-label='${label}']`)), 10000)).click();
  const output = path.resolve(app, '../../runs/verification/analysis-native-pages');
  try {
    await viewport(driver, 1920, 1080);
    await driver.get(base + '/analysis-browser');
    if(initialFailure){
      await driver.wait(()=>driver.executeScript('return document.body.textContent.includes("失败")&&document.body.textContent.includes("当前作业没有已发布结果")'),10000);
      assert.equal((await driver.findElements(By.css('button[aria-label="导出当前作业成果"]'))).length,0);
      await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,module+'-initial-failure.png'),await driver.takeScreenshot(),'base64');return;
    }
    const title = emptyCatalog ? '本次没有形成可用的候选方向。' : module === 'exploration' ? '末轮边缘检查' : '末轮表面关系';
    await driver.wait(() => driver.executeScript('return document.body.textContent.includes(arguments[0])', title), 10000,
      'the original result page displays the native publication');
    const version=await(await element('button[aria-label="导出当前作业成果"]')).getAttribute('data-version-id');
    await click('导出当前作业成果');
    await driver.wait(async()=>fs.stat(path.join(downloads,version+'.zip')).then(info=>info.size>0,()=>false),10000);
    assert.deepEqual(await fs.readFile(path.join(downloads,version+'.zip')),
      Buffer.from(await(await fetch(base+'/api/iad/analysis/publications/'+version+'/export')).arrayBuffer()));
    await fs.mkdir(output, {recursive: true});
    await fs.writeFile(path.join(output, module + (emptyCatalog?'-empty':'') + '-results.png'), await driver.takeScreenshot(), 'base64');
    if(emptyCatalog){assert.equal((await driver.findElements(By.css('button[aria-label^="查看方向 "]'))).length,0);return;}
    if (module === 'exploration') await click('查看方向');
    else await click('查看知识条目 末轮表面关系');
    await driver.wait(() => driver.executeScript('const images=[...document.querySelectorAll("dialog[open] img")];return images.length>0&&images.every(i=>i.complete&&[32,6].includes(i.naturalWidth))'), 10000,
      'evidence in the existing dialog resolves to the prepared native pixels');
    await fs.writeFile(path.join(output, module + '-evidence.png'), await driver.takeScreenshot(), 'base64');
    if (module === 'knowledge') {
      await (await element('input[name="knowledge-review"][value="confirmed"]')).click();
      await (await element('#review-note')).sendKeys('实际页面核实的原生知识条目。');
      await (await element('#save-review')).click();
      await driver.wait(() => driver.executeScript('return !document.querySelector(".knowledge-entry-dialog")'), 10000);
      await click('查看知识条目 末轮表面关系');
      await driver.wait(async () => (await element('input[name="knowledge-review"][value="confirmed"]')).isSelected(), 10000);
      assert.equal(await (await element('#review-note')).getAttribute('value'), '实际页面核实的原生知识条目。');
      if (partialVersionId) {
        await click('关闭知识详情');
        const versions = await element('select[aria-label="知识结果版本"]');
        await (await versions.findElement(By.css(`option[value="${partialVersionId}"]`))).click();
        await driver.wait(() => driver.executeScript('return document.querySelectorAll(".knowledge-row").length===3'), 10000);
        assert.ok(!(await driver.findElement(By.css('#knowledge-body')).getText()).includes('末轮表面关系'),
          'the selected partial version keeps its three checks after the job resumes');
        await fs.writeFile(path.join(output, 'knowledge-partial-version.png'), await driver.takeScreenshot(), 'base64');
      } else {
        await click('关闭知识详情');
        await click('删除知识条目 末轮表面关系');
        await(await element('dialog[aria-label="移除知识条目"] #confirm-accept')).click();
        await driver.wait(()=>driver.executeScript('return document.querySelectorAll(".knowledge-row").length===0&&document.body.textContent.includes("已生成维护版本")'),10000);
        const versions=await element('select[aria-label="知识结果版本"]');
        const maintained=await versions.getAttribute('value');
        assert.notEqual(maintained,version);
        assert.ok((await versions.getText()).includes('维护版本'));
        await click('导出当前作业成果');
        await driver.wait(async()=>fs.stat(path.join(downloads,maintained+'.zip')).then(info=>info.size>0,()=>false),10000);
        const edition=await(await fetch(base+'/api/iad/analysis/publications/'+maintained)).json();
        assert.equal(edition.parent_version_id,version);assert.equal(edition.catalog.checks.length,0);
        assert.equal(edition.coverage.completed,19);
        await fs.writeFile(path.join(output,'knowledge-maintenance.png'),await driver.takeScreenshot(),'base64');
        await(await versions.findElement(By.css(`option[value="${version}"]`))).click();
        await driver.wait(()=>driver.executeScript('return document.body.textContent.includes("末轮表面关系")'),10000);
        await click('查看知识条目 末轮表面关系');
        await driver.wait(async()=>(await element('input[name="knowledge-review"][value="confirmed"]')).isSelected(),10000);
      }
    } else {
      await click('关闭方向详情');
      await click('新建探索');
      await driver.wait(() => driver.executeScript('return document.querySelector(".exp-summarybar")?.textContent.includes("至少选择一张样例图像")'), 10000);
      assert.equal(await (await driver.findElement(By.xpath("//button[normalize-space(.)='启动联合探索']"))).isEnabled(), false);
      await click('继续添加良品图像');
      await (await element('input[aria-label="选择良品 00.png"]')).click();
      await click('完成选择');
      assert.equal(await (await driver.findElement(By.xpath("//button[normalize-space(.)='启动联合探索']"))).isEnabled(), true,
        'one-sided selection is sufficient');
      await (await driver.findElement(By.xpath("//button[@role='tab' and starts-with(normalize-space(.),'异常样例')]"))).click();
      await click('继续添加异常图像');
      await (await element('input[aria-label="选择异常 00.png"]')).click();
      await click('完成选择');
      await driver.wait(() => driver.executeScript('return document.querySelector(".exp-summarybar")?.textContent.includes("同一图像不能同时作为良品和异常样例")'), 5000,
        'overlapping roles are corrected at the original selection step');
      assert.equal(await (await driver.findElement(By.xpath("//button[normalize-space(.)='启动联合探索']"))).isEnabled(), false);
      await fs.writeFile(path.join(output, 'exploration-selection.png'), await driver.takeScreenshot(), 'base64');
    }
  } catch (error) {
    await fs.mkdir(output, {recursive: true});
    await fs.writeFile(path.join(output, module + '-failure.png'), await driver.takeScreenshot(), 'base64');
    await fs.writeFile(path.join(output, module + '-failure.txt'), await driver.findElement(By.css('body')).getText());
    throw error;
  } finally {await driver.quit();await fs.rm(downloads,{recursive:true,force:true});}
}
