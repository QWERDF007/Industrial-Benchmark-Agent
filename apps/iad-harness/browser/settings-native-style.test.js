import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {setTimeout as delay} from 'node:timers/promises';
import {startNativeModelHost} from './native-model-host.js';
import {selectModuleModel} from './module-model-select.js';

test('all four business settings follow General controls, labels, hints and themes', {timeout:120000}, async()=>{
  const fixture=await startNativeModelHost();let driver;
  const output='../../.scratch/settings-native';
  try{
    await fs.mkdir(output,{recursive:true});
    for(const deadline=Date.now()+25000;!fixture.readLog().match(/http:\/\/[^\s)]+/)&&Date.now()<deadline;)await delay(100);
    const login=fixture.readLog().match(/http:\/\/[^\s)]+/)?.[0];assert.ok(login);
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(new firefox.Options()
      .addArguments('-headless','--remote-allow-system-access').setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox'))
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    await driver.manage().window().setRect({width:1280,height:1000});await driver.get(login);
    await driver.wait(async()=>{
      if((await driver.findElements(By.xpath("//*[@data-shortcut-modal='settings']//button[normalize-space(.)='General']"))).length)return true;
      for(const text of ['Configure later','Continue']){const b=await driver.findElements(By.xpath(`//button[.='${text}']`));if(b.length&&await b[0].isDisplayed())await b[0].click();}
      const b=await driver.findElements(By.css('button[aria-label="Settings"]'));if(b.length&&await b[0].isDisplayed())await b[0].click();return false;
    },15000);
    const section=async label=>(await driver.wait(until.elementLocated(By.xpath(`//*[@data-shortcut-modal='settings']//button[normalize-space(.)='${label}']`)),8000)).click();
    const general=async()=>{
      await section('General');await driver.wait(until.elementLocated(By.css('[data-slot="settings.general.item"] button[aria-haspopup="menu"]')),7000);
      return driver.executeScript(`const button=document.querySelector('[data-slot="settings.general.item"] button[aria-haspopup="menu"]');
        let row=button.parentElement;while(row&&parseFloat(getComputedStyle(row).borderBottomWidth)===0)row=row.parentElement;
        const control=getComputedStyle(button),style=getComputedStyle(row);
        return {font:control.fontSize,line:control.lineHeight,radius:control.borderRadius,fill:control.backgroundColor,color:control.color,height:button.getBoundingClientRect().height,
          borderColor:style.borderBottomColor,borderWidth:style.borderBottomWidth,paddingTop:style.paddingTop,paddingBottom:style.paddingBottom};`);
    };
    const modules={exploration:'方向探索',knowledge:'知识挖掘',consistency:'数据一致性',audit:'模型审计'};
    const api=module=>driver.executeAsyncScript(`const done=arguments[arguments.length-1];fetch('/api/iad/settings/modules/'+arguments[0]).then(r=>r.json()).then(done);`,module);
    const evidence=[];
    for(const theme of ['Light','Dark']){
      const reference=await general();
      await(await driver.findElement(By.xpath(`//*[@data-shortcut-modal='settings']//button[normalize-space(.)='${theme}']`))).click();
      const expected=await general();
      for(const [module,label] of Object.entries(modules)){
        await section(label);await driver.wait(until.elementLocated(By.css('[data-module-settings] input[type="number"]')),7000);
        const measured=await driver.executeScript(`const root=document.querySelector('[data-module-settings]'),button=root.querySelector('button[aria-label="分析模型"]'),input=root.querySelector('input[type=number]'),row=button.closest('.iad-module-row');
          const b=getComputedStyle(button),n=getComputedStyle(input),r=getComputedStyle(row),title=root.querySelector('.iad-setting-label');
          return {headingCount:root.querySelectorAll('h2').length,font:b.fontSize,line:b.lineHeight,radius:b.borderRadius,fill:b.backgroundColor,color:b.color,height:button.getBoundingClientRect().height,
            inputFill:n.backgroundColor,inputRadius:n.borderRadius,inputBorder:n.borderWidth,inputHeight:input.getBoundingClientRect().height,inputFont:n.fontSize,
            borderColor:r.borderBottomColor,borderWidth:r.borderBottomWidth,paddingTop:r.paddingTop,paddingBottom:r.paddingBottom,
            labelWeight:title?getComputedStyle(title).fontWeight:null};`);
        assert.equal(measured.headingCount,0,label+' follows General without an extra title');
        for(const key of ['font','line','radius','fill','color','height','borderColor','borderWidth','paddingTop','paddingBottom'])
          assert.equal(measured[key],expected[key],`${theme} ${label} ${key}`);
        assert.equal(measured.inputFont,expected.font);assert.equal(measured.inputFill,expected.fill);assert.equal(measured.inputRadius,expected.radius);
        assert.equal(measured.inputBorder,'0px');assert.equal(measured.inputHeight,expected.height);assert.equal(measured.labelWeight,'400');
        if(theme==='Light'){
          await selectModuleModel(driver,'Second model（Second service）',{keyboard:module==='knowledge'});
          await driver.wait(async()=>(await api(module)).settings.model?.model_id==='second-model',6000);
          const input=await driver.findElement(By.css('[data-module-settings] input[type=number]'));
          await input.clear();await input.sendKeys('3',Key.ENTER);
          const field=module==='consistency'?'concurrency':'batch_size';
          await driver.wait(async()=>(await api(module)).settings[field]===3,6000);
          if(module==='consistency'){
            const hint=await driver.findElement(By.css('input[aria-label="输入大小"]'));
            const id=await hint.getAttribute('aria-describedby');assert.ok(id);
            assert.ok(await driver.executeScript('return arguments[0].closest(".iad-module-row").querySelector(".iad-module-row-text").contains(document.getElementById(arguments[1]))',hint,id.split(' ')[0]));
          }
        }
        evidence.push({theme,module,...measured});
        await fs.writeFile(`${output}/${module}-${theme.toLowerCase()}.png`,await driver.takeScreenshot(),'base64');
      }
      assert.ok(reference.font);
    }
    await driver.manage().window().setRect({width:450,height:900});await driver.setContext('chrome');
    await driver.executeScript("gBrowser.selectedBrowser.style.maxWidth='390px';gBrowser.selectedBrowser.style.width='390px';gBrowser.selectedBrowser.style.flex='none'");
    await driver.setContext('content');await driver.wait(()=>driver.executeScript('return innerWidth===390'),4000);
    for(const [module,label] of Object.entries(modules)){
      await section(label);await driver.wait(until.elementLocated(By.css('[data-module-settings] input[type=number]')),7000);
      assert.ok(await driver.executeScript('const root=document.querySelector("[data-module-settings]");return root.scrollWidth<=root.clientWidth+1&&document.documentElement.scrollWidth<=innerWidth'),label+' narrow layout');
      await fs.writeFile(`${output}/${module}-mobile.png`,await driver.takeScreenshot(),'base64');
    }
    await fs.writeFile(output+'/proof.json',JSON.stringify(evidence,null,2));assert.deepEqual(fixture.errors,[]);
  }catch(error){
    if(driver){console.error((await driver.findElement(By.css('body')).getText()).slice(-2000));await fs.writeFile(output+'/failure.png',await driver.takeScreenshot(),'base64');}
    throw error;
  }finally{await driver?.quit();await fixture.close();}
});
