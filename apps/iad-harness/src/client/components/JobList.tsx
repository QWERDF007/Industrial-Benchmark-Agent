import React,{useRef} from 'react';
import type {Dataset,JobSnapshot} from '../../shared/contracts.js';
import {formatJobElapsed,formatJobTime,jobStatuses} from '../../shared/job-display.js';
import {useJobClock} from '../useJobClock.js';
import type {useJobList} from '../useJobList.js';
import {JobListPanel} from './JobListPanel.js';
import {JobStatusAction,JobStatusButton} from './JobStatusDrawer.js';
import {IconButton,type IconName} from './IconButton.js';
import {DeleteAction} from './DeleteAction.js';
import {ClearFilterButton} from './CommonFilterControls.js';
import {Select} from './Select.js';
import {Pagination,IBA_JOBS_PAGE_SIZE} from './Pagination.js';

export interface JobListActions {
  status(job:JobSnapshot):void;
  prompt(job:JobSnapshot):void;
  delete(job:JobSnapshot):Promise<void>;
  additional?:{id:string;label:string;icon:IconName;onClick(job:JobSnapshot):void}[];
}

export function JobList({title,list,datasets,actions,loading=false,className=''}:{
  title:string;list:ReturnType<typeof useJobList>;datasets:Dataset[];actions:JobListActions;loading?:boolean;className?:string;
}) {
  const now=useJobClock(list.visible.some(job=>job.status==='RUNNING'));
  const searchInput=useRef<HTMLInputElement>(null);
  return <JobListPanel title={title} className={className} actions={list.hasJobs&&<div className="iad-job-filters">
    <input ref={searchInput} type="search" aria-label="搜索作业" placeholder="搜索作业ID或模型" value={list.state.search} onChange={event=>list.search(event.target.value)}/>
    <Select aria-label="筛选作业状态" value={list.state.status} onChange={event=>list.status(event.target.value)}>
      <option value="">全部状态</option>{Object.entries(jobStatuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}
    </Select><ClearFilterButton disabled={!list.state.search&&!list.state.status} onClick={list.clear}/>
  </div>}>
    {list.filtered.length?<div className="iad-job-table-scroll"><table className="iad-job-table-grid iad-jobs-table">
      <colgroup>{['id','status','dataset','progress','submitted','elapsed','actions'].map(name=><col key={name} className={`iad-job-col-${name}`}/>)}</colgroup>
      <thead><tr>{['作业ID','状态','数据集','进度','提交时间','耗时','操作'].map(label=><th key={label}>{label}</th>)}</tr></thead>
      <tbody>{list.visible.map(job=>{
        const names=(job.dataset_ids.length?job.dataset_ids:[job.dataset_id]).map(id=>datasets.find(dataset=>dataset.dataset_id===id)?.name||id).join('、');
        return <tr key={job.run_id} data-run-id={job.run_id} aria-selected={list.selected?.run_id===job.run_id} tabIndex={0}
          onClick={()=>list.select(job)} onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==='Enter'||event.key===' ')){event.preventDefault();list.select(job);}}}>
          <td title={job.run_id}>{job.run_id}</td>
          <td><JobStatusButton job={job} onClick={()=>actions.status(job)}><span className="iad-job-badge" data-status={job.status}>{jobStatuses[job.status]}</span></JobStatusButton></td>
          <td title={names}>{names}</td><td>{job.completed} / {job.total_samples}</td>
          <td>{formatJobTime(job.submitted_at)}</td><td>{formatJobElapsed(job,now)}</td>
          <td onClick={event=>event.stopPropagation()} onKeyDown={event=>event.stopPropagation()}><div className="iad-job-actions">
            <JobStatusAction job={job} onClick={()=>actions.status(job)}/>
            <IconButton icon="prompt" title="查看提示词" label={`查看提示词 ${job.run_id}`} onClick={()=>actions.prompt(job)}/>
            {actions.additional?.map(action=><IconButton key={action.id} icon={action.icon} title={action.label} label={`${action.label} ${job.run_id}`} onClick={()=>action.onClick(job)}/>)}
            <DeleteAction title="删除作业" name={job.run_id} confirmLabel="删除作业" disabled={job.status==='PENDING'||job.status==='RUNNING'}
              onDelete={()=>actions.delete(job)} restoreFocus={()=>searchInput.current}/>
          </div></td>
        </tr>;
      })}</tbody>
    </table></div>:<p className="iad-result-empty" role="status">{loading?`正在读取${title}…`:list.hasJobs?'没有符合筛选条件的作业':`当前没有${title}`}</p>}
    <Pagination hideSinglePage total={list.filtered.length} page={list.page} size={IBA_JOBS_PAGE_SIZE} unit="个作业" label={title} onPage={list.setPage}/>
  </JobListPanel>;
}
