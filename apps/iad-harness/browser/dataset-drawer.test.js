import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const base=process.env.IAD_BROWSER_URL;
const cookies=process.env.IAD_BROWSER_COOKIES;

test('dataset details close on outside clicks and keep inside clicks open',{
  timeout:60000,skip:!base||!cookies,
},async t=>{
  const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');
  if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  t.after(()=>driver.quit());
  await driver.get(base);
  for(const cookie of JSON.parse(await fs.readFile(cookies,'utf8')))await driver.manage().addCookie(cookie);
  const frame=await driver.executeScript('return [outerWidth-innerWidth,outerHeight-innerHeight]');
  await driver.manage().window().setRect({width:1920+frame[0],height:1080+frame[1]});
  const catalog=await driver.executeAsyncScript(done=>fetch('/api/iad/datasets').then(response=>response.json()).then(done));
  const first=catalog.datasets.find(dataset=>dataset.group_id===catalog.groups[0].group_id);
  await driver.get(base+'/?'+new URLSearchParams({iad:JSON.stringify({pageId:'industrial-datasets',datasetId:first.dataset_id})}));
  const element=selector=>driver.wait(until.elementLocated(By.css(selector)),15000);
  await element('.dataset-table .parent-row');
  const parent=await driver.findElement(By.css('.dataset-table .parent-row'));
  const child=await driver.findElement(By.css('.dataset-table .data-row:not(.parent-row)'));
  const ids=[await child.getAttribute('data-id'),await parent.getAttribute('data-id')];
  const close=await driver.findElements(By.css('.drawer-root.open button[aria-label="关闭详情抽屉"]'));
  if(close.length)await close[0].click();
  for(const id of ids){
    const row=await element('tr[data-id="'+id+'"]');
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',row);
    const name=await row.findElement(By.css('.name-text'));
    await name.click();
    const heading=await element('.drawer-root.open #detailTitle');
    await heading.click();
    assert.equal((await driver.findElements(By.css('.drawer-root.open'))).length,1,'点击抽屉内部保持打开');
    if(id===ids[0]){
      const directory=await driver.findElement(By.css('[data-field="imageDir"]'));
      await directory.sendKeys('/unsaved-drawer-check');
      await driver.actions().move({x:600,y:150,origin:'viewport'}).click().perform();
      await driver.wait(until.alertIsPresent(),2000);
      await driver.switchTo().alert().dismiss();
      assert.equal((await driver.findElements(By.css('.drawer-root.open'))).length,1,'取消放弃修改后抽屉仍打开');
      assert.ok((await directory.getAttribute('value')).endsWith('/unsaved-drawer-check'));
      await driver.actions().move({x:600,y:150,origin:'viewport'}).click().perform();
      await driver.wait(until.alertIsPresent(),2000);
      await driver.switchTo().alert().accept();
    }else{
      await driver.actions().move({x:600,y:150,origin:'viewport'}).click().perform();
    }
    await driver.wait(async()=>(await driver.findElements(By.css('.drawer-root.open'))).length===0,2000,'点击抽屉外应关闭详情抽屉');
  }
});
