import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {setTimeout as delay} from 'node:timers/promises';
import {startNativeModelHost} from './native-model-host.js';

test('settings selectors share General hover, pressed, focus, selection and disabled states', {timeout:120000}, async()=>{
  const fixture=await startNativeModelHost();let driver;
  const output='../../.scratch/settings-hover';
  try{
    await fs.mkdir(output,{recursive:true});
    for(const end=Date.now()+20000;!fixture.readLog().match(/http:\/\/[^\s)]+/)&&Date.now()<end;)await delay(100);
    const login=fixture.readLog().match(/http:\/\/[^\s)]+/)?.[0];assert.ok(login);
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(new firefox.Options()
      .addArguments('-headless','--remote-allow-system-access').setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox'))
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    await driver.manage().window().setRect({width:1440,height:1000});await driver.get(login);
    await driver.wait(async()=>{
      if((await driver.findElements(By.xpath("//*[@data-shortcut-modal='settings']//button[normalize-space(.)='General']"))).length)return true;
      for(const label of ['Configure later','Continue']){const b=await driver.findElements(By.xpath(`//button[.='${label}']`));if(b.length&&await b[0].isDisplayed())await b[0].click();}
      const b=await driver.findElements(By.css('button[aria-label="Settings"]'));if(b.length&&await b[0].isDisplayed())await b[0].click();return false;
    },15000);
    const section=async label=>(await driver.findElement(By.xpath(`//*[@data-shortcut-modal='settings']//button[normalize-space(.)='${label}']`))).click();
    const settle=()=>driver.executeAsyncScript('const done=arguments[arguments.length-1];requestAnimationFrame(()=>requestAnimationFrame(done))');
    const measure=element=>driver.executeScript(`const e=arguments[0],s=getComputedStyle(e);return {
      fill:s.backgroundColor,color:s.color,outline:s.outlineStyle,outlineWidth:s.outlineWidth,outlineColor:s.outlineColor,
      outlineOffset:s.outlineOffset,shadow:s.boxShadow,opacity:s.opacity,cursor:s.cursor,
      font:s.fontSize,line:s.lineHeight,radius:s.borderRadius};`,element);
    const park=async()=>{await driver.actions().move({origin:'viewport',x:10,y:10}).perform();await settle();};
    const hover=async element=>{
      await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',element);
      await driver.actions().move({origin:element}).perform();
      await settle();assert.ok(await driver.executeScript('return arguments[0].matches(":hover")',element));
      return measure(element);
    };
    const press=async element=>{
      await driver.actions().press().perform();await settle();
      assert.ok(await driver.executeScript('return arguments[0].matches(":active")',element));
      const result=await measure(element);await driver.actions().release().perform();return result;
    };
    const escape=async()=>{await driver.actions().sendKeys(Key.ESCAPE).perform();await settle();};
    const row=()=>driver.wait(until.elementLocated(By.css('[role="menuitem"],[role="option"]')),5000);
    const probe=async(trigger,name)=>{
      await driver.wait(until.elementIsEnabled(trigger),10000);
      await park();await driver.executeScript('document.activeElement.blur()');
      const button={rest:await measure(trigger),hover:await hover(trigger),pressed:await press(trigger)};
      await row();await escape();await park();
      await driver.executeScript('arguments[0].focus()',trigger);
      await driver.actions().keyDown(Key.SHIFT).sendKeys(Key.TAB).keyUp(Key.SHIFT).sendKeys(Key.TAB).perform();
      assert.ok(await driver.executeScript('return document.activeElement===arguments[0]&&arguments[0].matches(":focus-visible")',trigger));
      button.focus=await measure(trigger);
      await trigger.sendKeys(Key.SPACE);await row();
      await driver.actions().sendKeys(Key.ARROW_DOWN).perform();await settle();
      const focused=await row();
      const item={focus:await measure(focused),realFocus:await driver.executeScript('return document.activeElement===arguments[0]',focused)};
      await escape();await trigger.click();let option=await row();
      item.hover=await hover(option);await park();item.leave=await measure(option);
      await hover(option);item.pressed=await press(option);
      await driver.wait(async()=>!(await driver.findElements(By.css('[role="menu"],[role="listbox"]'))).length,5000);
      await driver.wait(until.elementIsEnabled(trigger),5000);await trigger.click();option=await row();
      await driver.wait(async()=>(await option.findElements(By.css('svg'))).length>0,5000);
      await park();item.selected=await measure(option);
      await fs.writeFile(output+'/'+name+'.png',await driver.takeScreenshot(),'base64');
      await escape();assert.ok(await driver.executeScript('return document.activeElement===arguments[0]',trigger));
      return {button,item};
    };
    const proof=[];
    for(const theme of ['Light','Dark']){
      await section('General');await(await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${theme}']`)),5000)).click();
      const native=await driver.findElement(By.css('[data-slot="settings.general.item"] button[aria-haspopup="menu"]'));
      const baseline=await probe(native,theme+'-general');
      await driver.executeScript('arguments[0].disabled=true',native);await hover(native);
      const disabled=await measure(native);await driver.executeScript('arguments[0].disabled=false',native);
      for(const label of ['方向探索','知识挖掘','数据一致性','模型审计']){
        await section(label);
        const trigger=await driver.wait(until.elementLocated(By.css('button[aria-label="分析模型"]')),5000);
        const model=await probe(trigger,theme+'-'+label);
        const disabledControls=await driver.findElements(By.css('[data-module-settings] .iad-module-selector:disabled'));
        const disabledStates=[];for(const control of disabledControls)disabledStates.push(await hover(control));
        assert.ok(disabledStates.length>0);
        proof.push({theme,label,baseline,model,disabled,disabledStates});
      }
      await section('数据一致性');
      const mode=await probe(await driver.findElement(By.css('button[aria-label="检索方式"]')),theme+'-mode');
      proof.push({theme,label:'检索方式',baseline,model:mode});
    }
    await fs.writeFile(output+'/proof.json',JSON.stringify(proof,null,2));
    for(const {theme,label,baseline,model,disabled,disabledStates=[]} of proof){
      assert.deepEqual(model.button,baseline.button,theme+' '+label+' trigger states');
      assert.deepEqual(model.item,baseline.item,theme+' '+label+' menu states');
      for(const actual of disabledStates)assert.deepEqual(actual,disabled,theme+' '+label+' disabled');
    }
    await driver.manage().window().setRect({width:1440,height:300});await section('方向探索');
    await(await driver.findElement(By.css('button[aria-label="分析模型"]'))).click();
    const search=await driver.wait(until.elementLocated(By.css('input[aria-label="搜索模型"]')),5000);
    await search.sendKeys(Key.END);await settle();
    const scrolling=await driver.executeScript(`const input=arguments[0],menu=input.closest('[role="menu"]'),rows=menu.querySelectorAll('button[role="menuitem"]:not(:disabled)');
      return {searchTop:input.getBoundingClientRect().top,menuTop:menu.getBoundingClientRect().top,lastFocused:document.activeElement===rows[rows.length-1]};`,search);
    await fs.writeFile(output+'/scroll-proof.json',JSON.stringify(scrolling,null,2));
    assert.equal(scrolling.lastFocused,true);assert.ok(scrolling.searchTop>=scrolling.menuTop,'model search stays visible while the keyboard scrolls through models');
    await escape();
    assert.deepEqual(fixture.errors,[]);
  }finally{await driver?.quit();await fixture.close();}
});
