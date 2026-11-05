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
    await driver.manage().window().setRect({width: 1790, height: 1000});
    await driver.get(process.env.IAD_BASE_URL || 'http://127.0.0.1:8000/');
    await (await driver.wait(until.elementLocated(By.css('button[aria-label="知识挖掘"]')), 15000)).click();
    const page = await driver.wait(until.elementLocated(By.id('knowledge-page')), 10000);
    assert.ok(!(await page.getText()).includes('离线交互原型'));
    const {dataset}=JSON.parse(await fs.readFile(process.env.IAD_KNOWLEDGE_CASE || 'runs/verification/v58-audit-20261104/browser-case.json','utf8'));
    await (await driver.wait(until.elementLocated(By.css(`#dataset option[value="${dataset.group_id}"]`)),10000)).click();
    await (await driver.wait(until.elementLocated(By.css(`#subset option[value="${dataset.dataset_id}"]`)),10000)).click();
    await driver.wait(until.elementLocated(By.css('#job-rows tr')), 15000);
    const api = await driver.executeAsyncScript(`const done=arguments[arguments.length-1];
      fetch('/api/iad/knowledge/jobs?dataset_id='+document.querySelector('#subset').value)
        .then(r=>r.json()).then(done);`);
    const ids = new Set(api.jobs.map(job => job.run_id));
    const rows = await driver.findElements(By.css('#job-rows tr'));
    for (const row of rows) assert.ok(ids.has(await row.getAttribute('data-pick-job')));
    await (await driver.findElement(By.id('job-search'))).sendKeys('no-such-knowledge-job');
    await driver.wait(async () => (await driver.findElements(By.css('#job-rows tr'))).length === 0, 5000);
    assert.match(await (await driver.findElement(By.id('knowledge-body'))).getText(), /请选择/);
    await (await driver.findElement(By.id('kb-clear-job-filters'))).click();
    const entry = await driver.wait(until.elementLocated(By.css('[data-detail-entry]')), 15000);
    await entry.click();
    const image = await driver.wait(until.elementLocated(By.css('#entry-dialog .detail-evidence img')), 10000);
    assert.ok((await image.getAttribute('src')).includes('/api/iad/knowledge/evidence/'));
    await driver.wait(async () => await driver.executeScript('return arguments[0].complete && arguments[0].naturalWidth>0', image), 15000);
    await fs.mkdir('runs/browser/v58-knowledge', {recursive: true});
    await fs.writeFile('runs/browser/v58-knowledge/entry.png', await driver.takeScreenshot(), 'base64');
    const selectedJobId=await (await driver.findElement(By.css('#job-rows tr[aria-selected="true"]'))).getAttribute('data-pick-job');
    const review=await driver.executeAsyncScript(`const done=arguments[arguments.length-1], id=document.querySelector('[data-detail-entry]').dataset.detailEntry;
      fetch('/api/iad/knowledge/details?version_id='+arguments[0]+'&check_id='+encodeURIComponent(id)).then(r=>r.json()).then(done);`,
      api.jobs.find(job=>job.run_id===selectedJobId)?.knowledge_version_id);
    await (await driver.findElement(By.id('save-review'))).click();
    await driver.wait(async()=>!(await driver.findElements(By.css('dialog[aria-label="知识条目详情"][open]'))).length,10000);
    await (await driver.wait(until.elementLocated(By.css('[data-detail-entry]')),10000)).click();
    await driver.wait(until.elementLocated(By.id('save-review')),10000);
    assert.equal(await (await driver.findElement(By.css('input[name="knowledge-review"]:checked'))).getAttribute('value'), review.check.review.status);
    await (await driver.findElement(By.id('close-detail'))).click();
    await (await driver.findElement(By.id('create-btn'))).click();
    const setup = await driver.findElement(By.id('kb-setup-page'));
    assert.ok(await setup.isDisplayed());
    assert.ok((await setup.getRect()).y < 150);
    await (await driver.findElement(By.id('kb-setup-back'))).click();
    console.log('PASS: actual job scope, filtered selection, frozen evidence, persisted assessment and in-place setup');
    if(process.env.IAD_KNOWLEDGE_SUBMIT_CASE){
      const created=JSON.parse(await fs.readFile(process.env.IAD_KNOWLEDGE_SUBMIT_CASE,'utf8'));
      await (await driver.findElement(By.css(`#dataset option[value="${created.dataset.group_id}"]`))).click();
      await (await driver.wait(until.elementLocated(By.css(`#subset option[value="${created.dataset.dataset_id}"]`)),10000)).click();
      await (await driver.findElement(By.id('create-btn'))).click();
      const size=await driver.findElement(By.css('[aria-label="每批挖掘图像数"]'));
      await size.clear();await size.sendKeys('3');
      const submit=await driver.findElement(By.id('submit-job'));
      await driver.wait(until.elementIsEnabled(submit),15000);
      await submit.click();
      const jobRow=await driver.wait(until.elementLocated(By.css('#job-rows tr[data-pick-job]')),15000);
      const runId=await jobRow.getAttribute('data-pick-job');
      const job=await driver.executeAsyncScript(`const done=arguments[arguments.length-1];fetch('/api/iad/knowledge/status/'+arguments[0]).then(r=>r.json()).then(done);`,runId);
      assert.equal(job.job_type,'KNOWLEDGE_BATCH');assert.equal(job.total_samples,6);assert.equal(job.request.batch_size,3);
      await fs.writeFile('runs/verification/v58-knowledge-batches/live-run-id',runId);
      console.log('PASS: real full-scope submission, six sources in two batches; run_id='+runId);
    }
  } finally { await driver.quit(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
