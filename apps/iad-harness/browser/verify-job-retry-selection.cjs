const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {Builder,By,until}=require('selenium-webdriver');
const firefox=require('selenium-webdriver/firefox.js');

(async()=>{
  const reference=JSON.parse(await fs.readFile('runs/verification/v58-regroup/anomaly-normal-knowledge-reference.json','utf8'));
  const options=new firefox.Options().addArguments('-headless');
  options.setBinary('/tmp/iad-firefox128/firefox/firefox');
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  try{
    const route={pageId:'industrial-knowledge',datasetId:reference.request.dataset_ids[0],knowledgeKind:'normal',tab:'results',job:reference.run_id};
    await driver.get('http://127.0.0.1:8000/');
    await (await driver.wait(until.elementLocated(By.css('button[aria-label="知识挖掘"]')),15000)).click();
    await driver.wait(until.elementLocated(By.css('#knowledge-page')),10000);
    await driver.executeScript(`const url=new URL(location.href);url.searchParams.set('iad',JSON.stringify(arguments[0]));
      history.pushState(history.state,'',url);window.dispatchEvent(new PopStateEvent('popstate'));`,route);
    await driver.wait(until.elementLocated(By.css('#job-rows tr[data-pick-job]')),15000);
    const ids=await driver.executeScript(()=>[...document.querySelectorAll('#job-rows tr[data-pick-job]')].map(row=>row.dataset.pickJob));
    assert.equal(ids.length,new Set(ids).size,'打开原作业的链接后，重试作业不得重复显示');
    assert.equal(ids.length,1,'所选范围仍只有一个知识作业');
    assert.ok(await (await driver.findElement(By.css('#job-rows tr[aria-selected="true"]'))).isDisplayed());
    console.log('PASS: original job link resolves to one selected logical job after retries');
  }finally{await driver.quit();}
})().catch(error=>{console.error(error);process.exitCode=1;});
