import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {By,Key,until} from 'selenium-webdriver';

export async function verifyJobCreation(driver,{base,datasetIds,parentId,output}) {
  await fs.mkdir(output,{recursive:true});
  const element=selector=>driver.wait(until.elementLocated(By.css(selector)),30000);
  const click=async selector=>{const node=await element(selector);await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',node);await node.click();};
  const replace=async(selector,text)=>{const node=await element(selector);await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',node);
    await node.clear();await node.sendKeys(text,Key.TAB);};
  await driver.get(base+'/?'+new URLSearchParams({iad:JSON.stringify({pageId:'industrial-consistency',
    datasetIds,parentId,view:'setup'})}));
  await element('#dc-create-page textarea');
  assert.equal(await driver.executeScript('return document.querySelector("#dc-create-page .dc-scope").nextElementSibling.querySelector("h2")?.textContent'),
    '确认并启动','新建检查的第一个内容区块是确认并启动');
  await driver.wait(until.elementIsEnabled(await element('[data-dc="create-job"]')),10000);
  const startVisible=await driver.executeScript('const r=document.querySelector("[data-dc=create-job]").getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight');
  assert.ok(startVisible,'检查启动按钮在首屏');
  assert.equal(await driver.executeScript('return document.querySelector("#dc-create-page .iad-job-start").tagName'),'FORM');
  assert.deepEqual(await driver.executeScript('return [...document.querySelectorAll("#dc-create-page .iad-job-start-fields th")].map(node=>node.textContent)'),
    ['检查范围','模型','检索方式','缩放方式','图像大小（像素）','相似度阈值']);
  assert.equal(await driver.executeScript('return document.querySelectorAll("#dc-create-page .iad-job-start-fields tbody tr").length'),1,'参数横向排列在一行');
  assert.ok(await driver.executeScript('return [...document.querySelectorAll("#dc-create-page .iad-job-start-fields input")].every(node=>node.clientWidth>=100&&node.labels.length===1)'),
    '参数表格的输入字段有标签及足够宽度');
  assert.equal(await(await element('[aria-label="缩放方式"]')).getText(),'原图尺寸');
  assert.equal(await(await element('input[aria-label="图像大小"]')).isEnabled(),true);
  assert.equal(await(await element('input[aria-label="相似度阈值"]')).getAttribute('value'),'0.990');
  await replace('input[aria-label="相似度阈值"]','0.99');
  assert.equal(await(await element('input[aria-label="相似度阈值"]')).getAttribute('value'),'0.990');
  for(const invalid of ['1.1','0.9901']){
    await replace('input[aria-label="相似度阈值"]',invalid);
    assert.equal(await(await element('[data-dc="create-job"]')).isEnabled(),false);
  }
  await replace('input[aria-label="相似度阈值"]','0.995');
  await fs.writeFile(path.join(output,'consistency-create.png'),await driver.takeScreenshot(),'base64');
  const intercept=()=>driver.executeScript(`window.creationRequests=[];const send=window.fetch;window.fetch=(url,options)=>{
    if(String(url).startsWith('/api/iad/')&&options?.method==='POST'){
      window.creationRequests.push({url:String(url),body:JSON.parse(options.body)});
      return Promise.resolve(new Response(JSON.stringify({error:{message:'页面验收，未启动作业'}}),{status:503,headers:{'Content-Type':'application/json'}}));}
    return send(url,options);};`);
  await replace('input[aria-label="图像大小"]','1024');
  await intercept();
  await click('[data-dc="create-job"]');await element('dialog[aria-label="创建检查失败"]');
  const originalRequests=await driver.executeScript('return window.creationRequests');
  assert.equal(originalRequests.length,1);assert.equal(originalRequests[0].body.whole_image_max_side,null);
  assert.equal(originalRequests[0].body.min_similarity,.995);
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  await driver.wait(async()=>(await driver.findElements(By.css('dialog'))).length===0,5000);
  await click('[aria-label="缩放方式"]');
  await(await driver.wait(until.elementLocated(By.xpath('//*[@role="menuitem"][normalize-space(.)="自定义最大边"]')),5000)).click();
  assert.equal(await(await element('input[aria-label="图像大小"]')).getAttribute('value'),'1024');
  await replace('input[aria-label="图像大小"]','0');
  assert.equal(await(await element('[data-dc="create-job"]')).isEnabled(),false);
  const size=await element('input[aria-label="图像大小"]');await size.clear();await size.sendKeys('1024');
  await driver.executeScript('window.creationRequests=[]');
  await driver.executeScript('document.querySelector("[data-dc=create-job]").click()');
  await element('dialog[aria-label="创建检查失败"]');
  const checkRequests=await driver.executeScript('return window.creationRequests');
  assert.equal(checkRequests.length,1,JSON.stringify(checkRequests.map(({url,body})=>({url,submission_id:body.submission_id}))));assert.equal(checkRequests[0].url,'/api/iad/analysis/start');
  assert.equal(checkRequests[0].body.whole_image_max_side,1024);
  assert.equal(checkRequests[0].body.min_similarity,.995);
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  await driver.wait(async()=>(await driver.findElements(By.css('dialog'))).length===0,5000);
  assert.equal(await driver.executeScript('return document.activeElement.getAttribute("data-dc")'),'create-job');
  assert.equal(await size.getAttribute('value'),'1024');
  await fs.writeFile(path.join(output,'consistency-custom-size.png'),await driver.takeScreenshot(),'base64');
  await click('[data-dc="close-new"]');await click('[data-dc="start-check"]');
  assert.equal(await(await element('[aria-label="缩放方式"]')).getText(),'原图尺寸');
  assert.equal(await(await element('input[aria-label="图像大小"]')).isEnabled(),true);
  assert.equal(await(await element('input[aria-label="图像大小"]')).getAttribute('value'),'2048');
  assert.equal(await(await element('input[aria-label="相似度阈值"]')).getAttribute('value'),'0.990');
  await driver.get(base+'/?'+new URLSearchParams({iad:JSON.stringify({pageId:'industrial-audit',
    datasetId:datasetIds[0],datasetIds,tab:'setup'})}));
  await element('#audit-create-view textarea');
  assert.equal(await driver.executeScript('return document.querySelector("#audit-create-view .iad-job-start").tagName'),'FORM');
  assert.ok(await driver.executeScript('return !!(document.querySelector("#audit-create-consistency-jobs").compareDocumentPosition(document.querySelector("#audit-create-view .iad-job-start"))&Node.DOCUMENT_POSITION_FOLLOWING)'));
  assert.equal(await driver.executeScript('return document.querySelector("#audit-create-view .iad-job-start").nextElementSibling.querySelector("h2").textContent'),'提示词');
  assert.equal(await driver.executeScript('return document.querySelector("#audit-create-view .iad-job-start-fields").tagName'),'TABLE');
  assert.equal(await driver.executeScript('return document.querySelectorAll("#audit-create-view .iad-job-start-fields tbody tr").length'),1);
  const audit=await driver.executeAsyncScript('fetch("/api/iad/settings/modules/audit").then(r=>r.json()).then(arguments[arguments.length-1])');
  const consistencyOnly=audit.settings.audit_scope==='consistency';
  const editors=await driver.findElements(By.css('#audit-create-view textarea'));
  assert.equal(editors.length,consistencyOnly?2:5);
  assert.equal(await(await element('#audit-create-submit')).isEnabled(),false);
  await click('input[name="audit-consistency-source"]');
  await driver.executeScript('document.querySelector("#audit-create-view .iad-job-start").scrollIntoView({block:"center"})');
  await fs.writeFile(path.join(output,'audit-confirmation.png'),await driver.takeScreenshot(),'base64');
  const prompt=consistencyOnly?'#audit-consistency-prompt':'#audit-master-prompt';
  await replace(prompt+'-system','根据本次冻结记录评价数据质量。');await replace(prompt,' ');
  assert.equal(await(await element('#audit-create-submit')).isEnabled(),false);
  await replace(prompt,'概括主要问题及其实际影响。');
  await driver.wait(until.elementIsEnabled(await element('#audit-create-submit')),10000);
  await intercept();await click('#audit-create-submit');
  await element('#audit-create-view .iad-job-start [role="alert"]');
  const auditRequests=await driver.executeScript('return window.creationRequests');
  assert.equal(auditRequests.length,1);assert.equal(auditRequests[0].url,'/api/iad/audit/start');
  assert.deepEqual(auditRequests[0].body[consistencyOnly?'consistency_prompt':'master_prompt'],
    {system_prompt:'根据本次冻结记录评价数据质量。',user_prompt:'概括主要问题及其实际影响。'});
  await fs.writeFile(path.join(output,'audit-create.png'),await driver.takeScreenshot(),'base64');
  await click('button[aria-label="Settings"]');
  await(await driver.wait(until.elementLocated(By.xpath('//*[@data-shortcut-modal="settings"]//button[normalize-space(.)="数据一致性"]')),10000)).click();
  await element('[data-module-settings="consistency"] input[type=number]');
  assert.equal((await driver.findElements(By.css('[data-module-settings="consistency"] [aria-label="图像大小"]'))).length,0);
  assert.equal((await driver.findElements(By.css('[data-module-settings="consistency"] [aria-label="相似度阈值"]'))).length,0);
  await fs.writeFile(path.join(output,'settings-consistency.png'),await driver.takeScreenshot(),'base64');
  await driver.actions().sendKeys(Key.ESCAPE).perform();
  return {consistencyTop:true,auditConfirmationBeforePrompts:true,confirmationForms:true,consistencyStartVisible:true,auditScope:audit.settings.audit_scope,
    auditPromptEditors:editors.length,jobOnlyImageSize:true,newCheckResetsSize:true,invalidSizeBlocked:true,
    scalingFieldsAlwaysEditable:true,originalRequestUsesOriginal:true,jobOnlyThreshold:true,
    failedSubmissionRetainsDraft:true,settingsImageSizeRemoved:true,interceptedStarts:[originalRequests[0].url,checkRequests[0].url,auditRequests[0].url],createdJobs:0};
}
