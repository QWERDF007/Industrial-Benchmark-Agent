import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { message, request, reviewLabel } from '../api.js';
import { differenceLabels } from '../../shared/consistency-presentation.js';
import { useWorkspace } from '../workspace.js';
import { ConsistencyRegionProposal } from './ConsistencyRegionProposal.js';
const actions = { CONFIRM_DIFFERENCE: '确认差异，待修正', EXPECTED_POLICY_DIFFERENCE: '属于不同规范', NEEDS_CONTEXT: '需要补充依据', SET_EFFECTIVE_QUALITY: '提交有效质量裁决', PROPOSE_REGION_CHANGE: '提出区域修正建议' };
const reviewStates = { OPEN: '待复核', NEEDS_CONTEXT: '待补充依据', RESOLVED: '已裁决' };
const correctionStates = { NOT_REQUIRED: '无需修正', PROPOSED: '建议未应用', AWAITING_RESCAN: '等待源修正及重扫', VERIFIED: '重扫已验证' };
export function ConsistencyReviewPanel({ bundle }) {
    const { workspace } = useWorkspace();
    const { result } = bundle, key = 'iad.consistency-pending:' + result.evidence_id;
    const [context, setContext] = useState(null), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
    const [selected, setSelected] = useState([]), [kind, setKind] = useState('CONFIRM_DIFFERENCE');
    const [reviewer, setReviewer] = useState(() => localStorage.getItem('iad.reviewer') || 'auditor_qc'), [comment, setComment] = useState('');
    const [quality, setQuality] = useState({});
    const [region, setRegion] = useState(null);
    const pending = useRef(null), active = useRef(true);
    const [hasPending, setHasPending] = useState(false);
    const sources = [bundle.sources.left, bundle.sources.right];
    useEffect(() => {
        active.current = true;
        const controller = new AbortController();
        try {
            const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
            if (saved?.evidence_id === result.evidence_id && typeof saved.client_request_id === 'string') {
                pending.current = saved;
                setHasPending(true);
            }
        }
        catch {
            sessionStorage.removeItem(key);
        }
        request('/consistency/review/context', { evidence_id: result.evidence_id }, undefined, controller.signal)
            .then(value => { if (active.current)
            setContext(value); }).catch(error => { if (!controller.signal.aborted)
            setError(message(error)); });
        return () => { active.current = false; controller.abort(); };
    }, [key, result.evidence_id]);
    const current = context?.source_states.left === 'CURRENT' && context.source_states.right === 'CURRENT';
    const selectedDiffs = result.annotation.differences.filter(diff => selected.includes(diff.difference_id));
    const targets = Object.entries(quality).flatMap(([sample_id, quality]) => quality ? [{ sample_id, quality }] : []);
    const canSubmit = reviewer.trim() && comment.trim() && selected.length && (kind !== 'SET_EFFECTIVE_QUALITY' || (current && targets.length)) && (kind !== 'PROPOSE_REGION_CHANGE' || (current && region));
    async function submit() {
        if (busy)
            return;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            if (!pending.current) {
                if (!canSubmit)
                    throw new Error('请填写处置目标、复核人与说明');
                const action = kind === 'SET_EFFECTIVE_QUALITY' ? { kind, targets: targets.length === 1 ? [targets[0]] : [targets[0], targets[1]] } : kind === 'PROPOSE_REGION_CHANGE' ? region : { kind };
                pending.current = { client_request_id: uuid(), evidence_id: result.evidence_id, result_id: result.result_id, difference_ids: [selected[0], ...selected.slice(1)], reviewer: reviewer.trim(), comment: comment.trim(), action };
                sessionStorage.setItem(key, JSON.stringify(pending.current));
                setHasPending(true);
            }
            const submission = pending.current;
            await request('/consistency/review/submit', submission);
            const next = await request('/consistency/review/context', { evidence_id: result.evidence_id });
            sessionStorage.removeItem(key);
            localStorage.setItem('iad.reviewer', submission.reviewer);
            pending.current = null;
            if (active.current) {
                setContext(next);
                setHasPending(false);
                setNotice('处置已提交');
            }
        }
        catch (error) {
            if (active.current)
                setError(message(error));
        }
        finally {
            if (active.current)
                setBusy(false);
        }
    }
    async function verify(decision_id) {
        setBusy(true);
        setError('');
        try {
            const compared = await request('/consistency/compare', { sample_a: bundle.parameters.sample_a, sample_b: bundle.parameters.sample_b });
            const checked = await request('/consistency/review/verify', { client_request_id: uuid(), decision_id, evidence_id: compared.evidence_id, reviewer: reviewer.trim() });
            const next = await request('/consistency/review/context', { evidence_id: result.evidence_id });
            if (active.current) {
                setContext(next);
                setNotice(checked.reason);
            }
        }
        catch (error) {
            if (active.current)
                setError(message(error));
        }
        finally {
            if (active.current)
                setBusy(false);
        }
    }
    async function compareCurrent() {
        setBusy(true);
        setError('');
        try {
            const compared = await request('/consistency/compare', { sample_a: bundle.parameters.sample_a, sample_b: bundle.parameters.sample_b });
            if (active.current)
                workspace.updateConsistency({ evidenceId: compared.evidence_id, resultId: compared.result_id, differenceId: undefined }, true);
        }
        catch (error) {
            if (active.current)
                setError(message(error));
        }
        finally {
            if (active.current)
                setBusy(false);
        }
    }
    return _jsxs("section", { className: "iad-job-panel iad-consistency-review", "aria-label": "\u4E00\u81F4\u6027\u4EBA\u5DE5\u5904\u7F6E", children: [_jsx("h2", { children: "\u4EBA\u5DE5\u5904\u7F6E" }), context && _jsx("div", { className: "iad-table-scroll", children: _jsxs("table", { className: "iad-resource-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u5DEE\u5F02" }), _jsx("th", { children: "\u590D\u6838" }), _jsx("th", { children: "\u6E90\u4FEE\u6B63" })] }) }), _jsx("tbody", { children: context.differences.map(item => _jsxs("tr", { "data-review-state": item.review_state, "data-correction-state": item.correction_state, children: [_jsx("td", { children: _jsxs("label", { children: [_jsx("input", { type: "checkbox", "aria-label": `处置差异 ${result.annotation.differences.find(diff => diff.difference_id === item.difference_id)?.type}`, disabled: busy || hasPending, checked: selected.includes(item.difference_id), onChange: event => setSelected(event.target.checked ? [...selected, item.difference_id] : selected.filter(id => id !== item.difference_id)) }), differenceLabels[result.annotation.differences.find(diff => diff.difference_id === item.difference_id).type]] }) }), _jsx("td", { children: reviewStates[item.review_state] }), _jsx("td", { children: correctionStates[item.correction_state] })] }, item.difference_id)) })] }) }), !current && _jsxs("div", { className: "iad-row", children: [_jsx("p", { className: "iad-muted", children: "\u5386\u53F2\u6765\u6E90\u53EF\u8865\u5145\u5904\u7F6E\u8BF4\u660E\uFF1B\u8D28\u91CF\u88C1\u51B3\u548C\u533A\u57DF\u5EFA\u8BAE\u9700\u91CD\u65B0\u6BD4\u8F83\u5F53\u524D\u6765\u6E90\u3002" }), _jsx("button", { disabled: busy || hasPending, onClick: () => void compareCurrent(), children: "\u91CD\u65B0\u6BD4\u8F83\u5F53\u524D\u6765\u6E90" })] }), _jsxs("form", { onSubmit: event => { event.preventDefault(); void submit(); }, children: [_jsxs("fieldset", { disabled: busy || hasPending, children: [_jsxs("div", { className: "iad-config-bar", children: [_jsxs("label", { className: "iad-field", children: ["\u5904\u7F6E\u52A8\u4F5C", _jsx("select", { "aria-label": "\u4E00\u81F4\u6027\u5904\u7F6E\u52A8\u4F5C", value: kind, onChange: event => setKind(event.target.value), children: Object.entries(actions).map(([value, label]) => _jsx("option", { value: value, children: label }, value)) })] }), _jsxs("label", { className: "iad-field", children: ["\u590D\u6838\u4EBA", _jsx("input", { "aria-label": "\u4E00\u81F4\u6027\u590D\u6838\u4EBA", value: reviewer, onChange: event => setReviewer(event.target.value), required: true })] })] }), kind === 'SET_EFFECTIVE_QUALITY' && _jsxs("section", { "aria-label": "\u8D28\u91CF\u88C1\u51B3\u76EE\u6807", children: [_jsx("h3", { children: "\u5B9E\u9645\u76EE\u6807\u6837\u672C" }), sources.map(source => _jsxs("label", { className: "iad-field", children: [source.sample.relative_path, _jsxs("select", { "aria-label": `质量裁决 ${source.sample.relative_path}`, value: quality[source.sample.sample_id] || '', onChange: event => setQuality({ ...quality, [source.sample.sample_id]: event.target.value }), children: [_jsx("option", { value: "", children: "\u4E0D\u4FEE\u6539" }), ['PASS', 'FAIL', 'HARD_NORMAL', 'UNCERTAIN'].map(value => _jsx("option", { value: value, children: reviewLabel(value) }, value))] })] }, source.sample.sample_id))] }), kind === 'PROPOSE_REGION_CHANGE' && _jsx(ConsistencyRegionProposal, { sources: sources, differences: selectedDiffs, onChange: setRegion }), _jsxs("label", { className: "iad-field", children: ["\u5904\u7F6E\u8BF4\u660E", _jsx("textarea", { "aria-label": "\u4E00\u81F4\u6027\u5904\u7F6E\u8BF4\u660E", required: true, value: comment, onChange: event => setComment(event.target.value) })] })] }), hasPending && pending.current && _jsxs("div", { role: "status", children: ["\u63D0\u4EA4\u7ED3\u679C\u5F85\u786E\u8BA4 \u00B7 ", actions[pending.current.action.kind], " \u00B7 ", pending.current.reviewer, _jsx("p", { children: pending.current.comment }), pending.current.action.kind === 'SET_EFFECTIVE_QUALITY' && _jsx("ul", { children: pending.current.action.targets.map(target => _jsxs("li", { children: [sources.find(source => source.sample.sample_id === target.sample_id)?.sample.relative_path, " \u00B7 ", reviewLabel(target.quality)] }, target.sample_id)) }), pending.current.action.kind === 'PROPOSE_REGION_CHANGE' && _jsx("ul", { children: pending.current.action.changes.map((change, index) => _jsxs("li", { children: [sources.find(source => source.sample.sample_id === change.sample_id)?.sample.relative_path, " \u00B7 ", change.operation] }, index)) })] }), _jsx("button", { className: "iad-primary", disabled: busy || (!hasPending && !canSubmit), children: busy ? '提交中…' : hasPending ? '重试同一处置' : '提交处置' })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), notice && _jsx("p", { role: "status", children: notice }), !!context?.decisions.length && _jsxs("details", { children: [_jsxs("summary", { children: ["\u5904\u7F6E\u8BB0\u5F55 \u00B7 ", context.decisions.length] }), context.decisions.map(decision => _jsxs("div", { children: [_jsxs("p", { children: [actions[decision.request.action.kind], " \u00B7 ", decision.request.reviewer, " \u00B7 ", decision.request.comment] }), decision.request.action.kind === 'PROPOSE_REGION_CHANGE' && _jsx("button", { disabled: busy || hasPending || !reviewer.trim(), onClick: () => void verify(decision.decision_id), children: "\u9A8C\u8BC1\u91CD\u626B\u7ED3\u679C" })] }, decision.decision_id))] })] });
}
