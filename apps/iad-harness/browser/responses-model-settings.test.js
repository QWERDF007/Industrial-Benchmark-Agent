import {selectModuleModel} from './module-model-select.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {Select} from 'selenium-webdriver/lib/select.js';
import {startNativeModelHost} from './native-model-host.js';

test('native consistency settings select and persist an image-capable Responses model',{timeout:60000},async()=>{
  const fixture=await startNativeModelHost({profilePatch:`- id: llm-pi-ai
  config:
    providers:
      pinai:
        displayName: PinAI
        api: openai-responses
        baseURL: https://pinai.invalid/v1
        apiKeyEnv: IAD_SECOND_TEST_KEY
        models:
          - id: gpt-6.1-sol
            input: [text]
            contextWindow: 262144
            maxTokens: 32768
            reasoningEfforts: {low: low, medium: medium, high: high, xhigh: xhigh}
          - id: vision-no-reasoning
            input: [text]
            contextWindow: 32768
            maxTokens: 4096
`});
  let driver;
  try {
    const deadline=Date.now()+20000;
    while(!fixture.readLog().match(/http:\/\/[^\s)]+/) && Date.now()<deadline)await delay(100);
    const login=fixture.readLog().match(/http:\/\/[^\s)]+/)?.[0];assert.ok(login);
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(new firefox.Options()
      .addArguments('-headless','--remote-allow-system-access').setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox'))
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    await driver.manage().window().setRect({width:1440,height:1000});await driver.get(login);
    const api=(body,route)=>driver.executeAsyncScript(`const done=arguments[arguments.length-1];fetch('/api/iad'+arguments[1],arguments[0]?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(arguments[0])}:undefined).then(async r=>done({status:r.status,data:await r.json()}));`,body,route);
    const shared=await api(null,'/models');
    assert.equal(shared.status,404,'旧公共默认模型入口已删除');
    for(const module of ['exploration','knowledge','audit']) {
      const current=(await api(null,`/settings/modules/${module}`)).data;
      const saved=await api({expected_revision:current.revision,settings:{model:{provider_id:'pinai',model_id:'gpt-6.1-sol'}}},`/settings/modules/${module}`);
      assert.equal(saved.status,200,JSON.stringify(saved.data));
    }
    const open=async(label='数据一致性')=>{
      await driver.wait(async()=>{
        if((await driver.findElements(By.css('[data-shortcut-modal="settings"]'))).length)return true;
        const button=await driver.findElements(By.css('button[aria-label="Settings"]'));
        if(button.length)await button[0].click();return false;
      },10000);
      await(await driver.wait(until.elementLocated(By.xpath(`//*[@data-shortcut-modal='settings']//button[normalize-space(.)='${label}']`)),10000)).click();
      return driver.wait(until.elementLocated(By.css('button[aria-label="分析模型"]')),10000);
    };
    const selected=await open();
    await selectModuleModel(driver,'gpt-6.1-sol（PinAI）',{keyboard:true});
    await driver.wait(async()=>(await api(null,'/settings/modules/consistency')).data.settings.model?.provider_id==='pinai',5000);
    let effort=await driver.wait(until.elementLocated(By.css('select[aria-label="推理强度"]')),5000);
    assert.equal(await effort.getAttribute('value'),'');
    assert.deepEqual(await Promise.all((await effort.findElements(By.css('option'))).map(option=>option.getText())),['Default','Low','Medium','High','XHigh']);
    assert.deepEqual(await Promise.all((await effort.findElements(By.css('option'))).map(option=>option.getAttribute('value'))),['','low','medium','high','xhigh']);
    await new Select(effort).selectByValue('xhigh');
    await driver.wait(async()=>(await api(null,'/settings/modules/consistency')).data.settings.reasoning_effort==='xhigh',5000);
    await driver.navigate().refresh();
    assert.equal(await(await open()).getText(),'gpt-6.1-sol');
    effort=await driver.findElement(By.css('select[aria-label="推理强度"]'));
    assert.equal(await effort.getAttribute('value'),'xhigh');
    await open();await selectModuleModel(driver,'vision-no-reasoning（PinAI）');
    await driver.wait(async()=>(await api(null,'/settings/modules/consistency')).data.settings.model?.model_id==='vision-no-reasoning',5000);
    assert.equal((await api(null,'/settings/modules/consistency')).data.settings.reasoning_effort,null);
    assert.equal(await(await driver.findElement(By.css('select[aria-label="推理强度"]'))).isEnabled(),false);
    await open();await selectModuleModel(driver,'gpt-6.1-sol（PinAI）');
    await driver.wait(async()=>(await api(null,'/settings/modules/consistency')).data.settings.model?.model_id==='gpt-6.1-sol',5000);
    await new Select(await driver.findElement(By.css('select[aria-label="推理强度"]'))).selectByValue('high');
    await driver.wait(async()=>(await api(null,'/settings/modules/consistency')).data.settings.reasoning_effort==='high',5000);
    const models=(await api(null,'/models/providers')).data;
    const row=models.providers.find(provider=>provider.provider_id==='pinai');
    assert.equal(row.error,null);assert.deepEqual(row.models[0].input_modalities,['text']);
    const updated=await api({expected_revision:models.provider_revision,provider_id:'pinai',name:'PinAI',
      endpoint:row.endpoint,models:row.models},'/models/providers');
    assert.equal(updated.status,200);
    assert.equal(updated.data.providers.find(provider=>provider.provider_id==='pinai').api,'openai-responses');
    assert.deepEqual(updated.data.providers.find(provider=>provider.provider_id==='pinai').models[0].reasoning_efforts,['low','medium','high','xhigh']);
    assert.equal(Object.hasOwn(updated.data,'selection'),false);
    for(const [module,label,value] of [['exploration','方向探索','low'],['knowledge','知识挖掘','medium'],['audit','模型审计','xhigh']]) {
      await open(label);
      let control=await driver.wait(until.elementLocated(By.css('select[aria-label="推理强度"]')),5000);
      assert.deepEqual(await Promise.all((await control.findElements(By.css('option'))).map(option=>option.getAttribute('value'))),['','low','medium','high','xhigh']);
      await new Select(control).selectByValue(value);
      await driver.wait(async()=>(await api(null,`/settings/modules/${module}`)).data.settings.reasoning_effort===value,5000);
      await driver.navigate().refresh();await open(label);
      control=await driver.findElement(By.css('select[aria-label="推理强度"]'));
      assert.equal(await control.getAttribute('value'),value);
      await selectModuleModel(driver,'vision-no-reasoning（PinAI）');
      await driver.wait(async()=>(await api(null,`/settings/modules/${module}`)).data.settings.model?.model_id==='vision-no-reasoning',5000);
      assert.equal((await api(null,`/settings/modules/${module}`)).data.settings.reasoning_effort,null);
      assert.equal(await(await driver.findElement(By.css('select[aria-label="推理强度"]'))).isEnabled(),false);
    }
    assert.equal((await api(null,'/settings/modules/consistency')).data.settings.reasoning_effort,'high');
    assert.equal(fixture.calls.length,0);
    await driver.findElement(By.css('button[aria-label="分析模型"]')).click();
    assert.ok((await driver.findElements(By.css('[role=group][aria-label=PinAI]'))).length);
    await fs.writeFile('/tmp/module-model-picker.png',await driver.takeScreenshot(),'base64');
    await fs.writeFile('/tmp/pinai-module-settings.png',await driver.takeScreenshot(),'base64');
  } catch(error){if(driver)await fs.writeFile('/tmp/module-picker-failure.png',await driver.takeScreenshot(),'base64');throw error;} finally {await driver?.quit();await fixture.close();}
});
