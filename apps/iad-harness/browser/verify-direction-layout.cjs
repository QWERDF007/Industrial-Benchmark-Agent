const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const {Builder, By, Key, until} = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox.js');

(async () => {
  const options = new firefox.Options().addArguments('-headless');
  options.setBinary('/tmp/iad-firefox128/firefox/firefox');
  const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
  try {
    await driver.manage().window().setRect({width:1904,height:1000});
    await driver.get('http://127.0.0.1:8000/');
    await (await driver.wait(until.elementLocated(By.css('button[aria-label="方向探索"]')),15000)).click();
    const group=process.env.IAD_DIRECTION_GROUP || '异常检测';
    const title=process.env.IAD_DIRECTION_TITLE;
    await (await driver.wait(until.elementLocated(By.xpath(`//select[@id="exp-parent"]/option[contains(.,"${group}")]`)),10000)).click();
    const row = await driver.wait(async () => {
      for (const candidate of await driver.findElements(By.css('[data-action="direction"]'))) {
        if (await candidate.isDisplayed() && (!title || (await candidate.getText()).includes(title))) return candidate;
      }
      return false;
    },20000);
    const open = await row.findElement(By.css('.exp-view-detail-button'));
    await driver.executeScript('arguments[0].scrollIntoView({block:"center",inline:"center"})',open);
    await open.click();
    await driver.wait(until.elementLocated(By.css('.exp-direction-dialog')),10000);
    await driver.wait(async()=>await driver.executeScript(() => [...document.querySelectorAll('.exp-direction-dialog .exp-direction-evidence-card:first-child img')]
      .every(img=>img.complete && img.naturalWidth>0)),20000);
    const layout = await driver.executeScript(() => {
      const box = selector => {
        const el = document.querySelector(selector), rect=el.getBoundingClientRect();
        return {x:rect.x,y:rect.y,width:rect.width,height:rect.height,bottom:rect.bottom};
      };
        return {body:box('.exp-direction-body'), goal:box('.exp-direction-goal'), reasoning:box('.exp-direction-reasoning'), reason:box('.exp-direction-reasoning section:first-child'),
        limits:box('.exp-direction-reasoning section:last-child'), evidence:box('.exp-direction-evidence'),
        image:box('.exp-direction-evidence-card'), dialog:box('.exp-direction-dialog')};
    });
    await fs.mkdir('runs/browser/direction-layout',{recursive:true});
    const artifact=group==='异常检测'?'anomaly':'labelme';
    await fs.writeFile(`runs/browser/direction-layout/${artifact}-layout.json`,JSON.stringify(layout,null,2));
    await fs.writeFile(`runs/browser/direction-layout/${artifact}-desktop.png`,await driver.takeScreenshot(),'base64');
    assert.ok(Math.abs(layout.goal.width-layout.body.width)<3,'观察目标应占据上部整行');
    assert.ok(layout.reason.y>=layout.goal.bottom,'比较依据应在中部，位于观察目标下方');
    assert.ok(Math.abs(layout.reason.y-layout.limits.y)<3,'比较依据与限制应在中部同一行');
    assert.ok(Math.abs(layout.reason.width-layout.limits.width)<3,'中部两个区域应均分宽度');
    assert.ok(layout.evidence.y>=layout.reasoning.bottom,'图像证据应位于底部');
    assert.ok(Math.abs(layout.goal.height-layout.reasoning.height)<3 && Math.abs(layout.reasoning.height-layout.evidence.height)<3,'上中下三部分应均衡分配高度');
    assert.ok(layout.image.height>120 && layout.image.height<=160,'证据缩略图应保持适中高度');
    const thumbnails=await driver.executeScript(()=>[...document.querySelectorAll('.exp-direction-evidence-card')].map(card=>{
      const bounds=card.getBoundingClientRect(),image=card.querySelector('img');
      return {width:bounds.width,height:bounds.height,fit:getComputedStyle(image).objectFit};
    }));
    assert.ok(thumbnails.every(card=>card.width<=160 && card.height<=160),'所有证据包括单张异常图都应保持紧凑，不随分组剩余宽度拉伸');
    assert.ok(thumbnails.every(card=>card.fit==='contain'),'缩略图应保留完整画面');
    assert.ok(layout.evidence.bottom<=layout.dialog.bottom,'Evidence must remain inside the dialog');
    assert.ok(layout.image.height<layout.dialog.height,'An image must not stretch beyond the dialog');
    assert.ok(layout.evidence.y-Math.max(layout.goal.bottom,layout.reason.bottom,layout.limits.bottom)<36,'No large gap before evidence');
    assert.ok(layout.body.bottom-layout.evidence.bottom<3,'图像证据应铺满剩余高度');
    const prose=await (await driver.findElement(By.css('.exp-direction-body'))).getText();
    assert.doesNotMatch(prose,/img_[a-f0-9]{8,64}/,'正文应将真实证据 ID 显示为 N/A 引用');
    const focusAnchor=await driver.findElement(By.css('button[aria-label="关闭方向详情"]'));
    await driver.executeScript('arguments[0].focus()',focusAnchor);
    let testedReferences=0;
    for(const section of ['.exp-direction-goal','.exp-direction-reasoning section:first-child','.exp-direction-reasoning section:last-child']){
      const links=await driver.findElements(By.css(`${section} .exp-evidence-ref`));
      for(const link of links){
        testedReferences++;
        const ref=await link.getAttribute('data-evidence-ref');
        await driver.actions().move({origin:link}).perform();
        await driver.wait(async()=>await driver.executeScript(ref=>document.querySelector(`[data-evidence-card="${ref}"]`)?.classList.contains('is-related'),ref),3000);
        assert.equal(await driver.executeScript('return document.activeElement === arguments[0]',focusAnchor),true,'悬浮引用不应抢走键盘焦点');
        assert.equal(await link.getDomAttribute('title'),null,'引用不应重复弹出完整文件名');
      }
    }
    assert.ok(testedReferences>0,'本次真实方向应含可验证联动的证据引用');
    await driver.manage().window().setRect({width:1366,height:850});
    const compact=await driver.executeScript(()=>{
      const rect=selector=>document.querySelector(selector).getBoundingClientRect();
      const goal=rect('.exp-direction-goal'),reason=rect('.exp-direction-reasoning'),evidence=rect('.exp-direction-evidence'),dialog=rect('.exp-direction-dialog');
      return {stacked:goal.bottom<=reason.y && reason.bottom<=evidence.y,
        contained:evidence.bottom<=dialog.bottom && dialog.right<=innerWidth,
        images:[...document.querySelectorAll('.exp-direction-evidence-card')].every(el=>{const bounds=el.getBoundingClientRect();return bounds.height>90&&bounds.height<=160&&bounds.width<=160;})};
    });
    assert.deepEqual(compact,{stacked:true,contained:true,images:true},'较小桌面窗口也应保持上下结构并完整展示证据');
    await fs.writeFile(`runs/browser/direction-layout/${artifact}-compact.png`,await driver.takeScreenshot(),'base64');
    await (await driver.findElement(By.css('.exp-direction-evidence-card'))).click();
    await driver.wait(until.elementLocated(By.css('[role="dialog"][aria-label="原图检视器"]')),10000);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    assert.equal((await driver.findElements(By.css('.exp-direction-dialog'))).length,1,'Esc应先退出大图，保留方向详情');
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.wait(async()=>(await driver.findElements(By.css('.exp-direction-dialog'))).length===0,5000);
    const currentRow=await driver.findElement(By.css('[data-action="direction"]'));
    const id=await currentRow.getAttribute('data-id');
    const instruction=await (await currentRow.findElement(By.css('.exp-direction-description'))).getText();
    await (await currentRow.findElement(By.css('button[aria-label="去知识挖掘"]'))).click();
    await driver.wait(until.elementLocated(By.css('.kb-creating')),10000);
    const choice=await driver.wait(until.elementLocated(By.css(`input[data-dir-kind="explore"][data-dir-id="${id}"]`)),10000);
    assert.equal(await choice.isDisplayed(),true,'打开来源方向所在页签');
    assert.equal(await choice.isSelected(),true,'预选来源方向');
    assert.ok((await driver.findElement(By.css('#prompt-text')).getAttribute('value')).includes(instruction),'提示词应包含来源方向');
    console.log('DIRECTION_LAYOUT_PASSED',JSON.stringify(layout));
  } finally {await driver.quit();}
})().catch(error=>{console.error(error);process.exitCode=1;});
