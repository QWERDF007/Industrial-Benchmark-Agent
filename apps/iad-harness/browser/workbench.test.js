import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { Builder, By, until } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";
import { PythonBridge, createIadHttpHandler } from "../lib/server/index.js";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.resolve(app, "../..");

test("browser: import Labelme, filter, select references, review and rename", { timeout: 120000 }, async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-browser-"));
  const bridge = new PythonBridge({ cwd: workspace, dbPath: path.join(root, "test.db") });
  execFileSync(bridge.pythonPath, ["-c", `
import json,sys
from pathlib import Path
from PIL import Image
root=Path(sys.argv[1])
(root/'images').mkdir(); (root/'labels').mkdir()
for name in ['normal','normal2','dent']:
    Image.new('RGB',(320,240),(0,0,200) if name=='normal' else (0,0,220) if name=='normal2' else 'blue').save(root/'images'/f'{name}.png')
(root/'labels'/'dent.json').write_text(json.dumps({'imageWidth':320,'imageHeight':240,'shapes':[{'label':'dent','shape_type':'rectangle','points':[[10,10],[30,30]]}]}))
`, root]);
  const bundle = await build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
      import {ModelAuditPage,HumanReviewPage} from './src/client/WorkbenchPage.tsx';
      function App(){const [mode,setMode]=React.useState('model');return <><nav id="test-navigation"><button onClick={()=>setMode('model')}>模型审计</button><button onClick={()=>setMode('review')}>人工复核</button></nav>{mode==='model'?<ModelAuditPage/>:<HumanReviewPage/>}</>}
      createRoot(document.getElementById('root')).render(<App/>);`, loader: "tsx", resolveDir: app },
    bundle: true, format: "iife", write: false, target: "es2022", define: { "process.env.NODE_ENV": '"production"' },
  });
  const previousEndpoint = process.env.LIVE_VLM_ENDPOINT;
  const modelRequests = [];
  let holdRegion = false, releaseRegion;
  const api = createIadHttpHandler(bridge);
  const server = http.createServer(async (req, res) => {
    if (req.url === "/") { res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end('<!doctype html><meta charset="utf-8"><style>html,body,#root{height:100%;margin:0}</style><div id="root"></div><script src="/browser.js"></script>'); }
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
      if (schema.title === "JointAnalysis") answer = {...view,global_view:view,
        region_observations:images.filter(image=>image.role==="roi"&&image.representation==="raw").map((_,index)=>({...view,region_index:index+1})),suggested_label:"FAIL",reason_category:"SCRATCH",confidence:0.8,
        evidence_ids:parts.filter(part=>part.type==="text"&&part.text.startsWith("视觉证据：")).map(part=>JSON.parse(part.text.slice(5)).evidence_id)};
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
    await driver.get(base);
    const element = css => driver.wait(until.elementLocated(By.css(css)), 15000);
    const button = async text => (await driver.findElement(By.xpath(`//button[normalize-space(.)='${text}']`))).click();
    const select = async (label, value) => {
      const el = await element(`select[aria-label='${label}']`);
      await driver.executeScript("arguments[0].value=arguments[1];arguments[0].dispatchEvent(new Event('change',{bubbles:true}));", el, value);
    };
    const gridCount = count => driver.wait(async () => await driver.executeScript("return document.querySelectorAll('.iad-grid .iad-sample').length===arguments[0] && !!document.querySelector('.iad-gallery') && !document.querySelector('.iad-gallery').textContent.includes('加载中');", count), 15000, `Expected ${count} grid images`);
    await (await element("#dataset-name")).sendKeys("浏览器验收");
    await (await element("input[aria-label='图像目录']")).sendKeys(path.join(root, "images"));
    await (await element("input[aria-label='标注目录']")).sendKeys(path.join(root, "labels"));
    await button("导入数据集");
    await driver.wait(async () => (await (await element("select[aria-label='当前数据集']")).getText()).includes("浏览器验收"), 15000);
    await button("图像样本"); await gridCount(3);
    const datasets = await (await fetch(base + "/api/iad/datasets")).json();
    const dataset = datasets.datasets[0];
    const samples = await (await fetch(`${base}/api/iad/samples/${dataset.task_id}?dataset_id=${dataset.dataset_id}`)).json();
    const normal = samples.items.find(sample => sample.relative_path === "normal.png");
    const normal2 = samples.items.find(sample => sample.relative_path === "normal2.png");
    const learned = await (await fetch(base + "/api/iad/knowledge/start", {method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({dataset_id:dataset.dataset_id,kind:"normal",sample_ids:[normal.sample_id,normal2.sample_id]})})).json();
    await driver.wait(async ()=>(await (await fetch(`${base}/api/iad/knowledge/status/${learned.run_id}`)).json()).status === "COMPLETED",15000);
    assert.equal((await driver.findElements(By.css(".iad-reference"))).length, 2);
    await (await element("summary[aria-label='标注筛选']")).click();
    await (await element("input[aria-label='无标注']")).click(); await gridCount(2);
    await (await element("input[aria-label='类别 dent']")).click(); await gridCount(3);
    await (await element("input[aria-label='无标注']")).click(); await gridCount(1);
    await (await element("summary[aria-label='标注筛选']")).click();
    await driver.wait(until.elementLocated(By.xpath("//button[.='设为良品参考']")), 15000);
    await button("设为良品参考");
    await driver.wait(until.elementLocated(By.css(".iad-reference")), 15000);
    await (await element("button[title='放大图像']")).click();
    await element("[role='dialog'] .iad-annotation-layer rect");
    const viewport = await element(".iad-viewer-viewport");
    await select("缩放", "2");
    assert.ok(await driver.executeScript(`const v=arguments[0].getBoundingClientRect(),i=document.querySelector('.iad-viewer-world').getBoundingClientRect();return Math.abs(v.x+v.width/2-i.x-i.width/2)<2&&Math.abs(v.y+v.height/2-i.y-i.height/2)<2`, viewport), "fixed zoom stays centered");
    const scale = await (await element(".iad-viewer-world")).getAttribute("data-scale");
    await driver.executeScript("arguments[0].dispatchEvent(new WheelEvent('wheel',{deltaY:-150,clientX:400,clientY:400,bubbles:true,cancelable:true}))", viewport);
    await driver.wait(async () => Number(await (await element(".iad-viewer-world")).getAttribute("data-scale")) > Number(scale), 3000);
    await (await element("button[title='隐藏标注']")).click();
    assert.equal((await driver.findElements(By.css("[role='dialog'] .iad-annotation-layer"))).length, 0);
    await (await element("button[title='显示标注']")).click();
    await element("[role='dialog'] .iad-annotation-layer rect");
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
    await element("[role='dialog'] .iad-viewer-viewport img"); await button("关闭");
    await button("图像样本");
    const dent = samples.items.find(sample => sample.relative_path === "dent.png");
    const updatedDataset = (await (await fetch(base + "/api/iad/datasets")).json()).datasets[0];
    assert.equal(updatedDataset.reference_sample_ids.length, 3);
    assert.ok(updatedDataset.reference_sample_ids.includes(dent.sample_id));
    await button("按知识审计此图");
    await driver.wait(async () => (await (await element(".iad-single-job")).getText()).includes("COMPLETED"),15000);
    await driver.wait(until.elementLocated(By.css(".iad-analysis summary")),15000);
    await (await element(".iad-analysis summary")).click();
    assert.ok((await (await element(".iad-analysis")).getText()).includes("可见蓝色表面"));
    const previews = await driver.findElements(By.css(".iad-evidence-preview"));
    assert.equal(previews.length,3);
    for (const preview of previews) {
      assert.ok((await preview.getText()).includes("结论引用"));
      await preview.click(); await element("[role='dialog'] img"); await button("关闭");
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
    await element("[role='dialog'] img");
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

    await fs.mkdir(path.join(workspace, "runs/browser"), { recursive: true });
    await fs.writeFile(path.join(workspace, "runs/browser/model-audit.png"), await driver.takeScreenshot(), "base64");
    await (await element("#test-navigation button:nth-child(2)")).click(); await gridCount(3);
    assert.equal(await (await element(".iad-inspector h2")).getText(), "复核明细");
    assert.equal((await driver.findElements(By.xpath("//button[.='按知识审计此图']"))).length, 0);
    await (await element("input[aria-label='按文件名搜索']")).sendKeys("dent"); await gridCount(1);
    await element(".iad-decision"); await button("良品"); await gridCount(0);
    const detail = await (await fetch(`${base}/api/iad/sample/${encodeURIComponent(dent.sample_id)}`)).json();
    assert.equal(detail.review_decision.decision, "PASS");
    assert.equal(detail.sample.quality_status, "UNCERTAIN");
    await select("人工复核", "reviewed"); await gridCount(1);
    await fs.writeFile(path.join(workspace, "runs/browser/human-review.png"), await driver.takeScreenshot(), "base64");
    await (await element("#test-navigation button:first-child")).click();
    await button("数据集管理");
    await (await element("input[aria-label='新的数据集名称']")).sendKeys("验收后改名"); await button("保存名称");
    await driver.wait(async () => (await (await element("select[aria-label='当前数据集']")).getText()).includes("验收后改名"), 15000);
    await driver.navigate().refresh(); await gridCount(3);
    const reloaded = await (await fetch(base + "/api/iad/datasets")).json();
    assert.equal(reloaded.datasets[0].name, "验收后改名");
    assert.equal(reloaded.datasets[0].dataset_id, dataset.dataset_id);
    assert.equal(reloaded.datasets[0].human_reviewed_count, 1);
  } catch (error) {
    if (driver) {
      await fs.mkdir(path.join(workspace, "runs/browser"), { recursive: true });
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
