import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { Builder, By, until } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";
import { resolvePythonPath } from "../lib/server/python-bridge/index.js";

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const toolMessages = request => {
  const names = new Map(request.messages.flatMap(message => (message.tool_calls || []).map(call => [call.id, call.function.name])));
  return request.messages.filter(message => message.role === "tool").map(message => ({ ...message, name: names.get(message.tool_call_id) }));
};

test("native DSH: ask about frozen evidence and return to the original inspection", { timeout: 600000 }, async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-native-handoff-"));
  const app = path.join(workspace, "apps/iad-harness");
  const profile = path.join(root, "home/profiles/web");
  await fs.mkdir(path.join(profile, "node_modules/@industrial-benchmark"), { recursive: true });
  await fs.symlink(app, path.join(profile, "node_modules/@industrial-benchmark/iad-harness"));
  await fs.writeFile(path.join(profile, "package.json"), JSON.stringify({ name: "iad-native-handoff", private: true, type: "module",
    dsh: { profile: { bundles: ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app"] } } }));
  await fs.writeFile(path.join(profile, "cordis.yml"), "[]\n");
  await fs.writeFile(path.join(profile, "cordis.patch.yml"), "- id: ui-settings-general\n  config:\n    welcomeNoticeVersion: 2026-09-28.1\n");
  execFileSync(resolvePythonPath(), [path.join(app, "test/fixtures/knowledge_dataset.py"), root]);
  const agentRequests = [];
  let agentCompleted = false;
  const model = http.createServer(async (req, res) => {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString());
    if (body.stream) {
      if (!body.tools?.some(tool => tool.function.name === "model_audit_context")) {
        res.writeHead(200, { "Content-Type": "text/event-stream" });
        res.end(`data: ${JSON.stringify({ id: "session-title", object: "chat.completion.chunk", model: "test-mllm", choices: [{ index: 0, delta: { role: "assistant", content: "左孔证据核对" }, finish_reason: "stop" }] })}\n\ndata: [DONE]\n\n`);
        return;
      }
      agentRequests.push(body);
      const user = body.messages.find(message => message.role === "user");
      const text = typeof user.content === "string" ? user.content : user.content.filter(part => part.type === "text").map(part => part.text).join("\n");
      const reference = JSON.parse(text.split("冻结检视引用：")[1].split("\n")[0]);
      const outputs = toolMessages(body);
      const context = outputs[0]?.content.startsWith("{") ? JSON.parse(outputs[0].content) : null;
      const image = context?.evidence?.[outputs.length - 1];
      const last = outputs.at(-1);
      const tool = !outputs.length ? { name: "model_audit_context", arguments: reference }
        : outputs.length < 3 && image ? { name: "model_audit_evidence", arguments: { suggestion_id: reference.suggestion_id, evidence_id: image.evidence_id } } : null;
      if (!tool) agentCompleted = true;
      const delta = tool ? { role: "assistant", tool_calls: [{ index: 0, id: `handoff-${outputs.length}`, type: "function", function: { name: tool.name, arguments: JSON.stringify(tool.arguments) } }] }
        : { role: "assistant", content: `已结合实际全图与ROI核对左孔，反光仍需人工核实。[返回检视](${text.split("返回检视：")[1].split("\n")[0]})` };
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      for (const choice of [{ index: 0, delta, finish_reason: null }, { index: 0, delta: {}, finish_reason: tool ? "tool_calls" : "stop" }]) {
        res.write(`data: ${JSON.stringify({ id: "native-handoff", object: "chat.completion.chunk", model: "test-mllm", choices: [choice] })}\n\n`);
      }
      res.end("data: [DONE]\n\n"); return;
    }
    assert.equal(req.url, "/tokenize", "Inspection explanations use the actual native streaming Agent");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ count: 1000, max_model_len: 262144 }));
  });
  await new Promise(resolve => model.listen(0, "127.0.0.1", resolve));
  const endpoint = `http://127.0.0.1:${model.address().port}/v1`;
  const reservation = http.createServer();
  await new Promise(resolve => reservation.listen(0, "127.0.0.1", resolve));
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const patch = path.join(root, "host.patch.yml");
  await fs.writeFile(patch, `- id: webserver\n  config:\n    host: 127.0.0.1\n    port: ${port}\n- id: llm-pi-ai\n  config:\n    providers:\n      handoff:\n        api: openai-completions\n        baseURL: ${JSON.stringify(endpoint)}\n        apiKeyEnv: IAD_HANDOFF_TEST_KEY\n        models:\n          - id: test-mllm\n            input: [text, image]\n            contextWindow: 262144\n- id: agent-default-model\n  config:\n    provider: handoff\n    model: test-mllm\n- insert:\n    - id: industrial-harness-plugin\n      name: '@industrial-benchmark/iad-harness'\n      config:\n        cwd: ${JSON.stringify(workspace)}\n        dbPath: ${JSON.stringify(path.join(root, "test.db"))}\n`);
  const host = spawn(process.env.IAD_NODE_PATH || process.execPath, [path.join(workspace, "node_modules/@deepseek-ai/dsh/lib/bin.js"), "--profile", "web", "--patch", patch, "--port", String(port), "--no-open"],
    { cwd: workspace, env: { ...process.env, DSH_HOME: path.join(root, "home"), LIVE_VLM_ENDPOINT: endpoint, LIVE_VLM_MODEL: "test-mllm", LIVE_VLM_CAPACITY_MODE: "vllm_tokenize", IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES: "2", LIVE_VLM_KEY: "synthetic-test-credential", IAD_HANDOFF_TEST_KEY: "synthetic-test-credential" }, stdio: ["ignore", "pipe", "pipe"] });
  let log = ""; host.stdout.on("data", data => { log += data; }); host.stderr.on("data", data => { log += data; });
  let driver;
  try {
    const deadline = Date.now() + 30000;
    while (!log.match(/http:\/\/127\.0\.0\.1:[^\s)]+/) && host.exitCode === null && Date.now() < deadline) await delay(100);
    const url = log.match(/http:\/\/127\.0\.0\.1:[^\s)]+/)?.[0];
    assert.ok(url, log.replace(/(token=)[^\s&]+/g, "$1<redacted>"));
    const options = new firefox.Options().addArguments("-headless").setPreference('ui.primaryPointerCapabilities',6); if (process.env.FIREFOX_PATH) options.setBinary(process.env.FIREFOX_PATH);
    if (process.env.IAD_BROWSER_DPR) options.setPreference("layout.css.devPixelsPerPx", process.env.IAD_BROWSER_DPR);
    driver = await new Builder().forBrowser("firefox").setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || "geckodriver")).build();
    await driver.manage().window().setRect({ width: 1440, height: 1100 }); await driver.get(url);
    if (process.env.IAD_BROWSER_DPR) assert.equal(await driver.executeScript("return devicePixelRatio"), Number(process.env.IAD_BROWSER_DPR));
    const element = css => driver.wait(until.elementLocated(By.css(css)), 15000);
    const button = async text => { const control = await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${text}' or @aria-label='${text}']`)), 15000); await driver.wait(until.elementIsVisible(control),5000);await driver.wait(until.elementIsEnabled(control),5000);await control.click(); };
    const api = async (pathname, body) => {
      const result = await driver.executeAsyncScript(`const done=arguments[arguments.length-1];fetch('/api/iad'+arguments[0],arguments[1]?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(arguments[1])}:undefined).then(async response=>done({status:response.status,value:await response.json()})).catch(error=>done({error:String(error)}));`, pathname, body || null);
      assert.equal(result.status, 200, JSON.stringify(result)); return result.value;
    };
    await element("button[aria-label^='数据集管理']");
    const later = await driver.findElements(By.xpath("//button[.='Configure later']")); if (later.length) await later[0].click();
    const notice = await driver.findElements(By.xpath("//button[.='Continue']")); if (notice.length) await notice[0].click();
    const group = await api("/datasets/groups", { name: "会话交接" });
    const dataset = await api("/datasets/import", { format: "labelme", name: "冻结检视", group_id: group.group_id, image_dir: path.join(root, "images"), annotation_dir: path.join(root, "labels") });
    const saveAdvisory = () => JSON.parse(execFileSync(resolvePythonPath(), [path.join(app, "test/fixtures/inspection_advisory.py"), path.join(root, "test.db"), dataset.dataset_id + ":part-2.png"],
      { cwd: workspace, env: { ...process.env, PYTHONPATH: path.join(workspace, "python") }, encoding: "utf8" }));
    saveAdvisory();
    const initial = new URL(url); initial.search = new URLSearchParams({iad:JSON.stringify({pageId:"industrial-review",datasetId:dataset.dataset_id,selected:dataset.dataset_id+":part-2.png"})});
    await driver.get(initial.href);
    const target = await api(`/sample/${encodeURIComponent(dataset.dataset_id + ":part-2.png")}`);
    await (await element("button[aria-label='全屏检视']")).click(); await (await element("button[aria-label='定位 ROI 1']")).click();
    const stage = await element("#stage");
    await driver.actions().move({origin:stage}).press().move({origin:stage,x:30,y:20}).release().perform();
    const geometry = () => driver.executeScript(`const world=document.querySelector('#image-world'),viewport=document.querySelector('#stage'),image=world.querySelector('img');const w=world.getBoundingClientRect(),v=viewport.getBoundingClientRect();return {scale:w.width/image.naturalWidth,center:[(v.left+v.width/2-w.left)*image.naturalWidth/w.width,(v.top+v.height/2-w.top)*image.naturalHeight/w.height]};`);
    const before = await geometry();
    await button("向 Agent 追问"); await (await element("textarea[aria-label='追问内容']")).sendKeys("这个区域是否可能只是反光？请根据冻结原图和裁剪解释。");
    await fs.mkdir(path.join(workspace, "runs/browser/session-handoff"), { recursive: true });
    await fs.writeFile(path.join(workspace, "runs/browser/session-handoff/question.png"), await driver.takeScreenshot(), "base64");
    await button("发送到会话");
    await driver.wait(() => agentCompleted, 15000);console.log(JSON.stringify({nativeStage:"handoff-complete"}));
    assert.equal((await driver.findElements(By.css(".iad-workbench"))).length, 0, "Open the actual host conversation");
    const finalImages = agentRequests.at(-1).messages.flatMap(message => Array.isArray(message.content) ? message.content.filter(item => item.type === "image_url") : []);
    assert.equal(finalImages.length, 2, "Actual full image and ROI must reach the Session MLLM");
    assert.deepEqual(finalImages.map(image => createHash("sha256").update(Buffer.from(image.image_url.url.split(",")[1], "base64")).digest("hex")),
      [target.suggestion.analysis.overview.sha256, target.suggestion.analysis.regions[0].image.sha256]);
    const userInput = agentRequests[0].messages.find(message => message.role === "user").content;
    const prompt = typeof userInput === "string" ? userInput : userInput.filter(part => part.type === "text").map(part => part.text).join("\n");
    const inspectionRoute = JSON.parse(new URL(prompt.split("返回检视：")[1].split("\n")[0]).searchParams.get("iad"));
    const sessionId = inspectionRoute.inspection.sessionId;
    assert.ok(sessionId, "The inspection return route retains the actual initiating conversation");
    const requestCount = agentRequests.length;
    saveAdvisory();
    const latest = await api(`/sample/${encodeURIComponent(target.sample.sample_id)}`);
    assert.notEqual(latest.suggestion.suggestion_id, target.suggestion.suggestion_id);
    const back = await driver.wait(until.elementLocated(By.css("a[href*='?iad=']")), 15000);
    const windows = await driver.getAllWindowHandles(); await back.click();
    await driver.wait(async () => (await driver.getAllWindowHandles()).length > windows.length || (await driver.findElements(By.css(".iad-workbench"))).length > 0, 10000);
    const returned = (await driver.getAllWindowHandles()).find(id => !windows.includes(id)); if (returned) await driver.switchTo().window(returned);
    await element(".iad-inspection-region");
    await driver.wait(() => driver.executeScript("return document.querySelector('#big-image')?.naturalWidth>0"), 5000);
    const after = await geometry();
    assert.ok(Math.abs(after.scale - before.scale) < 1e-9, JSON.stringify({before,after}));
    assert.ok(after.center.every((value,index) => Math.abs(value-before.center[index]) < 0.01), JSON.stringify({before,after}));
    assert.equal(await (await element(".iad-inspection-region")).getAttribute("data-evidence-id"), target.suggestion.analysis.regions[0].image.evidence_id);
    assert.ok((await (await element(".iad-inspection-panel")).getText()).includes("历史建议"));
    assert.ok((await (await element(".iad-inspection-region img")).getAttribute("src")).includes(target.suggestion.suggestion_id));
    await fs.writeFile(path.join(workspace, "runs/browser/session-handoff/returned.png"), await driver.takeScreenshot(), "base64");
    const roiPath = path.join(root, "cache/visual-evidence", target.suggestion.analysis.regions[0].image.sha256 + ".png");
    await fs.rename(roiPath, roiPath + ".missing");
    try {
      await button("向 Agent 追问"); await button("发送到会话");
      assert.ok((await (await element(".iad-inspection-question [role='alert']")).getText()).includes("冻结图像证据缺失"));
      assert.equal(agentRequests.length, requestCount, "Missing frozen images must be rejected before Session submission");
    } finally { await fs.rename(roiPath + ".missing", roiPath); }
    const invalid = new URL(await driver.getCurrentUrl());
    const route = JSON.parse(invalid.searchParams.get("iad")); route.inspection.reference.evidence_id = "missing";
    invalid.searchParams.set("iad", JSON.stringify(route)); await driver.get(invalid.href);
    assert.ok((await (await element(".iad-inspector [role='alert']")).getText()).includes("证据引用不存在"));
    assert.equal((await driver.findElements(By.css(".iad-viewer-dialog[open]"))).length, 0);
    assert.equal(agentRequests.length, requestCount, "Inspecting frozen evidence does not submit another message");
  } catch (error) {
    await fs.mkdir(path.join(workspace, "runs/browser/session-handoff"), { recursive: true });
    if (driver) {
      await fs.writeFile(path.join(workspace, "runs/browser/session-handoff/failure.png"), await driver.takeScreenshot(), "base64");
      console.error(JSON.stringify({ agentRequests: agentRequests.length, buttons: await driver.executeScript("return [...document.querySelectorAll('button')].map(b=>({text:b.textContent,expanded:b.getAttribute('aria-expanded')})).filter(b=>b.text||b.expanded)"), page: (await driver.findElement(By.css("body")).getText()).slice(-2200) }));
    }
    console.error(log.slice(-2200).replace(/(token=)[^\s&]+/g, "$1<redacted>"));
    throw error;
  } finally {
    await driver?.quit(); host.kill("SIGTERM");
    await Promise.race([new Promise(resolve => host.once("exit", resolve)), delay(3000)]);
    if (host.exitCode === null) host.kill("SIGKILL");
    model.closeAllConnections(); await new Promise(resolve => model.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});
