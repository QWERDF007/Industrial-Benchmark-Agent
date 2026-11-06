import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import {setTimeout as delay} from 'node:timers/promises';
import {Builder,By,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {startNativeModelHost} from './native-model-host.js';
import {viewport} from './workbench-layout.js';

test('native settings preserve General and Models while business settings persist and route jobs',{timeout:90000},async()=>{
  const fixture=await startNativeModelHost();const {host,readLog,root,calls}=fixture;let driver,phase='startup';
  try{
    const deadline=Date.now()+30000;
    while(!readLog().match(/http:\/\/[^\s)]+/) && host.exitCode===null && Date.now()<deadline)await delay(100);
    const login=readLog().match(/http:\/\/[^\s)]+/)?.[0];assert.ok(login,'native host started');
    const address=Object.values(os.networkInterfaces()).flat().find(item=>item?.family==='IPv4'&&!item.internal)?.address;
    const url=new URL(login);url.hostname=address;
    const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');
    if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    await viewport(driver,1440,1000);await driver.get(url.href);
    const api=async(body,route)=>driver.executeAsyncScript(`const done=arguments[arguments.length-1];fetch('/api/iad'+arguments[1],arguments[0]?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(arguments[0])}:undefined).then(async r=>done({status:r.status,data:await r.json()})).catch(e=>done({error:String(e)}));`,body,route);
    const click=async text=>(await driver.wait(until.elementLocated(By.xpath(`//*[@data-shortcut-modal='settings']//button[normalize-space(.)='${text}' or @aria-label='${text}']`)),10000)).click();
    const open=async()=>{
      await driver.wait(async()=>{
        if((await driver.findElements(By.xpath("//*[@data-shortcut-modal='settings']//button[normalize-space(.)='General']"))).length)return true;
        for(const text of ['Configure later','Continue']){const rows=await driver.findElements(By.xpath(`//button[.='${text}']`));if(rows.length&&await rows[0].isDisplayed())await rows[0].click();}
        const rows=await driver.findElements(By.css('button[aria-label="Settings"]'));
        if(rows.length&&await rows[0].isDisplayed())await rows[0].click();return false;
      },15000);
    };
    const section=async label=>{await click(label);await driver.wait(until.elementLocated(By.css('[data-module-settings]')),10000);await driver.wait(until.elementLocated(By.css('select[aria-label="分析模型"]')),10000);};
    phase='native sections unchanged';await open();await click('General');
    await driver.wait(until.elementLocated(By.xpath("//*[@data-shortcut-modal='settings']//button[normalize-space(.)='Light']")),5000);
    await click('Models');await driver.wait(until.elementLocated(By.css('button[aria-label^="Edit First service"]')),10000);
    assert.equal((await driver.findElements(By.css('[data-module-settings]'))).length,0);
    for(const label of ['方向探索','知识挖掘','数据一致性','模型审计'])assert.equal((await driver.findElements(By.xpath(`//*[@data-shortcut-modal='settings']//button[normalize-space(.)='${label}']`))).length,1);
    const shared=await api(null,'/models');
    const configured=await api({expected_revision:shared.data.revision,selection:{provider_id:'first-service',model_id:'first-model',limits:{capacity_mode:'vllm_tokenize'}}},'/models');assert.equal(configured.status,200);
    phase='per-module model persistence';
    for(const [module,label] of Object.entries({exploration:'方向探索',knowledge:'知识挖掘',audit:'模型审计'})){
      await section(label);const selected=await driver.findElement(By.css('select[aria-label="分析模型"]'));
      assert.equal(await selected.getAttribute('value'),'');
      await selected.sendKeys('Second model（Second service）');await click('保存设置');
      await driver.wait(async()=>(await api(null,`/settings/modules/${module}`)).data.settings.model?.model_id==='second-model',5000);
      assert.equal((await driver.findElements(By.css('[data-module-settings] input'))).length,0,'业务分类只配置分析模型');
    }
    phase='consistency defaults';await section('数据一致性');
    const settings=await api(null,'/settings/modules/consistency');assert.equal(settings.data.settings.min_similarity,.95);
    const threshold=await driver.findElement(By.css('input[aria-label="相似度阈值"]'));
    await threshold.clear();await threshold.sendKeys('0.97');await click('保存设置');
    await driver.wait(async()=>(await api(null,'/settings/modules/consistency')).data.settings.min_similarity===.97,5000);
    assert.notEqual((await api({expected_revision:0,settings:{mode:'exact'}},'/settings/modules/consistency')).status,200);
    const invalid=await api({expected_revision:0,settings:{model:{provider_id:'missing-provider',model_id:'missing'}}},'/settings/modules/audit');assert.notEqual(invalid.status,200);
    assert.equal((await api(null,'/settings/modules/audit')).data.settings.model.model_id,'second-model');
    await driver.findElement(By.css('select[aria-label="检索方式"]')).sendKeys('完全一致');
    assert.equal((await driver.findElements(By.css('input[aria-label="相似度阈值"]'))).length,0);await click('保存设置');
    await driver.wait(async()=>(await api(null,'/settings/modules/consistency')).data.settings.mode==='exact',5000);
    await fs.writeFile('/tmp/iad-v74-business-settings.png',await driver.takeScreenshot(),'base64');
    await driver.navigate().refresh();await open();await section('数据一致性');
    await driver.wait(async()=>await driver.findElement(By.css('select[aria-label="检索方式"]')).getAttribute('value')==='exact',5000);
    assert.equal((await api(null,'/models')).data.selection.model_id,'first-model','模块配置不改变工作台模型');
    assert.equal((await api(null,'/settings/modules/knowledge')).data.settings.model.model_id,'second-model');
    phase='reset current section';await click('恢复默认');await click('保存设置');
    await driver.wait(async()=>(await api(null,'/settings/modules/consistency')).data.settings.min_similarity===.95,5000);
    assert.equal((await api(null,'/settings/modules/audit')).data.settings.model.model_id,'second-model');
    phase='real job model routing';
    const imported=await api({format:'labelme',name:'Module settings routing',image_dir:root+'/images',annotation_dir:root+'/labels'},'/datasets/import');assert.equal(imported.status,200);
    const dataset=imported.data.dataset_id;
    const started=await api({dataset_id:dataset,normal_images:[dataset+':part-0.png'],defect_images:[dataset+':part-2.png']},'/exploration/start');assert.equal(started.status,200,JSON.stringify(started));
    const job=await driver.wait(async()=>{const result=await api(null,`/exploration/status/${started.data.run_id}`);return !['RUNNING','PENDING'].includes(result.data.status)?result.data:false;},15000);
    assert.equal(job.status,'COMPLETED',JSON.stringify(job.errors));assert.equal(job.model_profile.model_id,'second-model');assert.equal(job.model_profile.provider_id,'second-service');
    assert.ok(calls.some(call=>call.path.startsWith('/second/')&&call.body?.model==='second-model'&&call.authorization==='Bearer second-isolated-key'));
    phase='program retrieval reads module defaults';
    const exact=await api({expected_revision:3,settings:{mode:'exact',min_similarity:.98}},'/settings/modules/consistency');assert.equal(exact.status,200,JSON.stringify(exact));
    const program=await api({request_id:'module-exact-default',subjects:{kind:'datasets',dataset_ids:[dataset]},corpus_scope:{kind:'datasets',dataset_ids:[dataset]}},'/consistency/start');assert.equal(program.status,200,JSON.stringify(program));
    const frozen=JSON.parse(execFileSync('/home/dell/anaconda3/envs/iad_agent/bin/python',['-c',
      "import json,sqlite3,sys; c=sqlite3.connect(sys.argv[1]); print(c.execute('SELECT plan_json FROM consistency_runs WHERE batch_id=?',(sys.argv[2],)).fetchone()[0])",root+'/workbench.db',program.data.batch_id],{encoding:'utf8'}));
    assert.equal(frozen.request.mode,'exact');assert.equal(frozen.request.min_similarity,.98);
    const overridden=await api({expected_revision:exact.data.revision,settings:{model:{provider_id:'second-service',model_id:'second-model'},mode:'exact',min_similarity:.98}},'/settings/modules/consistency');
    assert.equal(overridden.status,200);
    const analysis=await api({analysis_kind:'consistency',dataset_ids:[dataset]},'/analysis/start');assert.equal(analysis.status,200,JSON.stringify(analysis));
    const node=await api(null,`/analysis/node/${analysis.data.run_id}`);assert.equal(node.status,200);
    assert.equal(node.data.model_profile.model_id,'second-model');
    assert.equal(node.data.request.submission.mode,'exact');assert.equal(node.data.request.submission.min_similarity,.98);
    await api({expected_revision:overridden.data.revision,settings:{mode:'combined',min_similarity:.95}},'/settings/modules/consistency');
    const frozenAgain=await api(null,`/analysis/node/${analysis.data.run_id}`);
    assert.equal(frozenAgain.data.model_profile.model_id,'second-model');assert.equal(frozenAgain.data.request.submission.min_similarity,.98);

    assert.equal(await driver.executeScript('return document.documentElement.scrollWidth>innerWidth'),false);
    await viewport(driver,800,800);await fs.writeFile('/tmp/iad-v74-business-settings-compact.png',await driver.takeScreenshot(),'base64');
    await click('General');await driver.wait(until.elementLocated(By.xpath("//*[@data-shortcut-modal='settings']//button[normalize-space(.)='Light']")),5000);
    await click('Models');await driver.wait(until.elementLocated(By.css('button[aria-label^="Edit First service"]')),10000);
  }catch(error){
    if(driver){console.error(phase+'\n'+(await driver.findElement(By.css('body')).getText()).slice(-4000));await fs.writeFile('/tmp/iad-v74-module-failure.png',await driver.takeScreenshot(),'base64');}
    console.error(readLog().slice(-2500).replace(/(token=)[^\s&]+/g,'$1<redacted>'));throw error;
  }finally{await driver?.quit();await fixture.close();}
});
