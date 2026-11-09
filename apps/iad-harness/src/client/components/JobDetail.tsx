import React from 'react';
import type {JobSnapshot} from '../../shared/contracts.js';
import {jobPhases,jobStatuses,jobWorkflow} from '../../shared/job-display.js';


export function JobDetail({job,stale=false}: {job:JobSnapshot;stale?:boolean}) {
  const workflow=jobWorkflow(job),index=workflow.index;
  const failed=['FAILED','PARTIAL','INTERRUPTED'].includes(job.status), pending=job.status==='PENDING';
  const phase=jobPhases[job.phase || ''] || job.phase || '未记录具体执行阶段';
  const seconds=job.started_at?Math.max(0,Math.floor(((job.finished_at?Date.parse(job.finished_at):Date.now())-Date.parse(job.started_at))/1000)):null;
  const elapsed=seconds===null?'—':`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  const meta=[['作业 ID',job.run_id],['作业类型',workflow.title],['提交时间',job.submitted_at?new Date(job.submitted_at).toLocaleString():'未记录'],
    ...(job.model_name?[['模型',job.model_name]]:[]),['开始时间',job.started_at?new Date(job.started_at).toLocaleString():'未开始'],['耗时',elapsed],
    ['样本进度',`${job.completed} / ${job.total_samples}${job.failed?`，失败 ${job.failed}`:''}`],
    ...(job.queue_position!=null?[['排队位置',String(job.queue_position)]]:[]),
    ...(job.total_gallery_groups!=null?[['图组进度',`${job.completed_gallery_groups ?? 0} / ${job.total_gallery_groups}`]]:[]),
    ...(job.phase_started_at?[['阶段开始',new Date(job.phase_started_at).toLocaleString()]]:[]),
    ...(job.current_sample?[['当前图像',job.current_sample.relative_path || job.current_sample.sample_uuid]]:[])];
  return <div className="iad-job-drawer-body">
    <div className="iad-job-statusline"><span className="iad-job-pill" data-status={job.status}>{job.cancel_requested&&['PENDING','RUNNING'].includes(job.status)?'正在停止':jobStatuses[job.status]}</span>
      <strong>{pending?'等待资源调度':phase}</strong></div>
    <dl className="iad-job-meta">{meta.map(([label,value])=><React.Fragment key={label}><dt>{label}</dt><dd>{value}</dd></React.Fragment>)}</dl>
    <section className="iad-job-status-section" aria-label="执行阶段"><h3>执行阶段</h3>
      {index<0&&<p className="iad-job-note">当前记录没有独立的阶段值。</p>}
      <div className="iad-job-stage-list">{workflow.stages.map((stage,position)=>{
        const current=!pending&&position===index;
        const state=current?(failed?'error':job.status==='RUNNING'?'current':job.status==='COMPLETED'?'done':'waiting'):'waiting';
        return <div key={stage.title} className="iad-job-stage" data-state={state} aria-current={current?'step':undefined}>
          <span className="iad-job-dot">{state==='done'?'✓':position+1}</span><div><strong>{stage.title}</strong>
            {current&&<small>{failed||job.status==='CANCELLED'?'停止于此阶段':job.status==='RUNNING'?'当前执行阶段':'已结束'}</small>}</div></div>;
      })}</div>
    </section>
    {(failed||job.errors.length>0)&&<section className="iad-job-status-section" aria-label="失败信息"><h3>失败信息</h3>
      {job.execution_error && <div className="iad-job-error"><strong>{job.execution_error.type}</strong><p>{job.execution_error.message}</p></div>}
      {job.errors.length?job.errors.map((error,index)=><div className="iad-job-error" key={`${error.sample_id}:${index}`}>
        <strong>{error.code?`错误码：${error.code}`:'失败原因'}</strong><p>{error.message}</p>
        <p>{error.relative_path || error.sample_uuid || error.sample_id}</p>
        {error.source_run_id&&<p>{jobPhases[error.source_phase || ''] || error.source_phase || '未记录阶段'}<code>{error.source_run_id}</code></p>}
      </div>):!job.execution_error&&<div className="iad-job-error"><p>未记录错误详情</p></div>}
    </section>}
    {stale&&<p className="iad-job-note" role="status">当前显示最近一次读取的作业状态。</p>}
  </div>;
}
