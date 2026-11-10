import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { message, request } from '../api.js';
import { Button } from './Button.js';
export function ConsistencyGroupReviewForm({ jobId, anchorId, onClose, onReviewed, children }) {
    const [context, setContext] = useState(null);
    const [decision, setDecision] = useState('pending');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const pending = useRef(null);
    const mounted = useRef(false);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    const path = jobId ? `/consistency/checks/${encodeURIComponent(jobId)}/anchors/${encodeURIComponent(anchorId)}/review` : null;
    useEffect(() => {
        const controller = new AbortController();
        if (!path) {
            setError('图组缺少可复核的作业引用');
            return;
        }
        request(path, undefined, undefined, controller.signal).then(value => {
            if (controller.signal.aborted)
                return;
            setContext(value);
            setDecision(value.disposition);
            const latest = [...value.decisions].reverse().find(item => item.request.result_fingerprint === value.result_fingerprint);
            setNote(latest?.request.comment || '');
        }).catch(failure => { if (!controller.signal.aborted)
            setError(message(failure)); });
        return () => controller.abort();
    }, [path]);
    const locked = busy || !context || !!pending.current;
    async function save(event) {
        event.preventDefault();
        if (!path || !context || busy)
            return;
        if (decision === 'pending' && !note.trim()) {
            onClose();
            return;
        }
        if (!note.trim()) {
            setError('请填写复核依据');
            return;
        }
        if (!pending.current)
            pending.current = { client_request_id: uuid(), result_fingerprint: context.result_fingerprint,
                reviewer: localStorage.getItem('iad.reviewer') || 'auditor_qc', comment: note.trim(),
                action: { kind: decision === 'confirmed' ? 'CONFIRM_DIFFERENCE' : decision === 'rejected' ? 'REJECT_DIFFERENCE' : 'NEEDS_CONTEXT' } };
        setBusy(true);
        setError('');
        try {
            await request(path, pending.current);
            pending.current = null;
            if (mounted.current)
                onClose();
            onReviewed();
        }
        catch (failure) {
            if (mounted.current)
                setError(message(failure));
        }
        finally {
            if (mounted.current)
                setBusy(false);
        }
    }
    return _jsxs("form", { className: "dc-group-review-form", onSubmit: save, children: [_jsxs("div", { className: "dc-dialog-body", children: [children, _jsxs("section", { className: "dc-review-panel", "aria-label": "\u4EBA\u5DE5\u590D\u6838", children: [_jsx("h3", { children: "\u4EBA\u5DE5\u590D\u6838" }), _jsx("div", { className: "dc-decision-controls", children: [['pending', '待确认'], ['confirmed', '确认冲突'], ['rejected', '排除冲突']].map(([value, label]) => _jsxs("label", { children: [_jsx("input", { type: "radio", name: "dc-review", value: value, disabled: locked, checked: decision === value, onChange: () => setDecision(value) }), label] }, value)) }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), _jsx("textarea", { disabled: locked, className: "dc-note", id: "dc-note", "aria-label": "\u590D\u6838\u8BF4\u660E", placeholder: "\u590D\u6838\u8BF4\u660E", value: note, onChange: event => setNote(event.target.value) })] })] }), _jsxs("footer", { className: "dc-dialog-footer", children: [_jsx(Button, { onClick: onClose, children: "\u53D6\u6D88" }), _jsx(Button, { variant: "primary", type: "submit", disabled: busy || !context, children: "\u4FDD\u5B58\u590D\u6838" })] })] });
}
