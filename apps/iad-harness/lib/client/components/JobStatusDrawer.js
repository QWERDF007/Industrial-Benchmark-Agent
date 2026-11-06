import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { jobStatuses } from '../../shared/job-display.js';
import { useWorkspace } from '../workspace.js';
import { JobDetail } from './JobDetail.js';
import { Modal } from './Modal.js';
import { Button } from './Button.js';
import { IconButton } from './IconButton.js';
export function JobStatusButton({ job, onClick, children }) {
    if (job.status === 'COMPLETED')
        return _jsx("span", { children: children || jobStatuses[job.status] });
    return _jsx("button", { type: "button", className: "iad-job-status-button", "data-job-root": job.root_run_id, "aria-label": `查看作业状态 ${job.run_id}`, onClick: event => { event.stopPropagation(); onClick(); }, onKeyDown: event => event.stopPropagation(), children: children || jobStatuses[job.status] });
}
export function JobStatusAction({ job, onClick }) {
    return job.status === 'COMPLETED' ? null : _jsx(IconButton, { icon: "details", label: `查看作业状态 ${job.run_id}`, title: "\u67E5\u770B\u4F5C\u4E1A\u72B6\u6001", onClick: event => { event.stopPropagation(); onClick(); } });
}
export function JobStatusDrawer({ job, onClose, stale }) {
    const { state } = useWorkspace();
    const page = useRef(state.pageId);
    const trigger = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const triggerId = useRef(trigger.current?.id);
    useEffect(() => { if (state.pageId !== page.current)
        onClose(); }, [state.pageId, onClose]);
    return _jsxs(Modal, { title: "\u4F5C\u4E1A\u72B6\u6001", className: "iad-drawer iad-job-drawer", onClose: onClose, restoreFocus: () => trigger.current?.isConnected ? trigger.current : (triggerId.current ? document.getElementById(triggerId.current) : null) || document.querySelector(`button[data-job-root="${CSS.escape(job.root_run_id)}"]`), children: [_jsx(JobDetail, { job: job, stale: stale }), _jsx("footer", { className: "iad-job-drawer-footer", children: _jsx(Button, { onClick: onClose, children: "\u5173\u95ED" }) })] });
}
