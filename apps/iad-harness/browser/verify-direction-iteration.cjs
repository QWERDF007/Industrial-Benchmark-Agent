const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const {Builder,By,until} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox.js');

(async()=>{
  const reference=JSON.parse(await fs.readFile(process.env.IAD_EXPLORATION_REFERENCE || 'runs/verification/v58-regroup/test-exploration-reference.json','utf8'));
  const options=new firefox.Options().addArguments('-headless');
  options.setBinary(process.env.FIREFOX_PATH || '/tmp/iad-firefox128/firefox/firefox');
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || '/tmp/geckodriver')).build();
  try{
    await driver.manage().window().setRect({width:1904,height:1000});
    await driver.get(process.env.IAD_BASE_URL || 'http://127.0.0.1:8000/');
    await (await driver.wait(until.elementLocated(By.css('button[aria-label="方向探索"]')),15000)).click();
    await (await driver.wait(until.elementLocated(By.xpath('//select[@id="exp-parent"]/option[contains(.,"框胶")]')),10000)).click();
    await driver.wait(async()=>(await driver.findElements(By.css('[data-action="direction"]'))).length>=2,15000);
    const rows=await driver.findElements(By.css('[data-action="direction"]'));
    const firstId=await rows[0].getAttribute('data-id');
    await (await rows[1].findElement(By.css('.exp-view-detail-button'))).click();
    const dialog=await driver.wait(until.elementLocated(By.css('.exp-direction-dialog')),10000);
    const title=await dialog.getAttribute('aria-label');
    const original=await driver.executeScript(()=>[...document.querySelectorAll('.exp-direction-dialog img')].map(img=>img.src));
    assert.ok(original.length);
    const version=original[0].match(/\/exploration\/evidence\/([^/]+)\//)[1];
    await driver.wait(async()=>await driver.executeAsyncScript(`const done=arguments[arguments.length-1];
      fetch('/api/iad/analysis/results/'+encodeURIComponent(arguments[0])).then(r=>r.json())
      .then(result=>done(result.snapshots.some(snapshot=>snapshot.version_id!==arguments[1])));`,reference.run_id,version),180000);
    await driver.wait(async()=>await (await driver.findElement(By.css('[data-action="direction"]'))).getAttribute('data-id')!==firstId,15000);
    assert.equal(await dialog.getAttribute('aria-label'),title,'打开的方向必须保持原版本');
    assert.deepEqual(await driver.executeScript(()=>[...document.querySelectorAll('.exp-direction-dialog img')].map(img=>img.src)),original,'迭代不得替换正在查看的证据');
    console.log('PASS: live iteration refreshes the table while the open direction and evidence retain their frozen version');
  }finally{await driver.quit();}
})().catch(error=>{console.error(error);process.exitCode=1;});
