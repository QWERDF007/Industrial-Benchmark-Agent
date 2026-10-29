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
import {viewport} from './workbench-layout.js';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('1920 desktop retrieves all exact members and compares real annotation differences', {timeout: 90000}, async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-consistency-browser-'));
  const bridge = new PythonBridge({cwd: path.resolve(app, '../..'), dbPath: path.join(root, 'test.db')});
  t.after(()=>bridge.destroy());
  execFileSync(bridge.pythonPath, ['-c', `
import json,sys
from pathlib import Path
from PIL import Image,ImageDraw
r=Path(sys.argv[1]);(r/'images').mkdir();(r/'labels').mkdir()
im=Image.new('RGB',(2560,1920),'#dce2e8');d=ImageDraw.Draw(im);d.rectangle((80,100,480,350),fill='#4c6278');d.ellipse((190,180,230,220),fill='#db6935')
for name,label in [('query','scratch'),('copy','dent')]:
 im.save(r/'images'/f'{name}.png')
 (r/'labels'/f'{name}.json').write_text(json.dumps({'imageWidth':2560,'imageHeight':1920,'shapes':[{'label':label,'shape_type':'rectangle','points':[[190,180],[230,220]]}]}))
`, root]);
  const dataset = await bridge.execute('dataset_import', {format:'labelme', name:'双图核验', image_dir:path.join(root,'images'), annotation_dir:path.join(root,'labels'),
    annotation_policy:{policy_id:'same-policy',annotation_role:'REFERENCE',annotation_coverage:'EXHAUSTIVE'}});
  const bundle = await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import {apply} from './src/client/index.ts';
    const entries=[],mains=new Map(),listeners=new Set();let panel=null;
    const layout={panelInfo:{getSnapshot:()=>({activePanelId:panel}),subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}},selectPanel:id=>{panel=id;listeners.forEach(f=>f())}};
    apply({layout,slots:{inject:(_,f)=>f(),register:(o,c)=>{if(o.name==='main')mains.set(o.key,c);else if(o.name==='sidebar.panellist')entries.push(o)}}});
    function App(){const [id,setId]=React.useState(panel||entries[0].id);React.useEffect(()=>layout.panelInfo.subscribe(()=>setId(panel)),[]);const Page=mains.get(id);return <><nav>{entries.map(e=><button key={e.id} onClick={()=>layout.selectPanel(e.id)}>{e.label}</button>)}</nav><div style={{height:'calc(100% - 40px)'}}>{Page&&<Page/>}</div></>}
    createRoot(document.getElementById('root')).render(<App/>);`,loader:'tsx',resolveDir:app},bundle:true,format:'iife',write:false,target:'es2022',define:{'process.env.NODE_ENV':'"production"'}});
  const api = createIadHttpHandler(bridge), calls=[], reviewSubmissions=[], responses=[];
  let loseReviewResponse=false;
  const server=http.createServer(async(req,res)=>{
    if(req.url==='/browser.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].contents);}
    if(req.url.startsWith('/api/iad')){
      calls.push(req.url);
      const response={url:req.url,status:null};responses.push(response);res.on('finish',()=>{response.status=res.statusCode;});
      if(req.url==='/api/iad/consistency/review/submit'){
        const chunks=[];req.on('data',chunk=>chunks.push(chunk));
        req.on('end',()=>reviewSubmissions.push(JSON.parse(Buffer.concat(chunks))));
        if(loseReviewResponse){loseReviewResponse=false;res.end=body=>{res.write(body.slice(0,1),()=>res.destroy());return res;};}
      }
      return api(req,res);
    }
    res.setHeader('Content-Type','text/html;charset=utf-8');res.end('<!doctype html><meta charset="utf-8"><style>html,body,#root{height:100%;margin:0}body{font-family:system-ui;font-size:14px}</style><div id="root"></div><script>if(isSecureContext)Object.defineProperty(crypto,"randomUUID",{value:undefined});</script><script src="/browser.js"></script>');
  });
  const host=process.env.IAD_CONSISTENCY_BROWSER_HOST||'127.0.0.1';
  await new Promise(resolve=>server.listen(0,host,resolve));
  let driver;
  try {
    const options=new firefox.Options().addArguments('-headless','--remote-allow-system-access');
    if(process.env.FIREFOX_PATH)options.setBinary(process.env.FIREFOX_PATH);
    driver=await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH||'geckodriver')).build();
    const route={pageId:'industrial-consistency',tab:'search',query:{kind:'sample',sample_id:dataset.dataset_id+':query.png'},scope:{kind:'all_registered'}};
    await driver.get(`http://${host}:${server.address().port}/?${new URLSearchParams({iad:JSON.stringify(route)})}`);
    const environment=await driver.executeScript('return {secureContext:isSecureContext,randomUUID:typeof crypto.randomUUID,getRandomValues:typeof crypto.getRandomValues}');
    assert.equal(environment.randomUUID,'undefined');
    assert.equal(environment.getRandomValues,'function');
    if(host!=='127.0.0.1'&&host!=='localhost')assert.equal(environment.secureContext,false);
    t.diagnostic(JSON.stringify(environment));
    await viewport(driver,1920,1080);
    const output=process.env.IAD_CONSISTENCY_BROWSER_OUTPUT||'/tmp/iad-consistency-browser';
    await fs.mkdir(output,{recursive:true});
    await driver.wait(until.elementLocated(By.css('[data-page="industrial-consistency"]')),5000);
    const click=async text=>(await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${text}' or @aria-label='${text}']`)),5000)).click();
    await driver.wait(until.elementLocated(By.css('.iad-consistency-empty')),5000);
    await fs.writeFile(path.join(output,'search-empty-1920.png'),await driver.takeScreenshot(),'base64');
    await click('标注冲突');
    const initialReport=await driver.wait(until.elementLocated(By.css('[aria-label="范围检查报告"]')),5000);
    assert.match(await initialReport.getText(),/尚未执行检查/);
    assert.doesNotMatch(await initialReport.getText(),/精确范围已检查|无冲突结果/);
    assert.ok(await driver.findElement(By.css('[aria-label="范围比较结果"] .iad-consistency-empty')).isDisplayed());
    for(const width of [1366,1792,1920]){
      await viewport(driver,width,1080);
      const layout=await driver.executeScript('const root=document.querySelector(".iad-workbench");return {overflow:root.scrollWidth-root.clientWidth,heights:[...root.querySelectorAll(".iad-consistency-query select")].map(e=>e.getBoundingClientRect().height)}');
      assert.ok(layout.overflow<=1,`desktop ${width} overflow ${layout.overflow}`);
      assert.ok(layout.heights.every(value=>Math.abs(value-40)<1));
    }
    await fs.writeFile(path.join(output,'conflicts-empty-1920.png'),await driver.takeScreenshot(),'base64');
    await click('重复图组');
    await driver.wait(until.elementLocated(By.css('[aria-label="范围重复图组"] .iad-consistency-empty')),5000);
    await fs.writeFile(path.join(output,'groups-empty-1920.png'),await driver.takeScreenshot(),'base64');
    await click('索引与作业');
    await driver.wait(until.elementLocated(By.css('[aria-label="一致性批次"] .iad-consistency-empty')),5000);
    await driver.wait(()=>driver.findElement(By.css('[aria-label="一致性批次"]')).getText().then(text=>text.includes('图像编码器未配置')),5000);
    assert.equal(await driver.findElement(By.xpath('//button[normalize-space(.)="开始批量检查"]')).isEnabled(),true,'严格同图检查不因未配置视觉编码器而禁用');
    await fs.writeFile(path.join(output,'jobs-empty-1920.png'),await driver.takeScreenshot(),'base64');
    await click('标注冲突');
    await driver.wait(until.elementLocated(By.css('[aria-label="范围检查报告"]')),5000);
    await click('开始批量检查');
    await driver.wait(async()=>{
      const alerts=await driver.findElements(By.css('[role="alert"]'));
      for(const alert of alerts)assert.doesNotMatch(await alert.getText(),/crypto\.randomUUID is not a function/);
      return /检查完成/.test(await driver.findElement(By.css('[aria-label="范围检查报告"]')).getText());
    },15000);
    assert.equal(await driver.findElement(By.css('[role="tab"][aria-selected="true"]')).getText(),'标注冲突');
    await click('索引与作业');
    await driver.wait(until.elementLocated(By.css('[aria-label="一致性批次"]')),5000);
    await click('开始批量检查');
    await driver.wait(async()=>{
      const panels=await driver.findElements(By.css('[data-batch-id]'));
      return panels.length && /已完成[\s\S]*完成 2[\s\S]*失败 0[\s\S]*未处理 0[\s\S]*共 2/.test(await panels[0].getText());
    },15000);
    const batchLocation=await driver.executeScript('return JSON.parse(new URL(location.href).searchParams.get("iad"))');
    assert.ok(batchLocation.batchId);assert.equal('datasetId' in batchLocation,false);
    assert.ok(await driver.findElement(By.css('table[aria-label="作业记录"] tbody tr[aria-selected="true"]')).isDisplayed());
    const beforeRefresh=calls.length;
    await driver.navigate().refresh();
    await driver.wait(until.elementLocated(By.css('[data-batch-id]')),5000);
    const hiddenSearchRequests=calls.slice(beforeRefresh).filter(url=>url.startsWith('/api/iad/samples/') || url.startsWith('/api/iad/sample/'));
    assert.deepEqual(hiddenSearchRequests,[],'非检索页不得读取隐藏检索页的样本列表和详情');
    assert.equal(await driver.findElement(By.css('[data-batch-id]')).getAttribute('data-batch-id'),batchLocation.batchId);
    const jobSummary=await driver.wait(until.elementLocated(By.css('[aria-label="作业概览"]')),5000);
    assert.match(await jobSummary.getText(),/作业总数[\s\S]*最近索引作业[\s\S]*最近一致性检查/);
    await fs.writeFile(path.join(output,'batch-jobs-1920.png'),await driver.takeScreenshot(),'base64');
    await click('标注冲突');
    await driver.wait(until.elementLocated(By.css('[aria-label="范围检查报告"]')),5000);
    await driver.wait(()=>driver.findElement(By.css('[aria-label="范围检查报告"]')).getText().then(text=>/已检查 2 \/ 2/.test(text)),5000);
    await driver.wait(until.elementLocated(By.css('[aria-label="冲突图像"] .iad-consistency-image-card[data-facts-state="CURRENT"]')),5000);
    assert.equal((await driver.findElements(By.css('dialog[aria-label="图组详情"]'))).length,0,'网格默认不展开详情');
    await driver.findElement(By.css('[aria-label="冲突图像"] .iad-consistency-image-card')).click();
    await driver.wait(()=>driver.executeScript('const images=[...document.querySelectorAll("dialog[aria-label=图组详情] .iad-image-frame img")];return images.length===2&&images.every(image=>image.complete&&image.naturalWidth>0)'),5000);
    await fs.writeFile(path.join(output,'scope-conflicts-1920.png'),await driver.takeScreenshot(),'base64');
    await click('关闭图组详情');
    execFileSync(bridge.pythonPath,['-c',`import json,sys
from pathlib import Path
from PIL import Image
r=Path(sys.argv[1])/'other';r.mkdir();image=Image.new('RGB',(960,640),'#b4c9b5')
for name,label in [('other-a','hole'),('other-b','dent')]:
 image.save(r/(name+'.png'));(r/(name+'.json')).write_text(json.dumps({'imageWidth':960,'imageHeight':640,'shapes':[{'label':label,'shape_type':'rectangle','points':[[40,40],[80,80]]}]}))
`,root]);
    const other=await bridge.execute('dataset_import',{format:'labelme',name:'第二个真实内容组',image_dir:path.join(root,'other'),annotation_dir:path.join(root,'other'),annotation_policy:{policy_id:'same-policy',annotation_role:'REFERENCE',annotation_coverage:'EXHAUSTIVE'}});
    await bridge.execute('consistency_compare',{sample_a:other.dataset_id+':other-a.png',sample_b:other.dataset_id+':other-b.png'});
    await click('刷新结果');
    await driver.wait(async()=>(await driver.findElements(By.css('[aria-label="冲突图像"] .iad-consistency-image-card'))).length===2,5000);
    await driver.findElement(By.xpath('//*[@aria-label="冲突图像"]//button[contains(.,"other-a.png")]')).click();
    await driver.wait(()=>driver.findElement(By.css('dialog[aria-label="图组详情"]')).getText().then(text=>text.includes('other-a.png')),5000);
    await click('关闭图组详情');
    await click('重复图组');
    await driver.wait(()=>driver.findElement(By.css('[aria-label="范围检查报告"]')).getText().then(text=>/严格同图\s+2 组.*4 成员/.test(text)),5000);
    await driver.wait(async()=>(await driver.findElements(By.css('[aria-label="重复图组"] .iad-consistency-image-card'))).length===2,5000);
    const groupCards=await driver.findElements(By.css('[aria-label="重复图组"] .iad-consistency-image-card'));
    const firstName=await groupCards[0].getText();await groupCards[0].click();
    await driver.wait(until.elementLocated(By.css('dialog[aria-label="图组详情"]')),5000);
    const firstTitle=await driver.findElement(By.css('.iad-group-header h2')).getText();
    await click('下一组');await driver.wait(()=>driver.findElement(By.css('.iad-group-header h2')).getText().then(text=>text!==firstTitle),5000);
    await click('关闭图组详情');
    await (firstName.includes('other-') ? groupCards[1] : groupCards[0]).click();
    await driver.wait(until.elementLocated(By.css('dialog[aria-label="图组详情"] .iad-consistency-canvases')),5000);
    await fs.writeFile(path.join(output,'scope-groups-1920.png'),await driver.takeScreenshot(),'base64');
    assert.equal((await driver.findElements(By.xpath('//button[normalize-space(.)="查看比较证据"]'))).length,0);
    await click('关闭图组详情');
    await click('索引与作业');
    await driver.wait(until.elementLocated(By.css('[aria-label="批次比较结果"] button')),5000).click();
    await driver.wait(until.elementLocated(By.css('[data-evidence-id]')),5000);
    const beforeReturn=calls.length;
    await click('返回批次');await driver.wait(until.elementLocated(By.css('[data-batch-id]')),5000);
    assert.equal(calls.slice(beforeReturn).filter(url=>url==='/api/iad/datasets'||url.startsWith('/api/iad/consistency/report')||url==='/api/iad/consistency/query').length,0,'返回保留已加载工作区，不重查整页');
    await driver.findElement(By.css('[aria-label="批次比较结果"] button')).click();
    await driver.wait(until.elementLocated(By.css('[data-evidence-id]')),5000);
    await fs.writeFile(path.join(output,'batch-evidence-1920.png'),await driver.takeScreenshot(),'base64');
    const reviewPanel=await driver.wait(until.elementLocated(By.css('[aria-label="一致性人工处置"]')),5000);
    await reviewPanel.findElement(By.css('[aria-label="处置差异 CATEGORY"]')).click();
    await reviewPanel.findElement(By.css('[aria-label="一致性处置说明"]')).sendKeys('已核对双方产品规范');
    const action=await reviewPanel.findElement(By.css('[aria-label="一致性处置动作"]'));
    await action.findElement(By.css('option[value="EXPECTED_POLICY_DIFFERENCE"]')).click();
    await reviewPanel.findElement(By.css('button.iad-primary')).click();
    await driver.wait(until.elementLocated(By.css('[aria-label="一致性人工处置"] [data-review-state="RESOLVED"]')),5000);
    await driver.navigate().refresh();
    await driver.wait(until.elementLocated(By.css('[aria-label="一致性人工处置"] [data-review-state="RESOLVED"]')),5000);
    await fs.writeFile(path.join(output,'review-policy-1920.png'),await driver.takeScreenshot(),'base64');
    const qualityPanel=await driver.findElement(By.css('[aria-label="一致性人工处置"]'));
    await qualityPanel.findElement(By.css('[aria-label="处置差异 CATEGORY"]')).click();
    await qualityPanel.findElement(By.css('[aria-label="一致性处置动作"] option[value="SET_EFFECTIVE_QUALITY"]')).click();
    for(const name of ['query.png','copy.png'])await qualityPanel.findElement(By.css(`[aria-label="质量裁决 ${name}"] option[value="FAIL"]`)).click();
    await qualityPanel.findElement(By.css('[aria-label="一致性处置说明"]')).sendKeys('两张明确目标均判异常，测试响应丢失恢复');
    const rawLabels=await Promise.all(['query.json','copy.json'].map(name=>fs.readFile(path.join(root,'labels',name))));
    loseReviewResponse=true;
    await qualityPanel.findElement(By.css('button.iad-primary')).click();
    await driver.wait(until.elementLocated(By.css('[aria-label="一致性人工处置"] [role="alert"]')),5000);
    const initialSubmission=reviewSubmissions.find(item=>item.action.kind==='SET_EFFECTIVE_QUALITY');
    assert.ok(initialSubmission,'真实HTTP请求必须到达人审入口');
    assert.deepEqual(initialSubmission.action.targets.map(item=>item.sample_id).sort(),['copy.png','query.png'].map(name=>dataset.dataset_id+':'+name).sort());
    await driver.navigate().refresh();
    const retryPanel=await driver.wait(until.elementLocated(By.css('[aria-label="一致性人工处置"]')),5000);
    await driver.wait(()=>retryPanel.getText().then(text=>text.includes('提交结果待确认')),5000);
    const pendingText=await retryPanel.getText();
    assert.match(pendingText,/query\.png · 异常/);assert.match(pendingText,/copy\.png · 异常/);
    assert.equal(await retryPanel.findElement(By.css('[aria-label="一致性处置动作"]')).isEnabled(),false);
    await driver.executeScript("arguments[0].scrollIntoView({block:'end'})",retryPanel);
    await fs.writeFile(path.join(output,'review-pending-reload-1920.png'),await driver.takeScreenshot(),'base64');
    await retryPanel.findElement(By.xpath('.//button[normalize-space(.)="重试同一处置"]')).click();
    await driver.wait(()=>retryPanel.getText().then(text=>text.includes('处置已提交')),5000);
    assert.deepEqual(reviewSubmissions.filter(item=>item.action.kind==='SET_EFFECTIVE_QUALITY'),[initialSubmission,initialSubmission]);
    for(const name of ['query.png','copy.png']){
      const detail=await driver.executeAsyncScript('const done=arguments[arguments.length-1];fetch(arguments[0]).then(r=>r.json()).then(done)',`/api/iad/sample/${encodeURIComponent(dataset.dataset_id+':'+name)}`);
      assert.equal(detail.review_history.length,1);assert.equal(detail.review_decision.decision,'FAIL');
      assert.equal(detail.sample.quality_status,'UNCERTAIN');
    }
    assert.deepEqual(await Promise.all(['query.json','copy.json'].map(name=>fs.readFile(path.join(root,'labels',name)))),rawLabels);
    await fs.writeFile(path.join(output,'review-retried-once-1920.png'),await driver.takeScreenshot(),'base64');
    await driver.navigate().refresh();
    await driver.wait(until.elementLocated(By.css('[aria-label="一致性人工处置"]')),5000);
    assert.ok(!(await driver.findElement(By.css('[aria-label="一致性人工处置"]')).getText()).includes('提交结果待确认'));
    await driver.findElement(By.xpath('//button[normalize-space(.)="重新比较当前来源"]')).click();
    await driver.wait(until.elementLocated(By.css('[aria-label="一致性人工处置"] [data-review-state="OPEN"]')),5000);
    const panel=await driver.findElement(By.css('[aria-label="一致性人工处置"]'));
    await panel.findElement(By.css('[aria-label="处置差异 CATEGORY"]')).click();
    await panel.findElement(By.css('[aria-label="一致性处置动作"] option[value="PROPOSE_REGION_CHANGE"]')).click();
    await panel.findElement(By.css('[aria-label="区域建议目标"]')).findElement(By.xpath('.//option[normalize-space(.)="query.png"]')).click();
    await panel.findElement(By.css('[aria-label="建议目标区域"] option:not([value=""])')).click();
    await panel.findElement(By.css('[aria-label="建议类别"]')).sendKeys('dent');
    await panel.findElement(By.css('[aria-label="一致性处置说明"]')).sendKeys('按原图核实类别');
    const rawQuery=await fs.readFile(path.join(root,'labels/query.json'));
    await panel.findElement(By.css('button.iad-primary')).click();
    await driver.wait(until.elementLocated(By.css('[aria-label="一致性人工处置"] [data-correction-state="PROPOSED"]')),5000);
    assert.deepEqual(await fs.readFile(path.join(root,'labels/query.json')),rawQuery);
    const fixed=JSON.parse(rawQuery);fixed.shapes[0].label='dent';await fs.writeFile(path.join(root,'labels/query.json'),JSON.stringify(fixed));
    await bridge.execute('dataset_scan',{dataset_id:dataset.dataset_id});
    await driver.findElement(By.css('[aria-label="一致性人工处置"] details summary')).click();
    await driver.findElement(By.xpath('//button[normalize-space(.)="验证重扫结果"]')).click();
    await driver.wait(until.elementLocated(By.css('[aria-label="一致性人工处置"] [data-correction-state="VERIFIED"]')),5000);
    await fs.writeFile(path.join(output,'review-correction-1920.png'),await driver.takeScreenshot(),'base64');
    await fs.writeFile(path.join(root,'labels/query.json'),rawQuery);await bridge.execute('dataset_scan',{dataset_id:dataset.dataset_id});
    await driver.findElement(By.xpath('//button[normalize-space(.)="返回批次"]')).sendKeys(Key.ENTER);
    await driver.wait(until.elementLocated(By.css('[data-batch-id]')),5000);
    assert.equal(await driver.findElement(By.css('[data-batch-id]')).getAttribute('data-batch-id'),batchLocation.batchId);
    await driver.get(`http://${host}:${server.address().port}/?${new URLSearchParams({iad:JSON.stringify(route)})}`);
    await driver.wait(until.elementLocated(By.css('[data-page="industrial-consistency"]')),5000);
    await click('查找同图');
    await driver.wait(until.elementLocated(By.css('[data-relation="EXACT"]')),10000);
    await driver.wait(until.elementLocated(By.css('[aria-label="候选图像网格"] img')),5000);
    await driver.wait(()=>driver.executeScript('return [...document.querySelectorAll("[aria-label=候选图像网格] img,[aria-label=候选图像详情] img")].every(image=>image.complete&&image.naturalWidth>0)'),5000);
    await fs.writeFile(path.join(output,'search-grid-1920.png'),await driver.takeScreenshot(),'base64');
    await driver.executeScript('document.documentElement.setAttribute("data-ds-dark-theme","")');
    await driver.wait(()=>driver.executeScript('const selected=document.querySelector("[aria-label=候选图像网格] button[aria-pressed=true]");return getComputedStyle(selected).backgroundColor.match(/\\d+/g).slice(0,3).map(Number).every(value=>value<110)'),3000);
    await fs.writeFile(path.join(output,'search-grid-dark-1920.png'),await driver.takeScreenshot(),'base64');
    await driver.executeScript('document.documentElement.removeAttribute("data-ds-dark-theme")');
    await driver.findElement(By.xpath('//*[@aria-label="候选图像详情"]//button[normalize-space(.)="查看原图对比"]')).click();
    assert.match(await driver.findElement(By.css('.iad-consistency-results')).getText(),/1.*组[\s\S]*1.*成员/);
    await driver.wait(until.elementLocated(By.css('[data-difference="CATEGORY"]')),5000).click();
    const differences=await driver.findElement(By.css('.iad-consistency-differences')).getText();
    assert.match(differences,/scratch/);assert.match(differences,/dent/);
    assert.equal(await driver.findElement(By.css('[data-stat="local-compared"]')).getText(),'1,600');
    const zoom=await driver.findElements(By.css('.iad-consistency-comparison button[aria-label="放大"]'));
    assert.equal(zoom.length,2);await zoom[0].click();
    await driver.wait(async()=>{const scales=await driver.findElements(By.css('.iad-consistency-comparison .iad-viewer-world'));return scales.length===2&&(await scales[0].getAttribute('data-scale'))===(await scales[1].getAttribute('data-scale'));},3000);
    for(let step=0;step<2;step++) {
      const before=Number(await driver.findElement(By.css('.iad-consistency-comparison .iad-viewer-world')).getAttribute('data-scale'));
      await driver.executeScript('document.querySelector(".iad-consistency-comparison .iad-viewer-viewport").dispatchEvent(new WheelEvent("wheel",{deltaY:120,bubbles:true,cancelable:true}))');
      await driver.wait(async()=>Number(await driver.findElement(By.css('.iad-consistency-comparison .iad-viewer-world')).getAttribute('data-scale'))<before,3000);
    }
    assert.ok(calls.includes('/api/iad/images/retrieve'));
    const location=await driver.executeScript('return JSON.parse(new URL(location.href).searchParams.get("iad"))');
    assert.equal(location.pageId,'industrial-consistency');assert.equal('datasetId' in location,false);assert.ok(location.differenceId);
    await driver.navigate().refresh();
    await driver.wait(until.elementLocated(By.css('[data-page="industrial-consistency"]')),5000);
    assert.equal(await driver.findElement(By.css('[role=tab][aria-selected=true]')).getText(),'图像检索');
    const overflow=await driver.executeScript('const e=document.querySelector(".iad-workbench");return e.scrollWidth-e.clientWidth');
    assert.ok(overflow<=1,`horizontal overflow ${overflow}`);
    await fs.mkdir(output,{recursive:true});
    await click('查找同图');await driver.wait(until.elementLocated(By.css('[data-relation="EXACT"]')),10000);
    await driver.findElement(By.xpath('//*[@aria-label="候选图像详情"]//button[normalize-space(.)="查看原图对比"]')).click();
    await driver.wait(()=>driver.executeScript('const images=[...document.querySelectorAll(".iad-consistency-comparison .iad-image-frame img")];return images.length===2&&images.every(image=>image.complete&&image.naturalWidth>0)'),5000);
    await fs.writeFile(path.join(output,'comparison-1920.png'),await driver.takeScreenshot(),'base64');
    await driver.findElement(By.css('input[aria-label="上传查询图像"]')).sendKeys(path.join(root,'images/query.png'));
    await driver.wait(()=>driver.findElement(By.css('.iad-consistency-query')).getText().then(text=>text.includes('临时查询')),5000);
    await click('查找同图');
    await driver.wait(async()=>{const results=await driver.findElements(By.css('.iad-consistency-results'));return results.length && /2 成员/.test(await results[0].getText());},10000);
    await driver.findElement(By.css('select[aria-label="查询图像"] option[value="'+dataset.dataset_id+':query.png"]')).click();
    await driver.wait(()=>calls.some(route=>route.startsWith('/api/iad/images/temporary/image_')),3000);
    await driver.get(`http://${host}:${server.address().port}/?${new URLSearchParams({iad:JSON.stringify({pageId:'industrial-images',datasetId:dataset.dataset_id,selected:dataset.dataset_id+':query.png',filters:{search:'query'}})})}`);
    await driver.wait(until.elementLocated(By.css('.iad-inspector')),5000);
    assert.equal((await driver.findElements(By.xpath('//aside[contains(@class,"iad-inspector")]//button[normalize-space(.)="查找同图" or normalize-space(.)="查看同图"]'))).length,0,'样本详情不添加同图检索入口');
    await fs.writeFile(path.join(output,'sample-details-1920.png'),await driver.takeScreenshot(),'base64');
    await driver.get(`http://${host}:${server.address().port}/?${new URLSearchParams({iad:JSON.stringify(route)})}`);
    await driver.wait(until.elementLocated(By.css('[data-page="industrial-consistency"]')),5000);
    await click('查找同图');
    await driver.wait(until.elementLocated(By.css('[aria-label="候选图像详情"]')),10000);
    await driver.findElement(By.xpath('//*[@aria-label="候选图像详情"]//button[normalize-space(.)="查看原图对比"]')).click();
    await driver.wait(until.elementLocated(By.css('[data-difference="CATEGORY"]')),5000);
    const saveButton=await driver.wait(until.elementLocated(By.xpath("//button[normalize-space(.)='保存比较证据']")),5000);
    await driver.wait(until.elementIsEnabled(saveButton),5000);await saveButton.click();
    await driver.wait(until.elementLocated(By.css('[data-evidence-id]')),10000);
    const frozenUrl=await driver.getCurrentUrl();
    await fs.rm(path.join(root,'images'),{recursive:true});await fs.rm(path.join(root,'labels'),{recursive:true});
    await driver.get(frozenUrl);
    await driver.wait(until.elementLocated(By.css('[data-difference="CATEGORY"]')),5000);
    await driver.wait(()=>driver.executeScript('const images=[...document.querySelectorAll(".iad-consistency-comparison .iad-image-frame img")];return images.length===2&&images.every(image=>image.complete&&image.naturalWidth>0)'),5000);
    assert.match(await driver.findElement(By.css('[data-evidence-id]')).getText(),/来源已移除/);
    assert.match(await driver.findElement(By.css('.iad-consistency-differences')).getText(),/scratch/);
    assert.match(await driver.findElement(By.css('.iad-consistency-differences')).getText(),/dent/);
    await driver.findElement(By.css('[data-difference="CATEGORY"]')).click();
    await driver.wait(()=>driver.executeScript('return [...document.querySelectorAll(".iad-consistency-side")].every(side=>{const image=side.querySelector("img"),region=side.querySelector(".iad-consistency-region rect"),viewport=side.querySelector(".iad-viewer-viewport");if(!image||image.naturalWidth!==1280||!region||!viewport)return false;const r=region.getBoundingClientRect(),v=viewport.getBoundingClientRect();return Math.abs((r.left+r.right-v.left-v.right)/2)<3 && Math.abs((r.top+r.bottom-v.top-v.bottom)/2)<3})'),5000);
    await fs.writeFile(path.join(output,'frozen-history-1920.png'),await driver.takeScreenshot(),'base64');
    await driver.get(`http://${host}:${server.address().port}/?${new URLSearchParams({iad:JSON.stringify({pageId:'industrial-knowledge',datasetId:dataset.dataset_id,knowledgeKind:'normal',tab:'setup'})})}`);
    await driver.wait(until.elementLocated(By.css('button[aria-label="通用方向"]')),5000);
    await click('添加方向');
    await driver.findElement(By.css('input[aria-label="新方向名称"]')).sendKeys('孔内背景');
    await driver.findElement(By.css('textarea[aria-label="新方向说明"]')).sendKeys('区分孔内遮挡与阴影。');
    await click('添加数据集方向');
    await driver.wait(until.elementLocated(By.css('input[aria-label="启用方向 孔内背景"]')),5000);
    await click('保存方向');
    await driver.wait(async()=>!(await driver.findElement(By.css('button[data-action="save-mining-directions"]')).isEnabled()),5000);
    await driver.navigate().refresh();
    await driver.wait(until.elementLocated(By.css('button[aria-label="自定义方向"]')),5000).click();
    assert.equal(await driver.findElement(By.css('input[aria-label="启用方向 孔内背景"]')).isSelected(),true);
  } catch(error){
    console.error(JSON.stringify(responses.slice(-20)));
    if(driver){console.error((await driver.findElement(By.css('body')).getText()).slice(-5000));await fs.writeFile('/tmp/iad-evidence-browser-failure.png',await driver.takeScreenshot(),'base64');}
    throw error;
  } finally {if(driver)await driver.quit();await new Promise(resolve=>server.close(resolve));bridge.destroy();await fs.rm(root,{recursive:true,force:true});}
});
