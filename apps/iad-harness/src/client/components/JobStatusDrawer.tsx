import React, {useEffect, useRef} from 'react';
import type {JobSnapshot} from '../../shared/contracts.js';
import {jobStatuses} from '../../shared/job-display.js';
import {useWorkspace} from '../workspace.js';
import {JobDetail} from './JobDetail.js';
import {Modal} from './Modal.js';
import {Button} from './Button.js';
import {IconButton} from './IconButton.js';

export function JobStatusButton({job, onClick, children}: {job: JobSnapshot; onClick(): void; children?: React.ReactNode}) {
  if (job.status === 'COMPLETED') return <span>{children || jobStatuses[job.status]}</span>;
  return <button type="button" className="iad-job-status-button" data-job-root={job.root_run_id} aria-label={`查看作业状态 ${job.run_id}`}
    onClick={event => {event.stopPropagation(); onClick();}} onKeyDown={event => event.stopPropagation()}>
    {children || jobStatuses[job.status]}
  </button>;
}

export function JobStatusAction({job,onClick}: {job:JobSnapshot;onClick():void}) {
  return job.status === 'COMPLETED' ? null : <IconButton icon="details" label={`查看作业状态 ${job.run_id}`} title="查看作业状态"
    onClick={event=>{event.stopPropagation();onClick();}} />;
}

export function JobStatusDrawer({job, onClose, stale}: {job:JobSnapshot;onClose():void;stale?:boolean}) {
  const {state} = useWorkspace();
  const page = useRef(state.pageId);
  const trigger = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const triggerId = useRef(trigger.current?.id);
  useEffect(() => {if (state.pageId !== page.current) onClose();}, [state.pageId, onClose]);
  return <Modal title="作业状态" className="iad-drawer iad-job-drawer" onClose={onClose}
    restoreFocus={()=>trigger.current?.isConnected ? trigger.current : (triggerId.current ? document.getElementById(triggerId.current) : null) || document.querySelector<HTMLElement>(`button[data-job-root="${CSS.escape(job.root_run_id)}"]`)}>
    <JobDetail job={job} stale={stale} />
    <footer className="iad-job-drawer-footer"><Button onClick={onClose}>关闭</Button></footer>
  </Modal>;
}
