const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {Builder, By, Key, until} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox.js');

(async () => {
  const output = process.env.IAD_BROWSER_OUTPUT || path.resolve('runs/browser/v58-audit');
  const options = new firefox.Options().addArguments('-headless');
  options.setBinary(process.env.FIREFOX_PATH || '/tmp/iad-firefox128/firefox/firefox');
  const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || '/tmp/geckodriver')).build();
  try {
    await driver.manage().window().setRect({width: 1790, height: 1000});
    await driver.get(process.env.IAD_BASE_URL || 'http://127.0.0.1:8000/');
    const chrome = await driver.executeScript('return {width:outerWidth-innerWidth,height:outerHeight-innerHeight}');
    await driver.manage().window().setRect({width: 1790 + chrome.width, height: 900 + chrome.height});
    const navigation = await driver.wait(until.elementLocated(By.css('button[aria-label="模型审计"]')), 15000);
    await navigation.click();
    await driver.wait(until.elementLocated(By.css('.iad-workbench[data-page="industrial-audit"]')), 10000);
    await driver.wait(async () => (await driver.findElements(By.css('[aria-label="审计视图"] [role="tab"]'))).length === 2, 15000);
    const tabs = await driver.findElements(By.css('[aria-label="审计视图"] [role="tab"]'));
    assert.deepEqual(await Promise.all(tabs.map(tab => tab.getText())), ['模型审计', '报告']);
    await (await driver.findElement(By.css('#audit-page button[title="新建审计"]'))).click();
    await driver.wait(until.elementLocated(By.id('audit-create-mode')),10000);
    assert.equal((await driver.findElements(By.css('#audit-page .audit-create-grid > .audit-field'))).length,3);
    assert.ok(await (await driver.findElement(By.id('audit-create-summary'))).isDisplayed());
    await (await driver.findElement(By.id('audit-create-cancel'))).click();
    assert.equal((await driver.findElements(By.css('#audit-page .iad-inline-dialog'))).length, 0);
    await driver.wait(until.elementLocated(By.css('#audit-page #audit-job-search')), 10000);
    const search = await driver.findElement(By.id('audit-job-search'));
    await search.sendKeys('no-such-audit-v58');
    await driver.wait(async () => (await driver.findElements(By.css('#audit-page tbody tr[data-run-id]'))).length === 0, 5000);
    assert.match(await (await driver.findElement(By.id('audit-images'))).getText(), /没有|暂无/);
    await (await driver.findElement(By.css('[aria-label="审计视图"] [role="tab"]:last-child'))).click();
    assert.match(await (await driver.findElement(By.id('audit-report'))).getText(), /选择|没有|暂无/);
    await fs.mkdir(output, {recursive: true});
    await fs.writeFile(path.join(output, 'report-empty-filter.png'), await driver.takeScreenshot(), 'base64');
    console.log('PASS: two tabs, no persistent inspector, filtered selection and empty report');
    if (process.env.IAD_AUDIT_CASE) {
      const {dataset, job} = JSON.parse(await fs.readFile(process.env.IAD_AUDIT_CASE, 'utf8'));
      await (await driver.findElement(By.css('[aria-label="审计视图"] [role="tab"]:first-child'))).click();
      await search.clear();
      await (await driver.findElement(By.css(`#audit-dataset option[value="${dataset.group_id}"]`))).click();
      await (await driver.findElement(By.id('audit-child-trigger'))).click();
      const values = await driver.executeScript('return [...document.querySelectorAll("#audit-child-menu input")].map(input=>input.value)');
      for (const value of values) {
        const checkbox = await driver.findElement(By.css(`#audit-child-menu input[value="${value}"]`));
        if (await checkbox.isSelected() !== (value === dataset.dataset_id)) await checkbox.click();
      }
      await (await driver.findElement(By.id('audit-child-trigger'))).click();
      const row = await driver.wait(until.elementLocated(By.css(`tr[data-run-id="${job.run_id}"]`)), 15000);
      await driver.wait(until.elementIsVisible(row), 10000);
      await row.findElement(By.css('td')).click();
      const card = await driver.wait(until.elementLocated(By.css('#audit-images .iad-thumbnail-card')), 15000);
      await fs.writeFile(path.join(output, 'audit-jobs-and-images.png'), await driver.takeScreenshot(), 'base64');
      await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', card);
      const position = await driver.executeScript('return document.querySelector(".iad-workbench[data-page=industrial-audit]").scrollTop');
      await card.click();
      const detail = await driver.wait(until.elementLocated(By.css('dialog[aria-label="图像审计详情"][open]')), 10000);
      await driver.wait(async () => !(await detail.getText()).includes('正在读取冻结审计结果'), 15000);
      const bounds = await detail.getRect();
      assert.equal(Math.round(bounds.width), 1380);
      assert.equal(Math.round(bounds.height), 820);
      const text = await detail.getText();
      for (const label of ['知识条目依据', '数据一致性', '模型分析', '图像证据', '最终结论和限制']) assert.ok(text.includes(label), label);
      await fs.writeFile(path.join(output, 'audit-sample-detail.png'), await driver.takeScreenshot(), 'base64');
      await (await detail.findElement(By.css('.audit-detail-photo'))).click();
      await driver.wait(until.elementLocated(By.css('dialog[aria-label="原图检视器"][open]')), 10000);
      await driver.actions().sendKeys(Key.ESCAPE).perform();
      await driver.wait(async () => (await driver.findElements(By.css('dialog[aria-label="原图检视器"][open]'))).length === 0, 5000);
      assert.equal((await driver.findElements(By.css('dialog[aria-label="图像审计详情"][open]'))).length, 1);
      await driver.actions().sendKeys(Key.ESCAPE).perform();
      await driver.wait(async () => (await driver.findElements(By.css('dialog[aria-label="图像审计详情"][open]'))).length === 0, 5000);
      assert.ok(Math.abs(await driver.executeScript('return document.querySelector(".iad-workbench[data-page=industrial-audit]").scrollTop') - position) <= 2);
      await (await driver.findElement(By.css('[aria-label="审计视图"] [role="tab"]:last-child'))).click();
      await driver.wait(until.elementLocated(By.css('#audit-report .audit-kpi')), 15000);
      const metrics = await driver.findElements(By.css('#audit-report .audit-kpi'));
      assert.equal(metrics.length, 5);
      await fs.writeFile(path.join(output, 'audit-run-report.png'), await driver.takeScreenshot(), 'base64');
      console.log('PASS: real job selection, 1380x820 detail, frozen knowledge, evidence, nested viewer Escape, scroll preservation and five report metrics');
    }
  } finally {
    await driver.quit();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
