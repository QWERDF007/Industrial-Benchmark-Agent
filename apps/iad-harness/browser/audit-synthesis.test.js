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

test('audit detail, scope report and job selection keep frozen evidence and prototype interactions', {timeout: 90000}, async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-audit-synthesis-'));
  const bridge = new PythonBridge({cwd: path.resolve(app, '../..'), dbPath: path.join(root, 'test.db')});
  t.after(() => bridge.destroy());
  execFileSync(bridge.pythonPath, ['-c', `
import json,sys
from pathlib import Path
from PIL import Image
p=Path(sys.argv[1]);(p/'images').mkdir();(p/'labels').mkdir()
for i in range(3):
 Image.new('RGB',(640,480),(80+(i%2)*30,120,160)).save(p/'images'/f'part-{i}.png')
 (p/'labels'/f'part-{i}.json').write_text(json.dumps({'imageWidth':640,'imageHeight':480,'shapes':[{'label':'对照类别' if i==2 else '原始类别','shape_type':'rectangle','points':[[40,60],[140,180]]}]}))
`, root]);
  const bundle = await build({stdin: {contents: `
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {AuditSampleDialog} from './src/client/components/AuditSampleDialog.tsx';
    import {ConsistencyConflictDialog} from './src/client/components/ConsistencyConflictDialog.tsx';
    import {DatasetReport} from './src/client/components/DatasetReport.tsx';
    import {AuditPage} from './src/client/components/AuditPage.tsx';
    import {KnowledgePage} from './src/client/components/KnowledgePage.tsx';
    import {Workspace,WorkspaceContext} from './src/client/workspace.tsx';
    import {WorkbenchModelProvider} from './src/client/models.tsx';
    import {workbenchStyles} from './src/client/styles.ts';
    const workspace=new Workspace(null);const style=document.createElement('style');style.textContent=workbenchStyles;document.head.append(style);
    function App(){const [data,setData]=React.useState(null),[open,setOpen]=React.useState(false),[jobs,setJobs]=React.useState(false),[knowledge,setKnowledge]=React.useState(false),[compare,setCompare]=React.useState(false);
      React.useEffect(()=>{fetch('/fixture').then(r=>r.json()).then(setData)},[]);
      return <WorkspaceContext.Provider value={workspace}><WorkbenchModelProvider><div id={jobs?undefined:'audit-page'} className="iad-workbench" data-page="industrial-audit">
        <button id="open" onClick={()=>setOpen(true)}>查看审计</button>{open&&data&&<AuditSampleDialog sample={data.sample} taskId={data.taskId} onClose={()=>setOpen(false)}/>}
        {data?.conflict&&<button id="compare" onClick={()=>setCompare(true)}>查看一致性</button>}{compare&&data&&<ConsistencyConflictDialog conflict={data.conflict} items={[data.conflict]} queryId={data.queryId} onSelect={()=>{}} onClose={()=>setCompare(false)} onReviewed={()=>{}}/>}
        <button id="knowledge" onClick={()=>setKnowledge(true)}>知识挖掘</button><button id="jobs" onClick={()=>setJobs(true)}>审计作业</button>
        {data&&(knowledge?<KnowledgePage dataset={data.dataset} refreshRevision={0}/>:jobs?<AuditPage dataset={data.dataset} datasets={[data.dataset]} groups={[]} refreshRevision={0} onDatasetsChanged={()=>{}}/>
          :<DatasetReport datasetIds={data.datasetIds} onSample={()=>setOpen(true)}/>)}</div></WorkbenchModelProvider></WorkspaceContext.Provider>;
    }createRoot(document.getElementById('root')).render(<App/>);
  `, loader: 'tsx', resolveDir: app}, bundle: true, format: 'iife', write: false, target: 'es2022', define: {'process.env.NODE_ENV': '"production"'}});
  let fixture,offlineHtml='';
  const failing = new Set();
  const sourcePrompts=[];
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
        if(failing.has(views[0].annotations?.[0]?.sample_id)) {
          res.statusCode=503;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'该图像的模型调用失败'}));return;
        }
        const knowledge = JSON.parse(text.split('冻结知识：')[1].split('\n')[0]);
        result = {...view, suggested_label: 'PASS', reason_category: 'NORMAL', confidence: .7, evidence_ids: refs,
          global_view: view, region_observations: views.filter(view => view.role === 'roi' && view.representation === 'raw').map((_, index) => ({...view, region_index: index + 1})),
          check_assessments: knowledge.checks.map(check => ({...view, check_id: check.check_id, status: 'normal', evidence_ids: refs})), findings: [], resolved_findings: []};
      } else if (['GroupAnalysisDraft','GroupAnalysisSummary'].includes(body.response_format.json_schema.name)) {
        const visual=body.response_format.json_schema.name==='GroupAnalysisDraft';
        const scope=JSON.parse(text.split(visual?'冻结图组：':'冻结批次分析：')[1].split('\n请根据图像')[0]);
        const references=visual?Object.entries(scope.candidates).map(([candidate_id,item])=>({candidate_id,
          comparison:{result_id:item.comparison.result_id,evidence_id:item.comparison.evidence_id}})):scope.summaries.flatMap(item=>item.result.overall.references);
        result={...(visual?{assessments:references.map(ref=>({candidate_id:ref.candidate_id,verdict:'MATERIAL',conclusion:'标注类别不同',explanation:'对应标注类别不同。',findings:['标注类别不同']}))}:{}),
          overall:{verdict:'MATERIAL',text:'标注类别不同',references},conclusions:[{text:'主图与候选的像素相同，原始标注类别不同。',references}],limitations:[]};
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
        if(frozen.consistency.source_job_ids)sourcePrompts.push(frozen);
        result = {...view, suggested_label: 'PASS', reason_category: 'NORMAL', confidence: .7, evidence_ids: refs,
          analysis_text: '模型实际综合了冻结知识、独立比较图与本次一致性事实。', observation: '主体具有连续外观', applicable_rule: '仅适用于可见外观',
          normal_alternative: '保留成像亮度变化解释', label_relation: 'undetermined', proposed_slice: [],
          basis: [{text: '使用对应表面与独立来源比较', evidence_ids: refs, knowledge_check_ids: frozen.knowledge.checks.map(check => check.check_id), consistency_result_ids: []}]};
      }
      res.setHeader('Content-Type', 'application/json');res.end(JSON.stringify({choices: [{finish_reason: 'stop', message: {content: JSON.stringify(result)}}]}));return;
    }
    if (url.pathname === '/browser.js') {res.setHeader('Content-Type', 'application/javascript');res.end(bundle.outputFiles[0].contents);return;}
    if (url.pathname === '/fixture') {res.setHeader('Content-Type', 'application/json');res.end(JSON.stringify(fixture));return;}
    if (url.pathname === '/offline.html') {res.setHeader('Content-Type','text/html;charset=utf-8');res.end(offlineHtml);return;}
    if (url.pathname.startsWith('/api/iad')) return api(req, res);
    res.setHeader('Content-Type', 'text/html;charset=utf-8');res.end('<meta charset="utf-8"><div id="root"></div><script>if(isSecureContext)Object.defineProperty(crypto,"randomUUID",{value:undefined});</script><script src="/browser.js"></script>');
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
  await bridge.execute('consistency_compare',{sample_a:dataset.dataset_id+':part-1.png',sample_b:dataset.dataset_id+':part-2.png'});
  await bridge.execute('consistency_compare',{sample_a:dataset.dataset_id+':part-0.png',sample_b:dataset.dataset_id+':part-2.png'});
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
    const candidates=await dialog.findElements(By.css('[aria-label="切换候选图像"] button'));
    assert.ok(candidates.length>=2,'真实冻结比较图以缩略图条切换');
    const originalMain=await dialog.findElement(By.css('.iad-image-pair-side:first-child img')).getAttribute('src');
    const originalComparison=await dialog.findElement(By.css('.iad-image-pair-side:last-child img')).getAttribute('src');
    await driver.executeScript('arguments[0].click()',candidates[1]);
    await driver.wait(async()=>await dialog.findElement(By.css('.iad-image-pair-side:last-child img')).getAttribute('src')!==originalComparison,5000);
    assert.equal(await dialog.findElement(By.css('.iad-image-pair-side:first-child img')).getAttribute('src'),originalMain);
    assert.equal(await candidates[1].getAttribute('aria-pressed'),'true');
    await driver.executeScript('arguments[0].click()',candidates[0]);
    assert.equal((await dialog.findElements(By.css('.iad-embedded-canvas'))).length,0,'原型证据区使用图片卡片，不嵌入图像操作工具栏');
    assert.equal(await(await dialog.findElement(By.css('.audit-dialog-head h2'))).getText(),'图像审计详情');
    const evidenceStyle=await driver.executeScript('const s=getComputedStyle(arguments[0]);return {border:s.borderBottomWidth,padding:s.paddingBottom}',sections[0]);
    assert.equal(evidenceStyle.border,'1px','各部分恢复原型分割线');

    await driver.wait(async () => (await dialog.findElements(By.css('.iad-image-pair .iad-annotation-layer rect'))).length === 2, 10000);
    assert.equal((await dialog.findElements(By.css('.audit-evidence-item h4,.audit-original-label,.iad-image-quality'))).length,0,'LabelMe证据仅保留文件名及具体类别矩形');
    const expand = await dialog.findElements(By.css('.iad-image-pair button[aria-label^="放大"]'));
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
    assert.equal((await driver.findElements(By.css('.iad-report-chart'))).length,4);
    assert.ok((await driver.findElements(By.css('.iad-report-data dd'))).length>20);
    const technical=await driver.findElement(By.css('[data-report-section="technical_usability"]'));
    for (const label of ['原图完整解码','空间标注坐标有效','标注声明尺寸匹配']) {
      const row=await technical.findElement(By.xpath(`.//dt[normalize-space(.)="${label}"]/parent::*`));
      assert.equal(await row.findElement(By.css('dd')).getText(),'3/3');
    }
    assert.ok((await driver.findElement(By.css('[data-report-section="defect_coverage"]')).getText()).includes('框面积 / 原图面积'));
    const consistencyRow=await driver.findElement(By.xpath('//*[@data-report-section="label_trust"]//dt[normalize-space(.)="当前比较对"]/parent::*'));
    assert.equal(await consistencyRow.findElement(By.css('dd')).getText(),'2','报告包含未审计图像之间的比较');
    const reportId=await driver.findElement(By.css('select[aria-label="报告记录"]')).getAttribute('value');
    const exported=await fetch(`${base}/api/iad/dataset-reports/${reportId}/export`);
    assert.equal(exported.status,200);const html=await exported.text();
    assert.ok(html.includes('数据集范围结论由模型实际生成。')&&html.includes('data:image/png;base64,'));
    assert.ok(html.includes('原图完整解码')&&html.includes('空间标注坐标有效')&&html.includes('框面积 / 原图面积'));
    assert.ok(html.includes('当前比较对')&&html.includes('严格同图检查覆盖'));

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
    const drawer=await openStatus();
    assert.equal((await drawer.findElements(By.css('.iad-job-stage'))).length,4);
    assert.equal((await drawer.findElements(By.css('.iad-retry-scope,.iad-job-metrics,.iad-job-progress-card'))).length,0);
    assert.deepEqual(await Promise.all((await drawer.findElements(By.css('footer button'))).map(button=>button.getText())),['关闭']);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.wait(async()=>(await driver.findElements(By.css('dialog[open]'))).length===0,5000);
    const complete=await driver.findElement(By.css('tr[data-run-id="'+audit.run_id+'"]'));
    assert.equal((await complete.findElements(By.css('.iad-job-status-button'))).length,0,'成功状态不打开抽屉');
    await (await complete.findElement(By.css('button[aria-label="查看作业 '+audit.run_id+'"]'))).click();
    await driver.wait(async()=>await complete.getAttribute('aria-selected')==='true',5000);
    assert.equal((await driver.findElements(By.css('dialog[open]'))).length,0,'查看作业详情选中结果，不打开状态抽屉');
    await driver.wait(until.elementLocated(By.css('input[aria-label="搜索审计图像"]')),5000);
    const headers=await driver.executeScript(`return [...document.querySelectorAll('#audit-page .iad-section-heading')].map(header=>{const h=header.querySelector('h2'),r=header.getBoundingClientRect(),s=getComputedStyle(h);return {title:h.textContent,font:s.fontSize,weight:s.fontWeight,height:r.height,padding:getComputedStyle(header).paddingLeft,controls:[...header.querySelectorAll('input,select')].map(e=>{const c=e.getBoundingClientRect();return {center:c.top+c.height/2-r.top-r.height/2,inline:getComputedStyle(e.closest('label')).display}})}})`);
    assert.deepEqual(headers.map(h=>h.title),['审计作业','审计结果']);
    for(const header of headers){assert.equal(header.font,'16px');assert.equal(header.weight,'650');assert.equal(header.height,70);assert.equal(header.padding,'20px');assert.ok(header.controls.length);for(const control of header.controls){assert.ok(Math.abs(control.center)<1,'筛选控件在标题栏中居中');assert.equal(control.inline,'flex');}}

    await (await driver.findElement(By.css('button[title="新建审计"]'))).click();
    await driver.wait(until.elementLocated(By.id('audit-create-knowledge-jobs')),5000);
    assert.deepEqual(await Promise.all((await driver.findElements(By.css('.audit-source-panel > header h2'))).map(node=>node.getText())),
      ['知识挖掘','数据一致性','确认并启动']);
    assert.equal((await driver.findElements(By.css('#audit-create-model,#audit-create-mode,#audit-create-prompt'))).length,0);
    const sourceRadio=await driver.wait(until.elementLocated(By.css('#audit-create-knowledge-jobs input[type="radio"]')),5000);
    await sourceRadio.click();
    const allEntries=await driver.wait(until.elementLocated(By.id('audit-entries-all')),5000);
    await allEntries.click();
    assert.ok((await driver.findElement(By.id('audit-create-summary')).getText()).includes('1 条'));
    assert.equal(await driver.findElement(By.id('audit-create-submit')).isEnabled(),false,'没有已完成的一致性作业不得静默启动');
    await allEntries.click();
    assert.ok((await driver.findElement(By.id('audit-create-summary')).getText()).includes('0 条'));
    const consistency=await wait('analysis_status',await bridge.execute('analysis_start',{request:{analysis_kind:'consistency',mode:'exact',dataset_ids:[dataset.dataset_id]}}));
    await wait('analysis_status',await bridge.execute('analysis_start',{request:{analysis_kind:'knowledge',dataset_ids:[dataset.dataset_id],batch_size:3,
      mining_prompt:{objective:'另一知识作业',directions:[],instruction:'按真实图像比较主体外观。'}}}));
    await (await driver.findElement(By.css('button[aria-label="刷新当前页面"]'))).click();
    const consistencyChoice=await driver.wait(until.elementLocated(By.css('#audit-create-consistency-jobs input')),10000);
    const nextKnowledge=await driver.findElement(By.css('#audit-create-knowledge-jobs input[type="radio"]'));
    await nextKnowledge.click();
    assert.ok((await driver.findElement(By.id('audit-create-summary')).getText()).includes('0 条'),'切换来源版本清空所选条目');
    await (await driver.findElement(By.id('audit-entries-all'))).click();await consistencyChoice.click();
    const submit=await driver.findElement(By.id('audit-create-submit'));
    assert.equal(await submit.isEnabled(),true);
    const facts=await driver.findElements(By.css('.audit-create-facts>div'));
    const factRects=await Promise.all(facts.map(row=>row.getRect()));
    for(let i=1;i<factRects.length;i++)assert.ok(factRects[i].y>=factRects[i-1].y+factRects[i-1].height,'确认摘要按四行排列');
    const output=path.resolve(process.env.IAD_V72_OUTPUT||'/tmp/iad-v72-browser');await fs.mkdir(output,{recursive:true});
    await driver.executeScript('scrollTo(0,0)');await fs.writeFile(path.join(output,'audit-setup.png'),await driver.takeScreenshot(),'base64');
    await driver.executeScript(`const f=document.createElement('iframe');f.id='phone';f.src=arguments[0];f.style.cssText='position:fixed;inset:0;width:375px;height:812px;border:0;z-index:10000';document.body.append(f)`,base);
    await driver.switchTo().frame(await driver.findElement(By.id('phone')));
    await (await driver.wait(until.elementLocated(By.id('jobs')),10000)).click();
    await (await driver.wait(until.elementLocated(By.css('button[title="新建审计"]')),10000)).click();
    await (await driver.wait(until.elementLocated(By.css('#audit-create-knowledge-jobs input[type="radio"]')),10000)).click();
    const phoneLayout=await driver.executeScript('return {width:innerWidth,scroll:document.documentElement.scrollWidth,panels:[...document.querySelectorAll(".audit-source-panel")].map(e=>({left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}))}');
    assert.equal(phoneLayout.width,375);assert.ok(phoneLayout.scroll<=375,JSON.stringify(phoneLayout));
    assert.ok(phoneLayout.panels.every(panel=>panel.left>=0&&panel.right<=375),JSON.stringify(phoneLayout));
    await driver.switchTo().defaultContent();await driver.executeScript('document.getElementById("phone").remove()');
    await driver.executeScript('arguments[0].click()',submit);
    await driver.wait(async()=>(await driver.findElements(By.id('audit-create-view'))).length===0,10000);
    let latest=(await bridge.execute('audit_list',{dataset_id:dataset.dataset_id})).jobs[0];
    latest=await wait('audit_status',latest);
    const saved=await bridge.execute('analysis_node',{run_id:latest.run_id});
    assert.equal(saved.request.sources.consistency_job_ids[0],consistency.run_id);
    assert.equal(saved.request.sources.knowledge_entry_ids.length,1);
    assert.ok(saved.request.sources.consistency_groups.length>0,'冻结并复用所选作业的模型图组分析');
    assert.ok(sourcePrompts.some(input=>input.consistency.prior_analyses.length>0),'审计模型实际收到所选作业的既有图组结论');
    const sources=await bridge.execute('audit_sources',{dataset_ids:[dataset.dataset_id]});
    const selectedSource=sources.knowledge_jobs.find(job=>job.job_id===saved.request.sources.knowledge_job_id);
    assert.equal(saved.knowledge_version_id,selectedSource.version_id);
    await (await driver.findElement(By.xpath('//button[normalize-space(.)="报告"]'))).click();
    await (await driver.findElement(By.css('.iad-report-prompt summary'))).click();
    const newPrompt=await driver.findElement(By.css('textarea[aria-label="报告完整提示词"]'));
    await newPrompt.clear();await newPrompt.sendKeys('本次完整报告提示词：核对冻结数据、独立依据和适用范围。');
    await (await driver.findElement(By.id('generate-scope-report'))).click();
    await driver.wait(async()=>(await driver.findElements(By.css('.iad-report-section h4'))).length>0,20000);
    const charts=await driver.findElements(By.css('.iad-report-chart'));
    assert.equal(charts.length,4);
    const chartRects=await Promise.all(charts.map(chart=>chart.getRect()));
    for(let i=1;i<chartRects.length;i++)assert.ok(chartRects[i].y>=chartRects[i-1].y+chartRects[i-1].height,'四图纵向占满内容区');
    const selectedReport=await driver.findElement(By.css('select[aria-label="报告记录"]')).getAttribute('value');
    offlineHtml=await (await fetch(`${base}/api/iad/dataset-reports/${selectedReport}/export`)).text();
    assert.ok(offlineHtml.includes(saved.request.sources.knowledge_job_id));
    assert.ok(offlineHtml.includes('可见连续表面'));
    await fs.writeFile(path.join(output,'report.html'),offlineHtml);
    await driver.findElement(By.id('knowledge')).click();
    await driver.wait(until.elementLocated(By.id('knowledge-search')),10000);
    const knowledgeHeadings=await driver.executeScript(`return [...document.querySelectorAll('.iad-knowledge-page .iad-section-heading')].map(header=>{const r=header.getBoundingClientRect();return {height:r.height,controls:[...header.querySelectorAll('input,select')].map(e=>{const c=e.getBoundingClientRect();return c.top+c.height/2-r.top-r.height/2})}})`);
    assert.equal(knowledgeHeadings.length,2);
    for(const header of knowledgeHeadings){assert.equal(header.height,70,'知识板块有筛选控件时保持70px');assert.equal(header.controls.length,2);assert.ok(header.controls.every(center=>Math.abs(center)<1));}
    await driver.get(base+'/offline.html');
    assert.equal((await driver.findElements(By.css('.iad-report-chart'))).length,4);
    assert.equal((await driver.findElements(By.css('meter,link[rel="stylesheet"]'))).length,0);
    await driver.executeAsyncScript('const done=arguments[arguments.length-1];requestAnimationFrame(()=>requestAnimationFrame(done))');
    await fs.writeFile(path.join(output,'report.png'),await driver.takeScreenshot(),'base64');
    execFileSync(bridge.pythonPath,['-c',`import sys
from pathlib import Path
from PIL import Image
p=Path(sys.argv[1])/'classification'
for folder in ['OK','NG']:
 (p/folder).mkdir(parents=True)
 for i in range(2):Image.new('RGB',(640,480),(80+i*30,120,160)).save(p/folder/f'part-{i}.png')`,root]);
    const preview=await bridge.execute('dataset_preview',{root_dir:path.join(root,'classification')});
    const anomaly=await bridge.execute('dataset_import',{format:'folder_classification',name:'异常检测证据',root_dir:preview.root_dir,
      rules:preview.items.map(({path,role})=>({path,role})),preview_fingerprint:preview.preview_fingerprint});
    await wait('analysis_status',await bridge.execute('analysis_start',{request:{analysis_kind:'knowledge',dataset_ids:[anomaly.dataset_id],batch_size:4,
      mining_prompt:{objective:'核对异常检测',directions:[],instruction:'核对完整原图。'}}}));
    const pair=await bridge.execute('consistency_compare',{sample_a:anomaly.dataset_id+':OK/part-0.png',sample_b:anomaly.dataset_id+':NG/part-0.png'});
    const anomalyAudit=await wait('audit_status',await bridge.execute('audit_start',{dataset_id:anomaly.dataset_id,sample_ids:[anomaly.dataset_id+':OK/part-0.png']}));
    const report=await bridge.execute('consistency_report',{selection:{kind:'scope',subjects:{kind:'datasets',dataset_ids:[anomaly.dataset_id]}}});
    const gallery=await bridge.execute('consistency_gallery',{query_id:report.page.query_id,kind:'conflicts'});
    assert.deepEqual(gallery.items[0].conflict_categories,['类别不一致'],'异常检测统一归为类别不一致');
    const item=gallery.items[0],media=`/api/iad/consistency/evidence/${item.anchor.evidence_id}/media/${item.anchor.side}-original`;
    fixture={sample:(await bridge.execute('audit_job_samples',{run_id:anomalyAudit.run_id})).items[0],taskId:anomaly.task_id,datasetIds:[anomaly.dataset_id],dataset:anomaly,
      queryId:report.page.query_id,conflict:{id:item.group_id,type:'类别不一致',types:item.conflict_categories,filename:'OK/part-0.png',url:media,fullUrl:media,
        sourceWidth:640,sourceHeight:480,memberCount:item.member_count,review:item.review_state,model:{status:'unknown',modelType:'未分析'},rawItem:item}};
    await driver.get(base);await(await driver.wait(until.elementLocated(By.id('open')),10000)).click();
    const anomalyDialog=await driver.wait(until.elementLocated(By.css('dialog[aria-label="图像审计详情"]')),10000);
    const ngCandidate=await driver.wait(until.elementLocated(By.css('button[aria-label="切换为候选图像 NG/part-0.png"]')),10000);
    await ngCandidate.click();
    await driver.wait(async()=>JSON.stringify(await Promise.all((await anomalyDialog.findElements(By.css('.iad-image-pair .iad-image-quality'))).map(e=>e.getText())))==='["OK","NG"]',10000);
    assert.equal((await anomalyDialog.findElements(By.css('.iad-image-pair .iad-annotation-layer,.audit-original-label,.audit-evidence-item h4'))).length,0);
    await anomalyDialog.findElement(By.css('button[aria-label="放大对照图像"]')).click();
    await driver.wait(until.elementLocated(By.css('.full-stage>.iad-image-quality[data-quality="NG"]')),5000);
    assert.equal((await driver.findElements(By.css('.full-image-world .iad-annotation-layer'))).length,0);
    await driver.actions().sendKeys(Key.ESCAPE).perform();await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.findElement(By.id('compare')).click();
    const compare=await driver.wait(until.elementLocated(By.id('dc-compare-mask')),10000);
    await driver.wait(async()=>JSON.stringify(await Promise.all((await compare.findElements(By.css('.dc-compare .iad-image-quality'))).map(e=>e.getText())))==='["OK","NG"]',10000);
    assert.equal((await compare.findElements(By.css('.dc-compare .iad-annotation-layer,.dc-source-label,.dc-compare-title'))).length,0);
    await compare.findElement(By.css('[data-dc="zoom-candidate"]')).click();
    await driver.wait(until.elementLocated(By.css('.full-stage>.iad-image-quality[data-quality="NG"]')),5000);
    assert.equal((await driver.findElements(By.css('.full-image-world .iad-annotation-layer'))).length,0);
  } catch(error) {
    console.error(error.message);
    if(driver){console.error(await driver.executeScript('return {active:document.activeElement?.outerHTML.slice(0,300),dialogs:[...document.querySelectorAll("dialog")].map(d=>({open:d.open,modal:d.matches(":modal"),label:d.getAttribute("aria-label")}))}'));
      await fs.writeFile('/tmp/iad-audit-synthesis-failure.png',await driver.takeScreenshot(),'base64');}
    throw error;
  } finally {if (driver) await driver.quit();}
});
