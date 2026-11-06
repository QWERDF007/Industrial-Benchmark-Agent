import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { jobStatuses } from '../../shared/job-display.js';
import { useWorkspace } from '../workspace.js';
import { JobDetail } from './JobDetail.js';
import { Modal } from './Modal.js';
import { Button } from './Button.js';
import { IconButton } from './IconButton.js';
import { message, request } from '../api.js';
const cancellationRoutes = {
    ANALYSIS_WORKFLOW: 'analysis', MODEL_AUDIT: 'audit', DIRECTION_EXPLORATION: 'exploration', EXPLORATION_BATCH: 'exploration',
    KNOWLEDGE: 'knowledge', KNOWLEDGE_BATCH: 'knowledge', NORMAL_KNOWLEDGE: 'knowledge', DEFECT_KNOWLEDGE: 'knowledge',
};
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
    const [confirmation, setConfirmation] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const [cancelled, setCancelled] = useState(null);
    const active = ['PENDING', 'RUNNING'].includes(job.status);
    const response = cancelled?.run_id === job.run_id ? cancelled : null;
    const displayed = active && response ? response : job;
    const stopping = ['PENDING', 'RUNNING'].includes(displayed.status) && displayed.cancel_requested;
    const canCancel = active && !stopping && !!cancellationRoutes[job.job_type];
    useEffect(() => { setConfirmation(false); setError(''); setCancelled(null); }, [job.run_id]);
    async function cancel() {
        if (!canCancel || busy)
            return;
        setBusy(true);
        setError('');
        try {
            const result = await request(`/${cancellationRoutes[job.job_type]}/cancel/${encodeURIComponent(job.run_id)}`, {});
            setCancelled(result);
            setConfirmation(false);
        }
        catch (failure) {
            setError(message(failure));
        }
        finally {
            setBusy(false);
        }
    }
    useEffect(() => { if (state.pageId !== page.current)
        onClose(); }, [state.pageId, onClose]);
    return _jsxs(Modal, { title: "\u4F5C\u4E1A\u72B6\u6001", className: "iad-drawer iad-job-drawer", onClose: onClose, restoreFocus: () => trigger.current?.isConnected ? trigger.current : (triggerId.current ? document.getElementById(triggerId.current) : null) || document.querySelector(`button[data-job-root="${CSS.escape(job.root_run_id)}"]`), children: [_jsx(JobDetail, { job: displayed, stale: stale }), _jsxs("footer", { className: "iad-job-drawer-footer", children: [error && _jsx("p", { role: "alert", children: error }), stopping ? _jsx("span", { role: "status", children: "\u6B63\u5728\u505C\u6B62" }) : canCancel && (!response || ['PENDING', 'RUNNING'].includes(response.status)) &&
                        (confirmation ? _jsxs(_Fragment, { children: [_jsx("span", { children: "\u786E\u5B9A\u53D6\u6D88\u5F53\u524D\u4F5C\u4E1A\uFF1F" }), _jsx(Button, { disabled: busy, onClick: () => setConfirmation(false), children: "\u8FD4\u56DE" }), _jsx(Button, { disabled: busy, onClick: () => void cancel(), children: busy ? '正在提交…' : '确认取消' })] })
                            : _jsx(Button, { onClick: () => setConfirmation(true), children: "\u53D6\u6D88\u4F5C\u4E1A" })), _jsx(Button, { onClick: onClose, children: "\u5173\u95ED" })] })] });
}
