const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {Builder,By,until}=require('selenium-webdriver');
const firefox=require('selenium-webdriver/firefox.js');

(async()=>{
  const state=JSON.parse(await fs.readFile('runs/verification/v58-two-small/reference.json','utf8'));
  const output='runs/browser/knowledge-thumbnails';await fs.mkdir(output,{recursive:true});
  const options=new firefox.Options().addArguments('-headless');
  options.setBinary('/tmp/iad-firefox128/firefox/firefox');
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  const element=selector=>driver.wait(until.elementLocated(By.css(selector)),15000);
  const read=async route=>(await fetch('http://127.0.0.1:8000/api/iad/'+route)).json();
  const click=async target=>{
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',target);await target.click();
  };
  const evidence=role=>driver.executeScript(role=>{
    const section=document.querySelector(`[data-evidence-role="${role}"]`);
    if(!section)return null;
    const cards=[...section.querySelectorAll('.iad-thumbnail-card')];
    return {sources:cards.map(card=>card.querySelector('img').src),
      rows:[...new Set(cards.map(card=>Math.round(card.getBoundingClientRect().y)))].length,
      page:section.querySelector('[aria-current=page]')?.textContent,
      cards:cards.map(card=>({width:card.getBoundingClientRect().width,height:card.getBoundingClientRect().height,
        fit:getComputedStyle(card.querySelector('img')).objectFit})),text:section.textContent};
  },role);
  const proof={cases:[]};
  try{
    await driver.manage().window().setRect({width:1904,height:1000});
    await driver.get('http://127.0.0.1:8000/');
    await(await element('button[aria-label="知识挖掘"]')).click();
    for(const key of ['anomaly','labelme']){
      const dataset=state.datasets[key],run=dataset.stages.normal.run_id;
      const status=await read('analysis/status/'+run);
      const checks=await read('knowledge/details?'+new URLSearchParams({version_id:status.knowledge_version_id,page_size:'50'}));
      const check=checks.items.find(check=>check.support_count>12&&check.counter_count>0);
      assert.ok(check,'真实条目应同时有支持和反对证据');
      const route={pageId:'industrial-knowledge',datasetId:dataset.dataset_id,knowledgeKind:'normal',tab:'results',job:run};
      await driver.executeScript(`const url=new URL(location.href);url.searchParams.set('iad',JSON.stringify(arguments[0]));
        history.pushState(history.state,'',url);window.dispatchEvent(new PopStateEvent('popstate'));`,route);
      await click(await element(`[data-detail-entry="${check.check_id}"]`));
      await element('.knowledge-entry-dialog #review-note');
      await driver.wait(async()=>{
        const support=await evidence('support'),counter=await evidence('counter');
        return support?.sources.length>0&&counter?.sources.length>0;
      },15000);
      assert.equal((await driver.findElements(By.css('.knowledge-entry-dialog [data-evidence-role] nav.iad-pagination'))).length,2,
        '支持和反对证据必须分别拥有独立分页');
      const support=await evidence('support'),counter=await evidence('counter');
      assert.ok(support.rows<=2&&counter.rows<=2);
      assert.ok([...support.cards,...counter.cards].every(card=>card.width<=192&&card.height<=168&&card.fit==='contain'));
      assert.equal(counter.sources.length,Math.min(12,check.counter_count),'第一页必须实际展示反对证据');
      const note=await element('#review-note');await note.sendKeys('翻页应保留的未保存备注');
      const next=await driver.findElement(By.xpath('//*[@data-evidence-role="support"]//button[normalize-space()="下一页"]'));
      await click(next);
      await driver.wait(async()=>(await evidence('support'))?.page==='2',10000);
      const secondSupport=await evidence('support');
      assert.notDeepEqual(secondSupport.sources,support.sources);
      assert.deepEqual((await evidence('counter')).sources,counter.sources,'支持翻页不能改变反对证据');
      assert.equal(await(await element('#review-note')).getAttribute('value'),'翻页应保留的未保存备注');
      if(check.counter_count>12){
        await click(await driver.findElement(By.xpath('//*[@data-evidence-role="counter"]//button[normalize-space()="下一页"]')));
        await driver.wait(async()=>(await evidence('counter'))?.page==='2',10000);
        assert.deepEqual((await evidence('support')).sources,secondSupport.sources,'反对翻页不能改变支持证据');
        await click(await driver.findElement(By.xpath('//*[@data-evidence-role="counter"]//button[normalize-space()="上一页"]')));
        await driver.wait(async()=>(await evidence('counter'))?.page==='1',10000);
        assert.deepEqual((await evidence('counter')).sources,counter.sources);
      }
      await click(await driver.findElement(By.xpath('//*[@data-evidence-role="support"]//button[normalize-space()="上一页"]')));
      await driver.wait(async()=>(await evidence('support'))?.page==='1',10000);
      assert.deepEqual((await evidence('support')).sources,support.sources);
      await driver.manage().window().setRect({width:980,height:830});
      await driver.wait(async()=>{
        const support=await evidence('support'),counter=await evidence('counter');
        return support?.page==='1'&&support.rows<=2&&counter?.page==='1'&&counter.rows<=2;
      },10000);
      assert.equal(await(await element('#review-note')).getAttribute('value'),'翻页应保留的未保存备注');
      proof.cases.push({dataset:key,support:check.support_count,counter:check.counter_count,
        desktop:{support,counter},narrow:{support:await evidence('support'),counter:await evidence('counter')}});
      await driver.manage().window().setRect({width:1904,height:1000});
      await driver.wait(async()=>(await evidence('support'))?.sources.length===12,10000);
      const card=await element('[data-evidence-role="counter"] .iad-thumbnail-card');
      await click(card);await element('dialog.iad-fullscreen-dialog');
      await driver.actions().sendKeys(require('selenium-webdriver').Key.ESCAPE).perform();
      await driver.executeScript('document.querySelector("[data-evidence-role=support]").scrollIntoView({block:"start"})');
      await fs.writeFile(output+'/'+key+'.png',await driver.takeScreenshot(),'base64');
      await click(await element('button[aria-label="关闭知识详情"]'));
    }
    proof.status='PASSED';await fs.writeFile(output+'/verified.json',JSON.stringify(proof,null,2));
    console.log('KNOWLEDGE_INDEPENDENT_EVIDENCE_PAGING_AND_TWO_ROWS_PASSED');
  }catch(error){await fs.writeFile(output+'/failure.png',await driver.takeScreenshot(),'base64');throw error;}
  finally{await driver.quit();}
})().catch(error=>{console.error(error);process.exitCode=1;});
