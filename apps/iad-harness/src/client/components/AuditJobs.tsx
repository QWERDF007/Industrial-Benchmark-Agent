import React, { useEffect, useState } from "react";
import type { AuditJob, Dataset, Filters, NormalProfile, Report } from "../../shared/contracts.js";
import { ImageViewer, type ImageSource } from "./ImageViewer.js";
import { NormalKnowledge } from "./NormalKnowledge.js";
import { auditPhases, mediaUrl, message, request } from "../api.js";

export function AuditJobs({ dataset, filters, onChanged }: { dataset: Dataset; filters: Filters; onChanged(): void }) {
  const [lightbox, setLightbox] = useState<ImageSource | null>(null);
  const [profile, setProfile] = useState<NormalProfile | null>(null);
  const [jobs, setJobs] = useState<AuditJob[]>([]);
  const [model, setModel] = useState("Qwen/Qwen3.8-27B-FP8");
  const [limit, setLimit] = useState(50);
  const [maxRegions, setMaxRegions] = useState(12);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); let timer: ReturnType<typeof setTimeout>; let wasRunning = false;
    async function refresh() {
      try {
        const [data, learned] = await Promise.all([
          request<{ jobs: AuditJob[] }>(`/audit/jobs?dataset_id=${dataset.dataset_id}`, undefined, undefined, controller.signal),
          request<{ profile: NormalProfile | null }>(`/audit/profile?${new URLSearchParams({ dataset_id: dataset.dataset_id, model_name: model })}`, undefined, undefined, controller.signal),
        ]);
        if (controller.signal.aborted) return;
        setJobs(data.jobs); setProfile(learned.profile);
        const running = data.jobs.some(job => job.status === "RUNNING" || job.status === "PENDING");
        if (wasRunning && !running) onChanged();
        wasRunning = running;
        timer = setTimeout(refresh, running ? 1200 : 5000);
      } catch (e) { if (!controller.signal.aborted) setError(message(e)); }
    }
    refresh(); return () => { controller.abort(); clearTimeout(timer); };
  }, [dataset, model, revision, onChanged]);
  async function start() {
    setBusy(true); setError("");
    try { await request("/audit/start", { dataset_id: dataset.dataset_id, model_name: model, max_regions: maxRegions, limit, filters }); setRevision(v => v + 1); }
    catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  return <section className="iad-job-panel"><section className="iad-job-section"><h2>参考良品</h2><div className="iad-reference-grid">{dataset.reference_sample_ids.map(id => <div key={id}>
    <button title="放大参考良品" onClick={() => setLightbox({ src: mediaUrl({ task_id: dataset.task_id, sample_id: id }), title: id.split("/").pop()! })}><img alt="正常参考图" src={mediaUrl({ task_id: dataset.task_id, sample_id: id }, true)} /></button>
    <small>{id.split("/").pop()}</small></div>)}</div>
    {!dataset.reference_sample_ids.length && <p className="iad-error">暂无良品参考，请先在图像样本中选择。</p>}
    {profile ? <NormalKnowledge profile={profile} /> : <p className="iad-profile iad-muted">当前参考图尚未学习；启动后由 MLLM学习并保存良品模式。</p>}
    </section><section className="iad-job-section">
    <h2>启动模型审计</h2><div className="iad-row"><label>模型<input aria-label="模型名称" value={model} onChange={e => setModel(e.target.value)} /></label>
      <label>最多审计图数<input type="number" min={1} max={10000} value={limit} onChange={e => setLimit(Number(e.target.value))} /></label>
      <label>每图 ROI 预算<input aria-label="每图 ROI 预算" type="number" min={1} max={32} value={maxRegions} onChange={e => setMaxRegions(Number(e.target.value))} /></label>
      <button className="iad-primary" onClick={start} disabled={busy || !dataset.reference_sample_ids.length || jobs.some(j => j.status === "RUNNING")}>{busy ? "启动中…" : "按当前样本筛选启动"}</button></div>
    <p className="iad-muted">全图观察 → 标注及可疑区域细看 → 结合位置、光照综合判断。</p>{error && <p role="alert" className="iad-error">{error}</p>}
    </section><section className="iad-job-section"><h2>审计作业</h2>{jobs.map(job => <article className="iad-job" key={job.run_id}><div className="iad-row"><strong>{job.status}</strong><span>{job.model_name}</span>
      {(job.status === "RUNNING" || job.status === "PENDING") && <button onClick={async () => { try { await request(`/audit/cancel/${job.run_id}`, {}); setRevision(v => v + 1); } catch (e) { setError(message(e)); } }}>取消</button>}</div>
      <progress value={job.progress} max={1} /><p>完成 {job.completed} · 失败 {job.failed} · 共 {job.total_samples} 张</p>
      <p className="iad-muted">{auditPhases[job.phase || ""] || job.message}</p>
      {!!job.planned_regions && <p className="iad-muted">ROI {job.inspected_regions || 0} / {job.planned_regions}</p>}
      {job.profile_id && <small className="iad-muted">模式版本 {job.profile_id}<br /></small>}<small className="iad-muted">{job.run_id}</small>{job.errors.length > 0 && <details><summary>失败详情</summary>{job.errors.map((error, i) => <p key={i}>{error.sample_id}: {error.message}</p>)}</details>}</article>)}
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
  return <section><h2>审计汇总</h2>{error && <p role="alert" className="iad-error">{error}</p>}{report && <><dl>
    <dt>模型覆盖</dt><dd>{report.vlm_audited_count} / {report.total_samples} ({report.vlm_coverage_pct}%)</dd>
    <dt>模型建议异常</dt><dd>{report.vlm_anomalies_count}</dd><dt>技术质量问题</dt><dd>{report.technical_quality_issues}</dd>
    <dt>人工复核</dt><dd>{report.human_reviewed_count}</dd><dt>人审良品 / 异常 / 不确定</dt><dd>{report.human_pass_count} / {report.human_fail_count} / {report.human_uncertain_count}</dd>
  </dl><button onClick={download}>导出 JSON</button></>}</section>;
}
