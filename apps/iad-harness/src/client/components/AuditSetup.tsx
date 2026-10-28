import React, { useEffect, useState } from "react";
import type { AuditStartRequest, JobSnapshot, Dataset, Filters, SamplePage } from "../../shared/contracts.js";
import { ImageViewer, type ImageSource } from "./ImageViewer.js";
import { KnowledgeEvidenceGallery } from "./KnowledgeEvidenceGallery.js";
import { DatasetKnowledge } from "./DatasetKnowledge.js";
import { message, request, sampleQuery } from "../api.js";
import { useKnowledge } from "../useKnowledge.js";
import { useWorkspace } from "../workspace.js";
import { KnowledgeState } from "./KnowledgeState.js";
import {useWorkbenchModel, WorkbenchModelStatus} from '../models.js';

export interface AuditSetupProps { dataset: Dataset; filters: Filters; jobs: JobSnapshot[]; revision: number; onJobsChanged(): void; onStarted?(job: JobSnapshot): void }

export function AuditSetup({ dataset, filters, jobs, revision, onJobsChanged, onStarted }: AuditSetupProps) {
  const { workspace } = useWorkspace();
  const view = workspace.view("industrial-audit");
  const normalQuery = useKnowledge(dataset.dataset_id, "normal", view.normalVersion, revision);
  const defectQuery = useKnowledge(dataset.dataset_id, "defect", view.defectVersion, revision);
  const normal = normalQuery.knowledge;
  const defect = defectQuery.knowledge?.normal_version_id === normal?.version_id ? defectQuery.knowledge : null;
  const loading = normalQuery.loading || defectQuery.loading;
  const loadError = normalQuery.error || defectQuery.error || (!loading && view.defectVersion && !defect ? "所选不良知识与良品版本不匹配，请重新选择" : "");
  const [lightbox, setLightbox] = useState<ImageSource | null>(null);
  const model = useWorkbenchModel();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState<number | null>(null);
  const scopeQuery = sampleQuery(dataset.dataset_id, filters, 1, 1);
  useEffect(() => {
    const controller = new AbortController(); setTotal(null); setError("");
    request<SamplePage>(`/samples/${encodeURIComponent(dataset.task_id)}?${scopeQuery}`, undefined, undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setTotal(result.total); })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); });
    return () => controller.abort();
  }, [dataset.task_id, scopeQuery]);
  async function start() {
    setBusy(true); setError("");
    try {
      const input: AuditStartRequest = { dataset_id: dataset.dataset_id,
        normal_version_id: normal?.version_id, defect_version_id: defect?.version_id, filters,
        consistency_mode:view.auditConsistencyMode };
      const job = await request<JobSnapshot>("/audit/start", input); onJobsChanged(); onStarted?.(job);
    }
    catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  const normalDetails = normal && <><DatasetKnowledge knowledge={normal} /><KnowledgeEvidenceGallery versionId={normal.version_id} items={normal.evidence.filter(item => item.image.role === "normal" && item.image.representation === "raw")} onOpen={setLightbox} /></>;
  return <section className="iad-job-panel"><WorkbenchModelStatus /><section><h3>知识依据</h3>
    <div className="iad-config-bar"><label className="iad-field">良品版本<select aria-label="审计良品知识版本" value={view.normalVersion} disabled={loading} onChange={event => workspace.updateView("industrial-audit", { normalVersion: event.target.value, defectVersion: "" })}>
      <option value="">当前版本</option>{normalQuery.versions.map(version => <option key={version.version_id} value={version.version_id}>{version.version_id} · {version.created_at}</option>)}
    </select></label><label className="iad-field">不良品版本<select aria-label="审计不良品知识版本" value={view.defectVersion} disabled={loading || !normal} onChange={event => workspace.updateView("industrial-audit", { defectVersion: event.target.value })}>
      <option value="">匹配的当前版本</option>{defectQuery.versions.filter(version => version.normal_version_id === normal?.version_id).map(version => <option key={version.version_id} value={version.version_id}>{version.version_id} · {version.created_at}</option>)}
    </select></label>
    <label className="iad-field">一致性检查<select aria-label="审计一致性模式" value={view.auditConsistencyMode} onChange={event => workspace.updateView('industrial-audit', {auditConsistencyMode:event.target.value as NonNullable<AuditStartRequest['consistency_mode']>})}>
      <option value="exact">已有精确索引</option><option value="combined">精确与已有视觉索引</option>
    </select></label></div>
    <p aria-label="审计执行范围">当前筛选的全部 {total === null ? "…" : total} 张图像 · 全图与全部适用 ROI 联合分析</p>
    {loading ? <p role="status">正在读取审计知识…</p> : loadError ? <p role="alert" className="iad-error">{loadError}</p> : <>
    {normal ? <><KnowledgeState freshness={normalQuery.freshness} /><details><summary>良品知识 · {normal.checks.filter(check => check.status === "supported").length} 项有证据支持</summary>{normalDetails}</details></> : <p className="iad-profile iad-muted">请先挖掘良品知识，生成可用版本。<button onClick={() => workspace.openLocation({ pageId: "industrial-knowledge", datasetId: dataset.dataset_id, knowledgeKind: "normal" })}>前往挖掘良品知识</button></p>}
    {defect ? <><KnowledgeState freshness={defectQuery.freshness} /><details><summary>不良知识 · {defect.checks.length} 项判据</summary><DatasetKnowledge knowledge={defect} /></details></> : <p className="iad-muted">暂无匹配的不良知识，按正常判据筛查。</p>}
    </>}
    {error && <p role="alert" className="iad-error">{error}</p>}
    <div className="iad-form-actions"><button className="iad-primary" disabled={busy || loading || total === null || total === 0 || !!loadError || !model.ready || !normal?.checks.some(check => check.status === "supported") || jobs.some(job => job.status === "RUNNING" || job.status === "PENDING")} onClick={start}>{busy ? "启动中…" : "审计当前筛选全部图像"}</button></div>
    </section>
    {lightbox && <ImageViewer image={lightbox} onClose={() => setLightbox(null)} />}
  </section>;
}
