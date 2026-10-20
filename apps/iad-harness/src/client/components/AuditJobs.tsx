import { QualityReport } from "./QualityReport.js";
import React, { useEffect, useState } from "react";
import type { AuditJob, Dataset, Filters, KnowledgeSummary, Report } from "../../shared/contracts.js";
import { ImageViewer, type ImageSource } from "./ImageViewer.js";
import { DatasetKnowledge } from "./DatasetKnowledge.js";
import { auditPhases, message, request } from "../api.js";

export function AuditJobs({ dataset, filters, jobs, onJobsChanged }: { dataset: Dataset; filters: Filters; jobs: AuditJob[]; onJobsChanged(): void }) {
  const [lightbox, setLightbox] = useState<ImageSource | null>(null);
  const [normal, setNormal] = useState<KnowledgeSummary | null>(null);
  const [defect, setDefect] = useState<KnowledgeSummary | null>(null);
  const [model, setModel] = useState("Qwen/Qwen3.8-27B-FP8");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setNormal(null); setDefect(null);
    Promise.all((["normal", "defect"] as const).map(kind => request<{ knowledge: KnowledgeSummary | null }>(`/knowledge?${new URLSearchParams({ dataset_id: dataset.dataset_id, kind })}`, undefined, undefined, controller.signal)))
      .then(([normal, defect]) => { setNormal(normal.knowledge); setDefect(defect.knowledge?.normal_version_id === normal.knowledge?.version_id ? defect.knowledge : null); })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); });
    return () => controller.abort();
  }, [dataset.dataset_id, jobs[0]?.normal_version_id]);
  async function start() {
    setBusy(true); setError("");
    try { await request("/audit/start", { dataset_id: dataset.dataset_id, model_name: model,
      normal_version_id: normal?.version_id, defect_version_id: defect?.version_id, filters }); onJobsChanged(); }
    catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  return <section className="iad-job-panel"><section className="iad-job-section"><h2>冻结知识</h2>
    {normal ? <><DatasetKnowledge knowledge={normal} /><div className="iad-reference-grid">{normal.evidence.filter(item => item.image.role === "normal" && item.image.representation === "raw").map(item => {
      const src = `/api/iad/knowledge/evidence/${encodeURIComponent(normal.version_id)}/${encodeURIComponent(item.image.evidence_id)}`;
      return <button key={item.image.evidence_id} title="放大知识来源图" onClick={() => setLightbox({ src, title: item.sample_id.split("/").pop()! })}><img alt="知识来源证据" src={src} /></button>;
    })}</div></> : <p className="iad-profile iad-muted">请先运行“挖掘良品知识”技能，生成可用版本。</p>}
    {defect ? <DatasetKnowledge knowledge={defect} /> : <p className="iad-muted">暂无匹配的不良知识，按正常判据筛查。</p>}
    </section><section className="iad-job-section">
    <h2>启动模型审计</h2><div className="iad-row"><label>模型<input aria-label="模型名称" value={model} onChange={e => setModel(e.target.value)} /></label>
      <button className="iad-primary" onClick={start} disabled={busy || !normal?.checks.some(check => check.status === "supported") || jobs.some(j => j.status === "RUNNING")}>{busy ? "启动中…" : "审计当前筛选全部图像"}</button></div>
    <p className="iad-muted">结合冻结知识、全图与全部局部图，综合分析位置和光照。</p>{error && <p role="alert" className="iad-error">{error}</p>}
    </section><section className="iad-job-section"><h2>审计作业</h2>{jobs.map(job => <article className="iad-job" key={job.run_id}><div className="iad-row"><strong>{job.status}</strong><span>{job.model_name}</span>
      {(job.status === "RUNNING" || job.status === "PENDING") && <button onClick={async () => { try { await request(`/audit/cancel/${job.run_id}`, {}); onJobsChanged(); } catch (e) { setError(message(e)); } }}>取消</button>}</div>
      <progress value={job.progress} max={1} /><p>完成 {job.completed} · 失败 {job.failed} · 共 {job.total_samples} 张</p>
      <p className="iad-muted">{auditPhases[job.phase || ""] || job.message}</p>
      {!!job.planned_regions && <p className="iad-muted">ROI {job.inspected_regions || 0} / {job.planned_regions}</p>}
      {!!job.total_batches && <p className="iad-muted">联合判断 {job.completed_batches || 0} / {job.total_batches}</p>}
      {job.normal_version_id && <small className="iad-muted">良品版本 {job.normal_version_id}<br />{job.defect_version_id && <>不良版本 {job.defect_version_id}<br /></>}</small>}<small className="iad-muted">{job.run_id}</small>{job.errors.length > 0 && <details><summary>失败详情</summary>{job.errors.map((error, i) => <p key={i}>{error.sample_id}: {error.message}</p>)}</details>}</article>)}
    {!jobs.length && <p className="iad-muted">尚无审计作业。</p>}</section>
    {lightbox && <ImageViewer image={lightbox} onClose={() => setLightbox(null)} />}
  </section>;
}

export function AuditReport({ dataset }: { dataset: Dataset }) {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    request<Report>(`/report/${dataset.task_id}?dataset_id=${dataset.dataset_id}`, undefined, undefined, controller.signal).then(setReport).catch(e => { if (!controller.signal.aborted) setError(message(e)); });
    return () => controller.abort();
  }, [dataset]);
  function download() {
    const blob = new Blob([JSON.stringify({ dataset_id: dataset.dataset_id, name: dataset.name, ...report }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob), anchor = document.createElement("a"); anchor.href = url; anchor.download = `${dataset.name}-report.json`; anchor.click(); URL.revokeObjectURL(url);
  }
  return <section className="iad-job-section iad-quality-report"><h2>审计汇总</h2>{error && <p role="alert" className="iad-error">{error}</p>}{report && <><QualityReport report={report} /><button onClick={download}>导出 JSON</button></>}</section>;
}
