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

test("browser: import Labelme, filter, rename, review and rescan frozen evidence", { timeout: 180000 }, async () => {
  await fs.mkdir(path.join(workspace, "runs/browser"), { recursive: true });
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-browser-"));
  const bridge = new PythonBridge({ cwd: workspace, dbPath: path.join(root, "test.db") });
  execFileSync(bridge.pythonPath, ["-c", `
import base64,io,json,sys
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(sys.argv[1])
(root/'images').mkdir(); (root/'labels').mkdir()
(root/'images-other').mkdir(); (root/'labels-other').mkdir()
Image.new('RGB',(320,240),'green').save(root/'images-other'/'other.png')
reference=Image.new('RGB',(320,240),'green');ImageDraw.Draw(reference).rectangle((180,120,200,140),fill='yellow');reference.save(root/'images-other'/'reference.png')
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
  let dropReviewResponse = false;
  const reviewRequests = [], datasetPatches = [];
  const api = createIadHttpHandler(bridge);
  const server = http.createServer((req, res) => {
    if (req.method === "PATCH" && /^\/api\/iad\/datasets\/[^/]+$/.test(req.url)) datasetPatches.push(req.url);
    if (new URL(req.url, "http://localhost").pathname === "/") { res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end('<!doctype html><meta charset="utf-8"><style>html,body,#root{height:100%;margin:0}</style><div id="root"></div><script src="/browser.js"></script>'); }
    else if (req.url === "/browser.js") { res.setHeader("Content-Type", "application/javascript"); res.end(bundle.outputFiles[0].contents); }
    else {
      if (req.url === "/api/iad/review/submit") {
        let body=""; req.on("data",chunk=>{body+=chunk;}); req.on("end",()=>reviewRequests.push(JSON.parse(body)));
        if (dropReviewResponse) {
          dropReviewResponse=false;
          res.end=body=>{res.write(body.slice(0,Math.floor(body.length/2)),()=>req.socket.destroy());return res;};
        }
      }
      void api(req, res);
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let driver;
  try {
    const options = new firefox.Options().addArguments("-headless", "--remote-allow-system-access");
    if (process.env.FIREFOX_PATH) options.setBinary(process.env.FIREFOX_PATH);
    if (process.env.IAD_BROWSER_DPR) options.setPreference("layout.css.devPixelsPerPx",process.env.IAD_BROWSER_DPR);
    driver = await new Builder().forBrowser("firefox").setFirefoxOptions(options)
      .setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || "geckodriver")).build();
    await driver.manage().window().setRect({ width: 1440, height: 1100 });
    await driver.get(base + "?host=kept#host-anchor");
    if (process.env.IAD_BROWSER_DPR) assert.equal(await driver.executeScript("return devicePixelRatio"),Number(process.env.IAD_BROWSER_DPR));
    const element = css => driver.wait(until.elementLocated(By.css(css)), 15000);
    const button = async text => {
      const dialog = await driver.executeScript("return [...document.querySelectorAll('dialog:modal')].at(-1)||null");
      const control = await driver.wait(async () => (await (dialog || driver).findElements(By.xpath(`.//button[normalize-space(.)='${text}' or @aria-label='${text}']`)))[0], 15000, `Button ${text}`);
      await driver.wait(until.elementIsEnabled(control),15000); await control.click();
    };
    const select = async (label, value) => {
      const el = await element(`select[aria-label='${label}']`);
      await driver.executeScript("arguments[0].value=arguments[1];arguments[0].dispatchEvent(new Event('change',{bubbles:true}));", el, value);
    };
    const selectedSample = async name => {const summary=await driver.findElements(By.css(".iad-review-information>summary"));if(summary.length && !(await summary[0].findElement(By.xpath("..")).getAttribute("open")))await summary[0].click();return driver.wait(until.elementLocated(By.xpath(`//dt[normalize-space(.)='图像名']/following-sibling::dd[1][normalize-space(.)='${name}']`)),5000);};
    const viewportSize=async(width,height)=>{
      await driver.setContext("chrome");
      await driver.executeScript("gBrowser.selectedBrowser.style.maxWidth='';gBrowser.selectedBrowser.style.width='';gBrowser.selectedBrowser.style.flex=''");
      await driver.setContext("content");
      const chrome=await driver.executeScript("return {width:outerWidth-innerWidth,height:outerHeight-innerHeight}");
      await driver.manage().window().setRect({width:width+chrome.width,height:height+chrome.height});

      assert.equal(await driver.executeScript("return innerWidth"),width);
    };
    const gridCount = count => driver.wait(async () => await driver.executeScript("return document.querySelectorAll('.iad-grid [data-sample-id]').length===arguments[0] && !!document.querySelector('.iad-gallery') && !document.querySelector('.iad-gallery').textContent.includes('加载中');", count), 15000, `Expected ${count} grid images`);
    await element("#test-navigation button");
    assert.deepEqual(await driver.executeScript("return [...document.querySelectorAll('#test-navigation button')].map(b=>b.textContent)"),
      ["数据集管理", "图像浏览", "方向探索", "知识挖掘", "数据一致性", "模型审计", "人工复核"]);
    assert.equal((await driver.findElements(By.css(".iad-header select,.iad-kpis"))).length, 0, "数据集管理由卡片选择数据集，不重复显示头部控件和统计");
    const group = await bridge.execute("dataset_group_create", { name: "浏览器验收" });
    await driver.navigate().refresh();
    await (await element(`button[aria-label="为 ${group.name} 添加子数据集"]`)).click();
    await (await element("#new-name")).sendKeys("浏览器验收子集");
    await (await element("#new-path")).sendKeys(path.join(root, "images"));
    await (await element("#new-label-path")).sendKeys(path.join(root, "labels"));
    await (await element('dialog[aria-label="添加数据集"] button[type="submit"]')).click();
    await driver.wait(async () => (await driver.findElements(By.css("dialog[open]"))).length === 0, 10000);
    const imported = await bridge.execute("dataset_list", {});
    assert.equal(imported.datasets.length, 1);
    const importedDataset = imported.datasets[0];
    await (await element(`.data-row[data-id="${importedDataset.dataset_id}"] button[data-edit]`)).click();
    const nameInput = await element('input[data-edit-input]');
    await nameInput.click();
    await driver.actions().keyDown(Key.CONTROL).sendKeys("a").keyUp(Key.CONTROL).perform();
    await nameInput.sendKeys("已命名子集");
    assert.equal(await nameInput.getAttribute("value"), "已命名子集");
    await nameInput.sendKeys(Key.ENTER);
    await driver.wait(async () => (await (await element(`.data-row[data-id="${importedDataset.dataset_id}"] .name-text`)).getText()) === "已命名子集", 5000);
    assert.equal(datasetPatches.length, 1);
    await button("图像浏览");
    await (await element(`#parent option[value="${group.group_id}"]`)).click();
    const imageCount = count => driver.wait(async () => (await driver.findElements(By.css("#grid [data-sample-id]"))).length === count, 10000);
    await imageCount(3);
    await (await element('#annotation option[value="none"]')).click(); await imageCount(2);
    await (await element('#annotation option[value="present"]')).click(); await imageCount(1);
    await (await element('#category option[value="dent"]')).click(); await imageCount(1);
    await (await element('#reset')).click(); await imageCount(3);
    const datasets = await bridge.execute("dataset_list", {});
    const dataset = datasets.datasets[0];
    const samples = await bridge.execute("sample_list", { task_id: dataset.task_id, dataset_id: dataset.dataset_id });
    const dent = samples.items.find(sample => sample.relative_path === "dent.png");
    await (await element(`[data-sample-id="${dent.sample_id}"]`)).click();
    await element('#overlay svg[aria-label="Labelme 标注"]');
    await (await element('#detail-preview')).click();
    await element('dialog[aria-label="原图检视器"]');
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.wait(async () => (await driver.findElements(By.css("dialog:modal"))).length === 1, 5000);
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.wait(async () => (await driver.findElements(By.css("dialog:modal"))).length === 0, 5000);
    const suggestion = JSON.parse(execFileSync(bridge.pythonPath, [path.join(app, "test/fixtures/inspection_advisory.py"), path.join(root, "test.db"), dent.sample_id],
      { cwd: workspace, env: { ...process.env, PYTHONPATH: path.join(workspace, "python") }, encoding: "utf8" }));
    await driver.get(base+"/?"+new URLSearchParams({iad:JSON.stringify({pageId:"industrial-review",datasetId:dataset.dataset_id})})); await gridCount(3);
    await element(".iad-review-focused .iad-viewer-viewport");
    assert.equal((await driver.findElements(By.xpath("//button[.='按知识审计此图']"))).length, 0);
    await (await element("input[aria-label='按文件名搜索']")).sendKeys("d"); await gridCount(1);
    await element(".iad-decision");
    await (await element(".iad-decision input:not([type=radio])")).sendKeys("浏览器核验员");
    await (await element(".iad-decision textarea")).sendKeys("已核实局部反光");
    await button("知识挖掘");
    await button("人工复核"); await gridCount(1);
    assert.equal(await (await element(".iad-decision textarea")).getAttribute("value"), "已核实局部反光");
    await driver.navigate().refresh(); await gridCount(1);
    assert.equal(await (await element(".iad-decision textarea")).getAttribute("value"), "已核实局部反光");
    assert.ok((await (await element(".iad-decision")).getText()).includes("草稿未提交"));
    const decisionChoice = await element(".iad-decision input[type=radio][value=PASS]");
    await decisionChoice.click();
    assert.equal(reviewRequests.length, 0, "选择人工裁决只保存草稿，不立即提交");
    await driver.navigate().refresh(); await gridCount(1);
    assert.equal(await (await element(".iad-decision input[type=radio][value=PASS]")).isSelected(), true, "刷新保留尚未提交的裁决选择");
    dropReviewResponse=true;
    await (await element(".iad-decision input[type=radio][value=PASS]")).click(); await button("提交复核");
    await element(".iad-decision [role='alert']");
    assert.equal(reviewRequests.length,1,"服务端真实提交后断开响应连接");
    assert.equal(await (await element(".iad-decision textarea")).getAttribute("value"),"已核实局部反光");
    await driver.navigate().refresh();await gridCount(0);
    assert.equal(await (await element(".iad-decision textarea")).getAttribute("value"),"已核实局部反光");
    await button("重试提交");
    await driver.wait(async()=>(await (await element(".iad-review-confirmation")).getText()).includes("dent.png，良品"),5000);
    await driver.wait(async()=>(await driver.findElements(By.css(".iad-decision"))).length===0,5000);
    assert.equal(reviewRequests.length,2);
    assert.deepEqual(reviewRequests[1],reviewRequests[0],"刷新后必须重放同一份提交，包括标识和耗时");
    const detail = await (await fetch(`${base}/api/iad/sample/${encodeURIComponent(dent.sample_id)}`)).json();
    assert.equal(detail.review_decision.decision, "PASS");
    assert.equal(detail.review_history.length,1,"响应丢失后的重试不能新增人工裁决");
    assert.equal(detail.sample.quality_status, "UNCERTAIN");
    await select("人工复核", "reviewed"); await gridCount(1);
    assert.doesNotMatch(await (await element(".iad-grid")).getText(), /技术问题/, "提交人审后也不向卡片底部追加状态文字");
    assert.ok((await (await element(".iad-decision")).getText()).includes("当前：良品"), "人工结果在详情独立展示");
    await selectedSample("dent.png");
    assert.ok((await (await element(".iad-review-information")).getText()).includes("左孔存在局部颜色差异"));
    await (await element(".iad-decision textarea")).sendKeys("更正：确认异常");
    await (await element(".iad-decision input[type=radio][value=FAIL]")).click(); await button("提交复核");
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
    await driver.wait(async()=>(await (await element(".iad-review-history")).getText()).includes("复核记录，2 次"),5000);
    await driver.executeScript("arguments[0].scrollIntoView({block:'end'})",await element(".iad-review-history"));
    await fs.writeFile(path.join(workspace, "runs/browser/human-review.png"), await driver.takeScreenshot(), "base64");
    await viewportSize(1920,1080);
    assert.ok(await driver.executeScript("const e=document.querySelector('.iad-workbench');return e.scrollWidth<=e.clientWidth+1"),"复核记录桌面不造成页面横向溢出");
    const recordsRegion=await element("[aria-label='复核历史表格']");
    await (await element("input[aria-label='搜索复核记录']")).click();
    await driver.actions().sendKeys(Key.TAB).perform();
    assert.ok(await driver.executeScript("return document.activeElement===arguments[0]",recordsRegion),"Tab按页面顺序进入历史表格");
    await driver.executeScript("document.querySelector('.iad-workbench').scrollTop=0");
    await fs.writeFile(path.join(workspace,"runs/browser/review-records-1920.png"),await driver.takeScreenshot(),"base64");
    await viewportSize(1440,1100);
    await button("数据集管理");
    const beforeRescan = await bridge.execute("sample_get", { sample_id: dent.sample_id });
    const updatedLabelme = JSON.parse(await fs.readFile(path.join(root, "labels/dent.json"), "utf8"));
    updatedLabelme.shapes[0].label = "已修订类别";
    updatedLabelme.shapes[0].points = [[40, 40], [70, 70]];
    await fs.writeFile(path.join(root, "labels/dent.json"), JSON.stringify(updatedLabelme));
    await fs.copyFile(path.join(root, "images/normal.png"), path.join(root, "images/new-image.png"));
    await (await element(`.data-row[data-id="${dataset.dataset_id}"] .name-text`)).click();
    await button("重新扫描目录");
    await driver.wait(async () => (await bridge.execute("dataset_list", {})).datasets.find(item => item.dataset_id === dataset.dataset_id).total_samples === 4, 10000);
    const afterRescan = await bridge.execute("sample_get", { sample_id: dent.sample_id });
    assert.equal(afterRescan.sample.sample_uuid, beforeRescan.sample.sample_uuid);
    assert.deepEqual(afterRescan.review_decision, beforeRescan.review_decision);
    assert.deepEqual(afterRescan.suggestion, beforeRescan.suggestion);
    assert.equal(afterRescan.annotations[0].raw_label, "已修订类别");
    assert.deepEqual(afterRescan.annotations[0].bbox, [40, 40, 70, 70]);
    assert.equal(afterRescan.suggestion.suggestion_id, suggestion.suggestion_id);
    const callCount = Number(execFileSync(bridge.pythonPath, ["-c", "import sqlite3,sys; print(sqlite3.connect('file:'+sys.argv[1]+'?mode=ro', uri=True).execute('select count(*) from model_calls').fetchone()[0])", path.join(root, "test.db")], { encoding: "utf8" }));
    assert.equal(callCount, 0, "Reading, human review and rescan do not run a model");
  } catch (error) {
    if (driver) {
      await fs.writeFile(path.join(workspace, "runs/browser/failure.png"), await driver.takeScreenshot(), "base64");
      console.error(await driver.findElement(By.css("body")).getText());
    }
    throw error;
  } finally {
    if (driver) await driver.quit();
    bridge.destroy(); await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});
