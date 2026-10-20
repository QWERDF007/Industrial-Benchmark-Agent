import { JobCard } from "./JobCard.js";
import { QualityReport } from "./QualityReport.js";
import React, { useEffect, useState } from "react";
import type { AuditStartRequest, JobSnapshot, Dataset, Filters, Report } from "../../shared/contracts.js";
import { ImageViewer, type ImageSource } from "./ImageViewer.js";
import { DatasetKnowledge } from "./DatasetKnowledge.js";
import { message, request } from "../api.js";
import { useKnowledge } from "../useKnowledge.js";
import { useWorkspace } from "../workspace.js";
import { KnowledgeState } from "./KnowledgeState.js";

export function AuditJobs({ dataset, filters, jobs, revision, onJobsChanged }: { dataset: Dataset; filters: Filters; jobs: JobSnapshot[]; revision: number; onJobsChanged(): void }) {
  const { workspace } = useWorkspace();
  const view = workspace.view("industrial-audit");
  const normalQuery = useKnowledge(dataset.dataset_id, "normal", view.normalVersion, revision);
  const defectQuery = useKnowledge(dataset.dataset_id, "defect", view.defectVersion, revision);
  const normal = normalQuery.knowledge;
  const defect = defectQuery.knowledge?.normal_version_id === normal?.version_id ? defectQuery.knowledge : null;
  const loading = normalQuery.loading || defectQuery.loading;
  const loadError = normalQuery.error || defectQuery.error || (!loading && view.defectVersion && !defect ? "所选不良知识与良品版本不匹配，请重新选择" : "");
  const [lightbox, setLightbox] = useState<ImageSource | null>(null);
  const [model, setModel] = useState("Qwen/Qwen3.8-27B-FP8");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    setBusy(true); setError("");
    try {
      const input: AuditStartRequest = { dataset_id: dataset.dataset_id, model_name: model,
        normal_version_id: normal?.version_id, defect_version_id: defect?.version_id, filters };
      await request<JobSnapshot>("/audit/start", input); onJobsChanged();
    }
    catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  return <section className="iad-job-panel"><section className="iad-job-section"><h2>审计知识</h2>
    <div className="iad-row"><label className="iad-field">良品版本<select aria-label="审计良品知识版本" value={view.normalVersion} disabled={loading} onChange={event => workspace.updateView("industrial-audit", { normalVersion: event.target.value, defectVersion: "" })}>
      <option value="">当前版本</option>{normalQuery.versions.map(version => <option key={version.version_id} value={version.version_id}>{version.version_id} · {version.created_at}</option>)}
    </select></label><label className="iad-field">不良品版本<select aria-label="审计不良品知识版本" value={view.defectVersion} disabled={loading || !normal} onChange={event => workspace.updateView("industrial-audit", { defectVersion: event.target.value })}>
      <option value="">匹配的当前版本</option>{defectQuery.versions.filter(version => version.normal_version_id === normal?.version_id).map(version => <option key={version.version_id} value={version.version_id}>{version.version_id} · {version.created_at}</option>)}
    </select></label></div>
    {loading ? <p role="status">正在读取审计知识…</p> : loadError ? <p role="alert" className="iad-error">{loadError}</p> : <>
    {normal ? <><DatasetKnowledge knowledge={normal} /><KnowledgeState freshness={normalQuery.freshness} /><div className="iad-reference-grid">{normal.evidence.filter(item => item.image.role === "normal" && item.image.representation === "raw").map(item => {
      const src = `/api/iad/knowledge/evidence/${encodeURIComponent(normal.version_id)}/${encodeURIComponent(item.image.evidence_id)}`;
      return <button key={item.image.evidence_id} title="放大知识来源图" onClick={() => setLightbox({ src, title: item.sample_id.split("/").pop()! })}><img alt="知识来源证据" src={src} /></button>;
    })}</div></> : <p className="iad-profile iad-muted">请先运行“挖掘良品知识”技能，生成可用版本。</p>}
    {defect ? <><DatasetKnowledge knowledge={defect} /><KnowledgeState freshness={defectQuery.freshness} /></> : <p className="iad-muted">暂无匹配的不良知识，按正常判据筛查。</p>}
    </>}
    </section><section className="iad-job-section">
    <h2>启动模型审计</h2><div className="iad-row"><label>模型<input aria-label="模型名称" value={model} onChange={e => setModel(e.target.value)} /></label>
      <button className="iad-primary" onClick={start} disabled={busy || loading || !!loadError || !normal?.checks.some(check => check.status === "supported") || jobs.some(j => j.status === "RUNNING" || j.status === "PENDING")}>{busy ? "启动中…" : "审计当前筛选全部图像"}</button></div>
    <p className="iad-muted">结合冻结知识、全图与全部局部图，综合分析位置和光照。</p>{error && <p role="alert" className="iad-error">{error}</p>}
    </section><section className="iad-job-section"><h2>审计作业</h2>{jobs.map(job => <JobCard key={job.run_id} job={job} onChanged={onJobsChanged} />)}
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
