const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {Builder,By,Key,until}=require('selenium-webdriver');
const firefox=require('selenium-webdriver/firefox.js');

(async()=>{
  const state=JSON.parse(await fs.readFile('runs/verification/v58-two-small/reference.json','utf8'));
  const output='runs/browser/shared-media';await fs.mkdir(output,{recursive:true});
  const options=new firefox.Options().addArguments('-headless');options.setBinary('/tmp/iad-firefox128/firefox/firefox');
  const driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  const proof={};
  try{
    await driver.manage().window().setRect({width:1904,height:1000});await driver.get('http://127.0.0.1:8000/');
    const catalog=await driver.executeAsyncScript(`const done=arguments[arguments.length-1];fetch('/api/iad/datasets').then(r=>r.json()).then(done);`);
    const labelme=catalog.datasets.find(d=>d.dataset_id===state.datasets.labelme.dataset_id);
    const anomaly=catalog.datasets.find(d=>d.dataset_id===state.datasets.anomaly.dataset_id);
    assert.notEqual(labelme.group_id,anomaly.group_id);
    assert.equal(labelme.total_samples,100);assert.equal(anomaly.total_samples,100);
    proof.dataset_parents={labelme:labelme.group_id,anomaly:anomaly.group_id};
    await(await driver.wait(until.elementLocated(By.css('button[aria-label="图像浏览"]')),20000)).click();
    const select=await driver.wait(until.elementLocated(By.id('parent')),15000);
    await driver.wait(async()=>driver.executeScript('return [...arguments[0].options].some(o=>o.value===arguments[1])',select,labelme.group_id),10000);
    await driver.executeScript('arguments[0].value=arguments[1];arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',select,labelme.group_id);
    await driver.wait(until.elementLocated(By.css(`#grid .iad-thumbnail-card[data-sample-id^="${labelme.dataset_id}:"]`)),15000);
    const annotated=new Set(state.datasets.labelme.selected.filter(s=>s.annotation_count>0).map(s=>s.relative_path.split('/').pop()));
    let chosen;
    for(const card of await driver.findElements(By.css('#grid .iad-thumbnail-card'))){
      if(annotated.has(await card.getAttribute('title'))){chosen=card;break;}
    }
    assert.ok(chosen,'真实当前页应包含可核验的人标图像');
    proof.image_card=await driver.executeScript(card=>{
      const image=card.querySelector('img'),bounds=card.getBoundingClientRect(),style=getComputedStyle(image);
      return {width:bounds.width,height:bounds.height,fit:style.objectFit};
    },chosen);
    assert.ok(proof.image_card.width<=192&&proof.image_card.height<=168);
    assert.equal(proof.image_card.fit,'contain');
    const pager=await driver.findElement(By.css('#pager.iad-pagination'));
    assert.equal((await pager.findElements(By.css('button[data-page]'))).length,5);
    await chosen.click();await(await driver.wait(until.elementLocated(By.id('detail-preview')),10000)).click();
    await driver.wait(until.elementLocated(By.css('dialog.iad-fullscreen-dialog')),10000);
    assert.equal(await driver.executeScript(()=>{
      const r=document.querySelector('dialog.iad-fullscreen-dialog').getBoundingClientRect();
      return Math.abs(r.width-innerWidth)<2&&Math.abs(r.height-innerHeight)<2;
    }),true,'共享大图检视器应铺满浏览器窗口');
    await driver.wait(async()=>driver.executeScript(()=>!!document.querySelector('.full-image-world .iad-annotation-layer g')),15000);
    const toggle=await driver.findElement(By.id('annotation-toggle'));assert.equal(await toggle.isEnabled(),true);
    await toggle.click();assert.equal((await driver.findElements(By.css('.full-image-world .iad-annotation-layer'))).length,0);
    await toggle.click();await driver.wait(until.elementLocated(By.css('.full-image-world .iad-annotation-layer')),5000);
    const before=await driver.findElement(By.id('image-world')).getAttribute('style');await(await driver.findElement(By.id('zoom-in'))).click();
    await driver.wait(async()=>(await driver.findElement(By.id('image-world')).getAttribute('style'))!==before,5000);
    await fs.writeFile(output+'/image-annotations.png',await driver.takeScreenshot(),'base64');
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    assert.equal((await driver.findElements(By.css('dialog.iad-fullscreen-dialog'))).length,0);
    assert.equal(await driver.findElement(By.css('.detail-overlay.show')).isDisplayed(),true);
    await(await driver.findElement(By.css('button[aria-label="关闭图像详情"]'))).click();
    await(await driver.findElement(By.css('button[aria-label="方向探索"]'))).click();
    const group=await driver.wait(until.elementLocated(By.id('exp-parent')),15000);
    await driver.wait(async()=>driver.executeScript('return [...arguments[0].options].some(o=>o.value===arguments[1])',group,labelme.group_id),10000);
    await driver.executeScript('arguments[0].value=arguments[1];arguments[0].dispatchEvent(new Event("change",{bubbles:true}))',group,labelme.group_id);
    await(await driver.wait(until.elementLocated(By.css('.exp-view-detail-button')),15000)).click();
    await driver.wait(until.elementLocated(By.css('.exp-direction-dialog .iad-thumbnail-card')),10000);
    proof.direction=await driver.executeScript(()=>{
      const sections=['.exp-direction-goal','.exp-direction-rationale','.exp-direction-limitations','.exp-direction-evidence']
        .map(selector=>document.querySelector(selector)).filter(Boolean);
      const groups=document.querySelectorAll('.exp-scroll-group');
      return {sections:sections.map(section=>{const r=section.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};}),
        horizontal:sections.slice(1).map(section=>getComputedStyle(section).borderTopWidth),
        evidenceDivider:getComputedStyle(groups[1]).borderLeftWidth,
        cards:[...document.querySelectorAll('.exp-direction-evidence-card')].map(card=>({caption:card.innerText,src:card.querySelector('img').src,
          width:card.getBoundingClientRect().width,height:card.getBoundingClientRect().height,fit:getComputedStyle(card.querySelector('img')).objectFit}))};
    });
    const snapshots=await driver.executeAsyncScript(`const done=arguments[arguments.length-1];fetch('/api/iad/analysis/results/'+arguments[0]).then(r=>r.json()).then(done);`,state.datasets.labelme.stages.exploration.run_id);
    const expected=snapshots.snapshots.find(snapshot=>snapshot.dataset_id===labelme.dataset_id);
    const originalIds=new Set(expected.evidence.filter(item=>item.image.representation==='raw'&&item.image.role!=='roi').map(item=>item.image.evidence_id));
    assert.ok(proof.direction.cards.every(card=>originalIds.has(decodeURIComponent(card.src.split('/').pop()))),
      'Labelme范围只能显示其自身原图，不应混入其他类型或裁剪证据');
    assert.equal(proof.direction.sections.length,4,'观察目标、比较依据、限制必须分别成行，证据保留在底部');
    assert.deepEqual(proof.direction.horizontal,['1px','1px','1px']);assert.equal(proof.direction.evidenceDivider,'1px');
    assert.ok(proof.direction.sections.every((row,index,rows)=>!index || (rows[index-1].bottom<=row.y+0.5 && Math.abs(rows[0].width-row.width)<2)),
      JSON.stringify(proof.direction.sections));
    assert.ok(proof.direction.cards.every(card=>card.width<=192&&card.height<=168&&card.fit==='contain'));
    for(const reference of await driver.findElements(By.css('.exp-direction-body .exp-evidence-ref'))){
      const id=await reference.getAttribute('data-evidence-ref');
      await driver.actions().move({origin:reference}).perform();
      await driver.wait(()=>driver.executeScript(id=>document.querySelector(`[data-evidence-card="${id}"]`)?.classList.contains('is-related'),id),3000);
    }
    await fs.writeFile(output+'/direction.png',await driver.takeScreenshot(),'base64');
    proof.compact=[];
    for(const viewport of [{width:1366,height:850},{width:980,height:830}]){
      await driver.manage().window().setRect(viewport);
      const layout=await driver.executeScript(()=>{
        const modal=document.querySelector('.exp-direction-dialog').getBoundingClientRect();
        const rows=[...document.querySelectorAll('.exp-direction-body>section')].map(section=>section.getBoundingClientRect());
        return {count:rows.length,stacked:rows.every((row,index)=>!index || rows[index-1].bottom<=row.y+0.5),
          contained:modal.right<=innerWidth&&modal.bottom<=innerHeight&&rows.at(-1).bottom<=modal.bottom};
      });
      assert.deepEqual(layout,{count:4,stacked:true,contained:true});
      proof.compact.push({...viewport,...layout});
    }
    await(await driver.findElement(By.css('.exp-direction-evidence-card'))).click();
    await driver.wait(until.elementLocated(By.css('dialog.iad-fullscreen-dialog')),10000);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    assert.equal((await driver.findElements(By.css('.exp-direction-dialog'))).length,1);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.wait(async()=>(await driver.findElements(By.css('.exp-direction-dialog'))).length===0,5000);
    await driver.manage().window().setRect({width:1904,height:1000});
    let citationRow;
    for(const row of await driver.findElements(By.css('tr[data-action="direction"]'))){
      if((await row.getText()).includes('边缘垂直长条状特征')){citationRow=row;break;}
    }
    assert.ok(citationRow,'验证用户截图中的实际方向');
    await(await citationRow.findElement(By.css('.exp-view-detail-button'))).click();
    await driver.wait(until.elementLocated(By.css('.exp-direction-rationale')),10000);
    proof.citation_labels=await Promise.all((await driver.findElements(By.css('.exp-direction-rationale .exp-evidence-ref'))).map(link=>link.getText()));
    assert.deepEqual(proof.citation_labels,['异常 A3','异常 A1','异常 A2','良品 N1','良品 N2','良品 N3','良品 N4','异常 A1'],
      '截图中的同源范围与列表应合并，独立描述继续保留自己的定位引用');
    await fs.writeFile(output+'/direction-citations.png',await driver.takeScreenshot(),'base64');
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    proof.status='PASSED';await fs.writeFile(output+'/verified.json',JSON.stringify(proof,null,2));
    console.log('SHARED_CARDS_PAGINATION_VIEWER_ANNOTATIONS_AND_DIVIDERS_PASSED');
  }catch(error){await fs.writeFile(output+'/failure.png',await driver.takeScreenshot(),'base64');throw error;}
  finally{await driver.quit();}
})().catch(error=>{console.error(error);process.exitCode=1;});
