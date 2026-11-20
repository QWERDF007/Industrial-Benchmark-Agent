import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {By,Key,until} from 'selenium-webdriver';

export async function verifyAuditImageNavigation(driver,{base,runId,datasetIds,output}) {
  await fs.mkdir(output,{recursive:true});
  await driver.get(base+'/?'+new URLSearchParams({iad:JSON.stringify({pageId:'industrial-audit',datasetId:datasetIds[0],datasetIds,job:runId})}));
  const element=selector=>driver.wait(until.elementLocated(By.css(selector)),20000);
  await element('#audit-page .iad-thumbnail-grid [data-sample-id]');
  const read=async route=>{
    const response=await driver.executeAsyncScript(function(route,done){fetch(route).then(async result=>done({status:result.status,data:await result.json()}));},route);
    assert.equal(response.status,200);return response.data;
  };
  const page=await read(`/api/iad/audit/jobs/${runId}/samples?page=1&page_size=18&status=all&search=`);
  assert.ok(page.total>18);
  await driver.findElement(By.css(`#audit-page [data-sample-id="${page.items[0].sample_id}"]`)).click();
  await (await element('dialog.audit-dialog [aria-label="放大主图"]')).click();
  await element('#big-image');
  assert.equal((await driver.findElements(By.id('next-img'))).length,1,'模型审计大图提供左右切换');
  assert.equal(await driver.findElement(By.id('prev-img')).isEnabled(),false);
  for(let index=1;index<18;index++){
    await driver.findElement(By.id('next-img')).click();
    await driver.wait(async()=>await driver.findElement(By.id('full-file-name')).getText()===page.items[index].filename.split('/').pop(),10000);
  }
  const next=await read(`/api/iad/audit/jobs/${runId}/samples?page=2&page_size=18&status=all&search=`);
  await driver.findElement(By.id('next-img')).click();
  await driver.wait(async()=>await driver.findElement(By.id('full-file-name')).getText()===next.items[0].filename.split('/').pop(),15000);
  await fs.writeFile(path.join(output,'audit-next-page.png'),await driver.takeScreenshot(),'base64');
  await driver.actions().sendKeys(Key.ARROW_LEFT).perform();
  await driver.wait(async()=>await driver.findElement(By.id('full-file-name')).getText()===page.items[17].filename.split('/').pop(),15000);
  await driver.findElement(By.id('full-close')).click();
  assert.equal((await driver.findElements(By.css('dialog.audit-dialog[open]'))).length,1,'关闭大图仍保留审计详情');
  await driver.findElement(By.css('[aria-label="关闭图像审计详情"]')).click();
  return {runId,images:page.total,forward:18,backwardAcrossPage:true};
}
