import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {Builder, By, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {setTimeout as delay} from 'node:timers/promises';
import {startNativeModelHost} from './native-model-host.js';
import {selectSettingOption,settingOptions} from './settings-select.js';

test('consistency groups its encoder settings and automatically saves fixed local DINOv3 models', {timeout:120000}, async()=>{
  const fixture=await startNativeModelHost();let driver;
  try {
    for(const deadline=Date.now()+20000;!fixture.readLog().match(/http:\/\/[^\s)]+/)&&Date.now()<deadline;)await delay(100);
    const login=fixture.readLog().match(/http:\/\/[^\s)]+/)?.[0];assert.ok(login);
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(new firefox.Options()
      .addArguments('-headless','--remote-allow-system-access').setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox'))
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    await driver.manage().window().setRect({width:1280,height:1000});await driver.get(login);
    const api=(path,body)=>driver.executeAsyncScript(`const done=arguments[arguments.length-1];fetch('/api/iad'+arguments[0],arguments[1]?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(arguments[1])}:undefined).then(async r=>done({status:r.status,data:await r.json()})).catch(e=>done({error:String(e)}));`,path,body||null);
    const open=async label=>{
      await driver.wait(async()=>{
        if((await driver.findElements(By.xpath("//*[@data-shortcut-modal='settings']//button[normalize-space(.)='General']"))).length)return true;
        for(const text of ['Configure later','Continue']){
          const buttons=await driver.findElements(By.xpath(`//button[.='${text}']`));
          if(buttons.length&&await buttons[0].isDisplayed())await buttons[0].click();
        }
        const buttons=await driver.findElements(By.css('button[aria-label="Settings"]'));
        if(buttons.length&&await buttons[0].isDisplayed())await buttons[0].click();return false;
      },15000);
      await(await driver.wait(until.elementLocated(By.xpath(`//*[@data-shortcut-modal='settings']//button[normalize-space(.)='${label}']`)),10000)).click();
    };
    await open('数据一致性');
    const hoverStyle=async button=>{
      await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',button);
      await driver.actions().move({origin:button}).perform();
      await driver.executeAsyncScript('const done=arguments[arguments.length-1];requestAnimationFrame(()=>requestAnimationFrame(done))');
      assert.ok(await driver.executeScript('return arguments[0].matches(":hover")',button));
      return driver.executeScript('const s=getComputedStyle(arguments[0]);return {fill:s.backgroundColor,color:s.color,border:s.borderColor};',button);
    };
    const nativeAction=await driver.findElement(By.xpath("//*[@data-shortcut-modal='settings']//button[normalize-space(.)='Open configuration file']"));
    const actionHover=await hoverStyle(nativeAction);
    const group=await driver.wait(until.elementLocated(By.css('[data-settings-group="similar"]')),6000);
    assert.equal((await group.findElements(By.xpath(".//*[normalize-space(.)='模型架构']"))).length,0);
    assert.equal((await group.findElements(By.xpath(".//label[normalize-space(.)='模型']"))).length,1);
    const model=await driver.findElement(By.css('button[aria-label="相似图模型"]'));
    assert.deepEqual((await settingOptions(driver,'相似图模型')).filter(label=>label!=='请选择模型')
      .map(label=>label.replace('（权重未准备）','')),[
      'dinov3-vits16-pretrain-lvd1689m','dinov3-vits16plus-pretrain-lvd1689m',
      'dinov3-vitb16-pretrain-lvd1689m','dinov3-vitl16-pretrain-lvd1689m',
    ]);
    await selectSettingOption(driver,'相似图模型','dinov3-vitb16-pretrain-lvd1689m');
    assert.ok(await driver.executeScript('const label=arguments[0].querySelector("span");return label.scrollWidth<=label.clientWidth',model),'桌面端应完整显示模型名称');
    await driver.wait(async()=>{const r=await api('/images/settings');return r.data.selection?.profile.model_id==='dinov3_vitb16';},10000);
    const first=(await api('/images/settings')).data;
    assert.ok(first.selection.profile.weights_ref.endsWith('/models/dinov3/dinov3_vitb16/model.safetensors'));
    assert.equal(first.selection.compute_dtype,'float16');
    const batch=await driver.findElement(By.css('input[aria-label="编码批量大小"]'));
    await batch.clear();await batch.sendKeys('16');await batch.sendKeys('\uE004');
    await driver.wait(async()=>(await api('/images/settings')).data.resources.batch_size===16,7000);
    assert.equal((await api('/images/settings')).data.selection.profile.profile_id,first.selection.profile.profile_id);
    const size=await driver.findElement(By.css('input[aria-label="输入大小"]'));
    const revision=(await api('/images/settings')).data.revision;
    await size.clear();await size.sendKeys('225');await size.sendKeys('\uE004');
    assert.equal(await size.getAttribute('aria-invalid'),'true');
    assert.equal((await api('/images/settings')).data.revision,revision);
    const description=await size.getAttribute('aria-describedby');assert.ok(description);
    assert.ok((await driver.findElement(By.id(description.split(' ')[0])).getText()).includes('16'));
    await size.clear();await size.sendKeys('256');await size.sendKeys('\uE004');
    await driver.wait(async()=>(await api('/images/settings')).data.selection.profile.input_size===256,10000);
    await selectSettingOption(driver,'相似图模型','dinov3-vits16-pretrain-lvd1689m');
    await driver.wait(async()=>(await api('/images/settings')).data.selection.profile.model_id==='dinov3_vits16',10000);
    const saved=(await api('/images/settings')).data;
    assert.equal(saved.selection.profile.dim,384);assert.equal(saved.selection.profile.input_size,256);
    assert.equal(saved.resources.batch_size,16);
    assert.equal((await driver.findElements(By.css('input[aria-label*="权重"],input[aria-label*="源码"]'))).length,0);
    assert.equal((await driver.findElements(By.xpath("//*[@data-module-settings='consistency']//button[contains(.,'保存图像') or contains(.,'检查加载')]"))).length,0);
    const invalid=await api('/images/settings',{expected_revision:saved.revision,model_id:'dinov3_vits16',batch_size:16,input_size:225});
    assert.notEqual(invalid.status,200);assert.equal((await api('/images/settings')).data.revision,saved.revision);
    await driver.executeScript(`const original=window.fetch.bind(window);window.fetch=(url,options)=>{
      if(String(url).endsWith('/images/settings')&&options?.method==='POST'){
        window.fetch=original;return Promise.resolve(new Response(JSON.stringify({error:{message:'临时断网'}}),{status:503,headers:{'Content-Type':'application/json'}}));
      }return original(url,options);
    };`);
    await batch.clear();await batch.sendKeys('32','\uE004');
    await driver.wait(until.elementLocated(By.xpath("//*[@role='alert'][contains(.,'临时断网')]")),7000);
    assert.equal(await batch.getAttribute('value'),'32');
    assert.deepEqual(await hoverStyle(await driver.findElement(By.xpath("//button[normalize-space(.)='重试保存']"))),actionHover,'retry uses the native settings action hover');
    await size.clear();await size.sendKeys('272','\uE004');
    await driver.wait(async()=>(await api('/images/settings')).data.selection.profile.input_size===272,10000);
    await(await driver.findElement(By.xpath("//button[normalize-space(.)='重试保存']"))).click();
    await driver.wait(async()=>{const s=(await api('/images/settings')).data;return s.resources.batch_size===32&&s.selection.profile.input_size===272;},10000);
    const beforeConflict=(await api('/images/settings')).data;
    assert.equal((await api('/images/settings',{expected_revision:beforeConflict.revision,model_id:'dinov3_vits16',batch_size:48,input_size:272})).status,200);
    await batch.clear();await batch.sendKeys('64','\uE004');
    await driver.wait(until.elementLocated(By.xpath("//*[@role='alert'][contains(.,'配置已变化')]")),7000);
    assert.equal(await batch.getAttribute('value'),'64');
    await(await driver.findElement(By.xpath("//button[normalize-space(.)='重试保存']"))).click();
    await driver.wait(async()=>(await api('/images/settings')).data.resources.batch_size===64,10000);
    await selectSettingOption(driver,'检索方式','完全一致');
    await driver.wait(async()=>!await model.isEnabled(),5000);
    await selectSettingOption(driver,'检索方式','一致+相似');
    await driver.wait(async()=>await model.isEnabled(),5000);
    await fs.mkdir('../../.scratch/consistency-gpu',{recursive:true});
    await fs.writeFile('../../.scratch/consistency-gpu/encoder-desktop.png',await driver.takeScreenshot(),'base64');
    await open('General');await(await driver.findElement(By.xpath("//*[@data-shortcut-modal='settings']//button[normalize-space(.)='Dark']"))).click();
    await open('数据一致性');await driver.manage().window().setRect({width:450,height:900});
    await driver.setContext('chrome');
    await driver.executeScript("gBrowser.selectedBrowser.style.maxWidth='390px';gBrowser.selectedBrowser.style.width='390px';gBrowser.selectedBrowser.style.flex='none'");
    await driver.setContext('content');await driver.wait(()=>driver.executeScript('return innerWidth===390'),5000);
    assert.equal(await driver.executeScript('return document.documentElement.scrollWidth>innerWidth'),false);
    assert.ok(await driver.executeScript(`return [...document.querySelectorAll('[data-settings-group=similar] .iad-setting-label')]
      .every(label=>label.getBoundingClientRect().height<24)`),'窄屏字段名称应保持完整可读');
    await fs.writeFile('../../.scratch/consistency-gpu/encoder-mobile-dark.png',await driver.takeScreenshot(),'base64');
    assert.deepEqual(fixture.errors,[]);
  } catch(error) {
    if(driver)console.error((await driver.findElement(By.css('body')).getText()).slice(-3500));
    console.error(fixture.readLog().slice(-2500).replace(/([?&]token=)[^\s)]+/g,'$1<REDACTED>'));throw error;
  } finally {await driver?.quit();await fixture.close();}
});
