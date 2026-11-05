import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { jobStatuses } from '../../shared/job-display.js';
import { useWorkspace } from '../workspace.js';
import { JobDetail } from './JobDetail.js';
import { Modal } from './Modal.js';
export function JobStatusButton({ job, onClick, children }) {
    return _jsx("button", { type: "button", className: "iad-job-status-button", "data-job-root": job.root_run_id, "aria-label": `查看作业状态 ${job.run_id}`, onClick: event => { event.stopPropagation(); onClick(); }, onKeyDown: event => event.stopPropagation(), children: children || jobStatuses[job.status] });
}
export function JobStatusDrawer({ job, onClose, onChanged, stale, lastSyncedAt }) {
    const { state } = useWorkspace();
    const page = useRef(state.pageId);
    const trigger = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
    useEffect(() => { if (state.pageId !== page.current)
        onClose(); }, [state.pageId, onClose]);
    return _jsx(Modal, { title: "\u4F5C\u4E1A\u72B6\u6001", className: "iad-drawer iad-job-drawer", onClose: onClose, restoreFocus: () => trigger.current?.isConnected ? trigger.current : document.querySelector(`button[data-job-root="${CSS.escape(job.root_run_id)}"]`), children: _jsx(JobDetail, { job: job, presentation: "status", onClose: onClose, onChanged: onChanged, stale: stale, lastSyncedAt: lastSyncedAt }, job.run_id) });
}
