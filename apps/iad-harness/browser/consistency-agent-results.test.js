import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import {Builder, By, Key, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {Select as NativeSelect} from 'selenium-webdriver/lib/select.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';
import {createConsistencyAgentHost} from '../test/fixtures/consistency-agent-host.js';

test('native results keep group conclusions and review fixed while image browsing changes', {timeout: 60000}, async () => {
  const fixture = await createConsistencyAgentHost({multiCandidate: true,withSimilarCandidate:true});
  const {bridge, scheduler, datasetId, wires} = fixture;
  const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const bundle = await build({stdin: {contents: `
import React from 'react';import {createRoot} from 'react-dom/client';
import {ConsistencyPage} from './src/client/components/ConsistencyPage.tsx';
import {Workspace,WorkspaceContext} from './src/client/workspace.tsx';
const workspace=new Workspace(null);
workspace.connect({selectPanel(){},panelInfo:{getSnapshot:()=>({activePanelId:'industrial-consistency'}),subscribe:()=>()=>{}}});
workspace.navigate('industrial-consistency');
createRoot(document.getElementById('root')).render(<WorkspaceContext.Provider value={workspace}><ConsistencyPage/></WorkspaceContext.Provider>);`,
    loader: 'tsx', resolveDir: app}, bundle: true, format: 'iife', write: false, target: 'es2022', define: {'process.env.NODE_ENV': '"production"'}});
  const handler = createIadHttpHandler(bridge);
  const scopeReads = [];
  let rejectCandidateReads=false, delayedAnchor='', delayReview=false;
  const membersHeld=Promise.withResolvers(), releaseMembers=Promise.withResolvers();
  const reviewHeld=Promise.withResolvers(), releaseReview=Promise.withResolvers();
  const server = http.createServer(async (req, res) => {
    if (req.url === '/browser.js') {res.setHeader('Content-Type', 'application/javascript');res.end(bundle.outputFiles[0].contents);return;}
    if (new URL(req.url, 'http://localhost').pathname === '/') {
      res.setHeader('Content-Type', 'text/html;charset=utf-8');
      res.end('<!doctype html><meta charset="utf-8"><style>html,body,#root{height:100%;margin:0}</style><div id="root"></div><script>window.renderErrors=[];addEventListener("error",event=>renderErrors.push(event.message))</script><script src="/browser.js"></script>');return;
    }
    if(rejectCandidateReads && req.url.endsWith('/candidates')){
      res.writeHead(503,{'Content-Type':'application/json'});
      res.end(JSON.stringify({error:{message:'候选图片暂时不可读取'}}));return;
    }
    if(delayedAnchor && req.url.endsWith('/members') && req.url.includes(encodeURIComponent(delayedAnchor))){
      delayedAnchor='';membersHeld.resolve();await releaseMembers.promise;
    }
    if(delayReview && req.method==='POST' && req.url.endsWith('/review')){
      delayReview=false;reviewHeld.resolve();await releaseReview.promise;
    }
    if (req.url.startsWith('/api/iad/analysis/jobs') || req.url.startsWith('/api/iad/consistency/checks')) scopeReads.push(req.url);
    await handler(req, res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let driver, phase = 'initial results';
  try {
    const response = await fetch(base + '/api/iad/analysis/start', {method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({submission_id:randomUUID(),analysis_kind: 'consistency', dataset_ids: [datasetId], instruction: '逐主图核对原始标注',
        subjects: {kind: 'samples', sample_ids: ['A','B','C'].map(name => datasetId + ':' + name + '.png')}})});
    assert.equal(response.status, 200, await response.clone().text());
    const job = await response.json();
    await scheduler.whenIdle();
    const report = await bridge.execute('consistency_agent_report', {run_id: job.run_id});
    assert.equal(report.completed, 3);
    assert.equal(report.original_conflicts, 2);
    assert.equal(report.no_candidates, 0);
    assert.deepEqual(report.verdicts, {MATERIAL: 2, EQUIVALENT: 1, UNCERTAIN: 0});
    assert.deepEqual(fixture.errors, []);
    const catalog = await (await fetch(base + '/api/iad/datasets')).json();
    assert.ok(catalog.datasets.some(item => item.dataset_id === datasetId), JSON.stringify(catalog));
    const callsBeforeViewing = wires.length;
    const members = await bridge.execute('consistency_agent_members', {run_id: job.run_id, anchor_id: datasetId + ':A.png'});
    const comparedB = members.items.find(item => item.image.sample.sample_id === datasetId + ':B.png');
    const opposite = await bridge.execute('consistency_agent_members', {run_id: job.run_id, anchor_id: datasetId + ':B.png'});
    const comparedA = opposite.items.find(item => item.image.sample.sample_id === datasetId + ':A.png');
    const options = new firefox.Options().addArguments('-headless', '--remote-allow-system-access')
      .setBinary(process.env.FIREFOX_PATH || '/tmp/iad-firefox128/firefox/firefox');
    driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options)
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || '/tmp/geckodriver')).build();
    await driver.manage().window().setRect({width: 1440, height: 1100});
    await driver.get(base);
    const element = selector => driver.wait(until.elementLocated(By.css(selector)), 10000);
    const cards = () => driver.findElements(By.css('[data-dc="open-conflict"]'));
    await new NativeSelect(await element('#dc-parent')).selectByVisibleText('未分组');
    assert.equal(await (await element('#dc-parent')).getAttribute('value'), '__ungrouped__');
    await driver.wait(async () => (await cards()).length === 2, 10000);
    assert.equal(await (await element('.dc-total')).getText(), '2');
    assert.equal((await driver.findElements(By.css(`[data-dc="open-conflict"][data-id="${datasetId}:C.png"]`))).length, 0);
    phase = 'complete model categories';
    assert.deepEqual(await Promise.all((await driver.findElements(By.css('#dc-model-filter option'))).map(option=>option.getText())),
      ['全部判断','类别不一致','多标','少标','位置差异','拆分','合并','一致']);
    await new NativeSelect(await element('#dc-model-filter')).selectByValue('合并');
    await driver.wait(async()=>(await cards()).length===0,5000);
    await new NativeSelect(await element('#dc-model-filter')).selectByValue('all');
    await driver.wait(async()=>(await cards()).length===2,5000);
    phase = 'six category tabs';
    const tabs = () => driver.findElements(By.css('[data-dc="raw-tab"]'));
    assert.deepEqual(await Promise.all((await tabs()).map(tab => tab.findElement(By.css('span:first-child')).then(label => label.getText()))),
      ['全部图像', '全部冲突', '类别不一致', '多标', '少标', '位置差异', '拆分', '合并', '无候选', '无有效候选']);
    assert.deepEqual(await Promise.all((await tabs()).map(tab => tab.findElement(By.css('.iad-tab-count')).then(count => count.getText()))),
      ['3', '2', '0', '1', '1', '0', '0', '0', '0', '1']);
    phase = 'tab scroll position';
    await driver.manage().window().setRect({width:1440,height:600});
    const beforeTabScroll=await driver.executeScript('const tab=document.querySelector("[data-dc=raw-tab]"),panel=tab.closest(".iad-workbench");panel.scrollTop+=tab.getBoundingClientRect().top-panel.getBoundingClientRect().top;return panel.scrollTop');
    assert.ok(beforeTabScroll>0,'测试必须在实际滚动后切换页签');
    await (await tabs())[0].click();
    await driver.wait(async () => (await driver.findElements(By.css('[data-dc="job-image"]'))).length === 3, 10000);
    assert.ok(Math.abs(await driver.executeScript('return document.querySelector(".iad-workbench").scrollTop')-beforeTabScroll)<2,'切换页签应保持实际滚动位置');
    await (await tabs())[1].click();
    await driver.wait(async()=>(await cards()).length===2,5000);
    assert.ok(Math.abs(await driver.executeScript('return document.querySelector(".iad-workbench").scrollTop')-beforeTabScroll)<2,'切回冲突页签应保持滚动位置');
    await (await tabs())[0].click();
    await driver.wait(async()=>(await driver.findElements(By.css('[data-dc="job-image"]'))).length===3,5000);
    await driver.manage().window().setRect({width:1440,height:1100});
    phase = 'all image cards open group comparison with program and model conclusions';
    assert.deepEqual(await Promise.all((await driver.findElements(By.css(`[data-dc="job-image"][data-id="${datasetId}:A.png"] .iad-thumbnail-values span`))).map(item=>item.getText())),['多标','多标']);
    assert.deepEqual(await Promise.all((await driver.findElements(By.css(`[data-dc="job-image"][data-id="${datasetId}:C.png"] .iad-thumbnail-values span`))).map(item=>item.getText())),['无有效候选','']);
    await (await element(`[data-dc="job-image"][data-id="${datasetId}:A.png"]`)).click();
    await element('#dc-compare-mask');
    assert.deepEqual(await driver.executeScript('return [...document.querySelectorAll("#dc-compare-mask .dc-compare-photo")].map(e=>Math.round(e.getBoundingClientRect().height))'),[450,450]);
    await driver.wait(async()=>(await driver.findElements(By.css('[data-dc="candidate"]'))).length===2,5000);
    assert.equal(await (await element('.dc-fact-panel .dc-verdict-value')).getText(),'多标');
    await (await element('.dc-dialog-head [aria-label="关闭"]')).click();
    assert.equal(await (await element('[data-dc="job-image"][data-id="'+datasetId+':C.png"]')).getAttribute('title'),'C.png');
    await (await element('[data-dc="job-image"][data-id="'+datasetId+':C.png"]')).click();
    await element('#dc-compare-mask');
    assert.equal(await (await element('.dc-fact-panel .dc-verdict-value')).getText(),'无有效候选');
    assert.equal(await (await element('.dc-conclusion-panel .dc-verdict-value')).getText(),'');
    await driver.wait(async()=>(await driver.findElements(By.css('[data-dc="identity-analysis"]'))).length===3,5000);
    const identityText=await (await element('.dc-model-panel')).getText();
    assert.equal((await driver.findElements(By.css('.dc-model-panel h4'))).length,0);
    assert.match(identityText,/实际原图颜色不同。/);
    assert.match(identityText,/内容不同/);
    assert.doesNotMatch(identityText,/未进行标注审核|暂无已保存|尚无已保存/);
    assert.doesNotMatch(identityText,/暂无已保存的整组分析/);
    assert.deepEqual(await Promise.all((await driver.findElements(By.css('[data-dc="identity-analysis"] .dc-analysis-sources'))).map(item=>item.getText())),
      ['A.png：内容不同','B.png：内容不同','D.png：内容不同']);
    await driver.wait(async()=>(await driver.findElements(By.css('[data-dc="retrieved-candidate"]'))).length===3,5000);
    assert.equal((await driver.findElements(By.css('[data-dc="candidate"]'))).length,0);
    assert.equal(await (await element('[data-dc="zoom-candidate"]')).getAttribute('aria-disabled'),'true');
    assert.equal((await driver.findElements(By.css('[aria-label="大图查看区域"]'))).length,0);
    await (await element('.dc-dialog-head [aria-label="关闭"]')).click();
    await (await tabs())[3].click();
    await driver.wait(async () => (await cards()).length === 1, 5000);
    assert.equal(await (await cards())[0].getAttribute('data-id'), datasetId + ':A.png');
    const beforeKeyboardScroll=await driver.executeScript('arguments[0].focus({preventScroll:true});return document.querySelector(".iad-workbench").scrollTop',(await tabs())[3]);
    await driver.actions().sendKeys(Key.ARROW_RIGHT).perform();
    await driver.wait(async () => (await (await cards())[0].getAttribute('data-id')) === datasetId + ':B.png', 5000);
    assert.equal(await (await tabs())[4].getAttribute('aria-selected'), 'true');
    assert.ok(Math.abs(await driver.executeScript('return document.querySelector(".iad-workbench").scrollTop')-beforeKeyboardScroll)<2,'真实键盘切换应保持滚动位置');
    await (await tabs())[4].sendKeys(Key.HOME);
    await driver.wait(async () => (await driver.findElements(By.css('[data-dc="job-image"]'))).length === 3, 5000);
    await (await tabs())[1].click();
    await driver.wait(async () => (await cards()).length === 2, 5000);
    await (await element(`[data-dc="open-conflict"][data-id="${datasetId}:A.png"]`)).click();
    phase = 'group conclusions and image sections';
    await driver.wait(async () => (await driver.findElements(By.css('[data-dc="candidate"]'))).length === 2, 10000);
    await element('section[aria-label="对比图"]');
    await element('section[aria-label="候选图"]');
    await driver.wait(async () => (await driver.findElements(By.css('[data-dc="retrieved-candidate"]'))).length === 3, 10000);
    assert.equal((await driver.findElements(By.css('[data-kind="exact"] [data-dc="retrieved-candidate"]'))).length, 2);
    assert.equal((await driver.findElements(By.css('[data-kind="similar"] [data-dc="retrieved-candidate"]'))).length, 1);
    await driver.wait(async () => await (await element('.dc-conclusion-panel .dc-verdict-value')).getText() === '多标', 5000);
    await driver.wait(async()=>(await driver.findElements(By.css('[data-dc="identity-analysis"]'))).length===3,5000);
    const groupTexts = await Promise.all(['.dc-fact-panel', '.dc-model-panel', '.dc-conclusion-panel'].map(async selector =>
      (await element(selector)).getText()));
    assert.match(groupTexts[1], /B\.png/);
    assert.match(groupTexts[1], /D\.png/);
    assert.match(groupTexts[1], /C\.png：内容不同/);
    assert.match(groupTexts[1], /像素完全一致（程序验证）/);
    for (const name of ['B', 'D']) {
      const index = members.items.findIndex(item => item.image.sample.sample_id === datasetId + ':' + name + '.png');
      const thumbnail = await element(`[data-dc="candidate"][data-id="${index}"]`);
      assert.equal(await thumbnail.getAttribute('title'), name + '.png');
      await thumbnail.click();
      await driver.wait(async () => await (await element('[data-dc="zoom-candidate"]')).getAttribute('title') === name + '.png', 5000);
      assert.deepEqual(await Promise.all(['.dc-fact-panel', '.dc-model-panel', '.dc-conclusion-panel'].map(async selector =>
        (await element(selector)).getText())), groupTexts);
      assert.match(await (await element('.dc-model-panel')).getText(), /主图有1个标注/);
    }
    const retrieved = await element('[data-kind="similar"] [data-dc="retrieved-candidate"]');
    const retrievedName = await retrieved.getAttribute('title');
    assert.equal(retrievedName, 'C.png');
    await retrieved.click();
    await element('[aria-label="大图查看区域"]');
    assert.equal(await (await element('#full-file-name')).getText(), retrievedName);
    const candidateBox=await element('dialog[aria-label="原图检视器"][open] .iad-annotation-layer rect');
    assert.deepEqual(await Promise.all(['x','y','width','height'].map(attribute=>candidateBox.getAttribute(attribute))),['10','10','10','10']);
    assert.equal(await (await element('dialog[aria-label="原图检视器"][open] .iad-annotation-layer text')).getText(),'scratch');
    await (await element('#annotation-toggle')).click();
    assert.equal((await driver.findElements(By.css('dialog[aria-label="原图检视器"][open] .iad-annotation-layer'))).length,0);
    await (await element('#full-close')).click();
    assert.equal(await (await element('[data-dc="zoom-candidate"]')).getAttribute('title'), 'D.png');
    await (await element('[data-dc="zoom-candidate"]')).click();
    await element('[aria-label="大图查看区域"]');
    assert.equal(await (await element('#full-file-name')).getText(), 'D.png');
    assert.equal(await (await element('#full-file-name')).getAttribute('title'), 'D.png');
    await (await element('#full-close')).click();
    await (await element('[data-dc="zoom-candidate"]')).sendKeys(Key.ENTER);
    await element('[aria-label="大图查看区域"]');
    assert.equal(await (await element('#full-file-name')).getText(), 'D.png');
    await (await element('#full-close')).click();
    const indexB = members.items.findIndex(item => item.image.sample.sample_id === datasetId + ':B.png');
    await (await element(`[data-dc="candidate"][data-id="${indexB}"]`)).click();
    phase = 'human review';
    await (await element('.dc-review-panel input[value="confirmed"]')).click();
    await (await element('#dc-note')).sendKeys('核对原始标注确认主图相对当前参考图多一处标注');
    await (await driver.findElement(By.xpath('//button[normalize-space(.)="保存复核"]'))).click();
    await driver.wait(async () => (await driver.findElements(By.id('dc-compare-mask'))).length === 0, 10000);
    const saved = await bridge.execute('consistency_agent_review', {run_id:job.run_id, anchor_id:datasetId + ':A.png'});
    assert.equal(saved.decisions.length, 1);
    assert.equal(saved.decisions[0].references.length, 2);
    assert.equal(saved.disposition, 'confirmed');
    assert.equal(saved.decisions[0].request.action.kind, 'CONFIRM_DIFFERENCE');
    assert.equal((await bridge.execute('consistency_review_context', {evidence_id: comparedB.comparison.evidence_id})).decisions.length, 0);
    const untouched = await bridge.execute('consistency_review_context', {evidence_id: comparedA.comparison.evidence_id});
    assert.equal(untouched.decisions.length, 0, '复核当前主图不应改变反方向主图的复核');
    await new NativeSelect(await element('#dc-review-filter')).selectByValue('confirmed');
    await driver.wait(async () => (await cards()).length === 1, 5000);
    assert.equal(await (await cards())[0].getAttribute('data-id'), datasetId + ':A.png');
    await new NativeSelect(await element('#dc-review-filter')).selectByValue('all');
    await driver.wait(async () => (await cards()).length === 2, 5000);
    await (await element('[data-dc="stats"]')).click();
    phase = 'statistics';
    await element('.dc-stats-dialog');
    assert.equal(await (await element('[data-dc="stat-category"][data-id="多类别"] .dc-vchart-value')).getText(), '1');
    assert.equal(await (await element('[data-dc="stat-category"][data-id="少类别"] .dc-vchart-value')).getText(), '1');
    assert.equal(await (await element('[data-dc="stat-agreement"][data-id="same"] .dc-vchart-value')).getText(), '2');
    await (await element('[data-dc="stat-category"][data-id="多类别"]')).click();
    await driver.wait(async () => (await cards()).length === 1, 5000);
    await (await element('[data-dc="raw-tab"][data-id="all"]')).click();
    await driver.wait(async () => (await cards()).length === 2, 5000);
    phase = 'refresh';
    await driver.navigate().refresh();
    await driver.wait(async () => (await cards()).length === 2, 10000);
    await (await element(`[data-dc="open-conflict"][data-id="${datasetId}:A.png"]`)).click();
    await driver.wait(async () => await (await element('.dc-review-panel input[value="confirmed"]')).isSelected(), 5000);
    assert.equal(await (await element('#dc-note')).getAttribute('value'), '核对原始标注确认主图相对当前参考图多一处标注');
    const reloadedMembers = await driver.findElements(By.css('[data-dc="candidate"]'));
    await reloadedMembers.at(-1).click();
    assert.equal(await (await element('.dc-review-panel input[value="confirmed"]')).isSelected(), true);
    await (await element('.dc-dialog-head [aria-label="关闭"]')).click();
    phase = 'candidate read failure isolation';
    rejectCandidateReads=true;
    await driver.navigate().refresh();
    await driver.wait(async () => (await cards()).length === 2, 10000);
    await (await element(`[data-dc="open-conflict"][data-id="${datasetId}:A.png"]`)).click();
    await driver.wait(async () => (await (await element('section[aria-label="候选图"]')).getText()).includes('候选图片暂时不可读取'), 5000);
    assert.equal(await (await element('.dc-conclusion-panel .dc-verdict-value')).getText(), '多标');
    assert.equal(await (await element('.dc-review-panel input[value="confirmed"]')).isSelected(), true);
    rejectCandidateReads=false;
    phase = 'late response cannot cross groups';
    delayedAnchor=datasetId + ':B.png';
    await (await driver.findElement(By.xpath('//button[normalize-space(.)="下一组"]'))).click();
    await membersHeld.promise;
    await driver.wait(async () => await (await element('.dc-conclusion-panel .dc-verdict-value')).getText() === '少标', 5000);
    await (await driver.findElement(By.xpath('//button[normalize-space(.)="上一组"]'))).click();
    releaseMembers.resolve();
    await driver.wait(async () => (await driver.findElements(By.css('[data-dc="candidate"]'))).length === 2, 5000);
    await driver.wait(async () => await (await element('.dc-conclusion-panel .dc-verdict-value')).getText() === '多标', 5000);
    await driver.wait(async () => await (await element('.dc-review-panel input[value="confirmed"]')).isSelected(), 5000);
    assert.equal(await (await element('#dc-note')).getAttribute('value'), '核对原始标注确认主图相对当前参考图多一处标注');
    assert.deepEqual(await Promise.all((await driver.findElements(By.css('[data-dc="candidate"]'))).map(item=>item.getAttribute('title'))),
      members.items.map(item=>item.image.sample.relative_path.split('/').pop()));
    assert.equal((await driver.findElements(By.xpath('//*[normalize-space(text())="暂无图片"]'))).length,0);
    phase = 'late review response cannot close another group';
    delayReview=true;
    await (await element('.dc-review-panel input[value="rejected"]')).click();
    await (await driver.findElement(By.xpath('//button[normalize-space(.)="保存复核"]'))).click();
    await reviewHeld.promise;
    await (await driver.findElement(By.xpath('//button[normalize-space(.)="下一组"]'))).click();
    await driver.wait(async () => await (await element('.dc-conclusion-panel .dc-verdict-value')).getText() === '少标', 5000);
    const galleryReads=scopeReads.filter(route=>route.includes('/gallery')).length;
    releaseReview.resolve();
    await driver.wait(()=>scopeReads.filter(route=>route.includes('/gallery')).length>galleryReads,5000);
    assert.equal((await driver.findElements(By.css('#dc-compare-mask'))).length,1);
    assert.equal(await (await element('.dc-conclusion-panel .dc-verdict-value')).getText(),'少标');
    assert.equal((await bridge.execute('consistency_agent_review',{run_id:job.run_id,anchor_id:datasetId+':A.png'})).disposition,'rejected');
    assert.equal((await bridge.execute('consistency_agent_review',{run_id:job.run_id,anchor_id:datasetId+':B.png'})).disposition,'pending');
    assert.equal(wires.length, callsBeforeViewing, '读取、候选切换、统计、刷新与人审不能启动推理');
    assert.deepEqual((await bridge.execute('consistency_agent_report', {run_id: job.run_id})).verdicts, report.verdicts);
    assert.deepEqual(await driver.executeScript('return window.renderErrors'), []);
    await fs.writeFile('/tmp/consistency-dsh-anchor-results-browser.png', await driver.takeScreenshot(), 'base64');
  } catch (error) {
    if (driver) {
      console.error(phase, await driver.executeScript('return {errors:window.renderErrors,text:document.body.innerText,selects:[...document.querySelectorAll("select")].map(select=>({value:select.value,text:select.innerText}))}'));
      console.error(scopeReads);
      await fs.writeFile('/tmp/consistency-dsh-anchor-results-browser-failure.png', await driver.takeScreenshot(), 'base64');
    }
    throw error;
  } finally {
    releaseMembers.resolve();
    releaseReview.resolve();
    await driver?.quit();await new Promise(resolve => server.close(resolve));await fixture.close();
  }
});
