import React, {useEffect, useRef, useState} from 'react';
import type {JobSnapshot} from '../../shared/contracts.js';
import {jobStatuses} from '../../shared/job-display.js';
import {useWorkspace} from '../workspace.js';
import {JobDetail} from './JobDetail.js';
import {Modal} from './Modal.js';
import {Button} from './Button.js';
import {IconButton} from './IconButton.js';
import {ConfirmationDialog} from './ConfirmationDialog.js';
import {request} from '../api.js';

const cancellationRoutes:Partial<Record<JobSnapshot['job_type'],string>>={
  ANALYSIS_WORKFLOW:'analysis',MODEL_AUDIT:'audit',DIRECTION_EXPLORATION:'exploration',EXPLORATION_BATCH:'exploration',
  KNOWLEDGE:'knowledge',KNOWLEDGE_BATCH:'knowledge',NORMAL_KNOWLEDGE:'knowledge',DEFECT_KNOWLEDGE:'knowledge',
};

export function JobStatusButton({job, onClick, children}: {job: JobSnapshot; onClick(): void; children?: React.ReactNode}) {
  if (job.status === 'COMPLETED') return <span>{children || jobStatuses[job.status]}</span>;
  return <button type="button" className="iad-job-status-button" data-job-root={job.root_run_id} aria-label={`查看作业状态 ${job.run_id}`}
    onClick={event => {event.stopPropagation(); onClick();}} onKeyDown={event => event.stopPropagation()}>
    {children || jobStatuses[job.status]}
  </button>;
}

export function JobStatusAction({job,onClick}: {job:JobSnapshot;onClick():void}) {
  return job.status === 'COMPLETED' ? null : <IconButton icon="clock" label={`查看作业状态 ${job.run_id}`} title="查看作业状态"
    onClick={event=>{event.stopPropagation();onClick();}} />;
}

export function JobStatusDrawer({job, onClose, stale}: {job:JobSnapshot;onClose():void;stale?:boolean}) {
  const {state} = useWorkspace();
  const page = useRef(state.pageId);
  const trigger = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const triggerId = useRef(trigger.current?.id);
  const [confirmation,setConfirmation]=useState(false);
  const cancelTrigger=useRef<HTMLButtonElement>(null);
  const [cancelled,setCancelled]=useState<JobSnapshot|null>(null);
  const active=['PENDING','RUNNING'].includes(job.status);
  const response=cancelled?.run_id===job.run_id?cancelled:null;
  const displayed=active&&response?response:job;
  const stopping=['PENDING','RUNNING'].includes(displayed.status)&&displayed.cancel_requested;
  const canCancel=active&&!stopping&&!!cancellationRoutes[job.job_type];
  useEffect(()=>{setConfirmation(false);setCancelled(null);},[job.run_id]);
  async function cancel() {
    if(!canCancel)return;
    const result=await request<JobSnapshot>(`/${cancellationRoutes[job.job_type]}/cancel/${encodeURIComponent(job.run_id)}`,{});
    setCancelled(result);
  }
  useEffect(() => {if (state.pageId !== page.current) onClose();}, [state.pageId, onClose]);
  return <><Modal title="作业状态" className="iad-drawer iad-job-drawer" onClose={onClose}
    restoreFocus={()=>trigger.current?.isConnected ? trigger.current : (triggerId.current ? document.getElementById(triggerId.current) : null) || document.querySelector<HTMLElement>(`button[data-job-root="${CSS.escape(job.root_run_id)}"]`)}>
    <JobDetail job={displayed} stale={stale} />
    {(canCancel||stopping)&&<footer className="iad-job-drawer-footer">
      {stopping?<span role="status">正在停止</span>:<Button ref={cancelTrigger} onClick={()=>setConfirmation(true)}>取消作业</Button>}
    </footer>}
  </Modal>
  {confirmation&&<ConfirmationDialog title="取消作业" danger confirmLabel="确认取消" cancelAriaLabel="取消"
    onClose={()=>setConfirmation(false)} onConfirm={cancel}
    restoreFocus={()=>cancelTrigger.current||document.querySelector<HTMLElement>('.iad-job-drawer .iad-dialog-header button')}>
    <p>确定取消作业「{job.run_id}」吗？</p><p>取消后将停止该作业后续执行。</p>
  </ConfirmationDialog>}</>;
}
