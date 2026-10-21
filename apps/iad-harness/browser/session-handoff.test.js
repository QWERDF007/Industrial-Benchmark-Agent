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
import { verifyWorkbenchLayout } from "./workbench-layout.js";
import { verifyWorkbenchSurfaces } from "./workbench-surfaces.js";

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const toolMessages = request => {
  const names = new Map(request.messages.flatMap(message => (message.tool_calls || []).map(call => [call.id, call.function.name])));
  return request.messages.filter(message => message.role === "tool").map(message => ({ ...message, name: names.get(message.tool_call_id) }));
};

test("native DSH: ask about frozen evidence and return to the original inspection", { timeout: 300000 }, async () => {
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
  let agentCompleted = false, rejectedAudits = 2;
  let releaseKnowledge;
  const knowledgeGate = new Promise(resolve => { releaseKnowledge = resolve; });
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
      const value = ["knowledge_get", "knowledge_mine_normal", "knowledge_job_status", "model_audit_start", "model_audit_status"].includes(last?.name) ? JSON.parse(last.content) : null;
      let tool = !outputs.length ? { name: "model_audit_context", arguments: reference }
        : outputs.length < 3 && image ? { name: "model_audit_evidence", arguments: { suggestion_id: reference.suggestion_id, evidence_id: image.evidence_id } } : null;
      if (outputs.length === 3) tool = { name: "knowledge_get", arguments: { dataset_id: reference.dataset_id, kind: "normal" } };
      if (last?.name === "knowledge_get") tool = { name: "knowledge_mine_normal", arguments: { dataset_id: reference.dataset_id, model_name: "test-mllm",
        base_version_id: value.knowledge.version_id, corrections: [{ check_id: value.knowledge.checks[0].check_id, instruction: "均匀亮度变化可能正常，需结合位置核验" }] } };
      if (["knowledge_mine_normal", "knowledge_job_status"].includes(last?.name)) tool = value?.status === "COMPLETED"
        ? { name: "model_audit_start", arguments: { dataset_id: reference.dataset_id, normal_version_id: value.knowledge_version_id, sample_ids: [reference.sample_id], model_name: "test-mllm" } }
        : { name: "knowledge_job_status", arguments: { run_id: value.run_id, wait_seconds: 5 } };
      if (["model_audit_start", "model_audit_status"].includes(last?.name)) tool = value?.status === "COMPLETED" ? { name: "dataset_report", arguments: { dataset_id: reference.dataset_id } }
        : { name: "model_audit_status", arguments: { run_id: value.run_id, wait_seconds: 5 } };
      if (!tool && last?.name === "dataset_report") agentCompleted = true;
      const delta = tool ? { role: "assistant", tool_calls: [{ index: 0, id: `handoff-${outputs.length}`, type: "function", function: { name: tool.name, arguments: JSON.stringify(tool.arguments) } }] }
        : { role: "assistant", content: `已结合实际全图与ROI核对左孔，反光仍需人工核实。[返回检视](${text.split("返回检视：")[1].split("\n")[0]})` };
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      for (const choice of [{ index: 0, delta, finish_reason: null }, { index: 0, delta: {}, finish_reason: tool ? "tool_calls" : "stop" }]) {
        res.write(`data: ${JSON.stringify({ id: "native-handoff", object: "chat.completion.chunk", model: "test-mllm", choices: [choice] })}\n\n`);
      }
      res.end("data: [DONE]\n\n"); return;
    }
    const content = body.messages[0].content;
    const evidence = content.filter(item => item.type === "text" && item.text.startsWith("视觉证据：")).map(item => JSON.parse(item.text.slice(5)));
    let answer = { count: 1000, max_model_len: 262144 };
    if (req.url !== "/tokenize") {
      if (body.response_format.json_schema.name === "KnowledgeDraft") {
        await knowledgeGate;
        answer = { summary: "孔内背景可见", checks: [{ title: "孔内外观", subject: "主体", location: "左孔",
          criterion: "孔内背景可见", allowed_variations: ["亮度变化"], support_evidence_ids: evidence.map(item => item.evidence_id), counter_evidence_ids: [], limitations: [], status: "supported" }], suspects: [], limitations: [] };
        if (content[0].text.includes("冻结父版本候选：")) {
          const parent = JSON.parse(content[0].text.split("冻结父版本候选：")[1].split("\n")[0]);
          answer.revisions = parent.checks.map(check => ({ previous_check_id: check.check_id, current_check_titles: ["孔内外观"], reason: "来源仍支持原孔内背景判据" }));
        }
      }
      else if (body.response_format.json_schema.name === "KnowledgeVerification") {
        const payload = JSON.parse(content[0].text.split("待核验疑点：")[1].split("\n请根据图像")[0]);
        answer = { findings: payload.findings.map(target => ({ finding_id: target.finding_id, status: "insufficient", affected_check_titles: [],
          description: "仍需独立证据", normal_explanation: "不能排除反光", limitations: ["合成验证"], conflicts: [],
          evidence_ids: [target.regions.find(region => region.image.representation === "raw").image.evidence_id] })) };
      } else {
        const checks = JSON.parse(content[0].text.split("冻结知识：")[1].split("\n")[0]).checks;
        const regions = evidence.filter(item => item.role === "roi" && item.representation === "raw");
        const view = { description: "左孔需核实", position_analysis: "主体左侧", illumination_analysis: "需排除反光" };
        answer = { ...view, global_view: view, suggested_label: "FAIL", reason_category: "OCCLUSION", confidence: 0.8,
          evidence_ids: evidence.map(item => item.evidence_id), check_assessments: checks.map(check => ({ ...view, check_id: check.check_id, status: "anomaly", evidence_ids: [evidence[0].evidence_id] })),
          region_observations: regions.map((_, index) => ({ ...view, region_index: index + 1 })),
          findings: regions.length ? [{ check_ids: checks.map(check => check.check_id), location: { scope: "local", bbox: [90,110,110,130], description: "主体左孔" },
            description: "红色覆盖背景", hypothesis: "局部遮挡", normal_explanation: "可能反光", limitations: ["合成验证"], review_action: "核对左孔", priority: "high", evidence_ids: [regions[0].evidence_id] }] : [] };
      }
      if (body.response_format.json_schema.name === "JointAnalysis" && rejectedAudits > 0) { rejectedAudits--; answer = { invalid_field: true }; }
      answer = { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(answer) } }] };
    }
    res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(answer));
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
    { cwd: workspace, env: { ...process.env, DSH_HOME: path.join(root, "home"), LIVE_VLM_ENDPOINT: endpoint, LIVE_VLM_KEY: "synthetic-test-credential", IAD_HANDOFF_TEST_KEY: "synthetic-test-credential" }, stdio: ["ignore", "pipe", "pipe"] });
  let log = ""; host.stdout.on("data", data => { log += data; }); host.stderr.on("data", data => { log += data; });
  let driver;
  try {
    const deadline = Date.now() + 30000;
    while (!log.match(/http:\/\/127\.0\.0\.1:[^\s)]+/) && host.exitCode === null && Date.now() < deadline) await delay(100);
    const url = log.match(/http:\/\/127\.0\.0\.1:[^\s)]+/)?.[0];
    assert.ok(url, log.replace(/(token=)[^\s&]+/g, "$1<redacted>"));
    const options = new firefox.Options().addArguments("-headless"); if (process.env.FIREFOX_PATH) options.setBinary(process.env.FIREFOX_PATH);
    if (process.env.IAD_BROWSER_DPR) options.setPreference("layout.css.devPixelsPerPx", process.env.IAD_BROWSER_DPR);
    driver = await new Builder().forBrowser("firefox").setFirefoxOptions(options).setFirefoxService(new firefox.ServiceBuilder(process.env.GECKODRIVER_PATH || "geckodriver")).build();
    await driver.manage().window().setRect({ width: 1440, height: 1100 }); await driver.get(url);
    if (process.env.IAD_BROWSER_DPR) assert.equal(await driver.executeScript("return devicePixelRatio"), Number(process.env.IAD_BROWSER_DPR));
    const element = css => driver.wait(until.elementLocated(By.css(css)), 15000);
    const button = async text => { const control = await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${text}']`)), 15000); await control.click(); };
    const api = async (pathname, body) => {
      const result = await driver.executeAsyncScript(`const done=arguments[arguments.length-1];fetch('/api/iad'+arguments[0],arguments[1]?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(arguments[1])}:undefined).then(async response=>done({status:response.status,value:await response.json()})).catch(error=>done({error:String(error)}));`, pathname, body || null);
      assert.equal(result.status, 200, JSON.stringify(result)); return result.value;
    };
    await element("button[aria-label^='数据集管理']");
    const later = await driver.findElements(By.xpath("//button[.='Configure later']")); if (later.length) await later[0].click();
    const notice = await driver.findElements(By.xpath("//button[.='Continue']")); if (notice.length) await notice[0].click();
    await (await element("button[aria-label^='数据集管理']")).click();
    const folderRoot = path.join(root, "classification");
    for (const directory of ["OK/batch", "NG", "unknown"]) await fs.mkdir(path.join(folderRoot, directory), { recursive: true });
    for (const [index, directory] of ["OK/batch", "NG", "unknown"].entries())
      await fs.copyFile(path.join(root, "images", `part-${index}.png`), path.join(folderRoot, directory, `sample-${index}.png`));
    await button("添加数据集");
    await (await element("input[value='folder_classification']")).click();
    const rootInput = await element("input[aria-label='父目录']");
    await rootInput.sendKeys(folderRoot);
    assert.equal(await rootInput.getAttribute("value"), folderRoot, "目录输入不被异步预览中断");
    await element("select[aria-label='目录 OK 角色']");
    await driver.wait(async () => await (await element("#dataset-name")).getAttribute("value") === "classification", 10000);
    const importButton = await driver.findElement(By.xpath("//button[normalize-space(.)='导入数据集']"));
    await driver.wait(until.elementIsEnabled(importButton), 15000); await importButton.click();
    await driver.wait(async () => (await driver.findElements(By.css("dialog[open]"))).length === 0, 15000);
    const folders = (await api("/datasets")).datasets;
    const folder = folders.find(item => item.format === "folder_classification");
    assert.equal(folder.labeled_sample_count, 2);
    await (await element("button[aria-label^='图像浏览']")).click();
    await driver.wait(async () => (await driver.findElements(By.css(".iad-sample"))).length === 3, 15000);
    assert.equal((await driver.findElements(By.css("summary[aria-label='标注筛选']"))).length, 0, "目录格式不提供区域标注筛选");
    await (await element("summary[aria-label='原始标签筛选']")).click();
    await (await element("input[aria-label='原始标签 NG']")).click();
    await (await element(".iad-header h1")).click();
    await driver.wait(async () => (await driver.findElements(By.css(".iad-sample"))).length === 1, 15000);
    assert.equal((await driver.findElements(By.css(".iad-floating-menu[open]"))).length, 0, "点击空白关闭筛选");
    await (await element(".iad-sample")).click();
    assert.match(await (await element("dialog [data-field='raw-label']")).getText(), /^NG/);
    await (await element("button[aria-label='关闭图像详情']")).click();
    await button("清除筛选");
    await driver.wait(async () => (await driver.findElements(By.css(".iad-sample"))).length === 3, 15000);
    await (await element("button[aria-label^='数据集管理']")).click();
    await (await element("select[aria-label='目录 NG 角色'] option[value='unlabeled']")).click();
    const saveMapping = await driver.findElement(By.xpath("//button[normalize-space(.)='保存映射并重新扫描']"));
    await driver.wait(until.elementIsEnabled(saveMapping), 15000); await saveMapping.click();
    await driver.wait(async () => (await (await api("/datasets")).datasets.find(item => item.dataset_id === folder.dataset_id)).labeled_sample_count === 1, 15000);
    assert.equal((await driver.findElements(By.css("section[aria-label='当前数据集详情'] [role='alert']"))).length, 0);
    await verifyWorkbenchLayout(driver, path.join(workspace, "runs/browser/folder-layout"), {
      pageLabels: ["数据集管理", "图像浏览"], sizes: [[1366, 768], [375, 812]], zoomLevels: [1, 2],
    });
    await driver.manage().window().setRect({ width: 1440, height: 1100 });
    await (await element("button[aria-label^='数据集管理']")).click();
    const dataset = await api("/datasets/import", { format: "labelme", name: "会话交接", image_dir: path.join(root, "images"), annotation_dir: path.join(root, "labels") });
    await (await element("button[aria-label^='图像浏览']")).click();
    await button("刷新");
    await (await element("select[aria-label='当前数据集'] option[value='" + dataset.dataset_id + "']")).click();
    await delay(5500);
    assert.equal(await (await element("button[aria-label^='图像浏览']")).getAttribute("aria-label"), "图像浏览", "侧栏保留固定名称，不附加待审计统计");
    let job = await api("/knowledge/start", { dataset_id: dataset.dataset_id, kind: "normal", model_name: "test-mllm" });
    assert.equal(await (await element("button[aria-label^='挖掘良品知识']")).getAttribute("aria-label"), "挖掘良品知识");
    await (await element("button[aria-label^='挖掘良品知识']")).click();
    await driver.wait(() => driver.executeScript("return document.querySelector('.iad-workbench h1')?.textContent==='挖掘良品知识'"), 5000);
    await driver.wait(async () => (await (await element(".iad-knowledge-jobs")).getText()).includes("执行中"), 10000, "作业进度在对应页面展示");
    releaseKnowledge();
    while (["PENDING", "RUNNING"].includes(job.status)) { await delay(100); job = await api(`/knowledge/status/${job.run_id}`); }
    assert.equal(job.status, "COMPLETED", JSON.stringify(job));
    await driver.wait(async () => !(await (await element("button[aria-label^='挖掘良品知识']")).getAttribute("aria-label")).includes("运行"), 10000);
    assert.ok((await driver.executeScript("return document.activeElement?.getAttribute('aria-label')"))?.startsWith("挖掘良品知识"), "状态更新保留原生导航按钮的键盘焦点");
    let audit = await api("/audit/start", { dataset_id: dataset.dataset_id, normal_version_id: job.knowledge_version_id, model_name: "test-mllm" });
    while (["PENDING", "RUNNING"].includes(audit.status)) { await delay(100); audit = await api(`/audit/status/${audit.run_id}`); }
    assert.equal(audit.status, "PARTIAL", JSON.stringify(audit));
    assert.equal(audit.failed, 2);
    const failedRun = audit.run_id;
    const auditLabel = async () => (await (await element("button[aria-label^='模型审计']")).getAttribute("aria-label"));
    assert.equal(await auditLabel(), "模型审计", "作业失败不改写导航名称");
    for (const [index, sample_id] of audit.failed_sample_ids.entries()) {
      const since = await driver.executeScript("return performance.now()");
      let retry = await api(`/audit/retry/${failedRun}`, { sample_ids: [sample_id] });
      while (["PENDING", "RUNNING"].includes(retry.status)) { await delay(100); retry = await api(`/audit/status/${retry.run_id}`); }
      assert.equal(retry.status, "COMPLETED", JSON.stringify(retry));
      await driver.wait(() => driver.executeScript("return performance.getEntriesByType('resource').some(e=>e.name.includes('/api/iad/audit/jobs?') && e.responseEnd>arguments[0])", since), 10000);
      const remaining = await api(`/audit/retry/${failedRun}`);
      assert.equal(remaining.samples.length, index === 0 ? 1 : 0, "按真实补审链保留剩余失败范围");
      assert.equal(await auditLabel(), "模型审计");
    }
    const target = await api(`/sample/${encodeURIComponent(dataset.dataset_id + ":part-2.png")}`);
    await button("刷新"); await (await element("button[aria-label^='图像浏览']")).click();
    await (await element("img[alt='part-2.png']")).click();
    await (await element("button[title='放大图像']")).click(); await (await element("button[aria-label='定位 ROI 1']")).click();
    await (await element(".iad-viewer-viewport")).sendKeys("\uE012");
    const geometry = () => driver.executeScript(`const world=document.querySelector('.iad-viewer-world'),viewport=document.querySelector('.iad-viewer-viewport'),image=world.querySelector('img');const w=world.getBoundingClientRect(),v=viewport.getBoundingClientRect();return {scale:Number(world.dataset.scale),center:[(v.left+v.width/2-w.left)*image.naturalWidth/w.width,(v.top+v.height/2-w.top)*image.naturalHeight/w.height]};`);
    const before = await geometry();
    await button("向 Agent 追问"); await (await element("textarea[aria-label='追问内容']")).sendKeys("这个区域是否可能只是反光？请将“均匀亮度变化可能正常，需结合位置核验”作为判据修订候选，核对真实图像后重新挖掘良品知识并审计这张图。");
    await fs.mkdir(path.join(workspace, "runs/browser/session-handoff"), { recursive: true });
    await fs.writeFile(path.join(workspace, "runs/browser/session-handoff/question.png"), await driver.takeScreenshot(), "base64");
    await button("发送到会话");
    await driver.wait(() => agentCompleted, 15000);
    assert.equal((await driver.findElements(By.css(".iad-workbench"))).length, 0, "Open the actual host conversation");
    const finalImages = agentRequests.at(-1).messages.flatMap(message => Array.isArray(message.content) ? message.content.filter(item => item.type === "image_url") : []);
    assert.equal(finalImages.length, 2, "Actual full image and ROI must reach the Session MLLM");
    assert.deepEqual(finalImages.map(image => createHash("sha256").update(Buffer.from(image.image_url.url.split(",")[1], "base64")).digest("hex")),
      [target.suggestion.analysis.overview.sha256, target.suggestion.analysis.regions[0].image.sha256]);
    const userInput = agentRequests[0].messages.find(message => message.role === "user").content;
    const prompt = typeof userInput === "string" ? userInput : userInput.filter(part => part.type === "text").map(part => part.text).join("\n");
    const inspectionRoute = JSON.parse(new URL(prompt.split("返回检视：")[1].split("\n")[0]).searchParams.get("iad"));
    const sessionId = inspectionRoute.inspection.sessionId;
    const executions = toolMessages(agentRequests.at(-1)).filter(message => ["knowledge_mine_normal", "model_audit_start"].includes(message.name)).map(message => JSON.parse(message.content));
    assert.equal(executions.length, 2);
    const revisionBase = JSON.parse(toolMessages(agentRequests.at(-1)).find(message => message.name === "knowledge_get").content).knowledge;
    const revisionJob = await api(`/knowledge/status/${executions[0].run_id}`);
    const revisedKnowledge = (await api(`/knowledge?version_id=${revisionJob.knowledge_version_id}`)).knowledge;
    assert.equal(revisedKnowledge.parent_version_id, revisionBase.version_id);
    assert.deepEqual(revisedKnowledge.corrections, [{ check_id: revisionBase.checks[0].check_id, instruction: "均匀亮度变化可能正常，需结合位置核验" }]);
    for (const execution of executions) assert.equal(execution.origin_session_id, sessionId, "Jobs must retain their actual initiating Session");
    const latest = await api(`/sample/${encodeURIComponent(target.sample.sample_id)}`);
    const latestContext = await api("/inspection/context", { dataset_id: dataset.dataset_id, sample_id: target.sample.sample_id, suggestion_id: latest.suggestion.suggestion_id });
    assert.equal(latestContext.origin_session_id, sessionId, "A saved audit suggestion must retain its initiating Session");
    assert.notEqual((await api(`/sample/${encodeURIComponent(target.sample.sample_id)}`)).suggestion.suggestion_id, target.suggestion.suggestion_id);
    const back = await driver.wait(until.elementLocated(By.css("a[href*='?iad=']")), 15000);
    const windows = await driver.getAllWindowHandles(); await back.click();
    await driver.wait(async () => (await driver.getAllWindowHandles()).length > windows.length || (await driver.findElements(By.css(".iad-workbench"))).length > 0, 10000);
    const returned = (await driver.getAllWindowHandles()).find(id => !windows.includes(id)); if (returned) await driver.switchTo().window(returned);
    await element(".iad-inspection-region");
    const world = await element(".iad-viewer-world");
    await driver.wait(async () => Number(await world.getAttribute("data-scale")) > 0, 5000);
    const after = await geometry();
    assert.ok(Math.abs(after.scale - before.scale) < 1e-9, JSON.stringify({before,after}));
    assert.ok(after.center.every((value,index) => Math.abs(value-before.center[index]) < 0.01), JSON.stringify({before,after}));
    assert.equal(await (await element(".iad-inspection-region")).getAttribute("data-evidence-id"), target.suggestion.analysis.regions[0].image.evidence_id);
    assert.ok((await (await element(".iad-inspection-panel")).getText()).includes("历史建议"));
    assert.ok((await (await element(".iad-inspection-region img")).getAttribute("src")).includes(target.suggestion.suggestion_id));
    await fs.writeFile(path.join(workspace, "runs/browser/session-handoff/returned.png"), await driver.takeScreenshot(), "base64");
    const roiPath = path.join(root, "cache/visual-evidence", target.suggestion.analysis.regions[0].image.sha256 + ".png");
    const requestCount = agentRequests.length;
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
    await (await element("button[aria-label='关闭图像详情']")).click();
    for (const [index, label] of ["挖掘良品知识", "模型审计"].entries()) {
      await (await element(`button[aria-label^='${label}']`)).click();
      if (index) await button("模型审计作业");
      if (index) {
        const versions = await element("select[aria-label='审计良品知识版本']");
        await driver.wait(() => versions.isEnabled(), 5000);
        await (await element(`select[aria-label='审计良品知识版本'] option[value='${executions[index].normal_version_id}']`)).click();
        await driver.navigate().refresh();
        await driver.wait(async () => await (await element("select[aria-label='审计良品知识版本']")).getAttribute("value") === executions[index].normal_version_id, 5000);
        const selectedVersion = JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get("iad"));
        assert.equal(selectedVersion.normalVersion, executions[index].normal_version_id);
        assert.equal(selectedVersion.defectVersion, "");
        assert.equal(agentRequests.length, requestCount, "原生宿主知识选择与刷新不重新运行模型");
      }
      const card = await element(`article[data-job-id='${executions[index].run_id}']`);
      await card.findElement(By.xpath(".//button[normalize-space(.)='返回发起会话']")).click();
      await driver.wait(async () => (await driver.findElements(By.css(".iad-workbench"))).length === 0, 5000);
      assert.ok((await driver.findElement(By.css("body")).getText()).includes("这个区域是否可能只是反光"), "Return to the actual original conversation");
      assert.equal(agentRequests.length, requestCount, "Returning to the initiating Session must not submit another message");
    }
    async function openToolResult(selector) {
      await button("Chat");
      for (const group of await driver.findElements(By.xpath("//button[contains(., 'Completed') and @aria-expanded='false']"))) await group.click();
      for (const group of await driver.findElements(By.xpath("//button[contains(., 'Called tools') and @aria-expanded='false']"))) await group.click();
      const link = await element(selector);
      await driver.executeScript("arguments[0].scrollIntoView({block:'center'})", link);
      await fs.writeFile(path.join(workspace, "runs/browser/session-handoff/tool-results.png"), await driver.takeScreenshot(), "base64");
      await link.click();
    }
    for (const execution of executions) {
      await openToolResult(`button[data-iad-run-id='${execution.run_id}']`);
      const card = await element(`article[data-job-id='${execution.run_id}']`);
      assert.equal(await card.getAttribute("aria-current"), "true");
      await card.findElement(By.xpath(".//button[normalize-space(.)='返回发起会话']")).click();
      await driver.wait(async () => (await driver.findElements(By.css(".iad-workbench"))).length === 0, 5000);
      assert.equal(agentRequests.length, requestCount);
    }
    const knowledgeJob = toolMessages(agentRequests.at(-1)).filter(message => message.name === "knowledge_job_status").map(message => JSON.parse(message.content)).at(-1);
    await openToolResult(`button[data-iad-version-id='${knowledgeJob.knowledge_version_id}']`);
    await driver.wait(async () => (await (await element("select[aria-label='知识版本']")).getAttribute("value")) === knowledgeJob.knowledge_version_id, 10000, "等待异步版本选项加载并选中会话指定版本");
    assert.equal(JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get("iad")).datasetId, dataset.dataset_id);
    await driver.navigate().back();
    await driver.wait(async () => (await driver.findElements(By.css(".iad-workbench"))).length === 0, 5000);
    await openToolResult(".iad-tool-card[data-iad-tool='dataset_report'] button[data-iad-page='industrial-audit']");
    await element(".iad-quality-report");
    const report = await api(`/report/${dataset.task_id}?dataset_id=${dataset.dataset_id}`);
    assert.equal(report.vlm_audited_count, 3);
    assert.ok((await (await element(".iad-quality-report")).getText()).includes("3 / 3"));
    await driver.navigate().back();
    await driver.wait(async () => (await driver.findElements(By.css(".iad-workbench"))).length === 0, 5000);
    await openToolResult(".iad-tool-card[data-iad-tool='dataset_report'] button[data-iad-page='industrial-images']");
    await element("img[alt='part-2.png']");
    assert.equal(JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get("iad")).datasetId, dataset.dataset_id);
    assert.equal(agentRequests.length, requestCount, "Tool result navigation and browser Back do not run the model again");
    execFileSync(resolvePythonPath(), ["-c", `
from pathlib import Path
from PIL import Image
import json,sys
root=Path(sys.argv[1]);root.mkdir()
for i in range(26): Image.new('RGB',(320,240),(20+i,80,120)).save(root/f'sequence-{i:02}.png')
Image.new('RGB',(320,240),'red').save(root/'zz-excluded.png')
(root/'zz-excluded.json').write_text(json.dumps({'imageWidth':320,'imageHeight':240,'shapes':[{'label':'排除标注','shape_type':'rectangle','points':[[10,10],[20,20]]}]}))
`, path.join(root,"sequence")]);
    const sequence = await api("/datasets/import", { format: "labelme", name: "跨页图像", image_dir: path.join(root,"sequence"), annotation_dir: path.join(root,"sequence") });
    await button("刷新");
    await (await element("select[aria-label='当前数据集'] option[value='" + sequence.dataset_id + "']")).click();
    assert.equal(await (await element("button[aria-label^='图像浏览']")).getAttribute("aria-label"), "图像浏览", "切换数据集仍使用固定导航名称");
    assert.equal(await (await element("button[aria-label^='挖掘良品知识']")).getAttribute("aria-label"), "挖掘良品知识", "无近期作业不能推断未曾发布知识，且不能继承另一数据集状态");
    await driver.manage().window().setRect({ width: 1440, height: 768 });
    await (await element("summary[aria-label='标注筛选']")).click();
    await (await element("input[aria-label='无标注']")).click();
    await (await element("summary[aria-label='标注筛选']")).click();
    await (await element("img[alt='sequence-23.png']")).click();
    await (await element("button[title='放大图像']")).click();
    async function stepImage(label, name, page) {
      const control = await driver.findElement(By.xpath(`//button[normalize-space(.)='${label}']`));
      await driver.wait(() => control.isEnabled(), 5000); await control.click();
      await driver.wait(async () => (await (await element(".iad-lightbox-toolbar strong")).getText()) === name, 5000);
      const route = JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get("iad"));
      assert.equal(route.page, page); assert.deepEqual(route.filters.annotation_filters, ["none"]);
      assert.equal(route.datasetId, sequence.dataset_id);
      assert.equal(await (await element("select[aria-label='缩放']")).getAttribute("value"), "0");
    }
    await stepImage("后一张", "sequence-24.png", 2);
    await driver.wait(async () => await driver.executeScript("return document.querySelector('.iad-viewer-world img').naturalWidth===320"),5000);
    assert.deepEqual(await driver.executeScript("const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const c=canvas.getContext('2d');c.drawImage(document.querySelector('.iad-viewer-world img'),0,0);return [...c.getImageData(0,0,1,1).data]"), [44,80,120,255], "跨页必须展示当前图的真实像素");
    await stepImage("后一张", "sequence-25.png", 2);
    assert.equal(await (await driver.findElement(By.xpath("//button[normalize-space(.)='后一张']"))).isEnabled(), false, "标注过滤后的最后一张不能进入被排除图像");
    await stepImage("前一张", "sequence-24.png", 2);
    await stepImage("前一张", "sequence-23.png", 1);
    await fs.writeFile(path.join(workspace, "runs/browser/session-handoff/image-sequence.png"), await driver.takeScreenshot(), "base64");
    await button("关闭");
    assert.equal(await driver.executeScript("return document.activeElement?.getAttribute('title')"), "放大图像", "跨页后关闭查看器回到当前图的来源按钮");
    await (await element("button[title='放大图像']")).click();
    const nextImage = await driver.findElement(By.xpath("//button[normalize-space(.)='后一张']"));
    await driver.wait(() => nextImage.isEnabled(), 5000);
    const closeImage = await driver.findElement(By.xpath("//dialog[contains(@class,'iad-viewer-dialog')]//button[normalize-space(.)='关闭']"));
    await driver.executeScript("arguments[0].click();arguments[1].click()", nextImage, closeImage);
    await api(`/samples/${sequence.task_id}?dataset_id=${sequence.dataset_id}&page=2`);
    assert.equal((await driver.findElements(By.css(".iad-viewer-dialog[open]"))).length, 0);
    assert.equal(JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get("iad")).page, 1, "关闭时取消未完成的跨页请求");
    assert.equal(await (await element("[data-field='image-name']")).getText(), "sequence-23.png");
    await (await element("button[aria-label='关闭图像详情']")).click();
    assert.equal(await driver.executeScript("return document.activeElement?.closest('.iad-sample')?.querySelector('strong')?.textContent"), "sequence-23.png", "关闭详情后焦点回到当前缩略图");
    const browseTop = await driver.executeScript("return document.querySelector('.iad-workbench').scrollTop");
    assert.ok(browseTop > 0, "当前缩略图位于滚动后的浏览位置");
    await (await element("button[aria-label^='数据集管理']")).click();
    await (await element("button[aria-label^='图像浏览']")).click();
    await element("img[alt='sequence-23.png']");
    await driver.wait(async () => Math.abs(await driver.executeScript("return document.querySelector('.iad-workbench').scrollTop") - browseTop) < 2, 5000, "切页返回恢复当前数据集的浏览位置");
    await (await element("select[aria-label='当前数据集'] option[value='" + dataset.dataset_id + "']")).click();
    await element("img[alt='part-2.png']");
    await (await element("select[aria-label='当前数据集'] option[value='" + sequence.dataset_id + "']")).click();
    await element("img[alt='sequence-23.png']");
    await driver.wait(async () => Math.abs(await driver.executeScript("return document.querySelector('.iad-workbench').scrollTop") - browseTop) < 2, 5000, "切换数据集后恢复各自浏览位置");
    await (await element("input[aria-label='按文件名搜索']")).sendKeys("sequence-2");
    await (await element("img[alt='sequence-20.png']")).click();
    await (await element("button[title='放大图像']")).click();
    assert.equal(await (await driver.findElement(By.xpath("//button[normalize-space(.)='前一张']"))).isEnabled(), false, "按当前搜索范围定位第一张");
    await stepImage("后一张", "sequence-21.png", 1);
    assert.equal(JSON.parse(new URL(await driver.getCurrentUrl()).searchParams.get("iad")).filters.search, "sequence-2");
    assert.equal(agentRequests.length, requestCount, "跨页与筛选切图不启动模型");
    await button("关闭"); await (await element("button[aria-label='关闭图像详情']")).click();
    await driver.manage().window().setRect({ width: 1440, height: 1100 });
    await (await element("select[aria-label='当前数据集'] option[value='" + dataset.dataset_id + "']")).click();
    let defect = await api("/knowledge/start", { dataset_id: dataset.dataset_id, kind: "defect", normal_version_id: knowledgeJob.knowledge_version_id, model_name: "test-mllm" });
    while (["PENDING", "RUNNING"].includes(defect.status)) { await delay(100); defect = await api(`/knowledge/status/${defect.run_id}`); }
    assert.equal(defect.status, "COMPLETED", JSON.stringify(defect));
    await button("刷新");
    await verifyWorkbenchSurfaces(driver, path.join(workspace, "runs/browser/native-surfaces"));
    await verifyWorkbenchLayout(driver, path.join(workspace, "runs/browser/native-layout"));
    assert.equal(agentRequests.length, requestCount, "布局验收不调用Agent模型");
  } catch (error) {
    await fs.mkdir(path.join(workspace, "runs/browser/session-handoff"), { recursive: true });
    if (driver) {
      await fs.writeFile(path.join(workspace, "runs/browser/session-handoff/failure.png"), await driver.takeScreenshot(), "base64");
      console.error(JSON.stringify({ agentRequests: agentRequests.length, buttons: await driver.executeScript("return [...document.querySelectorAll('button')].map(b=>({text:b.textContent,expanded:b.getAttribute('aria-expanded')})).filter(b=>b.text||b.expanded)"), page: (await driver.findElement(By.css("body")).getText()).slice(-2200) }));
    }
    console.error(log.slice(-2200).replace(/(token=)[^\s&]+/g, "$1<redacted>"));
    throw error;
  } finally {
    releaseKnowledge();
    await driver?.quit(); host.kill("SIGTERM");
    await Promise.race([new Promise(resolve => host.once("exit", resolve)), delay(3000)]);
    if (host.exitCode === null) host.kill("SIGKILL");
    model.closeAllConnections(); await new Promise(resolve => model.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});
