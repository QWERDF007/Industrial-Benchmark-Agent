const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const {Builder, By, until} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox.js');

(async () => {
  const reference = JSON.parse(await fs.readFile('runs/verification/v58-two-small/reference.json', 'utf8'));
  const output = 'runs/browser/file-presets';
  await fs.mkdir(output, {recursive: true});
  const options = new firefox.Options().addArguments('-headless');
  options.setBinary('/tmp/iad-firefox128/firefox/firefox');
  const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  const get = route => driver.executeAsyncScript(`const done=arguments[arguments.length-1];fetch('/api/iad/'+arguments[0]).then(r=>r.json()).then(done);`, route);
  const element = selector => driver.wait(until.elementLocated(By.css(selector)), 15000);
  const selectGroup = async (selector, id) => {
    const select = await element(selector);
    await driver.wait(() => driver.executeScript('return [...arguments[0].options].some(o=>o.value===arguments[1])', select, id), 15000);
    await driver.executeScript('arguments[0].value=arguments[1];arguments[0].dispatchEvent(new Event("change",{bubbles:true}))', select, id);
  };
  try {
    await driver.manage().window().setRect({width: 1904, height: 1000});
    await driver.get('http://127.0.0.1:8000/');
    const catalog = await get('datasets');
    await (await element('button[aria-label="方向探索"]')).click();
    const proof = {jobs: []};
    for (const dataset of Object.values(reference.datasets)) {
      const source = catalog.datasets.find(item => item.dataset_id === dataset.dataset_id);
      await selectGroup('#exp-parent', source.group_id);
      const row = await element(`tr[data-action="select-job"][data-id="${dataset.stages.exploration.run_id}"]`);
      const name = await (await row.findElements(By.css('td')))[2].getText();
      assert.equal(name, source.name);
      assert.equal((await driver.findElements(By.css('tr[data-action="select-job"]'))).length, 1);
      proof.jobs.push({dataset_id: source.dataset_id, name, run_id: dataset.stages.exploration.run_id});
    }
    await fs.writeFile(output + '/separate-jobs.png', await driver.takeScreenshot(), 'base64');

    const original = catalog.datasets.find(item => !Object.values(reference.datasets).some(small => small.dataset_id === item.dataset_id));
    await selectGroup('#exp-parent', original.group_id);
    const create = await element('button[title="新建探索"]');
    await driver.wait(until.elementIsEnabled(create), 10000);
    await create.click();
    const presets = (await get('exploration/presets')).presets;
    await driver.wait(async () => (await (await element('#exp-prompt')).getAttribute('value')) === presets[0].text, 15000);
    assert.equal(await driver.executeScript(() => performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('/knowledge/sources?')).length), 0,
      '打开新建探索时不应提前读取整个候选图池');
    await (await element('button[aria-label="继续添加良品图像"]')).click();
    await element('.iad-thumbnail-option');
    assert.equal((await driver.findElements(By.css('.iad-thumbnail-option input:checked'))).length, 0,
      '候选图片读取完成后仍然不能自动勾选');
    await (await driver.findElement(By.xpath('//button[normalize-space()="完成选择"]'))).click();
    assert.equal((await driver.findElements(By.css('.exp-preview .iad-thumbnail-card'))).length, 0,
      '未手动选择时预览必须保持空白');
    const start = await driver.findElement(By.xpath('//button[normalize-space()="启动联合探索"]'));
    assert.equal(await start.isEnabled(), true, '空的优先样例不能阻止按范围抽取首批图像');
    await (await element('button[aria-label="继续添加良品图像"]')).click();
    await (await element('.iad-thumbnail-option .iad-thumbnail-card')).click();
    await (await driver.findElement(By.xpath('//button[normalize-space()="完成选择"]'))).click();
    assert.equal((await driver.findElements(By.css('.exp-preview .iad-thumbnail-card'))).length, 1,
      '手动选择的图像应保留在预览中');
    await (await driver.findElement(By.xpath('//button[normalize-space()="返回作业与结果"]'))).click();
    await (await element('button[title="新建探索"]')).click();
    await driver.wait(async () => (await driver.findElements(By.css('.exp-preview .iad-thumbnail-card'))).length === 0, 5000);
    for (const preset of presets) {
      await driver.executeScript('arguments[0].value=arguments[1];arguments[0].dispatchEvent(new Event("change",{bubbles:true}))', await element('#exp-preset'), preset.id);
      assert.equal(await (await element('#exp-prompt')).getAttribute('value'), preset.text);
    }
    proof.exploration_presets = presets.length;
    await (await element('button[aria-label="知识挖掘"]')).click();
    await (await element('#create-btn')).click();
    const directions = (await get('knowledge/presets')).directions;
    await driver.wait(async () => (await driver.findElements(By.css('#general-directions tr'))).length === directions.length, 15000);
    for (const direction of directions) {
      const row = await (await element(`[data-dir-id="${direction.direction_id}"]`)).findElement(By.xpath('ancestor::tr'));
      const cells = await row.findElements(By.css('td'));
      assert.equal(await cells[1].getText(), direction.title);
      assert.equal(await cells[2].getText(), direction.instruction);
    }
    proof.knowledge_directions = directions.length;
    proof.status = 'PASSED';
    await fs.writeFile(output + '/knowledge-directions.png', await driver.takeScreenshot(), 'base64');
    await fs.writeFile(output + '/verified.json', JSON.stringify(proof, null, 2));
    console.log('FILE_PRESETS_AND_TWO_SEPARATE_JOB_SCOPES_PASSED');
  } catch (error) {
    await fs.writeFile(output + '/failure.png', await driver.takeScreenshot(), 'base64');
    throw error;
  } finally {
    await driver.quit();
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
