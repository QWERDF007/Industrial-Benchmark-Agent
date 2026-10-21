import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { PythonBridge, createIadHttpHandler } from "../lib/server/index.js";

test("real bridge: Labelme import, composed filters and human session submission", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-workbench-"));
  const images = path.join(root, "images"), labels = path.join(root, "labels");
  await fs.mkdir(images); await fs.mkdir(labels);
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=", "base64");
  await fs.writeFile(path.join(images, "good.png"), png);
  const bridge = new PythonBridge({ cwd: process.cwd().endsWith("iad-harness") ? path.resolve("../..") : process.cwd(), dbPath: path.join(root, "test.db") });
  const server = http.createServer(createIadHttpHandler(bridge));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/iad`;
  const post = (url, body) => fetch(base + url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  try {
    const invalidFmt = await post("/datasets/import", { format: "invalid", name: "bad", image_dir: images, annotation_dir: labels });
    assert.equal(invalidFmt.status, 422);
    const missingFmt = await post("/datasets/import", { name: "no-format", image_dir: images, annotation_dir: labels });
    assert.equal(missingFmt.status, 422);
    const imported = await post("/datasets/import", { format: "labelme", name: "Test dataset", image_dir: images, annotation_dir: labels });
    assert.equal(imported.status, 200, await imported.clone().text());
    const dataset = await imported.json();
    assert.equal(dataset.format, "labelme");
    const response = await fetch(`${base}/samples/${dataset.task_id}?dataset_id=${dataset.dataset_id}&annotation_filters=${encodeURIComponent(JSON.stringify(["none"]))}`);
    const samples = await response.json();
    assert.equal(samples.total, 1);
    execFileSync(bridge.pythonPath,["-c",`
import sqlite3,sys
conn=sqlite3.connect(sys.argv[1])
conn.executescript('''DROP VIEW current_review_decisions; DROP TABLE review_decisions;
CREATE TABLE review_decisions (
 id INTEGER PRIMARY KEY AUTOINCREMENT,sample_id TEXT NOT NULL,decision TEXT NOT NULL,
 reviewer TEXT NOT NULL,reason_code TEXT,comment TEXT,evidence_version TEXT DEFAULT 'v2',
 review_session_id TEXT,started_at TIMESTAMP,submitted_at TIMESTAMP,review_duration_ms INTEGER DEFAULT 0,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(sample_id,reviewer));''')
conn.execute("INSERT INTO review_decisions (id,sample_id,reviewer,decision,comment,submitted_at) VALUES (7,?,'alice','HARD_NORMAL','既有人审','2020-01-01T00:00:00Z')",(sys.argv[2],))
conn.commit();conn.close()
`,path.join(root,"test.db"),samples.items[0].sample_id]);
    const migrated=await (await fetch(`${base}/sample/${encodeURIComponent(samples.items[0].sample_id)}`)).json();
    assert.equal(migrated.review_history.length,1,"迁移只保留真实既有记录，不补造历史");
    assert.equal(migrated.review_history[0].comment,"既有人审");
    assert.equal(migrated.review_history[0].submitted_at,"2020-01-01T00:00:00Z");
    const legacyId=migrated.review_history[0].decision_id;
    const submission={ submission_id:randomUUID(),dataset_id:dataset.dataset_id,reviewer:"alice",sample_id:samples.items[0].sample_id,decision:"PASS",comment:"human confirmed",duration_ms:1300 };
    const decision = await post("/review/submit", submission);
    assert.equal(decision.status, 200, await decision.clone().text());
    const first=await decision.json();
    const repeated=await Promise.all([post("/review/submit",submission),post("/review/submit",submission)]);
    for(const response of repeated){assert.equal(response.status,200,await response.clone().text());assert.deepEqual(await response.json(),first,"相同提交标识必须返回已持久化原结果");}
    const conflict=await post("/review/submit",{...submission,decision:"FAIL"});
    assert.equal(conflict.status,422,"同一个提交标识不能改写内容");
    const corrected = await post("/review/submit", { ...submission,submission_id:randomUUID(),decision: "FAIL", comment: "近看确认异常" });
    assert.equal(corrected.status,200,await corrected.clone().text());
    const invalid = await post("/review/submit", {...submission,submission_id:randomUUID(),sample_id:"invented"});
    assert.equal(invalid.status, 404);
    const detail = await (await fetch(`${base}/sample/${encodeURIComponent(samples.items[0].sample_id)}`)).json();
    assert.equal(detail.sample.quality_status, "UNCERTAIN");
    assert.equal(detail.review_decision.decision, "FAIL");
    assert.deepEqual(detail.review_history.map(record=>[record.decision,record.comment]),[["FAIL","近看确认异常"],["PASS","human confirmed"],["HARD_NORMAL","既有人审"]],"人工更正必须保留原裁决");
    assert.equal(detail.review_history[2].decision_id,legacyId,"重复初始化不能改变迁移记录身份");
    assert.notEqual(detail.review_history[0].decision_id,detail.review_history[1].decision_id);
    assert.deepEqual((await (await fetch(base+"/datasets")).json()).datasets[0].reference_sample_ids,[],"旧正常裁决不能使已更正异常继续进入良品参考");
    const report = await (await fetch(`${base}/report/${dataset.task_id}?dataset_id=${dataset.dataset_id}`)).json();
    assert.equal(report.quality.technical_usability.percent, 100);
    assert.equal(report.quality.human_verification_coverage.percent, 100);
    assert.equal(report.quality.audit_coverage.percent, 0);
    assert.equal(report.human_fail_count,1);
    const blocked={...submission,submission_id:randomUUID(),decision:"UNCERTAIN",comment:"事务恢复"};
    execFileSync(bridge.pythonPath,["-c","import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.execute(\"CREATE TRIGGER fail_review_session BEFORE INSERT ON review_sessions BEGIN SELECT RAISE(ABORT,'injected session storage failure'); END\"); c.commit(); c.close()",path.join(root,"test.db")]);
    assert.equal((await post("/review/submit",blocked)).status,500);
    assert.equal((await (await fetch(`${base}/sample/${encodeURIComponent(samples.items[0].sample_id)}`)).json()).review_history.length,3,"会话存储失败时裁决必须一起回滚");
    execFileSync(bridge.pythonPath,["-c","import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.execute('DROP TRIGGER fail_review_session'); c.commit(); c.close()",path.join(root,"test.db")]);
    assert.equal((await post("/review/submit",blocked)).status,200,"故障修复后可使用原提交标识重试");
    const history=await fetch(`${base}/review/history?dataset_id=${dataset.dataset_id}&page_size=2`);
    assert.equal(history.status,200,await history.clone().text());
    const records=await history.json();
    assert.equal(records.total,4);
    assert.deepEqual(records.items.map(item=>[item.decision,item.relative_path]),[["UNCERTAIN","good.png"],["FAIL","good.png"]]);
    const older=await (await fetch(`${base}/review/history?dataset_id=${dataset.dataset_id}&page_size=2&page=2`)).json();
    assert.deepEqual(older.items.map(item=>item.decision),["PASS","HARD_NORMAL"]);
    const searched=await (await fetch(`${base}/review/history?dataset_id=${dataset.dataset_id}&search=${encodeURIComponent("既有人审")}`)).json();
    assert.equal(searched.total,1);assert.equal(searched.items[0].decision_id,legacyId);
    assert.equal((await fetch(`${base}/review/history?dataset_id=${dataset.dataset_id}&page=0`)).status,422);
    const otherImages=path.join(root,"other-images");await fs.mkdir(otherImages);await fs.writeFile(path.join(otherImages,"other.png"),png);
    const otherImport=await post("/datasets/import",{format:"labelme",name:"Other dataset",image_dir:otherImages,annotation_dir:labels});
    assert.equal(otherImport.status,200,await otherImport.clone().text());
    const other=await otherImport.json();
    assert.equal(other.format,"labelme");
    const isolated=await (await fetch(`${base}/review/history?dataset_id=${other.dataset_id}`)).json();
    assert.equal(isolated.total,0,"不同数据集不能读取本数据集的人工历史");
    const badImport = await post("/datasets/import", { format: "labelme", name: "broken", image_dir: "/does-not-exist", annotation_dir: labels });
    assert.equal(badImport.status, 404);
    assert.equal((await (await fetch(base + "/datasets")).json()).datasets.length, 2);

    // Folder classification preview and import
    const folderRoot = path.join(root, "folder-test");
    await fs.mkdir(path.join(folderRoot, "OK"), { recursive: true });
    await fs.mkdir(path.join(folderRoot, "NG"), { recursive: true });
    await fs.writeFile(path.join(folderRoot, "OK/1.png"), png);
    await fs.writeFile(path.join(folderRoot, "NG/2.png"), png);
    const prevRes = await post("/datasets/preview", { root_dir: folderRoot });
    assert.equal(prevRes.status, 200);
    const prevData = await prevRes.json();
    assert.equal(prevData.format, "folder_classification");
    assert.equal(prevData.total_images, 2);
    const folderImport = await post("/datasets/import", {
      format: "folder_classification",
      name: "目录异常分类",
      root_dir: folderRoot,
      rules: prevData.items.map(i => ({ path: i.path, role: i.suggested_role })),
      preview_fingerprint: prevData.preview_fingerprint,
    });
    assert.equal(folderImport.status, 200, await folderImport.clone().text());
    const folderDs = await folderImport.json();
    assert.equal(folderDs.format, "folder_classification");
    assert.equal(folderDs.total_samples, 2);
    assert.equal(folderDs.annotation_count, 0);
    assert.equal(folderDs.labeled_sample_count, 2);
    assert.equal((await (await fetch(base + "/datasets")).json()).datasets.length, 3);
  } finally {
    bridge.destroy();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("real bridge: normal mining publishes knowledge and serves its actual visual evidence", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-knowledge-"));
  const images = path.join(root, "images"), labels = path.join(root, "labels");
  await fs.mkdir(images); await fs.mkdir(labels);
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=", "base64");
  for (let index=0;index<10;index++) await fs.writeFile(path.join(images, `candidate-${index}.png`), png);
  let visualEvidence;
  const modelRequests = [];
  const model = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const requestBody = Buffer.concat(chunks).toString();
    modelRequests.push(requestBody);
    const body = JSON.parse(requestBody);
    const content = body.messages[0].content;
    const text = content.find(item => item.type === "text" && item.text.startsWith("视觉证据："));
    visualEvidence = JSON.parse(text.text.slice("视觉证据：".length));
    const response = req.url === "/tokenize" ? { count: 1000, max_model_len: 262144 } : {
      choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
        summary: "该来源无法支持结构判据", checks: [], suspects: [], limitations: ["输入仅一个像素"],
      }) } }],
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(response));
  });
  await new Promise(resolve => model.listen(0, "127.0.0.1", resolve));
  const previousEndpoint = process.env.LIVE_VLM_ENDPOINT;
  const previousCapacity=process.env.LIVE_VLM_CAPACITY_MODE;process.env.LIVE_VLM_CAPACITY_MODE="vllm_tokenize";
  const previousModel = process.env.LIVE_VLM_MODEL; process.env.LIVE_VLM_MODEL = "test-mllm";
  process.env.LIVE_VLM_ENDPOINT = `http://127.0.0.1:${model.address().port}/v1`;
  const bridge = new PythonBridge({ cwd: process.cwd().endsWith("iad-harness") ? path.resolve("../..") : process.cwd(), dbPath: path.join(root, "test.db") });
  const server = http.createServer(createIadHttpHandler(bridge));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/iad`;
  const post = (url, body) => fetch(base + url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  try {
    const imported = await post("/datasets/import", { format: "labelme", name: "Knowledge inputs", image_dir: images, annotation_dir: labels });
    assert.equal(imported.status, 200, await imported.clone().text());
    const dataset = await imported.json();
    assert.equal(dataset.reference_sample_ids.length, 10, "管理页候选必须覆盖全部来源，不能只返回默认4张预览");
    const selected = dataset.reference_sample_ids.slice(1);
    const selectReferences = await fetch(`${base}/datasets/${dataset.dataset_id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ reference_sample_ids: selected }) });
    assert.equal(selectReferences.status, 200, await selectReferences.clone().text());
    assert.deepEqual((await selectReferences.json()).reference_sample_ids, selected);
    for (const [status, total] of [["candidate", 9], ["excluded", 1]]) {
      const filtered = await fetch(`${base}/samples/${dataset.task_id}?dataset_id=${dataset.dataset_id}&reference_status=${status}`);
      assert.equal(filtered.status, 200, await filtered.clone().text());
      assert.equal((await filtered.json()).total, total, "良品来源筛选使用真实资格而非标注有无");
    }

    execFileSync(bridge.pythonPath, ["-c", "import sqlite3,sys; conn=sqlite3.connect(sys.argv[1]); conn.execute('ALTER TABLE datasets DROP COLUMN reference_selection_set'); conn.commit(); conn.close()", path.join(root,"test.db")]);
    const migrated = (await (await fetch(base+"/datasets")).json()).datasets[0];
    assert.equal(migrated.reference_mode,"selected","旧数据库的人工参考组必须保留其选择语义");
    assert.deepEqual(migrated.reference_sample_ids,selected);
    const invalid = await fetch(`${base}/datasets/${dataset.dataset_id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference_sample_ids:["unknown"]})});
    assert.equal(invalid.status,422);
    assert.deepEqual((await (await fetch(base+"/datasets")).json()).datasets[0].reference_sample_ids,selected);
    const initial = await fetch(`${base}/knowledge?dataset_id=${dataset.dataset_id}&kind=normal`);
    assert.equal(initial.status, 200, await initial.clone().text());
    assert.equal((await initial.json()).knowledge, null);
    const chosen = (await (await fetch(`${base}/knowledge/sources?dataset_id=${dataset.dataset_id}&kind=normal`)).json()).items.map(item => item.sample_id);
    const started = await post("/knowledge/start", { kind: "normal", image_count: chosen.length, images: chosen });
    assert.equal(started.status, 200, await started.clone().text());
    let job = await started.json();
    const deadline = Date.now() + 5000;
    while (["PENDING", "RUNNING"].includes(job.status) && Date.now() < deadline) {
      await delay(20);
      job = await (await fetch(`${base}/knowledge/status/${job.run_id}`)).json();
    }
    assert.equal(job.status, "COMPLETED", JSON.stringify(job));
    assert.equal(job.completed, 9);
    assert.deepEqual(job.model_calls.map(call => call.operation), ["tokenize", "generate"]);
    for (const [index, call] of job.model_calls.entries()) {
      const response = await fetch(`${base}/jobs/${job.run_id}/model-calls/${call.call_id}`);
      assert.equal(response.status, 200, await response.clone().text());
      const detail = await response.json();
      assert.equal(detail.request_body, modelRequests[index]);
      assert.equal(detail.http_status, 200);
      assert.equal(detail.usage, null);
      assert.ok(detail.response_body);
    }
    assert.equal((await fetch(`${base}/jobs/not-this-job/model-calls/${job.model_calls[0].call_id}`)).status, 404);
    const knowledge = (await (await fetch(`${base}/knowledge?version_id=${job.knowledge_version_id}`)).json()).knowledge;
    assert.equal(knowledge.summary, "该来源无法支持结构判据");
    assert.deepEqual(knowledge.sources.map(source=>source.sample_id), selected, "排除的参考不得继续进入正常知识");
    const evidence = await fetch(`${base}/knowledge/evidence/${knowledge.version_id}/${visualEvidence.evidence_id}`);
    assert.equal(evidence.status, 200, await evidence.clone().text());
    assert.equal(evidence.headers.get("content-type"), "image/png");
    assert.deepEqual(Buffer.from(await evidence.arrayBuffer()).subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jobs = await (await fetch(`${base}/knowledge/jobs?dataset_id=${dataset.dataset_id}`)).json();
    assert.equal(jobs.jobs[0].run_id, job.run_id);
    const missing = await fetch(`${base}/knowledge/evidence/${knowledge.version_id}/invented`);
    assert.equal(missing.status, 404);
    const clear = await fetch(`${base}/datasets/${dataset.dataset_id}`, { method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference_sample_ids:[]}) });
    assert.equal(clear.status,200,await clear.clone().text());
    assert.deepEqual((await clear.json()).reference_sample_ids,[]);
    const emptyDataset = (await (await fetch(base+"/datasets")).json()).datasets[0];
    assert.equal(emptyDataset.reference_mode,"selected");
    assert.deepEqual(emptyDataset.reference_sample_ids,[]);
    const noSources = await post("/knowledge/start",{kind:"normal",image_count:chosen.length,images:chosen});
    assert.equal(noSources.status,422,"显式空集合不能回退为全部无标注图");
    const reset = await fetch(`${base}/datasets/${dataset.dataset_id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({reset_references:true})});
    assert.equal(reset.status,200,await reset.clone().text());
    assert.equal((await reset.json()).reference_sample_ids.length,10);
    assert.equal((await (await fetch(`${base}/sample/${encodeURIComponent(dataset.reference_sample_ids[0])}`)).json()).review_decision,null,"资格编辑不生成人工裁决");
  } finally {
    bridge.destroy();
    if (previousEndpoint === undefined) delete process.env.LIVE_VLM_ENDPOINT;
    else process.env.LIVE_VLM_ENDPOINT = previousEndpoint;
    if(previousCapacity===undefined)delete process.env.LIVE_VLM_CAPACITY_MODE;else process.env.LIVE_VLM_CAPACITY_MODE=previousCapacity;
    if (previousModel === undefined) delete process.env.LIVE_VLM_MODEL; else process.env.LIVE_VLM_MODEL = previousModel;
    await new Promise(resolve => server.close(resolve));
    await new Promise(resolve => model.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("real bridge: cancellation stays requested until the model call returns", { timeout: 15000 }, async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-job-cancel-"));
  const images = path.join(root,"images"), labels = path.join(root,"labels");
  await fs.mkdir(images); await fs.mkdir(labels);
  await fs.writeFile(path.join(images,"normal.png"),Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=","base64"));
  let release, entered;
  const waiting = new Promise(resolve=>{entered=resolve;});
  const model = http.createServer(async(req,res)=>{
    for await(const chunk of req) { /* Consume the actual MLLM request. */ }
    if(req.url.endsWith("/tokenize")){res.end(JSON.stringify({count:1000,max_model_len:262144}));return;}
    entered(); await new Promise(resolve=>{release=resolve;});
    res.setHeader("Content-Type","application/json");res.end(JSON.stringify({choices:[{message:{content:JSON.stringify({summary:"像素不足",checks:[],suspects:[],limitations:["无法判断结构"]})}}]}));
  });
  await new Promise(resolve=>model.listen(0,"127.0.0.1",resolve));
  const previousEndpoint=process.env.LIVE_VLM_ENDPOINT;
  const previousCapacity=process.env.LIVE_VLM_CAPACITY_MODE;process.env.LIVE_VLM_CAPACITY_MODE="vllm_tokenize";
  const previousModel=process.env.LIVE_VLM_MODEL;process.env.LIVE_VLM_MODEL="test-model";
  process.env.LIVE_VLM_ENDPOINT=`http://127.0.0.1:${model.address().port}/v1`;
  const bridge=new PythonBridge({cwd:process.cwd().endsWith("iad-harness")?path.resolve("../.."):process.cwd(),dbPath:path.join(root,"test.db")});
  const server=http.createServer(createIadHttpHandler(bridge));
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/iad`;
  const post=(url,body)=>fetch(base+url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  try {
    const imported=await post("/datasets/import",{format:"labelme",name:"Cancellation",image_dir:images,annotation_dir:labels});
    assert.equal(imported.status,200,await imported.clone().text());const dataset=await imported.json();
    const chosen=(await(await fetch(`${base}/knowledge/sources?dataset_id=${dataset.dataset_id}&kind=normal`)).json()).items.map(item=>item.sample_id);
    const started=await post("/knowledge/start",{kind:"normal",image_count:chosen.length,images:chosen});
    assert.equal(started.status,200,await started.clone().text());const job=await started.json();
    await Promise.race([waiting,delay(5000).then(()=>{throw new Error("Model request did not arrive");})]);
    const cancellation=await post(`/knowledge/cancel/${job.run_id}`,{});
    assert.equal(cancellation.status,200,await cancellation.clone().text());const requested=await cancellation.json();
    assert.equal(requested.status,"RUNNING");
    assert.equal(requested.cancel_requested,true,"停止请求必须是持久化字段，不能靠解析消息判断");
    const listed=(await(await fetch(`${base}/knowledge/jobs?dataset_id=${dataset.dataset_id}`)).json()).jobs[0];
    assert.equal(listed.cancel_requested,true);assert.equal(listed.unprocessed,1);
    assert.equal(listed.model_calls.at(-1).finished_at,null,"当前真实HTTP请求尚未返回");
    release();release=undefined;
    let finished;const deadline=Date.now()+5000;
    do{finished=await(await fetch(`${base}/knowledge/status/${job.run_id}`)).json();if(finished.status!=="RUNNING")break;await delay(20);}while(Date.now()<deadline);
    assert.equal(finished.status,"CANCELLED");assert.equal(finished.cancel_requested,true);
    assert.equal(finished.completed,0);assert.equal(finished.unprocessed,1);
    const scopeResponse=await fetch(`${base}/knowledge/retry/${job.run_id}`);
    assert.equal(scopeResponse.status,200,await scopeResponse.clone().text());
    const scope=await scopeResponse.json();
    assert.equal(scope.selection_mode,"all_sources");assert.equal(scope.active_run_id,null);
    assert.equal(scope.samples.length,1);assert.equal(scope.samples[0].state,"unprocessed");
    assert.equal(scope.samples[0].relative_path,"normal.png");
    assert.match(scope.samples[0].sample_uuid,/^[a-f0-9-]{36}$/);
    await fs.writeFile(path.join(images,"normal.png"),"changed image");
    const changed=await post(`/knowledge/retry/${job.run_id}`,{sample_ids:scope.samples.map(sample=>sample.sample_id)});
    assert.equal(changed.status,422);assert.match(await changed.text(),/重新启动/);
    assert.equal((await(await fetch(`${base}/knowledge/jobs?dataset_id=${dataset.dataset_id}`)).json()).jobs.length,1);
  } finally {
    release?.();bridge.destroy();
    if(previousEndpoint===undefined)delete process.env.LIVE_VLM_ENDPOINT;else process.env.LIVE_VLM_ENDPOINT=previousEndpoint;
    if(previousCapacity===undefined)delete process.env.LIVE_VLM_CAPACITY_MODE;else process.env.LIVE_VLM_CAPACITY_MODE=previousCapacity;
    if(previousModel===undefined)delete process.env.LIVE_VLM_MODEL;else process.env.LIVE_VLM_MODEL=previousModel;
    await new Promise(resolve=>server.close(resolve));await new Promise(resolve=>model.close(resolve));
    await fs.rm(root,{recursive:true,force:true});
  }
});

test("folder classification: raw label filtering, details mapping modification, and atomic rescan", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-folder-"));
  const datasetRoot = path.join(root, "data");
  await fs.mkdir(path.join(datasetRoot, "OK/batch"), { recursive: true });
  await fs.mkdir(path.join(datasetRoot, "NG"), { recursive: true });
  await fs.mkdir(path.join(datasetRoot, "unknown"), { recursive: true });
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=", "base64");
  await fs.writeFile(path.join(datasetRoot, "OK/batch", "good.png"), png);
  await fs.writeFile(path.join(datasetRoot, "NG", "bad.PNG"), png);
  await fs.writeFile(path.join(datasetRoot, "unknown", "sample.png"), png);

  const bridge = new PythonBridge({ cwd: process.cwd().endsWith("iad-harness") ? path.resolve("../..") : process.cwd(), dbPath: path.join(root, "test.db") });
  const server = http.createServer(createIadHttpHandler(bridge));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/iad`;
  const post = (url, body) => fetch(base + url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  try {
    // 1. Preview
    const previewRes = await post("/datasets/preview", { root_dir: datasetRoot });
    assert.equal(previewRes.status, 200);
    const preview = await previewRes.json();
    assert.equal(preview.total_images, 3);
    assert.deepEqual(preview.items.find(item => item.path === "OK"), {
      path: "OK", image_count: 1, suggested_role: "normal", role: "normal",
    }, "预览与导入共同继承确认的父目录规则");

    // 2. Import
    const importRes = await post("/datasets/import", {
      format: "folder_classification",
      name: "产线质检",
      root_dir: datasetRoot,
      rules: [
        { path: "OK", role: "normal" },
        { path: "NG", role: "anomaly" },
        { path: "unknown", role: "unlabeled" },
      ],
      preview_fingerprint: preview.preview_fingerprint,
    });
    assert.equal(importRes.status, 200);
    const dataset = await importRes.json();
    assert.equal(dataset.format, "folder_classification");
    assert.equal(dataset.total_samples, 3);
    assert.equal(dataset.labeled_sample_count, 2);

    // 3. Raw label filtering
    const passQuery = await fetch(`${base}/samples/${dataset.task_id}?dataset_id=${dataset.dataset_id}&raw_label_filters=${encodeURIComponent(JSON.stringify(["PASS"]))}`);
    assert.equal(passQuery.status, 200);
    const passSamples = await passQuery.json();
    assert.equal(passSamples.total, 1);
    assert.equal(passSamples.items[0].relative_path, "OK/batch/good.png");

    const unionQuery = await fetch(`${base}/samples/${dataset.task_id}?dataset_id=${dataset.dataset_id}&raw_label_filters=${encodeURIComponent(JSON.stringify(["PASS", "FAIL"]))}`);
    assert.equal(unionQuery.status, 200);
    const unionSamples = await unionQuery.json();
    assert.equal(unionSamples.total, 2);

    // 4. Submit human review
    const targetSample = passSamples.items[0];
    const subRes = await post("/review/submit", {
      submission_id: randomUUID(),
      dataset_id: dataset.dataset_id,
      sample_id: targetSample.sample_id,
      reviewer: "inspector",
      decision: "PASS",
      comment: "human verified normal",
      duration_ms: 1000,
    });
    assert.equal(subRes.status, 200);

    // 5. Modify mapping: map "unknown" to "normal" and rescan
    const nextRules = [
        { path: "OK", role: "normal" },
        { path: "NG", role: "anomaly" },
        { path: "unknown", role: "normal" },
    ];
    const confirmed = await (await post("/datasets/preview", { root_dir: datasetRoot, rules: nextRules })).json();
    const changedRules = nextRules.map(rule => rule.path === "NG" ? { ...rule, role: "normal" } : rule);
    const stale = await post(`/datasets/${dataset.dataset_id}/rescan`, {
      image_dir: datasetRoot, folder_rules: changedRules, preview_fingerprint: confirmed.preview_fingerprint,
    });
    assert.equal(stale.status, 422, "不能将确认过的指纹应用于不同规则");
    const rescanRes = await post(`/datasets/${dataset.dataset_id}/rescan`, {
      image_dir: datasetRoot, folder_rules: nextRules, preview_fingerprint: confirmed.preview_fingerprint,
    });
    assert.equal(rescanRes.status, 200, await rescanRes.clone().text());

    // 6. Verify updated state
    const dsListRes = await fetch(`${base}/datasets`);
    const dsList = await dsListRes.json();
    const updatedDs = dsList.datasets.find(d => d.dataset_id === dataset.dataset_id);
    assert.equal(updatedDs.labeled_sample_count, 3);
    assert.equal(updatedDs.folder_rules.length, 3);
    const conflict = await post(`/datasets/${dataset.dataset_id}/rescan`, {
      folder_rules: [...nextRules, { path: "NG", role: "normal" }],
    });
    assert.equal(conflict.status, 422, "同目录多角色不得发布");

    const rePassQuery = await fetch(`${base}/samples/${dataset.task_id}?dataset_id=${dataset.dataset_id}&raw_label_filters=${encodeURIComponent(JSON.stringify(["PASS"]))}`);
    const rePassSamples = await rePassQuery.json();
    assert.equal(rePassSamples.total, 2);

    // Verify sample_id, sample_uuid, and human review decision are preserved
    const detailRes = await fetch(`${base}/sample/${encodeURIComponent(targetSample.sample_id)}`);
    const detail = await detailRes.json();
    assert.equal(detail.sample.sample_uuid, targetSample.sample_uuid);
    assert.equal(detail.review_decision.decision, "PASS");
    assert.equal(detail.review_decision.reviewer, "inspector");
    const excludedRules = nextRules.map(rule => rule.path === "OK" ? { ...rule, role: "excluded" } : rule);
    const excludedPreview = await (await post("/datasets/preview", { root_dir: datasetRoot, rules: excludedRules })).json();
    const excluded = await post(`/datasets/${dataset.dataset_id}/rescan`, {
      folder_rules: excludedRules, preview_fingerprint: excludedPreview.preview_fingerprint,
    });
    assert.equal(excluded.status, 200, await excluded.clone().text());
    assert.equal((await excluded.json()).issue_count, 0, "显式排除不是源文件丢失");
    const afterExclude = await (await fetch(`${base}/report/${dataset.task_id}?dataset_id=${dataset.dataset_id}`)).json();
    assert.equal(afterExclude.total_samples, 2, "排除图像退出当前投影但保留历史");
    const historical = await (await fetch(`${base}/sample/${encodeURIComponent(targetSample.sample_id)}`)).json();
    assert.equal(historical.review_decision.decision, "PASS");
    const restoredPreview = await (await post("/datasets/preview", { root_dir: datasetRoot, rules: nextRules })).json();
    assert.equal((await post(`/datasets/${dataset.dataset_id}/rescan`, {
      folder_rules: nextRules, preview_fingerprint: restoredPreview.preview_fingerprint,
    })).status, 200);
    const restored = await (await fetch(`${base}/sample/${encodeURIComponent(targetSample.sample_id)}`)).json();
    assert.equal(restored.sample.sample_uuid, targetSample.sample_uuid);
    assert.equal(restored.review_decision.decision, "PASS");
  } finally {
    bridge.destroy();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});
