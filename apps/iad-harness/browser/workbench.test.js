import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { Builder, By, Key, until } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";
import { PythonBridge, createIadHttpHandler } from "../lib/server/index.js";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.resolve(app, "../..");

test("browser: import Labelme, filter, select references, review and rename", { timeout: 120000 }, async () => {
  await fs.mkdir(path.join(workspace, "runs/browser"), { recursive: true });
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-browser-"));
  const bridge = new PythonBridge({ cwd: workspace, dbPath: path.join(root, "test.db") });
  execFileSync(bridge.pythonPath, ["-c", `
import json,sys
from pathlib import Path
from PIL import Image
root=Path(sys.argv[1])
(root/'images').mkdir(); (root/'labels').mkdir()
(root/'images-other').mkdir(); (root/'labels-other').mkdir()
Image.new('RGB',(320,240),'green').save(root/'images-other'/'other.png')
for name in ['normal','normal2','dent']:
    Image.new('RGB',(320,240),(0,0,200) if name=='normal' else (0,0,220) if name=='normal2' else 'blue').save(root/'images'/f'{name}.png')
(root/'labels'/'dent.json').write_text(json.dumps({'imageWidth':320,'imageHeight':240,'shapes':[{'label':'dent','shape_type':'rectangle','points':[[10,10],[30,30]]}]}))
`, root]);
  const bundle = await build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
      import {apply} from './src/client/index.ts';
      const entries=[], mains=new Map(), listeners=new Set(); let panel=null;
      const layout={panelInfo:{getSnapshot:()=>({activePanelId:panel}),subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}},
        selectPanel:id=>{panel=id;listeners.forEach(f=>f())},beginNavigation:()=>new AbortController().signal};
      apply({layout,slots:{inject:(_,f)=>f(),register:(options,component)=>{if(options.name==='main')mains.set(options.key,component);else entries.push({...options,component});}}});
      function App(){const [current,setCurrent]=React.useState(panel||entries[0].id);React.useEffect(()=>layout.panelInfo.subscribe(()=>setCurrent(panel)),[]);
        const Page=mains.get(current);return <><nav id="test-navigation">{entries.map(entry=><button key={entry.id} aria-label={entry.label} onClick={()=>layout.selectPanel(entry.id)}>{entry.label}</button>)}</nav>{Page&&<Page/>}</>}
      createRoot(document.getElementById('root')).render(<App/>);`, loader: "tsx", resolveDir: app },
    bundle: true, format: "iife", write: false, target: "es2022", define: { "process.env.NODE_ENV": '"production"' },
  });
  const previousEndpoint = process.env.LIVE_VLM_ENDPOINT;
  const modelRequests = [];
  let holdRegion = false, releaseRegion;
  const api = createIadHttpHandler(bridge);
  const server = http.createServer(async (req, res) => {
    if (new URL(req.url, "http://localhost").pathname === "/") { res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end('<!doctype html><meta charset="utf-8"><style>html,body,#root{height:100%;margin:0}</style><div id="root"></div><script src="/browser.js"></script>'); }
    else if (req.url === "/browser.js") { res.setHeader("Content-Type", "application/javascript"); res.end(bundle.outputFiles[0].contents); }
    else if (req.url === "/model/tokenize") {
      for await (const chunk of req) { /* Drain request before replying. */ }
      res.setHeader("Content-Type","application/json"); res.end(JSON.stringify({count:1000,max_model_len:262144}));
    }
    else if (req.url === "/model/v1/chat/completions") {
      let body = ""; for await (const chunk of req) body += chunk;
      const request = JSON.parse(body); modelRequests.push(request);
      const parts = request.messages[0].content;
      const schema = JSON.parse(parts[0].text.split("JSON Schema 的 JSON，不要 Markdown：\n")[1]);
      const images = parts.filter(part=>part.type==="text"&&part.text.startsWith("视觉证据：")).map(part=>JSON.parse(part.text.slice(5)));
      const view = {description:"可观察证据",position_analysis:"位置合理",illumination_analysis:"反光已核实"};
      let answer = view;
      if (schema.title === "KnowledgeDraft") answer = {summary:"可见蓝色表面",checks:[{title:"表面外观",subject:"主体",location:"全图",criterion:"可见蓝色表面",allowed_variations:["亮度变化"],support_evidence_ids:images.map(image=>image.evidence_id),counter_evidence_ids:[],limitations:[],status:"supported"}],suspects:[],limitations:[]};
      if (schema.title === "KnowledgeDraft" && parts[0].text.includes("冻结父版本候选：")) {
        const parent=JSON.parse(parts[0].text.split("冻结父版本候选：")[1].split("\n")[0]);
        answer.revisions=parent.checks.map(check=>({previous_check_id:check.check_id,current_check_titles:["表面外观"],reason:"本轮图像仍支持相同外观判据"}));
      }
      if (schema.title === "KnowledgeVerification") {
        const payload=JSON.parse(parts[0].text.split("待核验疑点：")[1].split("\n请根据图像")[0]);
        answer={findings:payload.findings.map(target=>({finding_id:target.finding_id,status:"insufficient",affected_check_titles:[],description:"当前图像不足以确认异常",normal_explanation:"仍需排除反光",limitations:["需要独立证据"],evidence_ids:[target.regions.find(region=>region.image.representation==="raw").image.evidence_id],conflicts:[]}))};
      }
      if (schema.title === "JointAnalysis") answer = {...view,global_view:view,
        check_assessments:JSON.parse(parts[0].text.split("冻结知识：")[1].split("\n")[0]).checks.map(check=>({...view,check_id:check.check_id,status:"anomaly",evidence_ids:[images[1].evidence_id]})),
        region_observations:images.filter(image=>image.role==="roi"&&image.representation==="raw").map((_,index)=>({...view,region_index:index+1})),suggested_label:"FAIL",reason_category:"SCRATCH",confidence:0.8,
        evidence_ids:parts.filter(part=>part.type==="text"&&part.text.startsWith("视觉证据：")).map(part=>JSON.parse(part.text.slice(5)).evidence_id)};
      if (schema.title === "JointAnalysis") answer.findings = ["high", "medium", "low", "high"].map((priority, index) => ({
        check_ids:answer.check_assessments.map(check=>check.check_id),
        location:{scope:index===2?"global":"local",bbox:index===2?null:[10,10,30,30],description:index===2?"整体关系":"左上角"},
        description:`待核实疑点 ${index+1}`, hypothesis:"可能污染", normal_explanation:"可能是反光",
        limitations:["缺少另一照明角度"], review_action:"核对原图与反光方向", priority, evidence_ids:[images[0].evidence_id,images[1].evidence_id],
      }));
      if (schema.title === "JointAnalysis" && holdRegion) await new Promise(resolve => { releaseRegion = resolve; });
      res.setHeader("Content-Type","application/json"); res.end(JSON.stringify({choices:[{message:{content:JSON.stringify(answer)}}]}));
    } else api(req, res);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  process.env.LIVE_VLM_ENDPOINT = base + "/model/v1";
  let driver;
  try {
    const options = new firefox.Options().addArguments("-headless");
    if (process.env.FIREFOX_PATH) options.setBinary(process.env.FIREFOX_PATH);
    driver = await new Builder().forBrowser("firefox").setFirefoxOptions(options)
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || "geckodriver")).build();
    await driver.manage().window().setRect({ width: 1440, height: 1100 });
    await driver.get(base + "?host=kept#host-anchor");
    const element = css => driver.wait(until.elementLocated(By.css(css)), 15000);
    const button = async text => { const control = await driver.findElement(By.xpath(`//button[normalize-space(.)='${text}']`)); await driver.wait(until.elementIsEnabled(control),15000); await control.click(); };
    const select = async (label, value) => {
      const el = await element(`select[aria-label='${label}']`);
      await driver.executeScript("arguments[0].value=arguments[1];arguments[0].dispatchEvent(new Event('change',{bubbles:true}));", el, value);
    };
    const gridCount = count => driver.wait(async () => await driver.executeScript("return document.querySelectorAll('.iad-grid .iad-sample').length===arguments[0] && !!document.querySelector('.iad-gallery') && !document.querySelector('.iad-gallery').textContent.includes('加载中');", count), 15000, `Expected ${count} grid images`);
    await element("#test-navigation button");
    assert.deepEqual(await driver.executeScript("return [...document.querySelectorAll('#test-navigation button')].map(b=>b.textContent)"),
      ["数据集管理", "图像浏览", "挖掘良品知识", "挖掘不良品知识", "模型审计", "人工复核"]);
    await button("添加数据集");
    await element("dialog[aria-label='导入 Labelme 数据集']");
    await (await element("#dataset-name")).sendKeys("浏览器验收");
    await (await element("input[aria-label='图像目录']")).sendKeys(path.join(root, "images"));
    await (await element("input[aria-label='标注目录']")).sendKeys(path.join(root, "labels"));
    await button("导入数据集");
    await driver.wait(async () => (await (await element("select[aria-label='当前数据集']")).getText()).includes("浏览器验收"), 15000);
    assert.equal((await driver.findElements(By.css("dialog[open]"))).length,0,"成功导入后返回管理列表");
    await element("button[aria-label='选择数据集 浏览器验收']");
    await button("图像浏览"); await gridCount(3);
    const datasets = await (await fetch(base + "/api/iad/datasets")).json();
    const dataset = datasets.datasets[0];
    const samples = await (await fetch(`${base}/api/iad/samples/${dataset.task_id}?dataset_id=${dataset.dataset_id}`)).json();
    const normal = samples.items.find(sample => sample.relative_path === "normal.png");
    const normal2 = samples.items.find(sample => sample.relative_path === "normal2.png");
    await button("数据集管理");
    await (await element(".iad-reference-manager summary")).click(); await gridCount(3);
    await (await element("img[alt='normal.png']")).click();
    await (await element("button[title='放大图像']")).click();
    await element(".iad-viewer-viewport");
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    assert.equal((await driver.findElements(By.css("dialog[open][aria-label='良品参考资格']"))).length,1,"Esc只关闭大图，不能连同来源详情一起关闭");
    assert.equal(await driver.executeScript("return document.activeElement.getAttribute('title')"),"放大图像","大图关闭应返回来源图像按钮焦点");
    await button("移出良品参考");
    await button("返回数据集管理");
    await driver.wait(async ()=>(await (await element(".iad-reference-manager summary")).getText()).includes("1 张"),5000);
    const curated = (await (await fetch(base+"/api/iad/datasets")).json()).datasets[0];
    assert.deepEqual(curated.reference_sample_ids,[normal2.sample_id]);
    assert.equal(curated.reference_mode,"selected");
    await button("恢复自动资格");
    await driver.wait(async ()=>(await (await element(".iad-reference-manager summary")).getText()).includes("2 张"),5000);
    await button("挖掘良品知识");
    await button("开始挖掘良品知识");
    await driver.wait(async ()=>(await (await element(".iad-knowledge-jobs")).getText()).includes("COMPLETED"),15000);
    const learned = (await (await fetch(`${base}/api/iad/knowledge/jobs?dataset_id=${dataset.dataset_id}`)).json()).jobs[0];
    await driver.wait(async ()=>(await (await element(".iad-knowledge-content")).getText()).includes("可见蓝色表面"),15000);
    const published = await (await fetch(`${base}/api/iad/knowledge?dataset_id=${dataset.dataset_id}&kind=normal`)).json();
    assert.equal(published.versions[0].version_id, published.knowledge.version_id);
    assert.ok((await (await element("select[aria-label='知识版本']")).getText()).includes(published.knowledge.version_id));
    await (await element(".iad-knowledge-evidence button")).click();
    await element(".iad-viewer-dialog img"); await button("关闭");
    await button("图像浏览"); await gridCount(3);
    assert.equal((await driver.findElements(By.css(".iad-reference"))).length, 2);
    await (await element("summary[aria-label='标注筛选']")).click();
    await (await element("input[aria-label='无标注']")).click(); await gridCount(2);
    await (await element("input[aria-label='类别 dent']")).click(); await gridCount(3);
    await (await element("input[aria-label='无标注']")).click(); await gridCount(1);
    await (await element("summary[aria-label='标注筛选']")).click();
    await button("挖掘良品知识");
    await element("[data-page='industrial-normal']");
    await button("图像浏览"); await gridCount(1);
    await driver.navigate().back(); await element("[data-page='industrial-normal']");
    await driver.navigate().forward(); await element("[data-page='industrial-images']"); await gridCount(1);
    await driver.navigate().refresh(); await gridCount(1);
    assert.equal(new URL(await driver.getCurrentUrl()).searchParams.get("host"), "kept");
    assert.equal(new URL(await driver.getCurrentUrl()).hash, "#host-anchor");
    assert.equal((await driver.findElements(By.css(".iad-inspector"))).length, 0, "浏览网格不常驻长详情");
    await (await element("img[alt='dent.png']")).click();
    await button("前往模型审计");
    await gridCount(3);
    await driver.wait(until.elementLocated(By.css(".iad-reference")), 15000);
    await (await element("button[title='放大图像']")).click();
    await element(".iad-viewer-dialog .iad-annotation-layer rect");
    const viewport = await element(".iad-viewer-viewport");
    await select("缩放", "2");
    assert.ok(await driver.executeScript(`const v=arguments[0].getBoundingClientRect(),i=document.querySelector('.iad-viewer-world').getBoundingClientRect();return Math.abs(v.x+v.width/2-i.x-i.width/2)<2&&Math.abs(v.y+v.height/2-i.y-i.height/2)<2`, viewport), "fixed zoom stays centered");
    const scale = await (await element(".iad-viewer-world")).getAttribute("data-scale");
    await driver.executeScript("arguments[0].dispatchEvent(new WheelEvent('wheel',{deltaY:-150,clientX:400,clientY:400,bubbles:true,cancelable:true}))", viewport);
    await driver.wait(async () => Number(await (await element(".iad-viewer-world")).getAttribute("data-scale")) > Number(scale), 3000);
    await (await element("button[title='隐藏标注']")).click();
    assert.equal((await driver.findElements(By.css(".iad-viewer-dialog .iad-annotation-layer"))).length, 0);
    await (await element("button[title='显示标注']")).click();
    await element(".iad-viewer-dialog .iad-annotation-layer rect");
    await select("缩放", "1.5");
    const beforeDrag = await (await element(".iad-viewer-world")).getRect();
    await driver.actions({ async: true }).move({ origin: viewport }).press().move({ origin: viewport, x: 60, y: 35 }).release().perform();
    const afterDrag = await (await element(".iad-viewer-world")).getRect();
    assert.ok(Math.abs(afterDrag.x - beforeDrag.x - 60) < 2 && Math.abs(afterDrag.y - beforeDrag.y - 35) < 2, "drag pans image");
    await button("关闭");
    assert.match(await (await element("[data-field='sample-uuid']")).getText(), /^[0-9a-f]{8}-[0-9a-f-]{27}$/);
    assert.equal(await (await element("[data-field='image-name']")).getText(), "dent.png");
    await button("模型审计作业");
    assert.equal((await driver.findElements(By.xpath("//label[contains(.,'最多审计图数') or contains(.,'每图 ROI 预算')]//input"))).length, 0);
    await driver.findElement(By.xpath("//button[.='审计当前筛选全部图像']"));
    await (await element(".iad-reference-grid button")).click();
    await element(".iad-viewer-dialog .iad-viewer-viewport img"); await button("关闭");
    await button("结果");
    const dent = samples.items.find(sample => sample.relative_path === "dent.png");
    const updatedDataset = (await (await fetch(base + "/api/iad/datasets")).json()).datasets[0];
    assert.equal(updatedDataset.reference_sample_ids.length, 2);
    await button("按知识审计此图");
    await driver.wait(async () => (await (await element(".iad-single-job")).getText()).includes("COMPLETED"),15000);
    assert.equal((await driver.findElements(By.css(".iad-findings li"))).length,3);
    await driver.executeScript("document.querySelector('.iad-findings').scrollIntoView({block:'start'});");
    await fs.writeFile(path.join(workspace, "runs/browser/audit-findings.png"), await driver.takeScreenshot(), "base64");
    await (await element(".iad-findings li button")).click();
    await element(".iad-viewer-dialog .iad-finding-layer rect");
    assert.equal(await (await element(".iad-finding-layer rect")).getAttribute("x"),"10");
    assert.equal(await (await element(".iad-finding-layer rect")).getAttribute("width"),"20");
    assert.match(await (await element(".iad-viewer-dialog img")).getAttribute("src"), /\/api\/iad\/evidence\//);
    await driver.wait(async()=>await driver.executeScript("const r=document.querySelector('.iad-finding-layer rect').getBoundingClientRect(),v=document.querySelector('.iad-viewer-viewport').getBoundingClientRect();return Math.abs((r.left+r.right-v.left-v.right)/2)<2&&Math.abs((r.top+r.bottom-v.top-v.bottom)/2)<2"),5000);
    assert.ok(await driver.executeScript("const r=document.querySelector('.iad-finding-layer rect'),w=document.querySelector('.iad-viewer-world');return parseFloat(getComputedStyle(r).strokeWidth)*new DOMMatrix(getComputedStyle(w).transform).a<=3"), "放大后定位描边仍应保持细线，避免遮挡缺陷");
    await fs.writeFile(path.join(workspace, "runs/browser/audit-finding-focus.png"), await driver.takeScreenshot(), "base64");
    await button("关闭");
    await button("查看其余 1 项");
    assert.equal((await driver.findElements(By.css(".iad-findings li"))).length,4);
    await driver.findElement(By.xpath("//section[contains(@class,'iad-findings')]//button[contains(.,'整体关系')]" )).click();
    await element(".iad-viewer-dialog img");
    assert.equal((await driver.findElements(By.css(".iad-finding-layer"))).length,0);
    await button("关闭");
    await (await element(".iad-rule-assessments summary")).click();
    assert.ok((await (await element(".iad-rule-assessments")).getText()).includes("表面外观"));
    assert.ok((await (await element(".iad-rule-assessments")).getText()).includes("发现偏离"));
    await (await element(".iad-rule-assessments button")).click();
    await driver.wait(async()=>await driver.executeScript("const image=document.querySelector('.iad-viewer-dialog img');return image&&image.naturalWidth===28&&image.naturalHeight===28"),5000);
    await button("关闭");
    await driver.executeScript("document.querySelector('.iad-rule-assessments').scrollIntoView({block:'center'});");
    await fs.writeFile(path.join(workspace, "runs/browser/rule-assessments.png"), await driver.takeScreenshot(), "base64");
    const processDetails = await driver.wait(until.elementLocated(By.xpath("//details[summary[normalize-space(.)='审计过程与知识版本']]")),15000);
    await processDetails.findElement(By.css("summary")).click();
    assert.ok((await processDetails.getText()).includes("可见蓝色表面"));
    const previews = await driver.findElements(By.css(".iad-evidence-preview"));
    assert.equal(previews.length,3);
    for (const preview of previews) {
      assert.ok((await preview.getText()).includes("结论引用"));
      await preview.click(); await element(".iad-viewer-dialog img"); await button("关闭");
    }
    const final = modelRequests.find(request=>request.messages[0].content[0].text.includes('"title": "JointAnalysis"'));
    assert.equal(final.messages[0].content.filter(part=>part.type==="image_url").length,3);
    const audited = await (await fetch(`${base}/api/iad/sample/${encodeURIComponent(dent.sample_id)}`)).json();
    holdRegion = true; await button("按知识审计此图");
    await driver.wait(()=>Boolean(releaseRegion),15000);
    await driver.wait(async () => (await (await element(".iad-single-job")).getText()).includes("全图与 ROI 联合分析"),5000);
    await button("取消审计"); releaseRegion(); holdRegion = false;
    await driver.wait(async ()=>(await (await element(".iad-single-job")).getText()).includes("CANCELLED"),15000);
    const cancelled = await (await fetch(`${base}/api/iad/sample/${encodeURIComponent(dent.sample_id)}`)).json();
    assert.equal(cancelled.suggestion.suggestion_id,audited.suggestion.suggestion_id);

    await (await element("summary[aria-label='标注筛选']")).click();
    await button("清空"); await gridCount(3);
    await (await element("summary[aria-label='标注筛选']")).click();
    await select("模型审计", "pending"); await gridCount(2);
    await driver.findElement(By.css("img[alt='normal.png']")).click();
    releaseRegion = null; holdRegion = true;
    const batch = await (await fetch(base + "/api/iad/audit/start", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_id: dataset.dataset_id, sample_ids: [normal.sample_id, normal2.sample_id] }) })).json();
    await driver.wait(() => Boolean(releaseRegion), 15000);
    await (await element("button[title='放大图像']")).click();
    const releaseFirst = releaseRegion; releaseRegion = null; releaseFirst();
    await driver.wait(() => Boolean(releaseRegion), 15000);
    await gridCount(1);
    await element(".iad-viewer-dialog img");
    const partial = await (await fetch(`${base}/api/iad/audit/status/${batch.run_id}`)).json();
    assert.equal(partial.status, "RUNNING"); assert.equal(partial.completed, 1);
    await button("关闭");
    assert.equal(await (await element("[data-field='image-name']")).getText(), "normal.png");
    await driver.wait(async () => (await (await element(".iad-kpis div:nth-child(2) strong")).getText()).startsWith("2"), 15000);
    await driver.wait(async () => (await (await element(".iad-inspector")).getText()).includes("可观察证据"), 15000);
    holdRegion = false; releaseRegion();
    await driver.wait(async () => (await (await fetch(`${base}/api/iad/audit/status/${batch.run_id}`)).json()).status === "COMPLETED", 15000);
    await select("模型审计", "all"); await gridCount(3);
    await driver.wait(async () => (await (await element(".iad-kpis div:nth-child(2) strong")).getText()).startsWith("3"), 15000);

    await fs.writeFile(path.join(workspace, "runs/browser/model-audit.png"), await driver.takeScreenshot(), "base64");
    await button("人工复核"); await gridCount(3);
    assert.equal(await (await element(".iad-inspector h2")).getText(), "复核明细");
    assert.equal((await driver.findElements(By.xpath("//button[.='按知识审计此图']"))).length, 0);
    await (await element("input[aria-label='按文件名搜索']")).sendKeys("dent"); await gridCount(1);
    await element(".iad-decision");
    await (await element(".iad-decision textarea")).sendKeys("已核实局部反光");
    await button("图像浏览"); await gridCount(1);
    await button("前往人工复核"); await gridCount(1);
    assert.equal(await (await element(".iad-decision textarea")).getAttribute("value"), "已核实局部反光");
    await driver.navigate().refresh(); await gridCount(1);
    assert.equal(await (await element(".iad-decision textarea")).getAttribute("value"), "已核实局部反光");
    assert.ok((await (await element(".iad-decision")).getText()).includes("草稿未提交"));
    await button("良品"); await gridCount(0);
    const detail = await (await fetch(`${base}/api/iad/sample/${encodeURIComponent(dent.sample_id)}`)).json();
    assert.equal(detail.review_decision.decision, "PASS");
    assert.equal(detail.sample.quality_status, "UNCERTAIN");
    await select("人工复核", "reviewed"); await gridCount(1);
    await fs.writeFile(path.join(workspace, "runs/browser/human-review.png"), await driver.takeScreenshot(), "base64");
    await button("模型审计");
    await button("报告");
    await driver.wait(async () => (await driver.findElement(By.css(".iad-workbench")).getText()).includes("人工核验覆盖率"), 15000);
    const ratioValue = label => driver.findElement(By.xpath(`//dt[normalize-space(.)='${label}']/following-sibling::dd[1]`)).getText();
    assert.equal(await ratioValue("技术可用率"), "100% · 3 / 3");
    assert.equal(await ratioValue("审计覆盖率"), "100% · 3 / 3");
    assert.equal(await ratioValue("人工核验覆盖率"), "33.33% · 1 / 3");
    await (await driver.findElement(By.xpath("//summary[normalize-space(.)='口径、范围与版本']"))).click();
    const scopeText = await driver.findElement(By.css(".iad-workbench")).getText();
    assert.ok(scopeText.includes(learned.knowledge_version_id || (await (await fetch(`${base}/api/iad/knowledge/status/${learned.run_id}`)).json()).knowledge_version_id));
    assert.ok(scopeText.includes("不受当前网格筛选影响"));
    assert.ok(scopeText.includes("不代表准确率"));
    await fs.writeFile(path.join(workspace, "runs/browser/quality-report.png"), await driver.takeScreenshot(), "base64");
    await button("数据集管理");
    await (await element("input[aria-label='新的数据集名称']")).sendKeys("验收后改名"); await button("保存名称");
    await driver.wait(async () => (await (await element("select[aria-label='当前数据集']")).getText()).includes("验收后改名"), 15000);
    await driver.navigate().refresh(); await element("button[aria-label='选择数据集 验收后改名']");
    const reloaded = await (await fetch(base + "/api/iad/datasets")).json();
    assert.equal(reloaded.datasets[0].name, "验收后改名");
    assert.equal(reloaded.datasets[0].dataset_id, dataset.dataset_id);
    assert.equal(reloaded.datasets[0].human_reviewed_count, 1);
    await button("添加数据集");
    await (await element("#dataset-name")).sendKeys("隔离数据集");
    await (await element("input[aria-label='图像目录']")).sendKeys(path.join(root,"images-other"));
    await (await element("input[aria-label='标注目录']")).sendKeys(path.join(root,"labels-other"));
    await button("导入数据集");
    await element("button[aria-label='选择数据集 隔离数据集']");
    assert.equal((await driver.findElements(By.css(".iad-dataset-list button"))).length,2);
    await button("图像浏览"); await gridCount(1);
    await element("img[alt='other.png']");
    assert.equal((await driver.findElements(By.css("img[alt='dent.png']"))).length,0);
    await button("数据集管理");
    await (await element("button[aria-label='选择数据集 验收后改名']")).click();
    await driver.wait(async () => await (await element("select[aria-label='当前数据集']")).getAttribute("value") === dataset.dataset_id,5000);
    await button("图像浏览"); await gridCount(1);
    await element("img[alt='dent.png']");
    assert.equal((await driver.findElements(By.css("img[alt='other.png']"))).length,0);
    await button("返回图像浏览");
    await button("数据集管理");
    await button("添加数据集"); await button("取消");
    assert.equal(await driver.executeScript("return document.activeElement.textContent"),"添加数据集","关闭导入弹窗应返回发起按钮焦点");
    await button("挖掘良品知识");
    await (await element("input[aria-label='知识挖掘模型']")).sendKeys("test-next");
    await button("开始挖掘良品知识");
    let nextNormal;
    await driver.wait(async()=>{const response=await (await fetch(`${base}/api/iad/knowledge?dataset_id=${dataset.dataset_id}&kind=normal`)).json();nextNormal=response.knowledge;return nextNormal?.version_id!==published.knowledge.version_id;},15000);
    await button("挖掘不良品知识");
    await select("依据良品知识版本",published.knowledge.version_id);
    await button("开始挖掘不良品知识");
    let defect;
    await driver.wait(async()=>{defect=(await (await fetch(`${base}/api/iad/knowledge?dataset_id=${dataset.dataset_id}&kind=defect`)).json()).knowledge;return !!defect;},15000);
    assert.equal(defect.normal_version_id,published.knowledge.version_id);
    await driver.wait(async()=>(await (await element("[data-field='knowledge-normal-version']")).getText()).includes(published.knowledge.version_id),15000);
    await select("依据良品知识版本",nextNormal.version_id);
    await driver.navigate().refresh();
    await driver.wait(async()=>await (await element("select[aria-label='依据良品知识版本']")).getAttribute("value")===nextNormal.version_id,10000);
    assert.ok((await (await element("[data-field='knowledge-normal-version']")).getText()).includes(published.knowledge.version_id),"下次执行的正常版本不能改写已发布不良知识的依赖展示");
    await button("标注核验");
    await driver.wait(async()=>(await (await element(".iad-knowledge-content")).getText()).includes("证据不足"),10000);
    const chrome=await driver.executeScript("return {width:outerWidth-innerWidth,height:outerHeight-innerHeight}");
    await driver.manage().window().setRect({width:375+chrome.width,height:812+chrome.height});
    await driver.setContext("chrome");
    await driver.executeScript("gBrowser.selectedBrowser.style.maxWidth='375px';gBrowser.selectedBrowser.style.width='375px';gBrowser.selectedBrowser.style.flex='none'");
    await driver.setContext("content");
    assert.equal(await driver.executeScript("return innerWidth"),375);
    assert.ok(await driver.executeScript("const e=document.querySelector('.iad-workbench');return e.scrollWidth<=e.clientWidth+1"),"带真实知识版本和核验记录的窄屏页面不能横向溢出");
    await fs.writeFile(path.join(workspace,"runs/browser/knowledge-versions-375.png"),await driver.takeScreenshot(),"base64");


  } catch (error) {
    if (driver) {
      await fs.writeFile(path.join(workspace, "runs/browser/failure.png"), await driver.takeScreenshot(), "base64");
      console.error(await driver.findElement(By.css("body")).getText());
    }
    throw error;
  } finally {
    if (releaseRegion) releaseRegion();
    if (previousEndpoint === undefined) delete process.env.LIVE_VLM_ENDPOINT;
    else process.env.LIVE_VLM_ENDPOINT = previousEndpoint;
    if (driver) await driver.quit();
    bridge.destroy(); await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});
