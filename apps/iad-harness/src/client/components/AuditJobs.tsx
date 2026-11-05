import {JobStatusButton} from './JobStatusDrawer.js';
import {Select} from './Select.js';
import {IconButton} from "./IconButton.js";
import React from 'react';
import type {Dataset, JobSnapshot} from '../../shared/contracts.js';
import {jobStatuses} from '../../shared/job-display.js';
import type {useAuditJobSelection} from '../useAuditJobSelection.js';
import {ClearFilterButton} from './CommonFilterControls.js';
import {Pagination} from './Pagination.js';


export function AuditJobs({selection, datasets, onDetails}: {
  selection: ReturnType<typeof useAuditJobSelection>; datasets: Dataset[]; onDetails(job: JobSnapshot): void;
}) {
  return <section className="audit-panel" aria-label="审计作业">
    <header className="audit-panel-head"><h2>审计作业</h2><div className="audit-filters">
      <label className="audit-field"><span>作业 ID</span><input id="audit-job-search" type="search" value={selection.state.search}
        onChange={event => selection.search(event.target.value)} placeholder="搜索作业 ID" /></label>
      <label className="audit-field"><span>状态</span><Select aria-label="审计作业状态" value={selection.state.status}
        onChange={event => selection.status(event.target.value)}><option value="">全部状态</option>
        {Object.entries(jobStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label>
      <ClearFilterButton onClick={selection.clear} />
    </div></header>
    <div className="iad-table-scroll"><table className="audit-table"><thead><tr>
      <th>作业 ID</th><th>状态</th><th>检查范围</th><th>完成 / 总数</th><th>提交时间</th><th className="audit-ops">操作</th>
    </tr></thead><tbody>{selection.visible.map(job => <tr key={job.run_id} data-run-id={job.run_id}
      aria-selected={selection.selected?.run_id === job.run_id} tabIndex={0} onClick={() => selection.select(job.run_id)}
      onKeyDown={event => {if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); selection.select(job.run_id);}}}>
      <td title={job.run_id}>{job.run_id}</td><td><JobStatusButton job={job} onClick={()=>onDetails(job)} /></td>
      <td>{datasets.find(dataset => dataset.dataset_id === job.dataset_id)?.name || '范围名称未记录'}</td>
      <td>{job.completed} / {job.total_samples}</td><td>{new Date(job.submitted_at).toLocaleString()}</td>
      <td className="audit-ops"><IconButton icon="details" type="button" label={`查看作业 ${job.run_id}`} onClick={event => {event.stopPropagation(); onDetails(job);}} /></td>
    </tr>)}</tbody></table></div>
    {!selection.filtered.length && <p className="audit-empty">{selection.state.search || selection.state.status ? '没有符合筛选条件的审计作业。' : '当前范围还没有审计作业，可以创建新审计。'}</p>}
    <Pagination total={selection.filtered.length} page={selection.page} size={8} unit="个作业" onPage={selection.setPage} />
  </section>;
}
