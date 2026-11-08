import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder, By, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {Select as NativeSelect} from 'selenium-webdriver/lib/select.js';
import {createIadHttpHandler} from '../lib/server/routes/index.js';
import {createConsistencyAgentHost} from '../test/fixtures/consistency-agent-host.js';

test('native anchor results drive the existing cards, candidate conclusions, statistics and independent human review', {timeout: 60000}, async () => {
  const fixture = await createConsistencyAgentHost({multiCandidate: true});
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
  const server = http.createServer(async (req, res) => {
    if (req.url === '/browser.js') {res.setHeader('Content-Type', 'application/javascript');res.end(bundle.outputFiles[0].contents);return;}
    if (new URL(req.url, 'http://localhost').pathname === '/') {
      res.setHeader('Content-Type', 'text/html;charset=utf-8');
      res.end('<!doctype html><meta charset="utf-8"><style>html,body,#root{height:100%;margin:0}</style><div id="root"></div><script>window.renderErrors=[];addEventListener("error",event=>renderErrors.push(event.message))</script><script src="/browser.js"></script>');return;
    }
    if (req.url.startsWith('/api/iad/analysis/jobs') || req.url.startsWith('/api/iad/consistency/checks')) scopeReads.push(req.url);
    await handler(req, res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let driver, phase = 'initial results';
  try {
    const response = await fetch(base + '/api/iad/analysis/start', {method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({analysis_kind: 'consistency', dataset_ids: [datasetId], instruction: '逐主图核对原始标注',
        subjects: {kind: 'samples', sample_ids: ['A','B','C'].map(name => datasetId + ':' + name + '.png')}})});
    assert.equal(response.status, 200, await response.clone().text());
    const job = await response.json();
    await scheduler.whenIdle();
    const report = await bridge.execute('consistency_agent_report', {run_id: job.run_id});
    assert.equal(report.completed, 3);
    assert.equal(report.original_conflicts, 2);
    assert.equal(report.no_candidates, 1);
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
    await (await element(`[data-dc="open-conflict"][data-id="${datasetId}:A.png"]`)).click();
    phase = 'candidate conclusions';
    await driver.wait(async () => (await driver.findElements(By.css('[data-dc="candidate"]'))).length === 2, 10000);
    for (const [name, conclusion] of [['B', '多类别'], ['D', '一致']]) {
      const index = members.items.findIndex(item => item.image.sample.sample_id === datasetId + ':' + name + '.png');
      await (await element(`[data-dc="candidate"][data-id="${index}"]`)).click();
      await driver.wait(async () => await (await element('.dc-conclusion-panel .dc-verdict-value')).getText() === conclusion, 5000);
      assert.match(await (await element('.dc-model-panel')).getText(), /主图有1个标注/);
    }
    await (await element('[data-dc="zoom-candidate"]')).click();
    await element('[aria-label="大图查看区域"]');
    await (await element('#full-close')).click();
    const indexB = members.items.findIndex(item => item.image.sample.sample_id === datasetId + ':B.png');
    await (await element(`[data-dc="candidate"][data-id="${indexB}"]`)).click();
    phase = 'human review';
    await (await element('.dc-review-panel input[value="confirmed"]')).click();
    await (await element('#dc-note')).sendKeys('核对原始标注确认主图相对当前参考图多一处标注');
    await (await driver.findElement(By.xpath('//button[normalize-space(.)="保存复核"]'))).click();
    await driver.wait(async () => (await driver.findElements(By.id('dc-compare-mask'))).length === 0, 10000);
    const saved = await bridge.execute('consistency_review_context', {evidence_id: comparedB.comparison.evidence_id});
    assert.equal(saved.decisions.length, 1);
    assert.equal(saved.decisions[0].request.action.kind, 'CONFIRM_DIFFERENCE');
    const untouched = await bridge.execute('consistency_review_context', {evidence_id: comparedA.comparison.evidence_id});
    assert.equal(untouched.decisions.length, 0, '复核当前主图不应改变反方向主图的复核');
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
    await driver?.quit();await new Promise(resolve => server.close(resolve));await fixture.close();
  }
});
