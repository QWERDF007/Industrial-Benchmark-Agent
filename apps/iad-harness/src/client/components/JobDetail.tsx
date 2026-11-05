import {Button} from './Button.js';
import {IconButton} from "./IconButton.js";

import { ExplorationProgress } from "./ExplorationProgress.js";
import React, { useEffect, useRef, useState } from "react";
import type { JobRetryOptions, JobSample, JobSnapshot } from "../../shared/contracts.js";
import { message, request } from "../api.js";
import { useWorkspace } from "../workspace.js";
import { KnowledgeJobEvidence } from "./KnowledgeJobEvidence.js";
import { jobStatuses, jobPhases as phases } from "../../shared/job-display.js";
import {useResource} from "../useResource.js";
import { DeleteAction } from "./DeleteAction.js";

const sampleName = (sample: JobSample) => sample.relative_path || sample.sample_uuid;

export interface JobDetailProps {
  job: JobSnapshot;
  onChanged(): void;
  stale?: boolean;
  lastSyncedAt?: number | null;
  presentation?: 'inline' | 'drawer';
  onClose?(): void;
}

export function JobDetail({job,onChanged,stale=false,lastSyncedAt,onClose,presentation='inline'}: JobDetailProps) {
  const { workspace } = useWorkspace();
  const grouped=job.job_type==="ANALYSIS_WORKFLOW";
  const kind = ['MODEL_AUDIT','MODEL_AUDIT_SAMPLE'].includes(job.job_type) ? "audit" : job.analysis_kind === "exploration" || ['DIRECTION_EXPLORATION','EXPLORATION_BATCH'].includes(job.job_type) ? "exploration" : job.analysis_kind === "consistency" ? "consistency" : "knowledge";
  const page = kind === "audit" ? "industrial-audit" : kind === "exploration" ? "industrial-exploration" : kind === "consistency" ? "industrial-consistency" : "industrial-knowledge";
  const endpoint=grouped?"analysis":kind;
  const [childId,setChildId]=useState("");
  const child=useResource<JobSnapshot>(childId?`/analysis/node/${encodeURIComponent(childId)}`:null,job.completed+job.failed);
  const active = job.status === "RUNNING" || job.status === "PENDING";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [options, setOptions] = useState<JobRetryOptions | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);
  const article = useRef<HTMLElement>(null);
  const drawer = presentation !== "inline";
  const focused = workspace.view(page).job === job.run_id;
  useEffect(() => { if (focused && !drawer) article.current?.scrollIntoView({ block: "nearest" }); }, [focused, drawer]);
  useEffect(() => {
    if (!expanded || grouped || kind === "exploration" || active || job.status === "COMPLETED") return;
    const controller = new AbortController();
    setOptions(null); setError("");
    request<JobRetryOptions>(`/${kind}/retry/${encodeURIComponent(job.run_id)}`, undefined, undefined, controller.signal)
      .then(options => { if (!controller.signal.aborted) { setOptions(options); setSelected(options.samples.map(sample => sample.sample_id)); } })
      .catch(error => { if (!controller.signal.aborted) setError(message(error)); });
    return () => controller.abort();
  }, [expanded, revision, job.run_id, kind, active, job.status]);
  async function cancel() {
    setBusy(true); setError("");
    try { await request(`/${endpoint}/cancel/${encodeURIComponent(job.run_id)}`, {}); onChanged(); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function retry() {
    setBusy(true); setError("");
    try {
      const next = await request<JobSnapshot>(`/${endpoint}/retry/${encodeURIComponent(job.run_id)}`, grouped || kind === "exploration" ? {} : { sample_ids: selected });
      workspace.updateView(page, { job: next.run_id });
      setExpanded(false); onChanged();
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  function locate(sampleId: string) {
    workspace.navigate(kind === "audit" ? "industrial-audit" : "industrial-images", sampleId);
  }
  function related(runId: string) {
    setChildId(runId);
  }
  const body = (
<div className="iad-job-detail-body">
    <section aria-label="运行概览">
    {kind !== "exploration" && !drawer && job.total_samples > 0 && <progress aria-label="作业处理进度" value={job.progress} max={1} />}
    {drawer && <section className="iad-job-progress-card"><p>作业完成进度<strong>{job.completed} / {job.total_samples}</strong></p><progress aria-label="作业完成进度" value={job.completed} max={job.total_samples || 1} /></section>}
    {drawer && <section aria-label="执行阶段"><h3>执行阶段</h3><dl>
      <dt>当前阶段</dt><dd>{phases[job.phase || ''] || job.phase || '未记录阶段'}{job.phase && <code className="iad-job-phase-code">{job.phase}</code>}</dd>
      <dt>阶段开始</dt><dd>{job.phase_started_at ? <time dateTime={job.phase_started_at}>{new Date(job.phase_started_at).toLocaleString()}</time> : '未记录'}</dd>
      {job.queue_position != null && <><dt>排队位置</dt><dd>{job.queue_position}</dd></>}
      {job.total_gallery_groups != null && <><dt>图组进度</dt><dd>{job.completed_gallery_groups ?? 0} / {job.total_gallery_groups}</dd></>}
      <dt>开始时间</dt><dd>{job.started_at ? new Date(job.started_at).toLocaleString() : '未开始'}</dd>
      {job.finished_at && <><dt>结束时间</dt><dd>{new Date(job.finished_at).toLocaleString()}</dd></>}
    </dl><p>{job.message}</p></section>}
    {drawer && job.observation_progress && <section className="iad-job-progress-card"><p>图像观察进度（不代表完成或发布）<strong>{job.observation_progress.observed_sources} / {job.observation_progress.planned_sources}</strong></p><progress aria-label="图像观察进度" value={job.observation_progress.observed_sources} max={job.observation_progress.planned_sources || 1} /></section>}
    {!drawer && (kind === "exploration" ? <ExplorationProgress job={job} stale={stale} lastSyncedAt={lastSyncedAt} /> : <p>完成 {job.completed}，失败 {job.failed}，未处理 {job.unprocessed}，共 {job.total_samples} 张</p>)}
    {kind === "exploration" && <><details><summary>任务冻结提示词</summary><pre className="iad-observation">{job.exploration_prompt?.text || "未记录"}</pre><p>{job.exploration_request?.objective}</p></details></>}
    {!drawer && kind === "knowledge" && job.observation_progress && <p className="iad-muted">已观察 {job.observation_progress.observed_sources} / {job.observation_progress.planned_sources} 张，完整视图 {job.observation_progress.complete_sources} 张，已发布 {job.observation_progress.published_sources} 张</p>}
    {['KNOWLEDGE_BATCH','EXPLORATION_BATCH'].includes(job.job_type) && <section><h3>分批进度</h3><p>已发布批次 {job.completed_batches || 0} / {job.total_batches ?? '准备中'}</p>
      <ol>{job.batch_runs.map(runId=><li key={runId}><button type="button" onClick={()=>{related(runId);}}>{runId}</button></li>)}</ol></section>}
    {!drawer && (active && job.cancel_requested ? <p className="iad-muted">等待当前模型请求返回后停止。</p> : <p className="iad-muted">{phases[job.phase || ""] || job.message}</p>)}
    {job.current_sample && <p>当前图像 <button onClick={() => locate(job.current_sample!.sample_id)} title={job.current_sample.sample_uuid}>{sampleName(job.current_sample)}</button></p>}
    {!!job.planned_regions && <p className="iad-muted">ROI {job.inspected_regions || 0} / {job.planned_regions}</p>}
    {!!job.total_batches && <p className="iad-muted">联合判断 {job.completed_batches || 0} / {job.total_batches}</p>}
    {job.normal_version_id && <small className="iad-muted">良品版本 {job.normal_version_id}<br />{job.defect_version_id && <>不良版本 {job.defect_version_id}<br /></>}</small>}
    <details><summary>冻结依据与任务标识</summary><dl><dt>任务 ID</dt><dd>{job.run_id}</dd><dt>根任务</dt><dd>{job.root_run_id}</dd><dt>开始时间</dt><dd>{job.started_at || "未提供"}</dd><dt>结束时间</dt><dd>{job.finished_at || "未提供"}</dd><dt>提供商</dt><dd>{job.model_profile?.provider_name || "未记录"}</dd><dt>模型</dt><dd>{job.model_name}</dd></dl></details>
    {job.origin_session_id && <p><button disabled={busy} onClick={async () => {
      setBusy(true); setError("");
      try { await workspace.openSession(job.origin_session_id!); onClose?.(); }
      catch (error) { setError(message(error)); } finally { setBusy(false); }
    }}>返回发起会话</button></p>}
    {job.parent_run_id && <p className="iad-job-links"><button onClick={() => related(job.parent_run_id!)}>原作业 {job.parent_run_id}</button>{job.root_run_id !== job.parent_run_id && <button onClick={() => related(job.root_run_id)}>起始作业 {job.root_run_id}</button>}</p>}
    {kind === "knowledge" && job.knowledge_version_id && <p><button onClick={() => { workspace.openLocation({ pageId: "industrial-knowledge", datasetId: job.dataset_id, version: job.knowledge_version_id!, tab: "results" }); }}>查看已发布版本</button></p>}
    </section>
    {!grouped && kind === 'knowledge' && !drawer && <KnowledgeJobEvidence job={job} initiallyOpen={drawer} />}
    {(job.errors.length > 0 || (drawer && ['FAILED','PARTIAL','INTERRUPTED'].includes(job.status))) && <section aria-label="失败记录"><h3>失败记录</h3>{!job.errors.length && <p>未记录错误详情</p>}
      <ul className="iad-job-errors">{job.errors.map((error,index) => <li key={index}>
        <button type="button" onClick={() => locate(error.sample_id)} title={error.sample_uuid}>{sampleName(error)}</button>
        {error.code && <code>{error.code}</code>}<p>{error.message}</p>
        {error.source_run_id && <p>{phases[error.source_phase || ''] || error.source_phase || '未记录阶段'}<code className="iad-job-phase-code">{error.source_run_id}</code></p>}
      </li>)}</ul></section>}

    {kind === "exploration" && job.exploration_version_id && <button onClick={() => workspace.updateView(page,{version:job.exploration_version_id!,tab:"results"})}>查看探索结果</button>}
    {(grouped || kind === "exploration") && !active && job.status !== "COMPLETED" && <button disabled={busy} onClick={() => void retry()}>按原图组重试</button>}
    {!grouped && kind !== "exploration" && !active && !job.deleted_at && job.status !== "COMPLETED" && <button aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? "收起重试范围" : "选择重试范围"}</button>}

    {expanded && !active && job.status !== "COMPLETED" && <section className="iad-retry-scope" aria-label="重试范围">
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
          <Button variant="primary" disabled={busy || !selected.length || !!options.active_run_id} onClick={retry}>{busy ? "启动重试中…" : `重试所选 ${selected.length} 张`}</Button>
        </>}
      </> : !error && <p role="status">正在读取可重试范围…</p>}
      <IconButton icon="refresh" label="重新读取范围" disabled={busy} onClick={() => setRevision(value => value + 1)} />
    </section>}
    {child.error&&<p role="alert" className="iad-error">{child.error}</p>}
    {child.data&&<section aria-label="内部步骤详情"><button type="button" onClick={()=>setChildId("")}>收起步骤</button><JobDetail job={child.data} onChanged={onChanged}/></section>}
    {error && <p role="alert" className="iad-error">{error}</p>}
    </div>
  );
  return <article ref={article} className="iad-job" data-job-id={job.run_id} aria-label={`作业 ${job.run_id}`} aria-current={focused || undefined}>
    {drawer && <p className="iad-job-identifier">{job.run_id}</p>}
    <div className="iad-row"><strong role="status">{active && job.cancel_requested ? "正在停止" : jobStatuses[job.status]}</strong><span>{job.model_profile?.provider_name ? `${job.model_profile.provider_name} / ` : ''}{job.model_name}</span>
      {active && <button disabled={busy || job.cancel_requested} onClick={cancel}>{job.cancel_requested ? "正在停止…" : kind === "audit" ? "取消审计" : kind === "exploration" ? job.status === "PENDING" ? "取消排队" : "取消探索" : kind === "consistency" ? "取消检查" : "取消挖掘"}</button>}
    </div>
    {drawer && <><div className="iad-job-metrics"><div><span>完成</span><strong>{job.completed}</strong><small>/ {job.total_samples}</small></div><div><span>失败</span><strong>{job.failed}</strong><small>张</small></div><div><span>未处理</span><strong>{job.unprocessed}</strong><small>张</small></div><div><span>已观察</span><strong>{job.observation_progress?.observed_sources ?? '未提供'}</strong>{job.observation_progress && <small>/ {job.observation_progress.planned_sources}</small>}</div></div>
      {stale && <p role="alert" className="iad-error">同步已过期，以下保留最近一次作业状态。</p>}
    </>}
    {body}
    <footer className="iad-job-footer">{drawer && <button onClick={onClose}>关闭</button>}
      {kind === "knowledge" && !active && !job.deleted_at && <DeleteAction title="删除作业" name={job.run_id} className="iad-action-end"
        description="从作业列表删除，保留已发布知识、冻结证据及历史引用。"
        restoreFocus={() => document.querySelector<HTMLElement>(".iad-knowledge-page .iad-tabs button.active")}
        onDelete={async () => { await request(grouped?`/analysis/delete/${encodeURIComponent(job.run_id)}`:`/knowledge/jobs/${encodeURIComponent(job.run_id)}`, grouped?{}:undefined, grouped?"POST":"DELETE");
          if (focused) workspace.updateView(page, { job: "" }); onClose?.(); onChanged(); }} />}


    </footer>
  </article>;
}
