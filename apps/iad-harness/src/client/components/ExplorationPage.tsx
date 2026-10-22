import React, { useCallback, useEffect, useState } from "react";
import type { Dataset, JobSnapshot } from "../../shared/contracts.js";
import type { ExplorationCatalog } from "../../shared/domain.generated.js";
import { message, request } from "../api.js";
import { useWorkspace } from "../workspace.js";
import { useJobs } from "../useJobs.js";
import { jobStatuses, jobPhases } from "../../shared/job-display.js";
import { ExplorationSources } from "./ExplorationSources.js";
import { ImageViewer, type ImageSource } from "./ImageViewer.js";
import {useWorkbenchModel} from '../models.js';

export function ExplorationPage({ dataset, refreshRevision }: { dataset: Dataset; refreshRevision: number }) {
  const model = useWorkbenchModel();
  const { workspace } = useWorkspace(), pageId = "industrial-exploration", view = workspace.view(pageId);
  const [catalog, setCatalog] = useState<ExplorationCatalog | null>(null), [revision, setRevision] = useState(0);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false), [normalSelecting, setNormalSelecting] = useState(false), [defectSelecting, setDefectSelecting] = useState(false);
  const [image, setImage] = useState<ImageSource | null>(null);
  const changed = useCallback(() => setRevision(v => v + 1), []);
  const jobs = useJobs("exploration", dataset.dataset_id, changed, view.job);
  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ dataset_id: dataset.dataset_id });
    if (view.version) query.set("version_id", view.version);
    request<ExplorationCatalog>(`/exploration?${query}`, undefined, undefined, controller.signal)
      .then(value => { if (!controller.signal.aborted) { setCatalog(value); setError(""); } }).catch(e => { if (!controller.signal.aborted) setError(message(e)); });
    return () => controller.abort();
  }, [dataset.dataset_id, view.version, revision, refreshRevision]);
  const active = jobs.jobs.find(j => j.status === "RUNNING" || j.status === "PENDING");
  const blocked = busy || !!active;
  const normalCount = Number(view.explorationNormalCount), defectCount = Number(view.explorationDefectCount);
  const valid = Number.isInteger(normalCount) && normalCount > 0 && Number.isInteger(defectCount) && defectCount > 0
    && view.explorationNormalImages.length === normalCount && view.explorationDefectImages.length === defectCount;
  async function run(path: string, body?: object) {
    setBusy(true); setError("");
    try { const job = await request<JobSnapshot>(path, body || {}); if (workspace.getSnapshot().datasetId === dataset.dataset_id) workspace.updateView(pageId, { job: job.run_id }); jobs.refresh(); }
    catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  const result = catalog?.exploration;
  return <div className="iad-exploration-page">
    {(error || jobs.error) && <p role="alert" className="iad-error">{error || jobs.error}</p>}
    <section className="iad-info-group"><div className="iad-section-header"><h2>联合探索检查方向</h2>
      <button className="iad-primary" disabled={blocked || normalSelecting || defectSelecting || !valid || !model.ready} onClick={() => void run("/exploration/start", {
        dataset_id: dataset.dataset_id, normal_images: view.explorationNormalImages, defect_images: view.explorationDefectImages,
        ...(view.explorationObjective.trim() ? { objective: view.explorationObjective } : {}),
      })}>{busy ? "提交中…" : "开始方向探索"}</button></div>
      <label className="iad-field">探索目标（可选）<textarea aria-label="方向探索目标" disabled={blocked} value={view.explorationObjective} rows={2} onChange={e => workspace.updateView(pageId, { explorationObjective: e.target.value }, true)} /></label>
      <div className="iad-exploration-groups">
        <ExplorationSources dataset={dataset} kind="normal" disabled={blocked} count={view.explorationNormalCount} images={view.explorationNormalImages} onCount={explorationNormalCount => workspace.updateView(pageId, { explorationNormalCount })} onImages={explorationNormalImages => { if (workspace.getSnapshot().datasetId === dataset.dataset_id) workspace.updateView(pageId, { explorationNormalImages }); }} onSelecting={setNormalSelecting} />
        <ExplorationSources dataset={dataset} kind="defect" disabled={blocked} count={view.explorationDefectCount} images={view.explorationDefectImages} onCount={explorationDefectCount => workspace.updateView(pageId, { explorationDefectCount })} onImages={explorationDefectImages => { if (workspace.getSnapshot().datasetId === dataset.dataset_id) workspace.updateView(pageId, { explorationDefectImages }); }} onSelecting={setDefectSelecting} />
      </div><p className="iad-muted">两组共 {view.explorationNormalImages.length + view.explorationDefectImages.length} 张联合观察。来源角色为候选，探索结果需选择后使用。</p>
    </section>
    {active && <p role="status">{active.cancel_requested ? "正在停止方向探索" : "方向探索执行中"} · {jobPhases[active.phase || ""] || active.message} · {active.total_samples} 张</p>}
    <details className="iad-info-group"><summary>探索作业 · {jobs.jobs.length}</summary>{jobs.jobs.map(job => <article className="iad-job" key={job.run_id}>
      <div className="iad-row"><strong>{jobStatuses[job.status]}</strong><span>{job.model_profile?.provider_name ? `${job.model_profile.provider_name} · ` : ''}{job.model_name}</span><span>{job.completed + job.failed} / {job.total_samples} 张</span>
        {job.status === "RUNNING" || job.status === "PENDING" ? <button disabled={busy || job.cancel_requested} onClick={() => void run(`/exploration/cancel/${job.run_id}`)}>{job.cancel_requested ? "正在停止…" : "取消"}</button> : job.status !== "COMPLETED" && <button disabled={blocked} onClick={() => void run(`/exploration/retry/${job.run_id}`)}>按原图组重试</button>}
      </div><p>{jobPhases[job.phase || ""] || job.message}</p>{job.errors.length > 0 && <details><summary>失败详情</summary>{job.errors.map(item => <p key={item.sample_id}>{item.relative_path}：{item.message}</p>)}</details>}
      {job.exploration_version_id && <button onClick={() => workspace.updateView(pageId, { version: job.exploration_version_id!, job: job.run_id })}>查看探索结果</button>}
    </article>)}</details>
    <section className="iad-info-group"><div className="iad-section-header"><h2>探索结果</h2>
      <select aria-label="探索结果版本" value={result?.version_id || ""} onChange={e => workspace.updateView(pageId, { version: e.target.value })}><option value="" disabled>选择结果版本</option>{catalog?.versions.map(v => <option key={v.version_id} value={v.version_id}>{v.created_at.slice(0, 19).replace("T", " ")} · {v.direction_count} 项方向</option>)}</select></div>
      {!result && <p className="iad-muted">尚无已完成的方向探索。</p>}
      {result && <><p>{result.summary}</p><div className="iad-row">{([['normal', '良品'], ['defect', '异常']] as const).map(([kind, label]) => <button key={kind} onClick={() => workspace.openLocation({ pageId: "industrial-knowledge", datasetId: dataset.dataset_id, knowledgeKind: kind, explorationVersion: result.version_id })}>用于{label}知识挖掘</button>)}</div>
        {!result.directions.length && <p>本批样例未形成可用探索方向。</p>}
        {result.directions.map(direction => <article className="iad-discovery-area" key={direction.direction_id}><h3>{direction.title} <small className="iad-muted">{direction.applies_to === "both" ? "良品与异常" : direction.applies_to === "normal" ? "良品" : "异常"}</small></h3><p>{direction.instruction}</p>
          <details><summary>依据与限制</summary><p>{direction.rationale}</p>{direction.limitations.map((v, i) => <p key={i}>{v}</p>)}<div className="iad-reference-grid">{direction.evidence_ids.map(id => {
            const src = `/api/iad/exploration/evidence/${encodeURIComponent(result.version_id)}/${encodeURIComponent(id)}`;
            return <button key={id} aria-label={`查看方向证据 ${direction.title}`} onClick={() => setImage({ src, title: direction.title })}><img src={src} alt={direction.title} loading="lazy" /></button>;
          })}</div></details></article>)}
        {!!result.limitations.length && <details><summary>整体限制</summary>{result.limitations.map((v, i) => <p key={i}>{v}</p>)}</details>}
      </>}
    </section>{image && <ImageViewer image={image} onClose={() => setImage(null)} />}
  </div>;
}
