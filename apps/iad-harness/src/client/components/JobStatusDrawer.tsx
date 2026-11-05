import React, {useEffect, useRef} from 'react';
import type {JobSnapshot} from '../../shared/contracts.js';
import {jobStatuses} from '../../shared/job-display.js';
import {useWorkspace} from '../workspace.js';
import {JobDetail} from './JobDetail.js';
import {Modal} from './Modal.js';

export function JobStatusButton({job, onClick, children}: {job: JobSnapshot; onClick(): void; children?: React.ReactNode}) {
  return <button type="button" className="iad-job-status-button" data-job-root={job.root_run_id} aria-label={`查看作业状态 ${job.run_id}`}
    onClick={event => {event.stopPropagation(); onClick();}} onKeyDown={event => event.stopPropagation()}>
    {children || jobStatuses[job.status]}
  </button>;
}

export function JobStatusDrawer({job, onClose, onChanged, stale, lastSyncedAt}: {
  job: JobSnapshot; onClose(): void; onChanged(): void; stale?: boolean; lastSyncedAt?: number | null;
}) {
  const {state} = useWorkspace();
  const page = useRef(state.pageId);
  const trigger = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  useEffect(() => {if (state.pageId !== page.current) onClose();}, [state.pageId, onClose]);
  return <Modal title="作业状态" className="iad-drawer iad-job-drawer" onClose={onClose}
    restoreFocus={()=>trigger.current?.isConnected ? trigger.current : document.querySelector<HTMLElement>(`button[data-job-root="${CSS.escape(job.root_run_id)}"]`)}>
    <JobDetail key={job.run_id} job={job} presentation="status" onClose={onClose} onChanged={onChanged}
      stale={stale} lastSyncedAt={lastSyncedAt} />
  </Modal>;
}
