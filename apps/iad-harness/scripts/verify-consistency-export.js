import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {By,Key,until} from 'selenium-webdriver';

export async function verifyConsistencyExport(driver,{base,runId,datasetIds,output}) {
  await fs.mkdir(output,{recursive:true});
  await driver.get(base+'/?'+new URLSearchParams({iad:JSON.stringify({
    pageId:'industrial-consistency',datasetIds,batchId:runId})}));
  await driver.wait(until.elementLocated(By.css('.dc-conflict-grid .iad-thumbnail-card')),30000);
  const menu=await driver.findElements(By.css('.dc-results-section [aria-label="导出标注冲突"]'));
  assert.equal(menu.length,1,'导出入口提供格式选择');
  await menu[0].sendKeys(Key.ENTER);
  const panel=await driver.wait(until.elementLocated(By.css('.iad-action-menu .iad-floating-menu-panel')),10000);
  assert.deepEqual(await Promise.all((await panel.findElements(By.css('button'))).map(button=>button.getText())),
    ['完整 ZIP','仅 Markdown']);
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  await driver.wait(async()=>(await driver.findElements(By.css('.iad-action-menu[open]'))).length===0,5000);
  assert.equal(await driver.executeScript('return document.activeElement.getAttribute("aria-label")'),'导出标注冲突');
  await menu[0].click();
  await driver.findElement(By.css('.dc-results-section .iad-section-title')).click();
  await driver.wait(async()=>(await driver.findElements(By.css('.iad-action-menu[open]'))).length===0,5000);
  await menu[0].click();
  await fs.writeFile(path.join(output,'export-menu.png'),await driver.takeScreenshot(),'base64');
  const destination=path.join(output,runId+'-标注冲突.md');
  await fs.rm(destination,{force:true});
  await driver.findElement(By.xpath('//details[contains(@class,"iad-action-menu")]//button[normalize-space(.)="仅 Markdown"]')).click();
  await driver.wait(async()=>{
    try{return (await fs.stat(destination)).size>0;}catch{return false;}
  },30000,'下载单份 Markdown');
  const text=await fs.readFile(destination,'utf8');
  assert.ok(text.startsWith('# 标注冲突\n'));assert.ok(text.includes(runId));
  assert.match(text,/\| 主图数据集 \| 主图文件名 \| 对比图数据集 \| 对比图文件名 \|/);
  assert.doesNotMatch(text,/!\[|data:image|## 无候选|## 无有效候选|## 一致\n/);
  assert.equal((await driver.findElements(By.css('.iad-action-menu[open]'))).length,0);
  assert.deepEqual((await fs.readdir(output)).filter(name=>/\.(?:png|json|zip|md)$/.test(name)).sort(),
    ['export-menu.png',runId+'-标注冲突.md'].sort());
  return {runId,download:path.basename(destination),chapters:text.split('\n').filter(line=>line.startsWith('## ')),
    rows:text.split('\n').filter(line=>line.startsWith('| ')&&!line.startsWith('| ---')&&!line.startsWith('| 主图数据集')).length,
    keyboard:true,outsideDismiss:true};
}
