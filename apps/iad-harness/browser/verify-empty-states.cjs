const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const {Builder, By, until} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox.js');

(async () => {
  const options = new firefox.Options().addArguments('-headless');
  options.setBinary(process.env.FIREFOX_PATH || '/tmp/iad-firefox128/firefox/firefox');
  const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || '/tmp/geckodriver')).build();
  try {
    await driver.manage().window().setRect({width:1790,height:1000});
    await driver.get(process.env.IAD_BASE_URL || 'http://127.0.0.1:8000/');
    for (const [label, selector, message] of [
      ['知识挖掘', '#jobs-empty', '当前范围还没有挖掘作业，可以创建新挖掘。'],
      ['方向探索', '.exp-job-empty', '当前范围还没有探索作业，可以创建新探索。'],
      ['数据一致性', '.dc-empty', '当前范围还没有检查作业，可以创建新检查。'],
      ['模型审计', '.audit-empty', '当前范围还没有审计作业，可以创建新审计。'],
    ]) {
      await (await driver.wait(until.elementLocated(By.css(`button[aria-label="${label}"]`)),15000)).click();
      const empty = await driver.wait(until.elementLocated(By.css(selector)),10000);
      assert.equal(await empty.getText(), message);
      const style = await driver.executeScript(el => ({
        weight:getComputedStyle(el).fontWeight,
        color:getComputedStyle(el).color,
        decorations:el.querySelectorAll('strong,b,h2,h3,svg,.blank-icon').length,
      }),empty);
      assert.equal(style.weight,'400');
      assert.equal(style.color,'rgb(23, 35, 56)');
      assert.equal(style.decorations,0);
      assert.ok(!(await driver.findElement(By.css('body')).getText()).includes('No route for GET'));
      if (label !== '模型审计') {
      const api = await driver.executeAsyncScript(`const done=arguments[arguments.length-1];
        fetch('/api/iad/analysis/jobs?dataset_id=ds_fa06dc6259df4394a12a1a9b69d231bf&analysis_kind='+arguments[0])
          .then(async r=>done({status:r.status,body:await r.json()}));`,
        label==='知识挖掘' ? 'knowledge' : label==='方向探索' ? 'exploration' : 'consistency');
      assert.equal(api.status,200);
      assert.ok(Array.isArray(api.body.jobs));
      }
      await fs.mkdir('runs/browser/empty-states',{recursive:true});
      await fs.writeFile(`runs/browser/empty-states/${label}.png`,await driver.takeScreenshot(),'base64');
    }
    await (await driver.findElement(By.css('button[aria-label="知识挖掘"]'))).click();
    await (await driver.wait(until.elementLocated(By.css('#create-btn')),10000)).click();
    const summary = await driver.wait(until.elementLocated(By.css('#kb-run-summary')),10000);
    assert.equal((await summary.findElements(By.css('strong,b'))).length,0);
    for (const item of await summary.findElements(By.css('span'))) {
      assert.equal(await item.getCssValue('font-weight'),'400');
      assert.equal(await item.getCssValue('color'),'rgb(23, 35, 56)');
    }
    assert.ok(!(await summary.getText()).includes('各子集当前知识版本；无基准则仅整理假设'));
    console.log('PASS: live analysis routes, plain empty states across four pages and concise creation summary');
  } finally {await driver.quit();}
})().catch(error=>{console.error(error);process.exitCode=1;});
