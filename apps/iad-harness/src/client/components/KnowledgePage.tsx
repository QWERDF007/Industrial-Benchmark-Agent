import React, { useCallback, useEffect, useState } from "react";
import type { Dataset, KnowledgeJob, KnowledgeSnapshot, KnowledgeVersion } from "../../shared/contracts.js";
import { message, request } from "../api.js";
import { useJobs } from "../useJobs.js";
import { useWorkspace } from "../workspace.js";
import { ImageViewer, type ImageSource } from "./ImageViewer.js";

const statuses = { supported: "有证据支持", provisional: "待验证", conflicted: "存在矛盾" };
export function KnowledgePage({ dataset, kind }: { dataset: Dataset; kind: "normal" | "defect" }) {
  const { workspace } = useWorkspace();
  const pageId = kind === "normal" ? "industrial-normal" : "industrial-defect";
  const view = workspace.view(pageId);
  const [knowledge, setKnowledge] = useState<KnowledgeSnapshot | null>(null);
  const [normal, setNormal] = useState<KnowledgeSnapshot | null>(null);
  const [versions, setVersions] = useState<KnowledgeVersion[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [lightbox, setLightbox] = useState<ImageSource | null>(null);
  const [model, setModel] = useState("");
  const updated = useCallback(() => setRevision(value => value + 1), []);
  const polling = useJobs<KnowledgeJob>("knowledge", dataset.dataset_id, updated);
  const jobs = polling.jobs.filter(job => job.kind === kind);
  const running = jobs.some(job => job.status === "RUNNING" || job.status === "PENDING");
  const [checkId, setCheckId] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ dataset_id: dataset.dataset_id, kind, ...(view.version ? { version_id: view.version } : {}) });
    Promise.all([
      request<{ knowledge: KnowledgeSnapshot | null; versions: KnowledgeVersion[] }>(`/knowledge?${query}`, undefined, undefined, controller.signal),
      kind === "defect" ? request<{ knowledge: KnowledgeSnapshot | null }>(`/knowledge?${new URLSearchParams({ dataset_id: dataset.dataset_id, kind: "normal" })}`, undefined, undefined, controller.signal) : Promise.resolve({ knowledge: null }),
    ]).then(([current, reference]) => { if (!controller.signal.aborted) { setKnowledge(current.knowledge); setVersions(current.versions); setNormal(reference.knowledge); setError(""); } })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); });
    return () => controller.abort();
  }, [dataset.dataset_id, kind, revision, view.version]);
  async function start() {
    setBusy(true); setError("");
    try {
      await request("/knowledge/start", { dataset_id: dataset.dataset_id, kind, ...(kind === "defect" ? { normal_version_id: normal?.version_id } : {}), ...(model.trim() ? { model_name: model.trim() } : {}) });
      workspace.updateView(pageId, { version: "" }); polling.refresh(); updated();
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  const check = knowledge?.checks.find(check => check.check_id === checkId) || knowledge?.checks[0];
  function evidence(ids: string[]) {
    return <div className="iad-knowledge-evidence iad-reference-grid">{knowledge?.evidence.filter(item => ids.includes(item.image.evidence_id)).map(item => {
      const image = item.image;
      const src = `/api/iad/knowledge/evidence/${encodeURIComponent(knowledge.version_id)}/${encodeURIComponent(image.evidence_id)}`;
      return <button key={image.evidence_id} title={`查看 ${image.role} · ${image.representation}`} onClick={() => setLightbox({ src, title: `${image.role} · ${image.representation} · ${image.crop_bbox.join(", ")}`, width: image.sent_size[0], height: image.sent_size[1] })}><img src={src} alt={`${image.role} ${image.representation}`} /><small>{image.role} · {image.representation}</small></button>;
    })}</div>;
  }
  return <section className="iad-knowledge-page">
    <section className="iad-job-section"><div className="iad-row"><strong>全部合格{kind === "normal" ? "良品" : "异常"}候选</strong><label>模型<input aria-label="知识挖掘模型" placeholder="使用项目配置" value={model} onChange={event => setModel(event.target.value)} /></label>
      <button className="iad-primary" disabled={busy || running || (kind === "defect" && !normal?.checks.some(check => check.status === "supported"))} onClick={start}>{busy ? "启动中…" : `开始挖掘${kind === "normal" ? "良品" : "不良品"}知识`}</button></div>
      <label className="iad-field">知识版本<select aria-label="知识版本" value={view.version} onChange={event => workspace.updateView(pageId, { version: event.target.value })}><option value="">当前发布版本{versions.length ? "" : " · 尚未发布"}</option>{versions.map(version => <option key={version.version_id} value={version.version_id}>{version.created_at} · {version.version_id} · {version.source_count} 张来源</option>)}</select></label>
      {view.version && <p className="iad-muted">正在查看固定版本；新作业从当前已发布版本继续核验。</p>}
      {kind === "defect" && (normal ? <p className="iad-muted">依据良品版本 <code>{normal.version_id}</code></p> : <p>需要可用的良品知识。<button onClick={() => workspace.navigate("industrial-normal")}>前往良品知识</button></p>)}
      {(error || polling.error) && <p role="alert" className="iad-error">{error || polling.error}</p>}
      <p className="iad-muted">参考资格与初始无标注约定在数据集管理维护。</p><button onClick={() => workspace.navigate("industrial-datasets")}>维护候选来源</button>
    </section>
    <nav className="iad-tabs" aria-label="知识视图">{[["results", "知识条目"], ["findings", kind === "normal" ? "待核实" : "标注核验"], ["versions", "版本"], ["jobs", "作业记录"]].map(([tab, title]) => <button key={tab} className={view.tab === tab ? "active" : ""} aria-pressed={view.tab === tab} onClick={() => workspace.updateView(pageId, { tab })}>{title}</button>)}</nav>
    <section className="iad-knowledge-content iad-job-section">{knowledge ? <>
      <p>{knowledge.summary}</p><p className="iad-muted"><code>{knowledge.version_id}</code> · {knowledge.sources.length} 张来源 · {knowledge.checks.length} 项判据 · {knowledge.findings.length} 项核验</p>
      {view.tab === "results" && <div className="iad-knowledge-split"><div className="iad-check-list">{knowledge.checks.map(item => <button key={item.check_id} aria-pressed={check?.check_id === item.check_id} onClick={() => setCheckId(item.check_id)}><strong>{item.title}</strong><span>{statuses[item.status]} · 支持 {item.support_evidence_ids.length} / 反对 {item.counter_evidence_ids.length}</span></button>)}{!knowledge.checks.length && <p>尚无可发布判据，请查看限制和核验结果。</p>}</div>{check && <article className="iad-info-group"><h2>{check.title}</h2><p>{check.subject} · {check.location}</p><p>{check.criterion}</p><p>允许变化：{check.allowed_variations.join("；") || "未记录"}</p><h3>支持证据</h3>{evidence(check.support_evidence_ids)}{!!check.counter_evidence_ids.length && <><h3>反对证据</h3>{evidence(check.counter_evidence_ids)}</>}<p className="iad-muted">{check.limitations.join("；")}</p></article>}</div>}
      {view.tab === "findings" && <>{knowledge.findings.map(finding => <article className="iad-info-group" key={finding.finding_id}><h3>{finding.judgment.status === "supported" ? "图像支持异常" : finding.judgment.status === "refuted" ? "正常解释成立" : "证据不足"}</h3><p>{finding.judgment.description}</p><p>正常替代解释：{finding.judgment.normal_explanation}</p><p className="iad-muted">{finding.judgment.limitations.join("；")}</p>{evidence(finding.judgment.evidence_ids)}<button onClick={() => workspace.navigate("industrial-review", finding.sample_id)}>人工核实此图</button></article>)}{!knowledge.findings.length && <p>此版本没有待核验区域。</p>}</>}
      {!!knowledge.limitations.length && <details><summary>知识限制</summary>{knowledge.limitations.map((limitation, index) => <p key={index}>{limitation}</p>)}</details>}
      {view.tab === "versions" && versions.map(version => <article className="iad-info-group" key={version.version_id}><button onClick={() => workspace.updateView(pageId, { version: version.version_id, tab: "results" })}>{version.version_id}</button><p>{version.source_count} 张来源 · {version.check_count} 项判据 · {version.created_at}</p>{version.parent_version_id && <p className="iad-muted">父版本 {version.parent_version_id}</p>}{version.normal_version_id && <p className="iad-muted">依据良品版本 {version.normal_version_id}</p>}</article>)}
    </> : <p>尚无{kind === "normal" ? "良品" : "不良品"}知识版本。</p>}</section>
    <section className="iad-knowledge-jobs iad-job-section"><h2>挖掘作业</h2>{jobs.map(job => <article className="iad-job" key={job.run_id}><div className="iad-row"><strong>{job.status}</strong><code>{job.run_id}</code>{(job.status === "RUNNING" || job.status === "PENDING") && <button onClick={async () => { try { await request(`/knowledge/cancel/${job.run_id}`, {}); polling.refresh(); } catch (error) { setError(message(error)); } }}>取消挖掘</button>}</div><progress value={job.progress} max={1} /><p>完成 {job.completed} · 失败 {job.failed} · 未处理 {job.unprocessed} · 共 {job.total_samples} 张</p><p className="iad-muted">{job.message}</p>{job.knowledge_version_id && <button onClick={() => workspace.updateView(pageId, { version: job.knowledge_version_id!, tab: "results" })}>查看已发布版本</button>}{job.errors.length > 0 && <details><summary>失败详情</summary>{job.errors.map((error, index) => <p key={index}>{error.message}</p>)}</details>}</article>)}{!jobs.length && <p>尚无挖掘作业。</p>}</section>
    {lightbox && <ImageViewer image={lightbox} onClose={() => setLightbox(null)} />}
  </section>;
}
