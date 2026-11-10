import test from 'node:test';
import assert from 'node:assert/strict';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {setTimeout as delay} from 'node:timers/promises';
import {startNativeModelHost} from './native-model-host.js';
import {selectModuleModel} from './module-model-select.js';

test('a provider added to the shared directory is immediately available in every module without modality declarations',{timeout:60000},async()=>{
  const fixture=await startNativeModelHost();let driver;
  try {
    const deadline=Date.now()+20000;
    while(!fixture.readLog().match(/http:\/\/[^\s)]+/) && Date.now()<deadline)await delay(100);
    const login=fixture.readLog().match(/http:\/\/[^\s)]+/)?.[0];assert.ok(login);
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(new firefox.Options()
      .addArguments('-headless','--remote-allow-system-access').setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox'))
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    await driver.get(login);
    const api=(path,body,method)=>driver.executeAsyncScript(`const done=arguments[arguments.length-1];fetch('/api/iad'+arguments[0],arguments[1]||arguments[2]?{method:arguments[2]||'POST',headers:{'Content-Type':'application/json'},body:arguments[1]?JSON.stringify(arguments[1]):undefined}:undefined).then(async r=>done({status:r.status,data:await r.json()})).catch(e=>done({error:String(e)}));`,path,body||null,method||null);
    await driver.wait(until.elementLocated(By.css('button[aria-label="Settings"]')),15000);
    const section=async label=>{
      await driver.wait(async()=>{
        if((await driver.findElements(By.css('[data-shortcut-modal="settings"]'))).length)return true;
        const buttons=await driver.findElements(By.css('button[aria-label="Settings"]'));
        if(buttons.length)await buttons[0].click();return false;
      },15000);
      await(await driver.wait(until.elementLocated(By.xpath(`//*[@data-shortcut-modal='settings']//button[normalize-space(.)='${label}']`)),10000)).click();
      await driver.wait(until.elementLocated(By.css('button[aria-label="分析模型"]')),5000);
    };
    await section('方向探索');
    const before=(await api('/models/providers')).data;
    const added=await api('/models/providers',{expected_revision:before.provider_revision,provider_id:'added-service',name:'新增服务',
      endpoint:fixture.modelBase+'/second/v1',api_key:'added-isolated-key',
      models:[{model_id:'added-model',name:'新增模型',context_tokens:65536,max_output_tokens:8192}]});
    assert.equal(added.status,200,JSON.stringify(added.data));
    assert.equal(Object.hasOwn(added.data,'selection'),false);
    assert.ok(added.data.providers.some(provider=>provider.provider_id==='added-service'));
    for(const [module,label] of [['knowledge','知识挖掘'],['consistency','数据一致性'],['audit','模型审计'],['exploration','方向探索']]) {
      await section(label);await selectModuleModel(driver,'新增模型（新增服务）');
      await driver.wait(async()=>(await api('/settings/modules/'+module)).data.settings.model?.provider_id==='added-service',5000);
    }
    const stale=await api('/models/providers',{expected_revision:before.provider_revision,provider_id:'added-service',name:'旧覆盖',
      endpoint:fixture.modelBase+'/second/v1',models:[{model_id:'added-model',name:'旧模型',context_tokens:65536,max_output_tokens:8192}]});assert.notEqual(stale.status,200);
    assert.equal((await api('/models')).status,404);
    assert.equal((await api('/models',{selection:{}})).status,404);
    assert.equal((await api('/models/check',{})).status,404);
    assert.equal(fixture.calls.length,0);
  } finally {await driver?.quit();await fixture.close();}
});
