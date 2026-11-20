import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {setTimeout as delay} from 'node:timers/promises';
import {PythonBridge,findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {startNativeModelHost} from '../browser/native-model-host.js';
import {viewport} from '../browser/workbench-layout.js';

test('creation forms submit job sizes and the prompts used by each audit scope',{timeout:120000},async t=>{
  const fixture=await startNativeModelHost(),cwd=findWorkspaceRoot(),database=path.join(fixture.root,'workbench.db');
  const source=JSON.parse(execFileSync(resolvePythonPath(),['apps/iad-harness/test/fixtures/audit_summary_dataset.py',fixture.root,database],
    {cwd,env:{...process.env,PYTHONPATH:path.join(cwd,'python')},encoding:'utf8'}));
  const bridge=new PythonBridge({cwd,dbPath:database});
  let driver;
  t.after(async()=>{await driver?.quit();await bridge.destroy();await fixture.close();});
  for(const module of ['consistency','audit']){
    const saved=await bridge.execute('module_settings_get',{module});
    await bridge.execute('module_settings_save',{module,expected_revision:saved.revision,
      settings:{...(module==='consistency'?{mode:'exact'}:{}),model:{provider_id:'first-service',model_id:'first-model'}}});
  }
  const dataset=await bridge.execute('dataset_get',{dataset_id:source.dataset_id});
  for(const deadline=Date.now()+25000;!fixture.readLog().match(/http:\/\/[^\s)]+/)&&Date.now()<deadline;)await delay(100);
  const login=fixture.readLog().match(/http:\/\/[^\s)]+/)?.[0];assert.ok(login);
  driver=await new Builder().forBrowser('firefox').setFirefoxOptions(new firefox.Options().addArguments('-headless','--remote-allow-system-access')
    .setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox'))
    .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
  await driver.get(login);await viewport(driver,1920,1080);
  const base=new URL(login).origin;
  const element=css=>driver.wait(until.elementLocated(By.css(css)),15000);
  const click=async css=>{const target=await element(css);await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',target);await target.click();};
  const replace=async(css,text)=>{const input=await element(css);await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',input);
    await input.clear();await input.sendKeys(text,Key.TAB);};
  const page=pageId=>driver.get(base+'/?'+new URLSearchParams({iad:JSON.stringify({pageId,datasetId:source.dataset_id,
    datasetIds:[source.dataset_id],parentId:dataset.group_id,view:'setup',tab:'setup'})}));
  await page('industrial-consistency');await element('#dc-new-prompt');
  assert.equal(await driver.executeScript('return document.querySelector("#dc-create-page .dc-scope").nextElementSibling.querySelector("h2").textContent'),'确认并启动');
  assert.equal(await driver.executeScript('return document.querySelector("#dc-create-page .iad-job-start").tagName'),'FORM');
  assert.deepEqual(await driver.executeScript('return [...document.querySelectorAll("#dc-create-page .iad-job-start-fields th")].map(node=>node.textContent)'),
    ['检查范围','模型','检索方式','缩放方式','图像大小（像素）','相似度阈值']);
  assert.equal(await driver.executeScript('return document.querySelectorAll("#dc-create-page .iad-job-start-fields tbody tr").length'),1);
  assert.ok(await driver.executeScript('return [...document.querySelectorAll("#dc-create-page .iad-job-start-fields input")].every(node=>node.clientWidth>=100&&node.labels.length===1)'));
  assert.equal((await driver.findElements(By.css('[data-dc="create-job"]'))).length,1);
  assert.equal(await(await element('input[aria-label="相似度阈值"]')).getAttribute('value'),'0.990');
  await replace('input[aria-label="相似度阈值"]','0.99');
  assert.equal(await(await element('input[aria-label="相似度阈值"]')).getAttribute('value'),'0.990');
  for(const invalid of ['1.1','0.9901']){
    await replace('input[aria-label="相似度阈值"]',invalid);
    assert.equal(await(await element('[data-dc="create-job"]')).isEnabled(),false);
  }
  await replace('input[aria-label="相似度阈值"]','0.995');
  assert.equal(await(await element('[aria-label="图像大小"]')).isEnabled(),true);
  await replace('input[aria-label="图像大小"]','128');
  assert.equal(await(await element('[aria-label="缩放方式"]')).getText(),'原图尺寸');
  await click('[aria-label="缩放方式"]');
  await(await driver.wait(until.elementLocated(By.xpath('//*[@role="menuitem"][normalize-space(.)="自定义最大边"]')),5000)).click();
  assert.equal(await(await element('input[aria-label="图像大小"]')).getAttribute('value'),'128');
  for(const invalid of ['0','-1','1.5']){
    await replace('input[aria-label="图像大小"]',invalid);
    assert.equal(await(await element('[data-dc="create-job"]')).isEnabled(),false,'非法尺寸不能启动');
  }
  const size=await element('input[aria-label="图像大小"]');await size.clear();await size.sendKeys('64');
  await driver.executeScript(`window.creationAttempts=[];const send=window.fetch;window.fetch=(url,options)=>{
    if(String(url).endsWith('/analysis/start')){creationAttempts.push(JSON.parse(options.body));if(creationAttempts.length===1)
      return new Promise(resolve=>window.releaseCreationFailure=()=>resolve(new Response(JSON.stringify({error:{message:'暂时无法提交，请重试'}}),{status:503,headers:{'Content-Type':'application/json'}})));}
    return send(url,options);};`);
  await driver.executeScript('document.querySelector("[data-dc=create-job]").click()');
  await driver.wait(()=>driver.executeScript('return typeof releaseCreationFailure==="function"'),5000);
  assert.equal(await(await element('[aria-label="缩放方式"]')).isEnabled(),false);
  assert.equal(await size.isEnabled(),false);
  assert.equal(await(await element('#dc-new-prompt')).isEnabled(),false);
  await driver.executeScript('releaseCreationFailure()');await element('dialog[aria-label="创建检查失败"]');
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  await driver.wait(async()=>(await driver.findElements(By.css('dialog'))).length===0,5000);
  assert.equal(await driver.executeScript('return document.activeElement.getAttribute("data-dc")'),'create-job');
  await click('[data-dc="create-job"]');
  await driver.wait(async()=>(await driver.findElements(By.css('#dc-create-page'))).length===0,15000);
  const attempts=await driver.executeScript('return creationAttempts');
  assert.equal(attempts[0].whole_image_max_side,64);assert.equal(attempts[0].min_similarity,.995);
  assert.equal(attempts[0].submission_id,attempts[1].submission_id);
  const jobs=await bridge.execute('analysis_list',{analysis_kind:'consistency',dataset_id:source.dataset_id});
  const created=jobs.jobs.find(job=>job.run_id!==source.consistency_job_id);
  assert.equal((await bridge.execute('consistency_agent_snapshot',{run_id:created.run_id})).whole_image_max_side,64);
  await driver.wait(async()=>(await bridge.execute('analysis_status',{run_id:created.run_id})).status==='COMPLETED',15000);
  assert.equal('whole_image_max_side' in (await bridge.execute('module_settings_get',{module:'consistency'})).settings,false);
  await page('industrial-consistency');await element('#dc-new-prompt');
  assert.equal(await(await element('[aria-label="缩放方式"]')).getText(),'原图尺寸');
  assert.equal(await(await element('input[aria-label="图像大小"]')).getAttribute('value'),'2048');
  assert.equal(await(await element('input[aria-label="图像大小"]')).isEnabled(),true);
  assert.equal(await(await element('input[aria-label="相似度阈值"]')).getAttribute('value'),'0.990');
  for(const scope of ['consistency','full']){
    const settings=await bridge.execute('module_settings_get',{module:'audit'});
    await bridge.execute('module_settings_save',{module:'audit',expected_revision:settings.revision,settings:{audit_scope:scope}});
    await page('industrial-audit');await element('#audit-create-view textarea');
    assert.equal(await driver.executeScript('return document.querySelector("#audit-create-view").firstElementChild.querySelector("h2").textContent'),scope==='consistency'?'数据一致性':'知识挖掘');
    assert.equal(await driver.executeScript('return document.querySelector("#audit-create-view .iad-job-start").tagName'),'FORM');
    assert.ok(await driver.executeScript('return !!(document.querySelector("#audit-create-consistency-jobs").compareDocumentPosition(document.querySelector("#audit-create-view .iad-job-start"))&Node.DOCUMENT_POSITION_FOLLOWING)'));
    assert.equal(await driver.executeScript('return document.querySelector("#audit-create-view .iad-job-start").nextElementSibling.querySelector("h2").textContent'),'提示词');
    assert.equal(await driver.executeScript('return document.querySelector("#audit-create-view .iad-job-start-fields").tagName'),'TABLE');
    assert.equal(await driver.executeScript('return document.querySelectorAll("#audit-create-view .iad-job-start-fields tbody tr").length'),1);
    assert.equal((await driver.findElements(By.css('#audit-create-view textarea'))).length,scope==='consistency'?2:5);
    await click('input[name="audit-consistency-source"]');
    const prompt=scope==='consistency'?'#audit-consistency-prompt':'#audit-master-prompt';
    await replace(prompt+'-system','本次系统要求。');await replace(prompt,' ');
    assert.equal(await(await element('#audit-create-submit')).isEnabled(),false);
    await replace(prompt,'本次用户要求。');
    const submit=await element('#audit-create-submit');
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',submit);await submit.sendKeys(Key.ENTER);
    await driver.wait(async()=>(await driver.findElements(By.css('#audit-create-view'))).length===0,15000);
    const list=await bridge.execute('audit_list',{dataset_id:source.dataset_id});
    const actual=list.jobs[0],snapshot=await bridge.execute('audit_agent_snapshot',{run_id:actual.run_id});
    const shown=await bridge.execute('audit_job_prompts',{run_id:actual.run_id});
    assert.deepEqual(shown.sections.slice(0,2).map(item=>item.text),['本次系统要求。','本次用户要求。']);
    if(scope==='consistency'){
      assert.equal(snapshot.consistency_summary_user_instruction,'本次用户要求。');
      await driver.wait(async()=>(await bridge.execute('audit_status',{run_id:actual.run_id})).status==='COMPLETED',15000);
      const call=fixture.calls.find(call=>call.body?.messages?.some(message=>message.role==='system'&&message.content==='本次系统要求。'));
      assert.ok(call);assert.equal(JSON.parse(call.body.messages.at(-1).content).instruction,'本次用户要求。');
    }else{
      assert.deepEqual(snapshot.master_prompt,{system_prompt:'本次系统要求。',user_prompt:'本次用户要求。'});
      await driver.executeAsyncScript('fetch("/api/iad/audit/cancel/"+encodeURIComponent(arguments[0]),{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"}).then(r=>r.json()).then(arguments[arguments.length-1])',actual.run_id);
    }
  }
  await click('button[aria-label="Settings"]');
  await(await driver.wait(until.elementLocated(By.xpath('//*[@data-shortcut-modal="settings"]//button[normalize-space(.)="数据一致性"]')),10000)).click();
  await element('[data-module-settings="consistency"] input[type=number]');
  assert.equal((await driver.findElements(By.css('[data-module-settings="consistency"] [aria-label="图像大小"]'))).length,0);
  assert.equal((await driver.findElements(By.css('[data-module-settings="consistency"] [aria-label="相似度阈值"]'))).length,0);
  const previous=await bridge.execute('module_settings_get',{module:'consistency'});
  const parallel=await element('input[aria-label="同时检查的主图数"]');await parallel.clear();await parallel.sendKeys('3');
  assert.equal((await bridge.execute('module_settings_get',{module:'consistency'})).revision,previous.revision,'设置页仍在失焦后保存');
  await parallel.sendKeys(Key.TAB);
  await driver.wait(async()=>(await bridge.execute('module_settings_get',{module:'consistency'})).settings.concurrency===3,5000);
  const saved=await bridge.execute('module_settings_get',{module:'consistency'});
  await parallel.clear();await parallel.sendKeys('0',Key.TAB);
  assert.equal(await parallel.getAttribute('aria-invalid'),'true');
  assert.equal((await bridge.execute('module_settings_get',{module:'consistency'})).revision,saved.revision);
  assert.deepEqual(fixture.errors,[]);
});
