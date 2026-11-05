import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Builder, By, Key, until} from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import {PythonBridge, createIadHttpHandler} from '../lib/server/index.js';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('audit detail, scope report and selected retry family keep frozen evidence and shared controls', {timeout: 90000}, async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-audit-synthesis-'));
  const bridge = new PythonBridge({cwd: path.resolve(app, '../..'), dbPath: path.join(root, 'test.db')});
  t.after(() => bridge.destroy());
  execFileSync(bridge.pythonPath, ['-c', `
import json,sys
from pathlib import Path
from PIL import Image
p=Path(sys.argv[1]);(p/'images').mkdir();(p/'labels').mkdir()
for i in range(3):
 Image.new('RGB',(640,480),(80+i*30,120,160)).save(p/'images'/f'part-{i}.png')
 (p/'labels'/f'part-{i}.json').write_text(json.dumps({'imageWidth':640,'imageHeight':480,'shapes':[{'label':'原始类别','shape_type':'rectangle','points':[[40,60],[140,180]]}]}))
`, root]);
  const bundle = await build({stdin: {contents: `
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {AuditSampleDialog} from './src/client/components/AuditSampleDialog.tsx';
    import {DatasetReport} from './src/client/components/DatasetReport.tsx';
    import {AuditPage} from './src/client/components/AuditPage.tsx';
    import {Workspace,WorkspaceContext} from './src/client/workspace.tsx';
    import {workbenchStyles} from './src/client/styles.ts';
    const workspace=new Workspace(null);const style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
    function App(){const [data,setData]=React.useState(null),[open,setOpen]=React.useState(false),[jobs,setJobs]=React.useState(false);
      React.useEffect(()=>{fetch('/fixture').then(r=>r.json()).then(setData)},[]);
      return <WorkspaceContext.Provider value={workspace}><div id="audit-page" className="iad-workbench" data-page="industrial-audit">
        <button id="open" onClick={()=>setOpen(true)}>查看审计</button>{open&&data&&<AuditSampleDialog sample={data.sample} taskId={data.taskId} onClose={()=>setOpen(false)}/>}
        <button id="jobs" onClick={()=>setJobs(true)}>审计作业</button>
        {data&&(jobs?<AuditPage dataset={data.dataset} datasets={[data.dataset]} groups={[]} refreshRevision={0} onDatasetsChanged={()=>{}}/>
          :<DatasetReport datasetIds={data.datasetIds} onSample={()=>setOpen(true)}/>)}</div></WorkspaceContext.Provider>;
    }createRoot(document.getElementById('root')).render(<App/>);
  `, loader: 'tsx', resolveDir: app}, bundle: true, format: 'iife', write: false, target: 'es2022', define: {'process.env.NODE_ENV': '"production"'}});
  let fixture;
  const failing = new Set();
  const api = createIadHttpHandler(bridge);
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.endsWith('/tokenize')) {res.setHeader('Content-Type', 'application/json');res.end(JSON.stringify({count: 1000, max_model_len: 262144}));return;}
    if (url.pathname.endsWith('/chat/completions')) {
      let raw = '';for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw), text = body.messages[0].content[0].text;
      const views = body.messages[0].content.filter(part => part.type === 'text' && part.text.startsWith('视觉证据：')).map(part => JSON.parse(part.text.slice(5)));
      const refs = views.filter(view => view.representation === 'raw').map(view => view.evidence_id);
      const view = {description: '可见主体外观', position_analysis: '比较对应表面', illumination_analysis: '保留光照变化解释'};
      let result;
      if (body.response_format.json_schema.name === 'KnowledgeDraft') result = {summary: '主体外观规律', checks: [{title: '外观规律', subject: '主体', location: '表面', criterion: '可见连续表面', allowed_variations: [], status: 'supported', limitations: [], support_evidence_ids: refs, counter_evidence_ids: []}], suspects: [], limitations: []};
      else if (body.response_format.json_schema.name === 'JointAnalysis') {
        if(failing.has(views[0].annotations[0]?.sample_id)) {
          res.statusCode=503;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'该图像的模型调用失败'}));return;
        }
        const knowledge = JSON.parse(text.split('冻结知识：')[1].split('\n')[0]);
        result = {...view, suggested_label: 'PASS', reason_category: 'NORMAL', confidence: .7, evidence_ids: refs,
          global_view: view, region_observations: views.filter(view => view.role === 'roi' && view.representation === 'raw').map((_, index) => ({...view, region_index: index + 1})),
          check_assessments: knowledge.checks.map(check => ({...view, check_id: check.check_id, status: 'normal', evidence_ids: refs})), findings: [], resolved_findings: []};
      } else if (body.response_format.json_schema.name === 'DatasetReportConclusion') {
        assert.ok(text.startsWith('本次完整报告提示词：核对冻结数据、独立依据和适用范围。\n冻结报告事实：'));
        const frozen=JSON.parse(text.split('冻结报告事实：')[1]);
        result={sections:Object.fromEntries(Object.keys(frozen.requirements).map(key=>[key,{
          status:'needs_evidence',analysis:'根据已保存的审计记录与图像观察当前范围，独立真值尚未提供。',
          conclusion:'当前范围待补证，不把模型审计建议当正式评测成绩。',missing_evidence:['独立参考真值'],
          sample_ids:[frozen.cases[0].sample_id],evidence_ids:refs.slice(0,2)}])),
          dataset_analysis:'实际范围包含可追溯的审计记录。',dataset_conclusion:'数据集范围结论由模型实际生成。',
          model_analysis:'没有参评模型的冻结预测与独立真值。',model_conclusion:'当前不能排名模型。'};
      } else {
        assert.equal(body.response_format.json_schema.name, 'AuditConclusion');
        const frozen = JSON.parse(text.split('冻结综合审计：')[1]);
        result = {...view, suggested_label: 'PASS', reason_category: 'NORMAL', confidence: .7, evidence_ids: refs,
          analysis_text: '模型实际综合了冻结知识、独立比较图与本次一致性事实。', observation: '主体具有连续外观', applicable_rule: '仅适用于可见外观',
          normal_alternative: '保留成像亮度变化解释', label_relation: 'undetermined', proposed_slice: [],
          basis: [{text: '使用对应表面与独立来源比较', evidence_ids: refs, knowledge_check_ids: frozen.knowledge.checks.map(check => check.check_id), consistency_result_ids: []}]};
      }
      res.setHeader('Content-Type', 'application/json');res.end(JSON.stringify({choices: [{finish_reason: 'stop', message: {content: JSON.stringify(result)}}]}));return;
    }
    if (url.pathname === '/browser.js') {res.setHeader('Content-Type', 'application/javascript');res.end(bundle.outputFiles[0].contents);return;}
    if (url.pathname === '/fixture') {res.setHeader('Content-Type', 'application/json');res.end(JSON.stringify(fixture));return;}
    if (url.pathname.startsWith('/api/iad')) return api(req, res);
    res.setHeader('Content-Type', 'text/html;charset=utf-8');res.end('<meta charset="utf-8"><div id="root"></div><script src="/browser.js"></script>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const names = ['LIVE_VLM_ENDPOINT', 'LIVE_VLM_MODEL', 'LIVE_VLM_CAPACITY_MODE', 'IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES'];
  const before = Object.fromEntries(names.map(name => [name, process.env[name]]));
  process.env.LIVE_VLM_ENDPOINT = base+'/model/v1';process.env.LIVE_VLM_MODEL = 'fixture-model';process.env.LIVE_VLM_CAPACITY_MODE = 'vllm_tokenize';
  process.env.IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES = '2';
  t.after(() => {for (const name of names) if (before[name] === undefined) delete process.env[name];else process.env[name] = before[name];});
  const dataset = await bridge.execute('dataset_import', {format: 'labelme', name: '综合审计', image_dir: path.join(root, 'images'), annotation_dir: path.join(root, 'labels')});
  const wait = async (operation, job, expected='COMPLETED') => {
    const deadline = Date.now()+20000;
    while (['PENDING', 'RUNNING'].includes(job.status) && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 30));job = await bridge.execute(operation, {run_id: job.run_id});
    }
    assert.equal(job.status, expected, JSON.stringify(job.errors));return job;
  };
  await wait('analysis_status', await bridge.execute('analysis_start', {request: {analysis_kind: 'knowledge', dataset_ids: [dataset.dataset_id], batch_size: 3,
    mining_prompt: {objective: '比较主体', directions: [], instruction: '按真实图像比较主体外观。'}}}));
  const audit = await wait('audit_status', await bridge.execute('audit_start', {dataset_id: dataset.dataset_id, sample_ids: [dataset.dataset_id+':part-0.png']}));
  fixture = {sample: (await bridge.execute('audit_job_samples', {run_id: audit.run_id})).items[0], taskId: dataset.task_id,datasetIds:[dataset.dataset_id],dataset};
  let driver;
  try {
    const options = new firefox.Options().addArguments('-headless');options.setBinary('/tmp/iad-firefox128/firefox/firefox');
    driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder('/tmp/geckodriver')).build();
    await driver.manage().window().setRect({width: 1660, height: 1100});await driver.get(base);
    await (await driver.wait(until.elementLocated(By.id('open')), 10000)).click();
    const dialog = await driver.wait(until.elementLocated(By.css('dialog[aria-label="图像审计详情"][open]')), 10000);
    await driver.wait(async () => (await dialog.getText()).includes('模型实际综合了'), 10000);
    const sections = await dialog.findElements(By.css('[data-audit-section]'));
    assert.deepEqual(await Promise.all(sections.map(section => section.findElement(By.css('h3')).then(node => node.getText()))), ['综合分析', '结论', '判断依据', '图像证据']);
    const bounds = await Promise.all(sections.map(section => section.getRect()));
    for (let index=1; index<bounds.length; index++) assert.ok(bounds[index].y > bounds[index-1].y+bounds[index-1].height);
    assert.equal((await dialog.findElements(By.css('.iad-image-pair-side'))).length, 2);
    await driver.wait(async () => (await dialog.findElements(By.css('.iad-image-pair .iad-annotation-layer rect'))).length === 2, 10000);
    const expand = await dialog.findElements(By.css('button[aria-label="全屏检视"]'));
    assert.equal(expand.length, 2);
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', expand[1]);await expand[1].click();
    await driver.wait(until.elementLocated(By.css('dialog[aria-label="原图检视器"][open]')), 5000);
    assert.ok((await driver.findElements(By.css('.full-image-world .iad-annotation-layer rect'))).length);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.wait(async()=>(await driver.findElements(By.css('dialog[aria-label="原图检视器"][open]'))).length===0,5000);
    assert.equal((await driver.findElements(By.css('dialog[aria-label="图像审计详情"][open]'))).length, 1);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.wait(async()=>(await driver.findElements(By.css('dialog[aria-label="图像审计详情"][open]'))).length===0,5000);
    const prompt=await driver.findElement(By.css('textarea[aria-label="报告完整提示词"]'));
    const summary=await driver.findElement(By.css('.iad-report-prompt summary'));
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',summary);await summary.click();
    await prompt.clear();await prompt.sendKeys('本次完整报告提示词：核对冻结数据、独立依据和适用范围。');
    await (await driver.findElement(By.id('generate-scope-report'))).click();
    await driver.wait(async()=>(await driver.findElement(By.id('audit-report')).getText()).includes('数据集范围结论由模型实际生成。'),20000);
    assert.equal((await driver.findElements(By.css('[data-report-section]'))).length,20);
    assert.equal((await driver.findElements(By.css('.iad-report-chart'))).length,3);
    assert.ok((await driver.findElements(By.css('.iad-report-data dd'))).length>20);
    const reportId=await driver.findElement(By.css('select[aria-label="报告记录"]')).getAttribute('value');
    const exported=await fetch(`${base}/api/iad/dataset-reports/${reportId}/export`);
    assert.equal(exported.status,200);const html=await exported.text();
    assert.ok(html.includes('数据集范围结论由模型实际生成。')&&html.includes('data:image/png;base64,'));

    const ids=[0,1,2].map(index=>dataset.dataset_id+`:part-${index}.png`);
    failing.add(ids[1]);failing.add(ids[2]);
    const partial=await wait('audit_status',await bridge.execute('audit_start',{dataset_id:dataset.dataset_id,sample_ids:ids}),'PARTIAL');
    failing.clear();
    await wait('audit_status',await bridge.execute('audit_start',{dataset_id:dataset.dataset_id,sample_ids:[ids[0]]}));
    await (await driver.findElement(By.id('jobs'))).click();
    const row=await driver.wait(until.elementLocated(By.css(`tr[data-run-id="${partial.run_id}"]`)),10000);
    const cell=await row.findElement(By.css('td'));
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',cell);await cell.click();
    const openStatus=async()=>{
      const selected=await driver.findElement(By.css('tr[aria-selected="true"]'));
      await (await selected.findElement(By.css('.iad-job-status-button'))).click();
      return driver.wait(until.elementLocated(By.css('dialog[aria-label="作业状态"][open]')),5000);
    };
    let drawer=await openStatus();
    for(let step=0;step<2;step++){
      const choose=await drawer.findElement(By.xpath('.//button[normalize-space(.)="选择重试范围"]'));
      await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',choose);await choose.click();
      await driver.wait(async()=>(await drawer.findElements(By.css('.iad-retry-samples input'))).length===2-step,5000);
      if(step===0)await (await drawer.findElements(By.css('.iad-retry-samples input')))[1].click();
      const retry=await drawer.findElement(By.xpath('.//button[normalize-space(.)="重试所选 1 张"]'));
      await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',retry);await retry.click();
      await driver.wait(async()=>{
        const state=await bridge.execute('audit_status',{run_id:partial.run_id});
        return state.completed===2+step&&!['PENDING','RUNNING'].includes(state.status);
      },10000);
      await driver.wait(async()=>(await driver.findElement(By.css('dialog[aria-label="作业状态"][open] .iad-job-progress-card')).getText()).includes(`${2+step} / 3`),10000);
      await driver.actions().sendKeys(Key.ESCAPE).perform();
      await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,5000);
      const selected=await driver.findElement(By.css('tr[aria-selected="true"]'));
      const state=await bridge.execute('audit_status',{run_id:partial.run_id});
      assert.equal(await selected.getAttribute('data-run-id'),state.run_id,'补跑后必须继续选中原逻辑作业');
      assert.equal((await driver.findElements(By.css('.audit-table tbody tr'))).length,3,'内部补跑不能增加作业行');
      assert.equal((await driver.findElements(By.css('#audit-images .iad-thumbnail-card'))).length,3);
      if(step===0)drawer=await openStatus();
    }
    assert.equal((await bridge.execute('audit_job_report',{run_id:partial.run_id})).audited_samples,3);
  } catch(error) {
    if(driver){console.error(await driver.executeScript('return {active:document.activeElement?.outerHTML.slice(0,300),dialogs:[...document.querySelectorAll("dialog")].map(d=>({open:d.open,modal:d.matches(":modal"),label:d.getAttribute("aria-label")}))}'));
      await fs.writeFile('/tmp/iad-audit-synthesis-failure.png',await driver.takeScreenshot(),'base64');}
    throw error;
  } finally {if (driver) await driver.quit();}
});
