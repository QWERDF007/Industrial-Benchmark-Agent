import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder,By,Key,until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';
import {createConsistencyAgentHost} from '../test/fixtures/consistency-agent-host.js';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('anomaly results and prompt drafts use the frozen task without changing the page interaction',{timeout:60000},async()=>{
  const fixture=await createConsistencyAgentHost({taskType:'anomaly_detection',multiCandidate:true,withSimilarCandidate:true});
  let driver,server;
  try {
    const historicalIdentity={gate_system:'历史身份验证系统原文\n保留实际细节。',gate_user:'历史身份验证用户原文。',gate_examples:'历史判断示例原文。'};
    const job=await fixture.scheduler.start({submission_id:randomUUID(),dataset_ids:[fixture.datasetId],
      identity_prompts:historicalIdentity,
      subjects:{kind:'samples',sample_ids:[fixture.sampleIds.A,fixture.sampleIds.C]}});
    await fixture.scheduler.whenIdle();
    await fs.mkdir(path.join(fixture.root,'bbox-images'));
    await fs.mkdir(path.join(fixture.root,'bbox-labels'));
    await fs.copyFile(path.join(fixture.root,'images/normal/A.png'),path.join(fixture.root,'bbox-images/one.png'));
    await fs.writeFile(path.join(fixture.root,'bbox-labels/one.json'),JSON.stringify({imageWidth:40,imageHeight:40,shapes:[]}));
    const bbox=await fixture.bridge.execute('dataset_import',{format:'labelme',name:'矩形审核样本',
      image_dir:path.join(fixture.root,'bbox-images'),annotation_dir:path.join(fixture.root,'bbox-labels')});
    const bundle=await build({stdin:{contents:`
import React from 'react';import {createRoot} from 'react-dom/client';
import {ConsistencyPage} from './src/client/components/ConsistencyPage.tsx';
import {Workspace,WorkspaceContext} from './src/client/workspace.tsx';
const workspace=new Workspace(null);
workspace.connect({selectPanel(){},panelInfo:{getSnapshot:()=>({activePanelId:'industrial-consistency'}),subscribe:()=>()=>{}}});
if(!new URL(location.href).searchParams.has('iad')){
workspace.navigate('industrial-consistency');
workspace.updateConsistency({parentId:'__ungrouped__',datasetIds:[${JSON.stringify(fixture.datasetId)}],batchId:${JSON.stringify(job.run_id)}},true);
}
createRoot(document.getElementById('root')).render(<WorkspaceContext.Provider value={workspace}><ConsistencyPage/></WorkspaceContext.Provider>);
`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
    const handler=createIadHttpHandler(fixture.bridge);
    server=http.createServer((req,res)=>{
      if(req.url==='/browser.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].contents);}
      if(new URL(req.url,'http://fixture.invalid').pathname==='/'){res.setHeader('Content-Type','text/html;charset=utf-8');return res.end('<!doctype html><meta charset="utf-8"><style>html,body,#root{height:100%;margin:0}</style><div id="root"></div><script src="/browser.js"></script>');}
      void handler(req,res);
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(new firefox.Options()
      .addArguments('-headless','--remote-allow-system-access').setBinary(process.env.FIREFOX_PATH||'/tmp/iad-firefox128/firefox/firefox'))
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'/tmp/geckodriver')).build();
    await driver.manage().window().setRect({width:1440,height:1100});
    await driver.get(`http://127.0.0.1:${server.address().port}/`);
    const element=css=>driver.wait(until.elementLocated(By.css(css)),10000);
    const texts=async css=>Promise.all((await driver.findElements(By.css(css))).map(item=>item.getText()));
    await element('[data-dc="open-conflict"]');
    await(await element('[data-dc="view-prompt"]')).click();
    const prompt=await element('dialog[aria-label="查看提示词"]');
    for(const text of Object.values(historicalIdentity))assert.ok((await prompt.getText()).includes(text));
    await driver.executeScript('Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async text=>{window.copiedPrompt=text;}}});');
    await(await prompt.findElement(By.xpath('.//button[normalize-space(.)="复制提示词"]'))).click();
    await driver.wait(async()=>!!await driver.executeScript('return window.copiedPrompt'),3000);
    for(const text of Object.values(historicalIdentity))assert.ok((await driver.executeScript('return window.copiedPrompt')).includes(text));
    const identityHeading=await prompt.findElement(By.xpath('.//h3[normalize-space(.)="身份验证系统提示词"]'));
    await driver.executeScript('arguments[0].scrollIntoView({block:"start"})',identityHeading);
    await fs.writeFile('/tmp/consistency-identity-prompts-history.png',await driver.takeScreenshot(),'base64');
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    assert.deepEqual(await texts('#dc-model-filter option'),['全部判断','类别不一致','一致']);
    assert.deepEqual(await texts('[data-dc="raw-tab"] span:first-child'),['全部图像','全部冲突','类别不一致']);
    await(await element('[data-dc="open-conflict"]')).click();
    await element('#dc-compare-mask');
    assert.equal(await(await element('.dc-conclusion-panel .dc-verdict-value')).getText(),'类别不一致');
    assert.equal((await driver.findElements(By.css('.dc-model-panel h4'))).length,0);
    assert.doesNotMatch(await(await element('.dc-model-panel')).getText(),/位置差异|拆分|合并|多标|少标/);
    await(await element('.dc-dialog-head [aria-label="关闭"]')).click();
    await(await element('[data-dc="stats"]')).click();
    await element('.dc-stats-dialog');
    assert.deepEqual(await texts('[data-dc="stat-category"] .dc-vchart-value'),['1']);
    assert.equal((await driver.findElements(By.css('[data-dc="stat-category"]'))).length,1);
    await(await element('[data-dc="stat-category"]')).click();
    await(await element('[data-dc="raw-tab"][data-id="images"]')).click();
    await(await element(`[data-dc="job-image"][data-id="${fixture.sampleIds.C}"]`)).click();
    await element('#dc-compare-mask');
    assert.equal(await(await element('.dc-conclusion-panel .dc-verdict-value')).getText(),'');
    assert.doesNotMatch(await(await element('.dc-model-panel')).getText(),/未进行标注审核|暂无已保存|尚无已保存/);
    await(await element('.dc-dialog-head [aria-label="关闭"]')).click();
    const calls=fixture.wires.length;
    await(await element('[data-dc="raw-tab"][data-id="all"]')).click();
    await(await element('#dc-filename-search')).sendKeys('A.png');
    const savedPosition=await driver.executeAsyncScript(`const done=arguments[arguments.length-1],surface=document.querySelector('.iad-workbench');surface.scrollTop=120;requestAnimationFrame(()=>done(surface.scrollTop));`);
    await driver.executeScript('document.querySelector(\'[data-dc="start-check"]\').click()');
    await element('#dc-create-page');
    await(await element('[data-dc="close-new"]')).click();
    assert.equal(await(await element('#dc-filename-search')).getAttribute('value'),'A.png');
    await driver.wait(async()=>Math.abs(await driver.executeScript('return document.querySelector(".iad-workbench").scrollTop')-savedPosition)<2,5000);
    await(await element('#dc-filename-search')).clear();
    await(await element('[data-dc="start-check"]')).click();
    await element('#dc-create-page');
    assert.equal((await driver.findElements(By.css('dialog[aria-label="新建一致性检查"]'))).length,0);
    assert.equal((await driver.findElements(By.css('.dc-jobs-section'))).length,0);
    assert.equal(await driver.executeScript('return JSON.parse(new URL(location.href).searchParams.get("iad")).view'),'setup');
    await driver.navigate().back();await element('[data-dc="start-check"]');
    await driver.navigate().forward();await element('#dc-create-page');
    await driver.navigate().refresh();await element('#dc-create-page');
    assert.ok((await(await element('#dc-new-prompt-system')).getAttribute('value')).includes('OK/NG'));
    await(await element('[data-dc="close-new"]')).click();await element('[data-dc="start-check"]');
    await(await element('[data-dc="start-check"]')).click();await element('#dc-create-page');
    const identityFields=['gate_system','gate_user','gate_examples'];
    const identityEditors=await Promise.all(identityFields.map(name=>element('#dc-identity-'+name)));
    const identityDefaults=await Promise.all(identityEditors.map(input=>input.getAttribute('value')));
    assert.match(identityDefaults[0],/工业图像身份与内容验证员/);
    assert.match(identityDefaults[1],/比较本次实际送达的主图与候选图/);
    assert.match(identityDefaults[2],/单侧|只有候选一侧/);
    const editedIdentity={gate_system:'自定义身份系统原文\n保留完整内容。',gate_user:'自定义身份用户原文。',gate_examples:'自定义身份示例原文。'};
    for(const [index,input] of identityEditors.entries()){
      assert.equal(await input.getDomAttribute('readonly'),null);
      await input.click();await driver.actions().keyDown(Key.CONTROL).sendKeys('a').keyUp(Key.CONTROL).perform();
      await input.sendKeys(editedIdentity[identityFields[index]],Key.TAB);
    }
    const examples=identityEditors[2];
    await examples.click();await driver.actions().keyDown(Key.CONTROL).sendKeys('a').keyUp(Key.CONTROL).perform();
    await examples.sendKeys(' ',Key.TAB);
    assert.equal(await(await element('[data-dc="create-job"]')).isEnabled(),false);
    await examples.click();await driver.actions().keyDown(Key.CONTROL).sendKeys('a').keyUp(Key.CONTROL).perform();
    await examples.sendKeys(editedIdentity.gate_examples,Key.TAB);
    assert.equal(await(await element('[data-dc="create-job"]')).isEnabled(),true);
    await fs.writeFile('/tmp/consistency-identity-prompts-create.png',await driver.takeScreenshot(),'base64');
    await driver.manage().window().setRect({width:450,height:650});
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',examples);
    const bounds=await driver.executeScript(`const form=document.querySelector('#dc-create-page'),surface=form.closest('.iad-workbench');
      const f=form.getBoundingClientRect();return {left:f.left,right:f.right,viewport:innerWidth,scrollable:surface.scrollHeight>surface.clientHeight,
        editorHeights:[...form.querySelectorAll('textarea')].map(input=>input.getBoundingClientRect().height)};`);
    assert.ok(bounds.left>=0&&bounds.right<=bounds.viewport,JSON.stringify(bounds));
    assert.equal(bounds.scrollable,true);
    assert.deepEqual(bounds.editorHeights,[400,400,400,400,400]);
    const submit=await element('[data-dc="create-job"]');
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',submit);
    assert.equal(await driver.executeScript('const r=arguments[0].getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight',submit),true);
    await fs.writeFile('/tmp/consistency-identity-prompts-narrow.png',await driver.takeScreenshot(),'base64');
    await driver.manage().window().setRect({width:1440,height:1100});
    const system=await element('#dc-new-prompt-system'),user=await element('#dc-new-prompt');
    const anomalySystem=await system.getAttribute('value'),anomalyUser=await user.getAttribute('value');
    assert.match(anomalySystem,/OK\/NG/);
    assert.doesNotMatch(anomalySystem+anomalyUser,/矩形|拆分|合并(?:实例|标注|框)/);
    const editedSystem='自定义系统原文\n只按用户要求审核。',editedUser='自定义用户原文\n完整保留。';
    for(const [input,text] of [[system,editedSystem],[user,editedUser]]){
      await input.click();await driver.actions().keyDown(Key.CONTROL).sendKeys('a').keyUp(Key.CONTROL).perform();await input.sendKeys(text,Key.TAB);
    }
    const toggle=async identity=>{
      const trigger=await element('#dc-new-child-trigger');
      if(await trigger.getAttribute('aria-expanded')!=='true')await trigger.click();
      await(await element(`#dc-new-child-options input[value="${identity}"]`)).click();
    };
    await toggle(fixture.datasetId);await toggle(bbox.dataset_id);
    assert.match(await system.getAttribute('value'),/矩形/);
    assert.doesNotMatch(await system.getAttribute('value'),/OK\/NG/);
    const bboxSystem=await system.getAttribute('value');
    await toggle(bbox.dataset_id);await toggle(fixture.datasetId);
    assert.equal(await system.getAttribute('value'),editedSystem);
    assert.equal(await user.getAttribute('value'),editedUser);
    await toggle(bbox.dataset_id);
    assert.equal(await system.getAttribute('value'),'');
    assert.equal(await(await element('[data-dc="create-job"]')).isEnabled(),false);
    await toggle(fixture.datasetId);
    assert.equal(await system.getAttribute('value'),bboxSystem);
    await toggle(bbox.dataset_id);await toggle(fixture.datasetId);
    await(await element('#dc-new-child-trigger')).click();
    const settings=await fixture.bridge.execute('module_settings_get',{module:'consistency'});
    await fixture.bridge.execute('module_settings_save',{module:'consistency',expected_revision:settings.revision,settings:{...settings.settings,mode:'exact'}});
    await(await element('[data-dc="create-job"]')).click();
    await driver.wait(async()=>(await driver.findElements(By.id('dc-create-page'))).length===0,10000);
    await fixture.scheduler.whenIdle();
    const jobs=await fixture.bridge.execute('analysis_list',{dataset_id:fixture.datasetId,analysis_kind:'consistency'});
    const created=jobs.jobs.find(item=>item.run_id!==job.run_id);
    const frozen=await fixture.bridge.execute('consistency_agent_snapshot',{run_id:created.run_id});
    assert.equal(frozen.system_prompt,editedSystem);assert.equal(frozen.instruction,editedUser);
    assert.deepEqual(frozen.prompts,editedIdentity);
    assert.deepEqual(created.consistency_identity_prompts,editedIdentity);
    assert.equal(fixture.wires.length,calls,'浏览和精确像素的图像级审核不增加模型调用');
    assert.deepEqual(fixture.errors,[]);
    await fs.writeFile('/tmp/consistency-v5-anomaly-browser.png',await driver.takeScreenshot(),'base64');
  } finally {
    await driver?.quit();
    if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    await fixture.close();
  }
});
