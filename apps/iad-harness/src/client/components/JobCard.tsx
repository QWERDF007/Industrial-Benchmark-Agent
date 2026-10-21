import React, { useEffect, useRef, useState } from "react";
import type { JobRetryOptions, JobSample, JobSnapshot } from "../../shared/contracts.js";
import { message, request } from "../api.js";
import { useWorkspace } from "../workspace.js";
import { KnowledgeJobEvidence } from "./KnowledgeJobEvidence.js";
import { jobStatuses } from "../../shared/job-display.js";

const phases: Record<string, string> = {
  PREPARING_KNOWLEDGE: "准备冻结知识", GLOBAL: "全图观察", REGIONS: "ROI 细看",
  SYNTHESIS: "全图与 ROI 联合分析", SAMPLE_COMPLETED: "图像审计完成",
  LEARNING_NORMAL: "归纳良品知识", LEARNING_DEFECT: "归纳不良品知识",
  VERIFYING_NORMAL: "核验良品疑点", VERIFYING_DEFECT: "核验标注与异常知识",
  OBSERVING_PRESET: "观察冻结判据", RECHECKING_HUMAN_KNOWLEDGE: "核验人工知识处置",
  KNOWLEDGE_PUBLISHED: "知识已发布", KNOWLEDGE_REUSED: "复用已核验知识",
};
const sampleName = (sample: JobSample) => sample.relative_path || sample.sample_uuid;

export function JobCard({ job, onChanged }: { job: JobSnapshot; onChanged(): void }) {
  const { workspace } = useWorkspace();
  const kind = job.job_type === "MODEL_AUDIT" ? "audit" : "knowledge";
  const page = kind === "audit" ? "industrial-audit" : "industrial-knowledge";
  const active = job.status === "RUNNING" || job.status === "PENDING";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [options, setOptions] = useState<JobRetryOptions | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);
  const article = useRef<HTMLElement>(null);
  const focused = workspace.view(page, job.kind ?? undefined).job === job.run_id;
  useEffect(() => { if (focused) article.current?.scrollIntoView({ block: "nearest" }); }, [focused]);
  useEffect(() => {
    if (!expanded) return;
    const controller = new AbortController();
    setOptions(null); setError("");
    request<JobRetryOptions>(`/${kind}/retry/${encodeURIComponent(job.run_id)}`, undefined, undefined, controller.signal)
      .then(options => { if (!controller.signal.aborted) { setOptions(options); setSelected(options.samples.map(sample => sample.sample_id)); } })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); });
    return () => controller.abort();
  }, [expanded, revision, job.run_id, kind]);
  async function cancel() {
    setBusy(true); setError("");
    try { await request(`/${kind}/cancel/${encodeURIComponent(job.run_id)}`, {}); onChanged(); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function retry() {
    setBusy(true); setError("");
    try {
      await request(`/${kind}/retry/${encodeURIComponent(job.run_id)}`, { sample_ids: selected });
      setExpanded(false); onChanged();
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  function locate(sampleId: string) {
    workspace.navigate(kind === "audit" ? "industrial-audit" : "industrial-images", sampleId);
  }
  function related(runId: string) {
    workspace.openLocation({ pageId: page, datasetId: job.dataset_id, knowledgeKind: job.kind ?? undefined, job: runId, tab: "jobs" });
  }
  return <article ref={article} className="iad-job" data-job-id={job.run_id} aria-label={`作业 ${job.run_id}`} aria-current={focused || undefined}>
    <div className="iad-row"><strong role="status">{active && job.cancel_requested ? "正在停止" : jobStatuses[job.status]}</strong><span>{job.model_name}</span>
      {active && <button disabled={busy || job.cancel_requested} onClick={cancel}>{job.cancel_requested ? "正在停止…" : kind === "audit" ? "取消审计" : "取消挖掘"}</button>}
    </div>
    <progress aria-label="作业处理进度" value={job.progress} max={1} />
    <p>完成 {job.completed} · 失败 {job.failed} · 未处理 {job.unprocessed} · 共 {job.total_samples} 张</p>
    {kind === "knowledge" && job.observation_progress && <p className="iad-muted">已观察 {job.observation_progress.observed_sources} / {job.observation_progress.planned_sources} 张 · 完整视图 {job.observation_progress.complete_sources} 张 · 已发布 {job.observation_progress.published_sources} 张</p>}
    {kind === "knowledge" && <KnowledgeJobEvidence job={job} />}
    {active && job.cancel_requested ? <p className="iad-muted">等待当前模型请求返回后停止。</p> : <p className="iad-muted">{phases[job.phase || ""] || job.message}</p>}
    {job.current_sample && <p>当前图像 <button onClick={() => locate(job.current_sample!.sample_id)} title={job.current_sample.sample_uuid}>{sampleName(job.current_sample)}</button></p>}
    {!!job.planned_regions && <p className="iad-muted">ROI {job.inspected_regions || 0} / {job.planned_regions}</p>}
    {!!job.total_batches && <p className="iad-muted">联合判断 {job.completed_batches || 0} / {job.total_batches}</p>}
    {job.normal_version_id && <small className="iad-muted">良品版本 {job.normal_version_id}<br />{job.defect_version_id && <>不良版本 {job.defect_version_id}<br /></>}</small>}
    <small className="iad-muted">{job.run_id}</small>
    {job.origin_session_id && <p><button disabled={busy} onClick={async () => {
      setBusy(true); setError("");
      try { await workspace.openSession(job.origin_session_id!); }
      catch (error) { setError(message(error)); } finally { setBusy(false); }
    }}>返回发起会话</button></p>}
    {job.parent_run_id && <p className="iad-job-links"><button onClick={() => related(job.parent_run_id!)}>原作业 {job.parent_run_id}</button>{job.root_run_id !== job.parent_run_id && <button onClick={() => related(job.root_run_id)}>起始作业 {job.root_run_id}</button>}</p>}
    {job.knowledge_version_id && <p><button onClick={() => { workspace.openLocation({ pageId: page, datasetId: job.dataset_id, knowledgeKind: job.kind ?? undefined, version: job.knowledge_version_id!, tab: "results" }); }}>查看已发布版本</button></p>}
    {!!job.errors.length && <details><summary>失败详情 · {job.errors.length}</summary><ul className="iad-job-errors">{job.errors.map((error, index) => <li key={index}><button onClick={() => locate(error.sample_id)} title={error.sample_uuid}>{sampleName(error)}</button><p className="iad-error">{error.message}</p></li>)}</ul></details>}
    {!active && job.status !== "COMPLETED" && <button aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? "收起重试范围" : "选择重试范围"}</button>}
    {expanded && <section className="iad-retry-scope" aria-label="重试范围">
      {options ? <>
        {options.active_run_id && <p role="status">同类作业仍在执行，请结束后重新读取范围。</p>}
        {!options.samples.length ? <p>关联作业已完成全部图像，无需重试。</p> : <>
          {options.selection_mode === "all_sources" ? <p className="iad-muted">知识联合归纳须使用整组冻结来源。</p> : <div className="iad-row">
            <button onClick={() => setSelected(options.samples.map(sample => sample.sample_id))}>全选</button>
            <button onClick={() => setSelected(options.samples.filter(sample => sample.state === "failed").map(sample => sample.sample_id))}>仅失败</button>
            <button onClick={() => setSelected(options.samples.filter(sample => sample.state === "unprocessed").map(sample => sample.sample_id))}>仅未处理</button>
          </div>}
          <fieldset disabled={busy || !!options.active_run_id}><legend>失败或未处理图像</legend><div className="iad-retry-samples">{options.samples.map(sample => <label key={sample.sample_id} title={sample.sample_uuid}>
            <input type="checkbox" checked={selected.includes(sample.sample_id)} disabled={options.selection_mode === "all_sources"}
              onChange={event => setSelected(values => event.target.checked ? [...values, sample.sample_id] : values.filter(id => id !== sample.sample_id))} />
            <span>{sampleName(sample)}</span><small>{sample.state === "failed" ? "失败" : "未处理"}</small>
          </label>)}</div></fieldset>
          <button className="iad-primary" disabled={busy || !selected.length || !!options.active_run_id} onClick={retry}>{busy ? "启动重试中…" : `重试所选 ${selected.length} 张`}</button>
        </>}
      </> : !error && <p role="status">正在读取可重试范围…</p>}
      <button disabled={busy} onClick={() => setRevision(value => value + 1)}>重新读取范围</button>
    </section>}
    {error && <p role="alert" className="iad-error">{error}</p>}
  </article>;
}
