import React, { useState } from "react";
import type { AuditStartRequest, JobSnapshot, Dataset, Filters } from "../../shared/contracts.js";
import { ImageViewer, type ImageSource } from "./ImageViewer.js";
import { DatasetKnowledge } from "./DatasetKnowledge.js";
import { message, request } from "../api.js";
import { useKnowledge } from "../useKnowledge.js";
import { useWorkspace } from "../workspace.js";
import { KnowledgeState } from "./KnowledgeState.js";

export interface AuditSetupProps { dataset: Dataset; filters: Filters; jobs: JobSnapshot[]; revision: number; onJobsChanged(): void }

export function AuditSetup({ dataset, filters, jobs, revision, onJobsChanged }: AuditSetupProps) {
  const { workspace } = useWorkspace();
  const view = workspace.view("industrial-audit");
  const normalQuery = useKnowledge(dataset.dataset_id, "normal", view.normalVersion, revision);
  const defectQuery = useKnowledge(dataset.dataset_id, "defect", view.defectVersion, revision);
  const normal = normalQuery.knowledge;
  const defect = defectQuery.knowledge?.normal_version_id === normal?.version_id ? defectQuery.knowledge : null;
  const loading = normalQuery.loading || defectQuery.loading;
  const loadError = normalQuery.error || defectQuery.error || (!loading && view.defectVersion && !defect ? "所选不良知识与良品版本不匹配，请重新选择" : "");
  const [lightbox, setLightbox] = useState<ImageSource | null>(null);
  const model = view.model;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    setBusy(true); setError("");
    try {
      const input: AuditStartRequest = { dataset_id: dataset.dataset_id, model_name: model || undefined,
        normal_version_id: normal?.version_id, defect_version_id: defect?.version_id, filters };
      await request<JobSnapshot>("/audit/start", input); onJobsChanged();
    }
    catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  const normalDetails = normal && <><DatasetKnowledge knowledge={normal} /><div className="iad-reference-grid">{normal.evidence.filter(item => item.image.role === "normal" && item.image.representation === "raw").map(item => {
      const src = `/api/iad/knowledge/evidence/${encodeURIComponent(normal.version_id)}/${encodeURIComponent(item.image.evidence_id)}`;
      return <button key={item.image.evidence_id} title="放大知识来源图" onClick={() => setLightbox({ src, title: item.sample_id.split("/").pop()! })}><img alt="知识来源证据" src={src} /></button>;
    })}</div></>;
  return <section className="iad-job-panel"><section className="iad-job-section"><h2>模型审计设置</h2>
    <div className="iad-config-bar"><label className="iad-field">良品版本<select aria-label="审计良品知识版本" value={view.normalVersion} disabled={loading} onChange={event => workspace.updateView("industrial-audit", { normalVersion: event.target.value, defectVersion: "" })}>
      <option value="">当前版本</option>{normalQuery.versions.map(version => <option key={version.version_id} value={version.version_id}>{version.version_id} · {version.created_at}</option>)}
    </select></label><label className="iad-field">不良品版本<select aria-label="审计不良品知识版本" value={view.defectVersion} disabled={loading || !normal} onChange={event => workspace.updateView("industrial-audit", { defectVersion: event.target.value })}>
      <option value="">匹配的当前版本</option>{defectQuery.versions.filter(version => version.normal_version_id === normal?.version_id).map(version => <option key={version.version_id} value={version.version_id}>{version.version_id} · {version.created_at}</option>)}
    </select></label>
    <button className="iad-primary" disabled={busy || loading || !!loadError || !normal?.checks.some(check => check.status === "supported") || jobs.some(job => job.status === "RUNNING" || job.status === "PENDING")} onClick={start}>{busy ? "启动中…" : "审计当前筛选全部图像"}</button></div>
    <details className="iad-model-settings"><summary>模型设置</summary><label className="iad-field">模型<input aria-label="模型名称" value={model} placeholder="使用项目配置模型" onChange={e => workspace.updateView("industrial-audit", { model: e.target.value }, true)} /></label></details>
    <p className="iad-muted">范围：当前筛选的全部图像 · 全图与全部适用 ROI 联合分析</p>
    {loading ? <p role="status">正在读取审计知识…</p> : loadError ? <p role="alert" className="iad-error">{loadError}</p> : <>
    {normal ? <><KnowledgeState freshness={normalQuery.freshness} /><details><summary>良品知识 · {normal.checks.filter(check => check.status === "supported").length} 项有证据支持</summary>{normalDetails}</details></> : <p className="iad-profile iad-muted">请先挖掘良品知识，生成可用版本。<button onClick={() => workspace.openLocation({ pageId: "industrial-knowledge", datasetId: dataset.dataset_id, knowledgeKind: "normal" })}>前往挖掘良品知识</button></p>}
    {defect ? <><KnowledgeState freshness={defectQuery.freshness} /><details><summary>不良知识 · {defect.checks.length} 项判据</summary><DatasetKnowledge knowledge={defect} /></details></> : <p className="iad-muted">暂无匹配的不良知识，按正常判据筛查。</p>}
    </>}
    {error && <p role="alert" className="iad-error">{error}</p>}
    </section>
    {lightbox && <ImageViewer image={lightbox} onClose={() => setLightbox(null)} />}
  </section>;
}
