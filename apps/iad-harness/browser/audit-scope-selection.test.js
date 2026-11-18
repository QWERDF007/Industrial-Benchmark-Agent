import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const base=process.env.IAD_BROWSER_URL;
const cookies=process.env.IAD_BROWSER_COOKIES;

test('audit dataset and subset selection survives refresh and navigation',{
  timeout:90000,skip:!base||!cookies,
},async t=>{
  const options=new firefox.Options().addArguments('-headless');
  if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  t.after(()=>driver.quit());
  await driver.get(base);
  for(const cookie of JSON.parse(await fs.readFile(cookies,'utf8')))await driver.manage().addCookie(cookie);
  const catalog=await driver.executeAsyncScript(done=>fetch('/api/iad/datasets').then(r=>r.json()).then(done));
  const initial=catalog.datasets.at(-1);
  const group=catalog.groups.find(group=>group.group_id!==initial.group_id
    &&catalog.datasets.filter(d=>d.group_id===group.group_id).length>=2);
  assert.ok(group,'验收需要两个父数据集，其中一个至少包含两个子数据集');
  const children=catalog.datasets.filter(d=>d.group_id===group.group_id);
  const element=selector=>driver.wait(until.elementLocated(By.css(selector)),15000);
  const route=()=>driver.executeScript('return JSON.parse(new URL(location.href).searchParams.get("iad"))');
  await driver.get(base+'/?'+new URLSearchParams({iad:JSON.stringify({pageId:'industrial-audit',
    datasetId:initial.dataset_id,datasetIds:[initial.dataset_id]})}));
  await(await element(`#audit-dataset option[value="${group.group_id}"]`)).click();
  await driver.wait(async()=>await(await element('#audit-dataset')).getAttribute('value')===group.group_id,10000);
  assert.equal((await route()).datasetId,children[0].dataset_id,'切换父数据集须同步导航位置');
  assert.deepEqual((await route()).datasetIds,[children[0].dataset_id]);
  await driver.navigate().refresh();
  await driver.wait(async()=>await(await element('#audit-dataset')).getAttribute('value')===group.group_id,15000);
  await(await element('#audit-child-trigger')).click();
  await(await element(`#audit-child-menu input[value="${children[1].dataset_id}"]`)).click();
  await(await element('#audit-child-trigger')).click();
  assert.deepEqual((await route()).datasetIds,[children[0].dataset_id,children[1].dataset_id]);
  await driver.navigate().refresh();
  await driver.wait(async()=>await(await element('#audit-child-trigger')).getText()==='已选 2 个子数据集',15000);
  const browse=await driver.findElement(By.xpath("//button[normalize-space(.)='图像浏览']"));
  await browse.click();
  await driver.wait(until.elementLocated(By.css('[data-page="industrial-images"]')),15000);
  await(await driver.findElement(By.xpath("//button[normalize-space(.)='模型审计']"))).click();
  await driver.wait(async()=>await(await element('#audit-child-trigger')).getText()==='已选 2 个子数据集',15000);
  await(await element('#audit-child-trigger')).click();
  for(const child of children.slice(0,2))await(await element(`#audit-child-menu input[value="${child.dataset_id}"]`)).click();
  await(await element('#audit-child-trigger')).click();
  assert.deepEqual((await route()).datasetIds,[]);
  await driver.navigate().refresh();
  await driver.wait(async()=>await(await element('#audit-child-trigger')).getText()==='请选择子数据集',15000);
  assert.equal((await route()).datasetId,children[1].dataset_id);
  const empty=catalog.groups.find(group=>!catalog.datasets.some(d=>d.group_id===group.group_id));
  if(empty){
    await(await element(`#audit-dataset option[value="${empty.group_id}"]`)).click();
    assert.equal((await route()).datasetGroupId,empty.group_id);
    assert.deepEqual((await route()).datasetIds,[]);
    await driver.navigate().refresh();
    await driver.wait(async()=>await(await element('#audit-dataset')).getAttribute('value')===empty.group_id,15000);
    assert.equal(await(await element('#audit-new')).isEnabled(),false);
  }

});
