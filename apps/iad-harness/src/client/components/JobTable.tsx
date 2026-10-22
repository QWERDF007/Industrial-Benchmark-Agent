import React, { useEffect, useState } from "react";
import type { JobSnapshot } from "../../shared/contracts.js";
import { jobStatuses } from "../../shared/job-display.js";
import { useWorkspace, type PageId } from "../workspace.js";
import { JobDetail } from "./JobDetail.js";
import { Pagination } from "./Pagination.js";

const types: Record<JobSnapshot["job_type"], string> = { MODEL_AUDIT: "模型审计", NORMAL_KNOWLEDGE: "良品知识", DEFECT_KNOWLEDGE: "异常知识", DIRECTION_EXPLORATION: "方向探索" };

export function JobTable({ jobs, pageId, onChanged }: { jobs: JobSnapshot[]; pageId: PageId; onChanged(): void }) {
  const { workspace } = useWorkspace(), selected = workspace.view(pageId).job;
  const [page, setPage] = useState(1), [status, setStatus] = useState("");
  const filtered = jobs.filter(job => !status || job.status === status);
  const index = filtered.findIndex(job => job.run_id === selected);
  useEffect(() => {
    if (index >= 0) setPage(Math.floor(index / 10) + 1);
  }, [selected, index]);
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10))), visible = filtered.slice((current - 1) * 10, current * 10);
  const job = jobs.find(job => job.run_id === selected) || visible[0];
  return <div className="iad-job-table">
    <label className="iad-field">任务状态<select aria-label="任务状态" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">全部状态</option>{Object.entries(jobStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <div className="iad-table-scroll"><table className="iad-resource-table" aria-label="作业列表"><thead><tr><th>任务</th><th>类型</th><th>状态</th><th className="iad-number">完成 / 总数</th><th className="iad-number">失败</th><th>开始时间</th><th>操作</th></tr></thead><tbody>{visible.map(item => <tr key={item.run_id} data-selected={job?.run_id === item.run_id}>
      <td title={item.run_id}><span className="iad-identifier">{item.run_id}</span></td><td>{types[item.job_type]}</td><td>{item.cancel_requested && (item.status === "RUNNING" || item.status === "PENDING") ? "正在停止" : jobStatuses[item.status]}</td>
      <td className="iad-number">{item.completed} / {item.total_samples}</td><td className="iad-number">{item.failed}</td><td><time dateTime={item.started_at || undefined}>{item.started_at ? new Date(item.started_at).toLocaleString() : "未提供"}</time></td>
      <td><button aria-label={`查看作业 ${item.run_id}`} onClick={() => workspace.updateView(pageId, { job:item.run_id })}>详情</button></td>
    </tr>)}</tbody></table></div><Pagination total={filtered.length} page={current} size={10} unit="个作业" onPage={setPage} />
    {!filtered.length && <p role="status">没有匹配的作业。</p>}
    {job && <section aria-label="作业详情"><h3>作业详情</h3><JobDetail key={job.run_id} job={job} onChanged={onChanged} /></section>}
  </div>;
}
