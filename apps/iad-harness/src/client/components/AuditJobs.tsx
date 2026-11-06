import {SectionHeading} from './layout/SectionHeading.js';
import {JobStatusButton, JobStatusAction} from './JobStatusDrawer.js';
import {Select} from './Select.js';
import {IconButton} from "./IconButton.js";
import React from 'react';
import type {Dataset, JobSnapshot} from '../../shared/contracts.js';
import {jobStatuses} from '../../shared/job-display.js';
import type {useAuditJobSelection} from '../useAuditJobSelection.js';
import {ClearFilterButton} from './CommonFilterControls.js';
import {Pagination} from './Pagination.js';


export function AuditJobs({selection, datasets, onDetails, loading=false}: {
  selection: ReturnType<typeof useAuditJobSelection>; datasets: Dataset[];loading?:boolean; onDetails(job: JobSnapshot): void;
}) {
  return <section className="audit-panel" aria-label="审计作业">
    <SectionHeading title="审计作业" className="audit-job-heading">{selection.hasJobs&&<div className="audit-filters">
      <label className="audit-field"><span>作业 ID</span><input id="audit-job-search" type="search" value={selection.state.search}
        onChange={event => selection.search(event.target.value)} placeholder="搜索作业 ID" /></label>
      <label className="audit-field"><span>状态</span><Select aria-label="审计作业状态" value={selection.state.status}
        onChange={event => selection.status(event.target.value)}><option value="">全部状态</option>
        {Object.entries(jobStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label>
      <ClearFilterButton onClick={selection.clear} />
    </div>}</SectionHeading>
    {!!selection.filtered.length&&<div className="iad-table-scroll"><table className="audit-table"><thead><tr>
      <th>作业 ID</th><th>状态</th><th>检查范围</th><th>完成 / 总数</th><th>提交时间</th><th className="audit-ops">操作</th>
    </tr></thead><tbody>{selection.visible.map(job => <tr key={job.run_id} data-run-id={job.run_id}
      aria-selected={selection.selected?.run_id === job.run_id} tabIndex={0} onClick={() => selection.select(job.run_id)}
      onKeyDown={event => {if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); selection.select(job.run_id);}}}>
      <td title={job.run_id}>{job.run_id}</td><td><JobStatusButton job={job} onClick={()=>onDetails(job)} /></td>
      <td>{(job.dataset_ids.length?job.dataset_ids:[job.dataset_id]).map(id=>datasets.find(dataset=>dataset.dataset_id===id)?.name || id).join('、')}</td>
      <td>{job.completed} / {job.total_samples}</td><td>{new Date(job.submitted_at).toLocaleString()}</td>
      <td className="audit-ops"><JobStatusAction job={job} onClick={()=>onDetails(job)} /><IconButton icon="prompt" type="button" title="查看作业详情" label={`查看作业 ${job.run_id}`} onClick={event => {event.stopPropagation(); selection.select(job.run_id);}} /></td>
    </tr>)}</tbody></table></div>}
    {!selection.filtered.length && <p className="iad-result-empty">{loading?'正在读取审计作业…':selection.state.search || selection.state.status ? '没有符合筛选条件的审计作业。' : '当前没有审计作业'}</p>}
    <Pagination total={selection.filtered.length} page={selection.page} size={8} unit="个作业" hideSinglePage onPage={selection.setPage} />
  </section>;
}
