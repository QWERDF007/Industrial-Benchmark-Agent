import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const base=process.env.IAD_BROWSER_URL;
const cookies=process.env.IAD_BROWSER_COOKIES;

test('dataset manager paginates five parent datasets with the shared controls and filters before pagination',{
  timeout:90000,skip:!base||!cookies,
},async t=>{
  const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');
  if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  t.after(()=>driver.quit());
  await driver.get(base);
  for(const cookie of JSON.parse(await fs.readFile(cookies,'utf8')))await driver.manage().addCookie(cookie);
  const frame=await driver.executeScript('return {width:outerWidth-innerWidth,height:outerHeight-innerHeight}');
  await driver.manage().window().setRect({width:1920+frame.width,height:1080+frame.height});
  const catalog=await driver.executeAsyncScript(done=>fetch('/api/iad/datasets').then(response=>response.json()).then(done));
  const groups=catalog.groups;
  assert.ok(groups.length>5,'验收需要至少六个已登记的父数据集');
  const first=catalog.datasets.find(dataset=>dataset.group_id===groups[0].group_id);
  const route={pageId:'industrial-datasets',datasetId:first.dataset_id};
  await driver.get(base+'/?'+new URLSearchParams({iad:JSON.stringify(route)}));
  const element=selector=>driver.wait(until.elementLocated(By.css(selector)),15000);
  const click=async node=>{
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',node);
    await node.click();
  };
  const rows=()=>driver.findElements(By.css('.dataset-table .parent-row'));
  await element('.dataset-table .parent-row');
  const detailClose=await driver.findElements(By.css('.drawer-root.open button[aria-label="关闭详情抽屉"]'));
  if(detailClose.length)await detailClose[0].click();
  assert.equal((await rows()).length,5);
  const initialIds=await Promise.all((await rows()).map(row=>row.getAttribute('data-id')));
  assert.deepEqual(initialIds,groups.slice(0,5).map(group=>group.group_id));
  const pagination=await element('nav.iad-pagination[aria-label="数据集列表分页"]');
  await click(await pagination.findElement(By.css('button[data-page="2"]')));
  await driver.wait(async()=>!(await (await rows())[0].getAttribute('data-id')).includes(groups[0].group_id),5000);
  const secondIds=await Promise.all((await rows()).map(row=>row.getAttribute('data-id')));
  assert.ok(secondIds.length<=5);
  assert.ok(secondIds.every(id=>!initialIds.includes(id)));

  const search=await element('#search');
  const child=catalog.datasets.find(dataset=>dataset.group_id===groups[0].group_id);
  await search.sendKeys(child.name);
  await driver.wait(async()=>!(await driver.findElements(By.css('nav[aria-label="数据集列表分页"]'))).length,5000);
  assert.equal((await rows()).length,1);
  assert.equal(await (await rows())[0].getAttribute('data-id'),groups[0].group_id);
  assert.equal((await driver.findElements(By.css('tr[data-id="'+child.dataset_id+'"]'))).length,1);
  await search.clear();
  await search.sendKeys('不存在的数据集-codex-pagination-check');
  await driver.wait(async()=>(await rows()).length===0,5000);
  assert.match(await (await element('.dataset-table')).getText(),/没有匹配的数据集/);
  assert.equal((await driver.findElements(By.css('nav[aria-label="数据集列表分页"]'))).length,0);
  await click(await element('#manager-clear-search'));
  await driver.wait(async()=>(await rows()).length===5,5000);
  assert.deepEqual(await Promise.all((await rows()).map(row=>row.getAttribute('data-id'))),initialIds);
  if(process.env.IAD_DATASET_PAGINATION_SCREENSHOT)
    await fs.writeFile(process.env.IAD_DATASET_PAGINATION_SCREENSHOT,await driver.takeScreenshot(),'base64');
});
