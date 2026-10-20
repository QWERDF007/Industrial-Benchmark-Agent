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
import base64,io,json,sys
from pathlib import Path
from PIL import Image
root=Path(sys.argv[1])
(root/'images').mkdir(); (root/'labels').mkdir()
(root/'images-other').mkdir(); (root/'labels-other').mkdir()
Image.new('RGB',(320,240),'green').save(root/'images-other'/'other.png')
Image.new('RGB',(320,240),'green').save(root/'images-other'/'reference.png')
mask=Image.new('L',(11,11),0)
for point in [(0,0),(2,3),(3,3),(10,10)]:mask.putpixel(point,255)
buffer=io.BytesIO();mask.save(buffer,'PNG')
(root/'labels-other'/'other.json').write_text(json.dumps({'imageWidth':320,'imageHeight':240,'shapes':[{'label':'稀疏Mask','shape_type':'mask','points':[[20,15],[30,25]],'mask':base64.b64encode(buffer.getvalue()).decode()}]}))
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
      apply({layout,slots:{inject:(_,f)=>f(),register:(options,component)=>{if(options.name==='main')mains.set(options.key,component);else if(options.name==='sidebar.panellist') entries.push({...options,component});}}});
      function App(){const [current,setCurrent]=React.useState(panel||entries[0].id);React.useEffect(()=>layout.panelInfo.subscribe(()=>setCurrent(panel)),[]);
        const Page=mains.get(current);return <><nav id="test-navigation">{entries.map(entry=><button key={entry.id} aria-label={entry.label} onClick={()=>layout.selectPanel(entry.id)}>{entry.label}</button>)}</nav>{Page&&<Page/>}</>}
      createRoot(document.getElementById('root')).render(<App/>);`, loader: "tsx", resolveDir: app },
    bundle: true, format: "iife", write: false, target: "es2022", define: { "process.env.NODE_ENV": '"production"' },
  });
  const previousEndpoint = process.env.LIVE_VLM_ENDPOINT;
  const modelRequests = [];
  let holdRegion = false, releaseRegion, proposeRegion = false;
  let failHeldRegion = false;
  let dropReviewResponse = false;
  const reviewRequests = [];
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
      if (schema.title === "JointAnalysis" && proposeRegion) answer.global_view = {...view,suspect_regions:[{bbox_1000:[31,41,125,167],reason:"补看边缘"}]};
      if (schema.title === "JointAnalysis") answer.findings = ["high", "medium", "low", "high"].map((priority, index) => ({
        check_ids:answer.check_assessments.map(check=>check.check_id),
        location:{scope:index===2?"global":"local",bbox:index===2?null:[10,10,30,30],description:index===2?"整体关系":"左上角"},
        description:`待核实疑点 ${index+1}`, hypothesis:"可能污染", normal_explanation:"可能是反光",
        limitations:["缺少另一照明角度"], review_action:"核对原图与反光方向", priority, evidence_ids:images.map(image=>image.evidence_id),
      }));
      if (schema.title === "JointAnalysis" && holdRegion) await new Promise(resolve => { releaseRegion = resolve; });
      if (schema.title === "JointAnalysis" && failHeldRegion) {
        failHeldRegion=false;res.writeHead(500,{"Content-Type":"application/json"});
        res.end(JSON.stringify({error:{message:"temporary model failure"}}));return;
      }
      res.setHeader("Content-Type","application/json"); res.end(JSON.stringify({choices:[{message:{content:JSON.stringify(answer)}}]}));
    } else {
      if(req.url==="/api/iad/review/submit") {
        let body="";req.on("data",chunk=>{body+=chunk;});req.on("end",()=>reviewRequests.push(JSON.parse(body)));
        if(dropReviewResponse) {
          dropReviewResponse=false;
          res.end=body=>{res.write(body.slice(0,Math.floor(body.length/2)),()=>req.socket.destroy());return res;};
        }
      }
      api(req, res);
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  process.env.LIVE_VLM_ENDPOINT = base + "/model/v1";
  let driver;
  try {
    const options = new firefox.Options().addArguments("-headless");
    if (process.env.FIREFOX_PATH) options.setBinary(process.env.FIREFOX_PATH);
    if (process.env.IAD_BROWSER_DPR) options.setPreference("layout.css.devPixelsPerPx",process.env.IAD_BROWSER_DPR);
    driver = await new Builder().forBrowser("firefox").setFirefoxOptions(options)
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || "geckodriver")).build();
    await driver.manage().window().setRect({ width: 1440, height: 1100 });
    await driver.get(base + "?host=kept#host-anchor");
    if (process.env.IAD_BROWSER_DPR) assert.equal(await driver.executeScript("return devicePixelRatio"),Number(process.env.IAD_BROWSER_DPR));
    const element = css => driver.wait(until.elementLocated(By.css(css)), 15000);
    const button = async text => { const control = await driver.findElement(By.xpath(`//button[normalize-space(.)='${text}']`)); await driver.wait(until.elementIsEnabled(control),15000); await control.click(); };
    const select = async (label, value) => {
      const el = await element(`select[aria-label='${label}']`);
      await driver.executeScript("arguments[0].value=arguments[1];arguments[0].dispatchEvent(new Event('change',{bubbles:true}));", el, value);
    };
    const selectedSample = name => driver.wait(until.elementLocated(By.xpath(`//dt[normalize-space(.)='图像名']/following-sibling::dd[1][normalize-space(.)='${name}']`)),5000);
    const viewportSize=async(width,height)=>{
      await driver.setContext("chrome");
      await driver.executeScript("gBrowser.selectedBrowser.style.maxWidth='';gBrowser.selectedBrowser.style.width='';gBrowser.selectedBrowser.style.flex=''");
      await driver.setContext("content");
      const chrome=await driver.executeScript("return {width:outerWidth-innerWidth,height:outerHeight-innerHeight}");
      await driver.manage().window().setRect({width:width+chrome.width,height:height+chrome.height});
      if(width<450){
        await driver.setContext("chrome");
        await driver.executeScript("gBrowser.selectedBrowser.style.maxWidth=arguments[0];gBrowser.selectedBrowser.style.width=arguments[0];gBrowser.selectedBrowser.style.flex='none'",`${width}px`);
        await driver.setContext("content");
      }
      assert.equal(await driver.executeScript("return innerWidth"),width);
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
    await driver.wait(async ()=>(await (await element(".iad-knowledge-jobs")).getText()).includes("已完成"),15000);
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
    const centerImagePoint=()=>driver.executeScript("const v=document.querySelector('.iad-viewer-viewport').getBoundingClientRect(),i=document.querySelector('.iad-viewer-world img'),r=i.getBoundingClientRect();return [(v.x+v.width/2-r.x)*i.naturalWidth/r.width,(v.y+v.height/2-r.y)*i.naturalHeight/r.height]");
    const expectCenter=async(expected,message)=>{
      const actual=await centerImagePoint();
      assert.ok(Math.abs(actual[0]-expected[0])<0.01&&Math.abs(actual[1]-expected[1])<0.01,`${message}: ${actual} ≈ ${expected}`);
    };
    await driver.actions().move({origin:viewport}).press().move({origin:viewport,x:50,y:25}).release().perform();
    const centerBeforeZoom=await centerImagePoint();
    assert.ok(Math.abs(centerBeforeZoom[0]-135)<1&&Math.abs(centerBeforeZoom[1]-107.5)<1,"在200%下拖动50×25像素，视口中心应指向原图135,107.5");
    await select("缩放","1.5");
    await expectCenter(centerBeforeZoom,"切换固定比例应保留视口中心的原图位置");
    await (await element("button[aria-label='放大']")).click();
    assert.equal(Number(await (await element(".iad-viewer-world")).getAttribute("data-scale")),3);
    await expectCenter(centerBeforeZoom,"放大按钮使用同一个视口中心锚点");
    await (await element("button[aria-label='缩小']")).click();
    assert.equal(Number(await (await element(".iad-viewer-world")).getAttribute("data-scale")),1.5);
    await expectCenter(centerBeforeZoom,"缩小按钮使用同一个视口中心锚点");
    await select("缩放","0");
    await expectCenter([160,120],"适应窗口显式恢复整图居中");
    await select("缩放","2");
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
    const savedCenter = await centerImagePoint();
    const savedScale = Number(await (await element(".iad-viewer-world")).getAttribute("data-scale"));
    await button("关闭");
    assert.equal(await driver.executeScript("return document.activeElement?.getAttribute('title')"), "放大图像", "关闭后焦点回到实际来源按钮");
    await (await element("button[title='放大图像']")).click();
    await driver.wait(async () => Number(await (await element(".iad-viewer-world")).getAttribute("data-scale")) > 0, 5000);
    assert.ok(Math.abs(Number(await (await element(".iad-viewer-world")).getAttribute("data-scale")) - savedScale) < 1e-9, "同图关闭重开保留缩放");
    await expectCenter(savedCenter, "同图关闭重开保留原图中心位置");
    const beforeImageNavigation = modelRequests.length;
    await button("后一张");
    await driver.wait(async () => (await (await element("[data-field='image-name']")).getText()) === "normal.png", 5000);
    await driver.wait(async () => (await (await element(".iad-lightbox-toolbar strong")).getText()) === "normal.png", 5000);
    assert.equal(await (await element("select[aria-label='缩放']")).getAttribute("value"), "0", "换图默认适应窗口");
    await expectCenter([160,120], "新图默认居中");
    await button("前一张");
    await driver.wait(async () => (await (await element(".iad-lightbox-toolbar strong")).getText()) === "dent.png", 5000);
    assert.equal(await (await element("select[aria-label='缩放']")).getAttribute("value"), "0", "换回上一图仍默认适应窗口");
    assert.equal(await (await driver.findElement(By.xpath("//button[normalize-space(.)='前一张']"))).isEnabled(), false, "当前筛选第一张不能再前移");
    assert.equal(modelRequests.length, beforeImageNavigation, "切图只读取现有结果，不调用模型");
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
    await driver.wait(async () => (await (await element(".iad-single-job")).getText()).includes("已完成"),15000);
    await driver.wait(async()=>(await driver.findElements(By.css(".iad-findings li"))).length===3,5000,"等待样本详情展示三项优先疑点");
    await driver.executeScript("document.querySelector('.iad-findings').scrollIntoView({block:'start'});");
    await fs.writeFile(path.join(workspace, "runs/browser/audit-findings.png"), await driver.takeScreenshot(), "base64");
    await (await element(".iad-findings li button")).click();
    await element(".iad-viewer-dialog .iad-finding-layer rect");
    assert.equal(await (await element(".iad-finding-layer rect")).getAttribute("x"),"10");
    assert.equal(await (await element(".iad-finding-layer rect")).getAttribute("width"),"20");
    assert.match(await (await element(".iad-viewer-dialog img")).getAttribute("src"), /\/api\/iad\/evidence\//);
    await driver.wait(async()=>await driver.executeScript("const r=document.querySelector('.iad-finding-layer rect').getBoundingClientRect(),v=document.querySelector('.iad-viewer-viewport').getBoundingClientRect();return Math.abs((r.left+r.right-v.left-v.right)/2)<2&&Math.abs((r.top+r.bottom-v.top-v.bottom)/2)<2"),5000);
    assert.equal(await driver.executeScript("return getComputedStyle(document.querySelector('.iad-finding-layer rect')).fill"),"none","定位框不能遮挡原图");
    const focusScreenshot=path.join(workspace,"runs/browser/audit-finding-focus.png");
    await fs.writeFile(focusScreenshot,await driver.takeScreenshot(),"base64");
    const edge=await driver.executeScript("const e=document.querySelector('.iad-finding-layer rect'),r=e.getBoundingClientRect();return [r.left,r.top+r.height/2,devicePixelRatio,getComputedStyle(e).stroke]");
    const strokePixels=Number(execFileSync(bridge.pythonPath,["-c",`from PIL import Image,ImageColor
import sys,json
x,y,dpr,color=json.loads(sys.argv[2]);x=round(x*dpr);y=round(y*dpr)
image=Image.open(sys.argv[1]).convert('RGB');stroke=ImageColor.getrgb(color)
print(sum(image.getpixel((i,y))==stroke for i in range(x-round(20*dpr),x+round(20*dpr)+1)))`,focusScreenshot,JSON.stringify(edge)],{encoding:"utf8"}));
    assert.ok(strokePixels>=1&&strokePixels<=4*edge[2],`放大后实际截图的定位描边应保持可辨且纤细，实际占 ${strokePixels} 像素`);
    await element(".iad-inspection-panel");
    assert.ok((await (await element(".iad-inspection-panel")).getText()).includes("综合建议"));
    await (await element("summary[aria-label='可视图层']")).click();
    await (await element("input[aria-label='模型候选图层']")).click();
    assert.equal((await driver.findElements(By.css(".iad-finding-layer"))).length,0,"关闭模型候选图层时疑点定位框也应隐藏");
    await (await element("input[aria-label='模型候选图层']")).click();
    await element(".iad-finding-layer");
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await (await element("button[aria-label='定位 ROI 1']")).click();
    await driver.wait(async()=>await driver.executeScript("const image=document.querySelector('.iad-inspection-region img');return image&&image.naturalWidth===28&&image.naturalHeight===28"),5000);
    await element(".iad-roi-layer [data-locked='true']");
    assert.ok((await (await element(".iad-inspection-region")).getText()).includes("光照"));
    assert.ok((await (await element(".iad-inspection-region")).getText()).includes("原图区域"));
    await (await element("summary[aria-label='可视图层']")).click();
    for(const label of ["标注图层","模型候选图层","细节覆盖图层"]) await element(`input[aria-label='${label}']`);
    await (await element("input[aria-label='细节覆盖图层']")).click();
    await (await element("input[aria-label='标注图层']")).click();
    assert.equal((await driver.findElements(By.css(".iad-roi-layer g"))).length,0,"隐藏标注图层后，关联的ROI轮廓也应隐藏");
    await (await element("input[aria-label='标注图层']")).click();
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    assert.equal(await (await element("summary[aria-label='可视图层']")).findElement(By.xpath("..")).getAttribute("open"),null,"首次Esc只关闭图层菜单");
    await element(".iad-roi-layer [data-locked='true']");
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    assert.equal((await driver.findElements(By.css(".iad-viewer-dialog[open]"))).length,1,"首次Esc解除锁定，保留查看器");
    assert.equal((await driver.findElements(By.css(".iad-roi-layer [data-locked='true']"))).length,0);
    const roiRect=await element(".iad-roi-layer rect");
    await driver.actions().move({origin:roiRect}).perform();
    await element(".iad-roi-layer .is-hovered");
    const roiHint=await element(".iad-viewer-viewport [role='tooltip']");
    assert.ok((await roiHint.getText()).includes("dent"));
    assert.ok((await roiHint.getText()).includes("Labelme"));
    assert.equal((await driver.findElements(By.css(".iad-roi-layer [data-locked='true']"))).length,0,"悬浮提示不应锁定区域");
    await fs.writeFile(path.join(workspace,"runs/browser/roi-hover.png"),await driver.takeScreenshot(),"base64");
    await driver.actions().move({origin:roiHint}).perform();
    assert.equal(await roiHint.isDisplayed(),true,"鼠标移到提示上仍可阅读");
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    assert.equal((await driver.findElements(By.css(".iad-viewer-viewport [role='tooltip']"))).length,0,"Esc只关闭悬浮提示");
    assert.equal((await driver.findElements(By.css(".iad-viewer-dialog[open]"))).length,1);
    await driver.actions().move({origin:await element("select[aria-label='缩放']")}).perform();
    await driver.actions().move({origin:roiRect}).perform();
    await element(".iad-viewer-viewport [role='tooltip']");
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.actions().move({origin:roiRect,x:1,y:1}).perform();
    assert.equal((await driver.findElements(By.css(".iad-viewer-viewport [role='tooltip']"))).length,0,"关闭后仍在同一区域内移动，不应立即重开提示");
    await driver.actions().move({origin:roiRect}).press().release().perform();
    await element(".iad-roi-layer [data-locked='true']");
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    const inspectionViewport=await element(".iad-viewer-viewport");
    await driver.actions().move({origin:inspectionViewport}).press().move({origin:inspectionViewport,x:50,y:25}).release().perform();
    assert.equal((await driver.findElements(By.css(".iad-roi-layer [data-locked='true']"))).length,0,"拖动画面不应误选ROI");
    const beforeKeyPan=await (await element(".iad-viewer-world")).getRect();
    await inspectionViewport.sendKeys(Key.ARROW_RIGHT);
    const afterKeyPan=await (await element(".iad-viewer-world")).getRect();
    assert.ok(Math.abs(afterKeyPan.x-beforeKeyPan.x+20)<2,"支持键盘平移代替拖拽");
    await viewportSize(375,812);
    await (await element("button[aria-label='定位 ROI 1']")).click();
    assert.ok(await driver.executeScript("const e=document.querySelector('.iad-viewer-dialog'),v=document.querySelector('.iad-viewer-viewport'),p=document.querySelector('.iad-inspection-panel');return e.scrollWidth<=e.clientWidth+1&&v.clientHeight>=160&&p.clientHeight>=160&&p.scrollWidth<=p.clientWidth+1"),"窄屏全图与ROI证据面板均可见且不能横向溢出");
    await fs.writeFile(path.join(workspace,"runs/browser/audit-roi-375.png"),await driver.takeScreenshot(),"base64");
    await viewportSize(1440,1100);

    await button("关闭");
    await button("查看其余 1 项");
    assert.equal((await driver.findElements(By.css(".iad-findings li"))).length,4);
    await driver.findElement(By.xpath("//section[contains(@class,'iad-findings')]//button[contains(.,'整体关系')]" )).click();
    await element(".iad-viewer-dialog img");
    const globalFinding=await element(".iad-inspection-finding");
    assert.ok((await globalFinding.getText()).includes("整体关系"));
    assert.ok((await globalFinding.getText()).includes("正常解释：可能是反光"));
    assert.ok((await globalFinding.getText()).includes("异常假设：可能污染"));
    assert.ok((await globalFinding.getText()).includes("缺少另一照明角度"));
    assert.equal((await driver.findElements(By.css(".iad-finding-layer"))).length,0);
    assert.equal((await driver.findElements(By.css(".iad-roi-layer [data-locked='true']"))).length,0,"全图关系疑点不能自动锁定某个局部框");
    const findingSelector=await element("select[aria-label='审计疑点']");
    const findingOptions=await findingSelector.findElements(By.css("option"));
    assert.equal(findingOptions.length,5,"查看器必须能选择全部四项疑点");
    const globalId=await findingSelector.getAttribute("value");
    await findingSelector.sendKeys(Key.HOME,Key.ARROW_DOWN,Key.ENTER);
    const localId=await findingSelector.getAttribute("value");
    assert.notEqual(localId,globalId);
    await driver.wait(async()=>await (await element(".iad-finding-layer")).getAttribute("data-finding-id")===localId,5000);
    assert.equal(await (await element(".iad-inspection-finding")).getAttribute("data-finding-id"),localId);
    assert.ok((await (await element(".iad-inspection-finding")).getText()).includes("局部疑点"));
    await select("审计疑点",globalId);
    assert.equal((await driver.findElements(By.css(".iad-finding-layer"))).length,0);
    await fs.writeFile(path.join(workspace,"runs/browser/global-finding.png"),await driver.takeScreenshot(),"base64");
    const roiEvidence=await element(".iad-inspection-finding .iad-actions button:nth-child(2)");
    assert.ok((await roiEvidence.getText()).includes("ROI"));
    const roiEvidenceId=await roiEvidence.getAttribute("data-evidence-id");
    await roiEvidence.click();
    await driver.wait(async()=>await driver.executeScript("const image=document.querySelector('.iad-inspection-region img');return image&&image.naturalWidth===28&&image.naturalHeight===28"),5000);
    assert.equal(await (await element(".iad-inspection-finding")).getAttribute("data-finding-id"),globalId,"查看ROI依据时不能丢失当前全图疑点");
    assert.equal(await (await element(".iad-inspection-region")).getAttribute("data-evidence-id"),roiEvidenceId);
    assert.equal(await (await element(".iad-roi-layer [data-locked='true']")).getAttribute("data-evidence-id"),roiEvidenceId);
    assert.equal((await driver.findElements(By.css(".iad-finding-layer"))).length,0,"实际ROI轮廓不能伪装成全图疑点框");
    assert.equal(await driver.executeScript("return document.querySelector('.iad-viewer-world img').naturalWidth"),320,"查看局部依据时仍保留全图");
    await (await element(".iad-inspection-finding .iad-actions button:nth-child(3)")).click();
    const maskEvidence=await element(".iad-inspection-mask img");
    assert.ok((await maskEvidence.getAttribute("src")).includes("/api/iad/evidence/"));
    await driver.wait(async()=>Number(await maskEvidence.getAttribute("naturalWidth"))===28,5000);
    assert.equal(await (await element(".iad-inspection-finding")).getAttribute("data-finding-id"),globalId);
    await (await element(".iad-inspection-finding .iad-actions button:first-child")).click();
    await element(".iad-inspection-overview");
    assert.equal((await driver.findElements(By.css(".iad-roi-layer [data-locked='true']"))).length,0);
    await (await element("button[aria-label='定位 ROI 1']")).click();
    const relatedFindings=await element(".iad-related-findings");
    assert.equal((await relatedFindings.findElements(By.css("button"))).length,4,"ROI必须能反向选择全部关联疑点");
    await (await relatedFindings.findElement(By.css(`button[data-finding-id='${globalId}']`))).click();
    assert.equal(await (await element(".iad-inspection-finding")).getAttribute("data-finding-id"),globalId);
    assert.equal((await driver.findElements(By.css(".iad-roi-layer [data-locked='true']"))).length,0);
    await viewportSize(375,812);
    await (await element(".iad-inspection-finding .iad-actions button:nth-child(2)")).click();
    assert.equal(await (await element(".iad-inspection-finding")).getAttribute("data-finding-id"),globalId);
    assert.ok(await driver.executeScript("const v=document.querySelector('.iad-viewer-viewport'),p=document.querySelector('.iad-inspection-panel');return v.clientHeight>=160&&p.clientHeight>=160&&p.scrollWidth<=p.clientWidth+1"),"375px的疑点、真实ROI和全图检视不能横向溢出");
    await driver.executeScript("document.querySelector('.iad-inspection-region img').scrollIntoView({block:'center'})");
    await fs.writeFile(path.join(workspace,"runs/browser/finding-roi-375.png"),await driver.takeScreenshot(),"base64");
    await viewportSize(1440,1100);
    await (await element("summary[aria-label='可视图层']")).click();
    assert.equal(await (await element("input[aria-label='细节覆盖图层']")).isSelected(),false,"跨图保留图层偏好");
    await (await element("input[aria-label='细节覆盖图层']")).click();
    await button("关闭");
    await (await element(".iad-rule-assessments summary")).click();
    assert.ok((await (await element(".iad-rule-assessments")).getText()).includes("表面外观"));
    assert.ok((await (await element(".iad-rule-assessments")).getText()).includes("发现偏离"));
    await (await element(".iad-rule-assessments button")).click();
    await driver.wait(async()=>await driver.executeScript("const image=document.querySelector('.iad-inspection-region img');return image&&image.naturalWidth===28&&image.naturalHeight===28"),5000);
    await select("缩放", "1.5");
    await (await element(".iad-viewer-viewport")).sendKeys(Key.ARROW_RIGHT);
    const savedRoiCenter = await centerImagePoint();
    const savedRoiScale = Number(await (await element(".iad-viewer-world")).getAttribute("data-scale"));
    const savedRoiId = await (await element(".iad-inspection-region")).getAttribute("data-evidence-id");
    await button("关闭");
    await (await element(".iad-rule-assessments button")).click();
    await element(".iad-inspection-region");
    assert.equal(await (await element(".iad-inspection-region")).getAttribute("data-evidence-id"), savedRoiId);
    assert.ok(Math.abs(Number(await (await element(".iad-viewer-world")).getAttribute("data-scale")) - savedRoiScale) < 1e-9);
    await expectCenter(savedRoiCenter, "同一ROI关闭重开保留原图中心");
    await button("关闭");
    await (await element("button[aria-label='数据集管理']")).click();
    await (await element("button[aria-label='模型审计']")).click();
    await (await element(".iad-rule-assessments summary")).click();
    await (await element(".iad-rule-assessments button")).click();
    await element(".iad-inspection-region");
    assert.equal(await (await element(".iad-inspection-region")).getAttribute("data-evidence-id"), savedRoiId);
    assert.ok(Math.abs(Number(await (await element(".iad-viewer-world")).getAttribute("data-scale")) - savedRoiScale) < 1e-9);
    await expectCenter(savedRoiCenter, "切换详情页再返回保留ROI与原图中心");
    await button("关闭");
    await (await element("button[title='放大图像']")).click();
    await element(".iad-inspection-region");
    assert.equal(await (await element(".iad-inspection-region")).getAttribute("data-evidence-id"), savedRoiId, "同一审计样本的原图与证据入口共享ROI锁定");
    await expectCenter(savedRoiCenter, "同一审计样本切换图像入口保留中心");
    await (await element("button[title='隐藏标注']")).click();
    await button("关闭");
    await (await element("button[title='放大图像']")).click();
    await element(".iad-inspection-region");
    assert.equal((await driver.findElements(By.css("button[title='显示标注']"))).length, 1, "恢复缓存ROI时保留用户隐藏标注的偏好");
    await (await element("button[title='显示标注']")).click();
    await button("关闭");
    await driver.executeScript("document.querySelector('.iad-rule-assessments').scrollIntoView({block:'center'});");
    await fs.writeFile(path.join(workspace, "runs/browser/rule-assessments.png"), await driver.takeScreenshot(), "base64");
    const processDetails = await driver.wait(until.elementLocated(By.xpath("//details[summary[normalize-space(.)='审计过程与知识版本']]")),15000);
    await processDetails.findElement(By.css("summary")).click();
    assert.ok((await processDetails.getText()).includes("可见蓝色表面"));
    const previews = await driver.findElements(By.css(".iad-evidence-preview"));
    assert.equal(previews.length,3);
    for (const [index,preview] of previews.entries()) {
      assert.ok((await preview.getText()).includes("结论引用"));
      const thumbnail=await preview.findElement(By.css("img"));
      await driver.wait(async()=>Number(await thumbnail.getAttribute("naturalWidth"))>0,5000);
      assert.deepEqual([Number(await thumbnail.getAttribute("naturalWidth")),Number(await thumbnail.getAttribute("naturalHeight"))],index===0?[320,240]:[28,28],"证据缩略图必须显示该实际全图或裁图");
      await preview.click(); await element(".iad-viewer-dialog img");
      if(index===1) await element(".iad-inspection-region");
      if(index===2) await element(".iad-inspection-mask");
      assert.equal(await driver.executeScript("return document.querySelector('.iad-viewer-world img').naturalWidth"),320,"每个审计证据入口均保留实际全图上下文");
      await button("关闭");
    }
    const final = modelRequests.find(request=>request.messages[0].content[0].text.includes('"title": "JointAnalysis"'));
    assert.equal(final.messages[0].content.filter(part=>part.type==="image_url").length,3);
    const audited = await (await fetch(`${base}/api/iad/sample/${encodeURIComponent(dent.sample_id)}`)).json();
    const questionReference={dataset_id:dataset.dataset_id,sample_id:dent.sample_id,
      suggestion_id:audited.suggestion.suggestion_id,finding_id:audited.suggestion.analysis.findings[0].finding_id,
      evidence_id:audited.suggestion.analysis.regions[0].image.evidence_id};
    const readContext=reference=>fetch(base+"/api/iad/inspection/context",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(reference)});
    const contextResponse=await readContext(questionReference);
    assert.equal(contextResponse.status,200,await contextResponse.clone().text());
    const frozenContext=await contextResponse.json();
    assert.equal(frozenContext.sample.relative_path,"dent.png");
    assert.equal(frozenContext.reference.suggestion_id,audited.suggestion.suggestion_id);
    assert.equal(frozenContext.analysis.normal_version_id,audited.suggestion.analysis.normal_version_id);
    assert.deepEqual(frozenContext.evidence.map(image=>image.evidence_id),[audited.suggestion.analysis.overview.evidence_id,...audited.suggestion.analysis.findings[0].evidence_ids.filter(id=>id!==audited.suggestion.analysis.overview.evidence_id)]);
    assert.equal((await readContext({...questionReference,sample_id:normal.sample_id})).status,422,"不同样本不能借用该建议");
    assert.equal((await readContext({...questionReference,evidence_id:"missing"})).status,404);
    assert.equal((await readContext({...questionReference,finding_id:"missing"})).status,404);
    holdRegion = true; await button("按知识审计此图");
    await driver.wait(()=>Boolean(releaseRegion),15000);
    await driver.wait(async () => (await (await element(".iad-single-job")).getText()).includes("全图与 ROI 联合分析"),5000);
    await button("取消审计");
    await driver.wait(async ()=>(await (await element(".iad-single-job")).getText()).includes("正在停止"),5000);
    const stopping=await driver.findElement(By.xpath("//section[contains(@class,'iad-single-job')]//button[contains(.,'正在停止')]"));
    assert.equal(await stopping.isEnabled(),false,"模型请求返回前不能重复取消或声称已停止");
    const pendingCancel=(await(await fetch(`${base}/api/iad/audit/jobs?dataset_id=${dataset.dataset_id}`)).json()).jobs[0];
    assert.equal(pendingCancel.status,"RUNNING");assert.equal(pendingCancel.cancel_requested,true);
    releaseRegion(); holdRegion = false;
    await driver.wait(async ()=>(await (await element(".iad-single-job")).getText()).includes("已取消"),15000);
    const cancelled = await (await fetch(`${base}/api/iad/sample/${encodeURIComponent(dent.sample_id)}`)).json();
    assert.equal(cancelled.suggestion.suggestion_id,audited.suggestion.suggestion_id);
    const parentCancelled=await(await fetch(`${base}/api/iad/audit/status/${pendingCancel.run_id}`)).json();
    await button("选择重试范围");
    const retryChoice=await element(".iad-single-job input[type='checkbox']");
    assert.equal(await retryChoice.isSelected(),true);
    assert.ok((await(await element(".iad-single-job")).getText()).includes("dent.png"));
    await fs.writeFile(path.join(workspace,"runs/browser/job-retry.png"),await driver.takeScreenshot(),"base64");
    await button("重试所选 1 张");
    await driver.wait(async()=>{
      const jobs=(await(await fetch(`${base}/api/iad/audit/jobs?dataset_id=${dataset.dataset_id}`)).json()).jobs;
      return jobs.some(job=>job.parent_run_id===parentCancelled.run_id&&job.status==="COMPLETED");
    },15000);
    assert.deepEqual(await(await fetch(`${base}/api/iad/audit/status/${parentCancelled.run_id}`)).json(),parentCancelled,"页面重试不能改写原作业");
    const historicalContext=await(await readContext(questionReference)).json();
    assert.equal(historicalContext.is_latest,false,"历史引用应明确提示已存在新建议");
    assert.deepEqual(historicalContext.analysis,frozenContext.analysis,"新建议不能改变追问中的冻结引用");
    assert.deepEqual(historicalContext.reference,frozenContext.reference);

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
    const firstCommitted=(await(await fetch(`${base}/api/iad/sample/${encodeURIComponent(normal.sample_id)}`)).json()).suggestion;
    failHeldRegion=true;holdRegion = false; releaseRegion();
    await driver.wait(async () => (await (await fetch(`${base}/api/iad/audit/status/${batch.run_id}`)).json()).status === "PARTIAL", 15000);
    await driver.wait(async()=>(await(await element(".iad-single-job")).getText()).includes("部分成功"),5000);
    await button("选择重试范围");
    await element(".iad-single-job input[type='checkbox']");
    const choices=await driver.findElements(By.css(".iad-single-job input[type='checkbox']"));
    assert.equal(choices.length,1,"已成功样本不能再次进入重试范围");
    assert.ok((await(await element(".iad-retry-scope")).getText()).includes("normal2.png"));
    const failedParent=await(await fetch(`${base}/api/iad/audit/status/${batch.run_id}`)).json();
    const retryScope=await(await fetch(`${base}/api/iad/audit/retry/${batch.run_id}`)).json();
    assert.equal(retryScope.selection_mode,"subset");
    assert.deepEqual(retryScope.samples.map(sample=>[sample.sample_id,sample.state]),[[normal2.sample_id,"failed"]]);
    await button("仅未处理");assert.equal(await choices[0].isSelected(),false);
    assert.equal(await driver.findElement(By.xpath("//button[normalize-space()='重试所选 0 张']")).isEnabled(),false);
    await button("仅失败");assert.equal(await choices[0].isSelected(),true);
    await viewportSize(375,812);
    await driver.executeScript("arguments[0].scrollIntoView({block:'center'})",await element(".iad-retry-scope"));
    assert.ok(await driver.executeScript("return document.documentElement.scrollWidth<=window.innerWidth+1"),"375px重试范围不能导致页面横向溢出");
    await fs.writeFile(path.join(workspace,"runs/browser/job-retry-375.png"),await driver.takeScreenshot(),"base64");
    await viewportSize(1440,1100);
    await button("重试所选 1 张");
    await driver.wait(async()=>{
      const jobs=(await(await fetch(`${base}/api/iad/audit/jobs?dataset_id=${dataset.dataset_id}`)).json()).jobs;
      return jobs.some(job=>job.parent_run_id===batch.run_id&&job.status==="COMPLETED");
    },15000);
    assert.deepEqual(await(await fetch(`${base}/api/iad/audit/status/${batch.run_id}`)).json(),failedParent);
    assert.deepEqual((await(await fetch(`${base}/api/iad/sample/${encodeURIComponent(normal.sample_id)}`)).json()).suggestion,firstCommitted,"重试失败图不能覆盖已成功图的建议");
    assert.deepEqual((await(await fetch(`${base}/api/iad/audit/retry/${batch.run_id}`)).json()).samples,[],"关联重试完成后不再提供已成功图像");
    await select("模型审计", "all"); await gridCount(3);
    await driver.wait(async () => (await (await element(".iad-kpis div:nth-child(2) strong")).getText()).startsWith("3"), 15000);

    await fs.writeFile(path.join(workspace, "runs/browser/model-audit.png"), await driver.takeScreenshot(), "base64");
    await driver.findElement(By.css("img[alt='normal.png']")).click();
    await (await element("button[title='放大图像']")).click();
    await (await element("summary[aria-label='可视图层']")).click();
    assert.equal((await driver.findElements(By.css(".iad-roi-layer g"))).length,1);
    await (await element("input[aria-label='细节覆盖图层']")).click();
    assert.equal((await driver.findElements(By.css(".iad-roi-layer g"))).length,0,"无标注图实际覆盖ROI受覆盖图层控制");
    await (await element("input[aria-label='细节覆盖图层']")).click();
    await button("关闭");
    await driver.findElement(By.css("img[alt='dent.png']")).click();
    const beforeExpanded = (await (await fetch(`${base}/api/iad/sample/${encodeURIComponent(dent.sample_id)}`)).json()).suggestion.suggestion_id;
    proposeRegion = true;
    await button("按知识审计此图");
    await driver.wait(async()=>{const result=await (await fetch(`${base}/api/iad/sample/${encodeURIComponent(dent.sample_id)}`)).json();return result.suggestion.suggestion_id!==beforeExpanded&&result.suggestion.analysis.regions.length===2;},15000);
    proposeRegion = false;
    await driver.wait(async()=>(await (await element(".iad-single-job")).getText()).includes("已完成"),15000);
    await driver.wait(()=>driver.executeScript("return [...document.querySelectorAll('.iad-analysis h3')].filter(heading=>heading.textContent.startsWith('局部 ·')).length===2"),5000,"等待样本详情展示两项真实ROI");
    await (await element("button[title='放大图像']")).click();
    await (await element("button[aria-label='定位 ROI 1']")).click();
    await driver.actions().move({origin:await element(".iad-roi-layer g:first-child rect")}).press().release().perform();
    const overlap = await element("[aria-label='重叠区域']");
    const overlapButtons = await overlap.findElements(By.css("button"));
    assert.equal(overlapButtons.length,2,"同一点覆盖标注与模型区域时应明确选择");
    await overlapButtons[1].click();
    assert.ok((await (await element(".iad-inspection-region")).getText()).includes("MLLM 候选"));
    await (await element("summary[aria-label='可视图层']")).click();
    await (await element("input[aria-label='标注图层']")).click();
    assert.equal((await driver.findElements(By.css(".iad-roi-layer g"))).length,1);
    await (await element("input[aria-label='模型候选图层']")).click();
    assert.equal((await driver.findElements(By.css(".iad-roi-layer g"))).length,0,"模型实际追加ROI受模型图层控制");
    await driver.actions().move({origin:await element(".iad-viewer-viewport")}).press().release().perform();
    assert.equal((await driver.findElements(By.css(".iad-inspection-region"))).length,0,"隐藏的ROI不参与指针命中");
    await (await element("input[aria-label='标注图层']")).click();
    await (await element("input[aria-label='模型候选图层']")).click();
    await button("关闭");
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
    dropReviewResponse=true;
    await button("良品");
    await element(".iad-decision [role='alert']");
    assert.equal(reviewRequests.length,1,"服务端真实提交后断开响应连接");
    assert.equal(await (await element(".iad-decision textarea")).getAttribute("value"),"已核实局部反光");
    await driver.navigate().refresh();await gridCount(0);
    assert.equal(await (await element(".iad-decision textarea")).getAttribute("value"),"已核实局部反光");
    await button("重试提交");
    await driver.wait(async()=>(await (await element(".iad-review-confirmation")).getText()).includes("dent.png · 良品"),5000);
    await driver.wait(async()=>(await driver.findElements(By.css(".iad-decision"))).length===0,5000);
    assert.equal(reviewRequests.length,2);
    assert.deepEqual(reviewRequests[1],reviewRequests[0],"刷新后必须重放同一份提交，包括标识和耗时");
    const detail = await (await fetch(`${base}/api/iad/sample/${encodeURIComponent(dent.sample_id)}`)).json();
    assert.equal(detail.review_decision.decision, "PASS");
    assert.equal(detail.review_history.length,1,"响应丢失后的重试不能新增人工裁决");
    assert.equal(detail.sample.quality_status, "UNCERTAIN");
    await select("人工复核", "reviewed"); await gridCount(1);
    await (await element(".iad-decision textarea")).sendKeys("更正：确认异常");
    await button("异常");
    await driver.wait(async()=>{const result=await (await fetch(`${base}/api/iad/sample/${encodeURIComponent(dent.sample_id)}`)).json();return result.review_history.length===2&&result.review_decision.decision==="FAIL";},5000);
    await (await element(".iad-review-history summary")).click();
    await driver.wait(async()=>(await driver.findElements(By.css(".iad-review-history li"))).length===2,5000);
    const reviewHistory=await (await element(".iad-review-history")).getText();
    assert.ok(reviewHistory.includes("更正：确认异常")&&reviewHistory.includes("已核实局部反光"));
    await button("复核记录");
    await driver.wait(async()=>(await driver.findElements(By.css(".iad-review-records tbody tr"))).length===2,5000);
    const recordsText=await (await element(".iad-review-records")).getText();
    assert.ok(recordsText.includes("更正：确认异常")&&recordsText.includes("已核实局部反光"));
    await (await element("input[aria-label='搜索复核记录']")).sendKeys("已核实局部反光");
    await driver.wait(async()=>(await driver.findElements(By.css(".iad-review-records tbody tr"))).length===1,5000);
    await driver.navigate().refresh();
    await driver.wait(async()=>(await driver.findElements(By.css(".iad-review-records tbody tr"))).length===1,5000);
    assert.equal(await (await element("input[aria-label='搜索复核记录']")).getAttribute("value"),"已核实局部反光");
    await (await element(".iad-review-records tbody button")).click();
    await driver.wait(async()=>(await (await element(".iad-review-history")).getText()).includes("复核记录 · 2 次"),5000);
    await driver.executeScript("arguments[0].scrollIntoView({block:'end'})",await element(".iad-review-history"));
    await fs.writeFile(path.join(workspace, "runs/browser/human-review.png"), await driver.takeScreenshot(), "base64");
    await viewportSize(375,812);
    assert.ok(await driver.executeScript("const e=document.querySelector('.iad-workbench');return e.scrollWidth<=e.clientWidth+1"),"复核记录窄屏不造成页面横向溢出");
    const recordsRegion=await element("[aria-label='复核历史表格']");
    await (await element("input[aria-label='搜索复核记录']")).click();
    await driver.actions().sendKeys(Key.TAB).perform();
    assert.ok(await driver.executeScript("return document.activeElement===arguments[0]",recordsRegion),"Tab按页面顺序进入历史表格");
    await driver.actions().sendKeys(Key.ARROW_RIGHT).perform();
    await driver.wait(async()=>await driver.executeScript("return arguments[0].scrollLeft>0",recordsRegion),5000,"键盘可查看表格右侧内容");
    await driver.executeScript("document.querySelector('.iad-workbench').scrollTop=0");
    await fs.writeFile(path.join(workspace,"runs/browser/review-records-375.png"),await driver.takeScreenshot(),"base64");
    await viewportSize(1440,1100);
    await button("模型审计");
    const readOnlyReview=await driver.wait(until.elementLocated(By.xpath("//dt[normalize-space(.)='人工结果']/following-sibling::dd[1]")),5000);
    assert.ok((await readOnlyReview.getText()).includes("异常"));
    assert.equal((await driver.findElements(By.css(".iad-decision"))).length,0);
    await button("前往人工复核");await element(".iad-decision");
    await selectedSample("dent.png");
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
    await button("图像浏览"); await gridCount(2);
    await element("img[alt='other.png']");
    assert.equal((await driver.findElements(By.css("img[alt='dent.png']"))).length,0);
    const otherDataset=(await (await fetch(base+"/api/iad/datasets")).json()).datasets.find(item=>item.name==="隔离数据集");
    const otherDetail=await (await fetch(`${base}/api/iad/sample/${encodeURIComponent(otherDataset.dataset_id+':other.png')}`)).json();
    const maskPath=otherDetail.annotations.find(item=>item.annotation_type==="mask").mask_path;
    await fs.rename(maskPath,maskPath+".missing");
    await fs.rename(otherDetail.sample.image_path,otherDetail.sample.image_path+".missing");
    await (await element("img[alt='other.png']")).click();
    await (await element("button[title='放大图像']")).click();
    const maskFailure=await element(".iad-viewer-dialog [role='alert']");
    assert.ok((await maskFailure.getText()).includes("标注像素无法加载"));
    assert.ok((await maskFailure.getText()).includes("图像无法加载"));
    await fs.writeFile(path.join(workspace,"runs/browser/missing-media.png"),await driver.takeScreenshot(),"base64");
    await select("缩放","2");
    const failedScale=await (await element(".iad-viewer-world")).getAttribute("data-scale");
    const failedViewport=await (await element(".iad-viewer-viewport")).getRect();
    await fs.rename(maskPath+".missing",maskPath);
    await (await element(".iad-viewer-dialog button[aria-label='重新加载图像']")).click();
    await driver.wait(async()=>(await (await element(".iad-viewer-dialog [role='alert']")).getText()).includes("图像无法加载")&&!(await (await element(".iad-viewer-dialog [role='alert']")).getText()).includes("标注像素无法加载"),5000);
    await fs.rename(otherDetail.sample.image_path+".missing",otherDetail.sample.image_path);
    await (await element(".iad-viewer-dialog button[aria-label='重新加载图像']")).click();
    await driver.wait(async()=>(await driver.findElements(By.css(".iad-viewer-dialog [role='alert']"))).length===0,5000);
    assert.equal(await driver.executeScript("return document.querySelector('.iad-viewer-world img').naturalWidth"),320);
    assert.equal(await (await element(".iad-viewer-world")).getAttribute("data-scale"),failedScale,"重新加载不能改变当前缩放");
    assert.deepEqual(await (await element(".iad-viewer-viewport")).getRect(),failedViewport,"失败提示不能挤压视口或在消失时移动图像");
    await element(".iad-viewer-dialog .iad-annotation-mask image");
    await select("缩放","2");
    const maskScreenshot=path.join(workspace,"runs/browser/labelme-mask.png");
    const readMaskPixels=async()=>{
      const geometry=await driver.executeScript("const r=document.querySelector('.iad-viewer-world').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,dpr:devicePixelRatio}");
      await fs.writeFile(maskScreenshot,await driver.takeScreenshot(),"base64");
      return JSON.parse(execFileSync(bridge.pythonPath,["-c",`from PIL import Image
import sys,json
r=json.loads(sys.argv[2]);image=Image.open(sys.argv[1]).convert('RGB')
def pixel(x,y):return image.getpixel((round((r['x']+x*r['width']/320)*r['dpr']),round((r['y']+y*r['height']/240)*r['dpr'])))
print(json.dumps({'foreground':pixel(22.5,18.5),'hole':pixel(25.5,20.5),'outside':pixel(19.5,15.5),'bbox_edge':pixel(20.5,20.5)}))`,maskScreenshot,JSON.stringify(geometry)],{encoding:"utf8"}));
    };
    let shownMask;
    await driver.wait(async()=>{shownMask=await readMaskPixels();return shownMask.foreground.some((value,index)=>value!==[0,128,0][index]);},5000,"真实Mask前景应在原图对应像素可见");
    assert.deepEqual(shownMask.hole,[0,128,0],"Mask孔洞必须透出原图");
    assert.deepEqual(shownMask.outside,[0,128,0]);
    assert.deepEqual(shownMask.bbox_edge,[0,128,0],"不能用bbox替代Mask形状");
    assert.ok(shownMask.foreground[1]>70,"叠加仍保留原始图像内容");
    await fs.copyFile(maskScreenshot,path.join(workspace,"runs/browser/labelme-mask-visible.png"));
    await (await element("button[title='隐藏标注']")).click();
    assert.equal((await driver.findElements(By.css(".iad-viewer-dialog .iad-annotation-mask"))).length,0);
    assert.deepEqual((await readMaskPixels()).foreground,[0,128,0]);
    await (await element("button[title='显示标注']")).click();
    await element(".iad-viewer-dialog .iad-annotation-mask image");
    await button("关闭");await button("返回图像浏览");
    await button("挖掘良品知识");
    await button("开始挖掘良品知识");
    await driver.wait(async()=>(await (await element(".iad-knowledge-jobs")).getText()).includes("已完成"),15000);
    await button("模型审计");await gridCount(2);
    await (await element("img[alt='other.png']")).click();
    holdRegion=true;releaseRegion=null;
    await button("按知识审计此图");
    await driver.wait(()=>Boolean(releaseRegion),15000);
    const pendingRoi=modelRequests.at(-1).messages[0].content.filter(part=>part.type==="text"&&part.text.startsWith("视觉证据：")).map(part=>JSON.parse(part.text.slice(5))).find(image=>image.role==="roi"&&image.representation==="raw");
    const roiPath=path.join(root,"cache","visual-evidence",pendingRoi.sha256+".png");
    await fs.rename(roiPath,roiPath+".missing");
    holdRegion=false;releaseRegion();
    await driver.wait(async()=>(await (await element(".iad-single-job")).getText()).includes("已完成"),15000);
    const maskDataset=await (await element("select[aria-label='当前数据集']")).getAttribute("value");
    const maskAudit=await (await fetch(`${base}/api/iad/sample/${encodeURIComponent(maskDataset+':other.png')}`)).json();
    await (await element(".iad-findings li button")).click();
    await select("缩放","2");
    const frozenMask=await element(".iad-viewer-dialog .iad-annotation-mask image");
    assert.ok((await frozenMask.getAttribute("href")).includes(`/api/iad/evidence/${maskAudit.suggestion.suggestion_id}/`),"历史审计标注必须来自该建议冻结的送模证据");
    let frozenPixels;
    await driver.wait(async()=>{frozenPixels=await readMaskPixels();return frozenPixels.foreground.some((value,index)=>value!==[0,128,0][index]);},5000);
    assert.deepEqual(frozenPixels.hole,[0,128,0]);
    assert.deepEqual(frozenPixels.outside,[0,128,0]);
    await fs.copyFile(maskScreenshot,path.join(workspace,"runs/browser/labelme-mask-frozen.png"));
    await (await element("button[aria-label='定位 ROI 1']")).click();
    assert.ok((await (await element(".iad-inspection-region [role='alert']")).getText()).includes("ROI 裁图无法加载"));
    const lockedEvidence=await (await element(".iad-inspection-region")).getAttribute("data-evidence-id");
    const lockedView=await (await element(".iad-viewer-world")).getAttribute("style");
    await fs.rename(roiPath+".missing",roiPath);
    await (await element(".iad-inspection-region button[aria-label='重新加载图像']")).click();
    await driver.wait(async()=>(await driver.findElements(By.css(".iad-inspection-region [role='alert']"))).length===0,5000);
    assert.deepEqual(await driver.executeScript("const image=document.querySelector('.iad-inspection-region img');return [image.naturalWidth,image.naturalHeight]"),[15,15]);
    assert.equal(await (await element(".iad-inspection-region")).getAttribute("data-evidence-id"),lockedEvidence);
    assert.equal(await (await element(".iad-viewer-world")).getAttribute("style"),lockedView,"ROI重试必须保留锁定与图像视口");
    const inspectionMask=maskAudit.suggestion.analysis.auxiliary_evidence.find(image=>image.representation==="annotation_mask");
    const maskContextResponse=await readContext({dataset_id:maskDataset,sample_id:maskAudit.sample.sample_id,suggestion_id:maskAudit.suggestion.suggestion_id,evidence_id:inspectionMask.evidence_id});
    assert.equal(maskContextResponse.status,200,await maskContextResponse.clone().text());
    const maskContext=await maskContextResponse.json();
    const pairedRaw=maskAudit.suggestion.analysis.regions.find(region=>JSON.stringify(region.image.crop_bbox)===JSON.stringify(inspectionMask.crop_bbox)).image;
    assert.deepEqual(maskContext.evidence.map(image=>image.evidence_id),[maskAudit.suggestion.analysis.overview.evidence_id,inspectionMask.evidence_id,pairedRaw.evidence_id],"Mask追问必须携带实际配对原图，不能将定位图单独作为缺陷证据");
    await button("关闭");
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
    await viewportSize(375,812);
    assert.ok(await driver.executeScript("const e=document.querySelector('.iad-workbench');return e.scrollWidth<=e.clientWidth+1"),"带真实知识版本和核验记录的窄屏页面不能横向溢出");
    await fs.writeFile(path.join(workspace,"runs/browser/knowledge-versions-375.png"),await driver.takeScreenshot(),"base64");

    await viewportSize(1440,1100);
    await button("模型审计"); await button("模型审计作业");
    async function selectAuditKnowledge(kind, version) {
      const query = `select[aria-label='审计${kind}知识版本']`;
      const control = await element(query); await driver.wait(() => control.isEnabled(), 5000);
      await (await element(`${query} option[value='${version}']`)).click();
    }
    await selectAuditKnowledge("良品", published.knowledge.version_id);
    await selectAuditKnowledge("不良品", defect.version_id);
    const beforeVersionAudit = await (await fetch(`${base}/api/iad/sample/${encodeURIComponent(dent.sample_id)}`)).json();
    async function auditSelectedVersion(model) {
      const input = await element("input[aria-label='模型名称']"); await input.clear(); await input.sendKeys(model);
      const start = await driver.findElement(By.xpath("//button[normalize-space(.)='审计当前筛选全部图像']"));
      await driver.wait(() => start.isEnabled(), 5000); await start.click();
      let job;
      await driver.wait(async () => {
        const result = await (await fetch(`${base}/api/iad/audit/jobs?dataset_id=${dataset.dataset_id}`)).json();
        job = result.jobs.find(item => item.model_name === model);
        if (job) assert.ok(!["FAILED", "PARTIAL"].includes(job.status), JSON.stringify(job.errors));
        return job?.status === "COMPLETED";
      }, 15000);
      return job;
    }
    const oldVersionAudit = await auditSelectedVersion("test-old-knowledge");
    assert.equal(oldVersionAudit.normal_version_id, published.knowledge.version_id);
    assert.equal(oldVersionAudit.defect_version_id, defect.version_id);
    await viewportSize(375, 812);
    await fs.writeFile(path.join(workspace, "runs/browser/audit-version-selectors-375.png"), await driver.takeScreenshot(), "base64");
    assert.ok(await driver.executeScript("const element=document.querySelector('.iad-workbench');return element.scrollWidth<=element.clientWidth+1"), "长版本号的审计知识选择在375px不应造成横向滚动");
    await viewportSize(1440, 1100);
    await selectAuditKnowledge("良品", nextNormal.version_id);
    await driver.wait(async () => (await (await element(".iad-job-panel")).getText()).includes("暂无匹配的不良知识"), 5000);
    assert.equal((await driver.findElements(By.css("select[aria-label='审计不良品知识版本'] option[value='" + defect.version_id + "']"))).length, 0, "另一良品版本的不良知识不可混用");
    await driver.navigate().refresh();
    await driver.wait(async () => await (await element("select[aria-label='审计良品知识版本']")).getAttribute("value") === nextNormal.version_id, 5000, "刷新保留待审计知识选择");
    const newVersionAudit = await auditSelectedVersion("test-new-knowledge");
    assert.equal(newVersionAudit.normal_version_id, nextNormal.version_id);
    assert.equal(newVersionAudit.defect_version_id, null);
    const afterVersionAudit = await (await fetch(`${base}/api/iad/sample/${encodeURIComponent(dent.sample_id)}`)).json();
    assert.deepEqual(afterVersionAudit.review_history, beforeVersionAudit.review_history);
    assert.equal(afterVersionAudit.sample.quality_status, beforeVersionAudit.sample.quality_status);
    const historicalVersionContext = await (await readContext({ dataset_id: dataset.dataset_id, sample_id: dent.sample_id, suggestion_id: beforeVersionAudit.suggestion.suggestion_id })).json();
    assert.equal(historicalVersionContext.is_latest, false);
    assert.deepEqual(historicalVersionContext.analysis, beforeVersionAudit.suggestion.analysis, "重审保留历史建议的冻结分析");
    await button("人工复核");await select("当前数据集",dataset.dataset_id);
    await button("复核队列");await gridCount(1);
    await select("人工复核","pending");
    await (await element("input[aria-label='按文件名搜索']")).clear();await gridCount(2);
    await (await element(".iad-grid img[alt='normal.png']")).click();
    await selectedSample("normal.png");
    await (await element(".iad-decision textarea")).sendKeys("第一张的草稿");
    await (await element(".iad-grid img[alt='normal2.png']")).click();
    await selectedSample("normal2.png");
    assert.equal(await (await element(".iad-decision textarea")).getAttribute("value"),"");
    await (await element(".iad-decision textarea")).sendKeys("第二张的草稿");
    await (await element(".iad-grid img[alt='normal.png']")).click();
    await selectedSample("normal.png");
    assert.equal(await (await element(".iad-decision textarea")).getAttribute("value"),"第一张的草稿");
    await button("良品");await gridCount(1);
    await selectedSample("normal2.png");
    assert.equal(await (await element(".iad-decision textarea")).getAttribute("value"),"第二张的草稿","确认保存后推进下一张且恢复该图草稿");
    await button("不确定");await gridCount(0);
    assert.equal((await driver.findElements(By.css(".iad-decision"))).length,0);
    const confirmed=await (await element(".iad-review-confirmation")).getText();
    assert.ok(confirmed.includes("normal2.png")&&confirmed.includes("不确定"));
    const reviewedAll=await (await fetch(`${base}/api/iad/report/${dataset.task_id}?dataset_id=${dataset.dataset_id}`)).json();
    assert.equal(reviewedAll.human_reviewed_count,3);
    assert.equal(reviewedAll.quality.human_verification_coverage.numerator,2,"人工不确定不能算成已核验真值");

    for(let index=0;index<31;index++) {
      const response=await fetch(base+"/api/iad/knowledge/start",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({dataset_id:dataset.dataset_id,kind:"normal",model_name:"test-next"})});
      assert.equal(response.status,200,await response.clone().text());const created=await response.json();
      await driver.wait(async()=>{
        const current=await(await fetch(`${base}/api/iad/knowledge/status/${created.run_id}`)).json();
        assert.ok(!["FAILED","PARTIAL"].includes(current.status),JSON.stringify(current.errors));
        return current.status==="COMPLETED";
      },5000);
    }
    const recent=(await(await fetch(`${base}/api/iad/knowledge/jobs?dataset_id=${dataset.dataset_id}`)).json()).jobs;
    assert.equal(recent.length,30);assert.ok(!recent.some(job=>job.run_id===learned.run_id));
    const historicalUrl=new URL(base);
    historicalUrl.searchParams.set("iad",JSON.stringify({pageId:"industrial-normal",datasetId:dataset.dataset_id,tab:"jobs",job:learned.run_id}));
    await driver.get(historicalUrl.href);
    const historical=await element(`.iad-knowledge-jobs [data-job-id='${learned.run_id}']`);
    assert.equal(await historical.getAttribute("aria-current"),"true");
    assert.ok((await historical.getText()).includes("已完成"));
    await historical.findElement(By.xpath(".//button[normalize-space()='查看已发布版本']")).click();
    await driver.wait(async()=>await(await element("select[aria-label='知识版本']")).getAttribute("value")===published.knowledge.version_id,5000);


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
