import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconButton } from "./IconButton.js";
import { RefreshIcon } from "../AuditIcon.js";
import { useCallback, useEffect, useState } from 'react';
import { ApiError, message, request } from '../api.js';
import { useWorkspace } from '../workspace.js';
import { ConsistencyScopePicker } from './ConsistencyScopePicker.js';
import { ConsistencyGallery } from './ConsistencyGallery.js';
import { ConsistencyReportSummary } from './ConsistencyReportSummary.js';
import { ConsistencyEmpty } from './ConsistencyEmpty.js';
import { useConsistencyStart } from '../useConsistencyStart.js';
import { jobStatuses } from '../../shared/job-display.js';
export function ConsistencyScopeResults({ datasets, tab }) {
    const { state, workspace } = useWorkspace();
    const scope = state.consistency.scope || { kind: 'all_registered' };
    const facts = state.consistency.facts || 'CURRENT';
    const subject = state.consistency.subjectId || 'all', review = state.consistency.reviewFilter || '';
    const [report, setReport] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const [revision, setRevision] = useState(0);
    const reopen = useCallback(() => {
        workspace.updateConsistency({ queryId: undefined, groupId: undefined, memberId: undefined, differenceId: undefined, galleryPage: 1, memberPage: 1 }, true);
        setRevision(value => value + 1);
    }, [workspace]);
    const reset = (patch) => workspace.updateConsistency({ ...patch, queryId: undefined, groupId: undefined, memberId: undefined, galleryPage: 1, memberPage: 1 }, true);
    const batchId = state.consistency.batchId || '';
    const [batch, setBatch] = useState(null);
    const [batchError, setBatchError] = useState('');
    const actions = useConsistencyStart(id => { setBatch(null); reset({ batchId: id }); });
    useEffect(() => {
        if (!batchId)
            return;
        const controller = new AbortController();
        let timer;
        setBatch(null);
        setBatchError('');
        async function poll() {
            try {
                const current = await request(`/consistency/runs/${encodeURIComponent(batchId)}`, undefined, undefined, AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]));
                if (controller.signal.aborted)
                    return;
                setBatch(current);
                setBatchError('');
                if (['PENDING', 'RUNNING'].includes(current.status))
                    timer = setTimeout(poll, 1200);
                else {
                    setRevision(value => value + 1);
                }
            }
            catch (failure) {
                if (!controller.signal.aborted) {
                    if (failure instanceof ApiError && failure.code === 'REFERENCE_NOT_FOUND') {
                        setBatch(null);
                        setBatchError('');
                        workspace.updateConsistency({ batchId: undefined }, true);
                        return;
                    }
                    setBatchError(message(failure));
                    timer = setTimeout(poll, 5000);
                }
            }
        }
        void poll();
        return () => { controller.abort(); clearTimeout(timer); };
    }, [batchId]);
    const scopeKey = JSON.stringify(scope);
    useEffect(() => {
        const controller = new AbortController();
        setBusy(true);
        setError('');
        setReport(null);
        const input = { selection: { kind: 'scope', subjects: subject === 'all' ? { kind: 'all_registered' } : { kind: 'datasets', dataset_ids: [subject] }, corpus_scope: scope, facts, mode: 'exact' },
            relation: 'EXACT', annotation_differences_only: tab === 'conflicts',
            review_state: review || undefined, page_size: 1 };
        const saved = state.consistency.queryId;
        request(saved ? `/consistency/report/${encodeURIComponent(saved)}` : '/consistency/report', saved ? undefined : input, undefined, controller.signal)
            .catch(failure => {
            if (!saved || controller.signal.aborted || !(failure instanceof ApiError) || failure.code !== 'REFERENCE_NOT_FOUND')
                throw failure;
            workspace.updateConsistency({ queryId: undefined, groupId: undefined, memberId: undefined, differenceId: undefined, galleryPage: 1, memberPage: 1 }, true);
            return request('/consistency/report', input, undefined, controller.signal);
        })
            .then(data => { if (!controller.signal.aborted)
            setReport(data); }).catch(failure => { if (!controller.signal.aborted)
            setError(message(failure)); })
            .finally(() => { if (!controller.signal.aborted)
            setBusy(false); });
        return () => controller.abort();
    }, [scopeKey, subject, facts, tab, revision, review]);
    return _jsxs("section", { "aria-label": "\u8303\u56F4\u4E00\u81F4\u6027\u7ED3\u679C", children: [_jsx("form", { className: "iad-consistency-query", onSubmit: event => { event.preventDefault(); reset({}); setRevision(value => value + 1); }, children: _jsxs("fieldset", { disabled: busy, children: [_jsx("legend", { className: "iad-visually-hidden", children: "\u7ED3\u679C\u8303\u56F4" }), _jsxs("div", { className: "iad-row", children: [_jsxs("label", { className: "iad-filter", children: ["\u68C0\u67E5\u8303\u56F4", _jsxs("select", { "aria-label": "\u7ED3\u679C\u68C0\u67E5\u8303\u56F4", value: subject, onChange: event => reset({ subjectId: event.target.value === 'all' ? undefined : event.target.value }), children: [_jsx("option", { value: "all", children: "\u5168\u90E8\u5DF2\u6CE8\u518C\u6570\u636E\u96C6" }), datasets.map(item => _jsx("option", { value: item.dataset_id, children: item.name }, item.dataset_id))] })] }), _jsx(ConsistencyScopePicker, { datasets: datasets, value: scope, onChange: scope => reset({ scope }) }), _jsxs("label", { className: "iad-filter", children: ["\u4E8B\u5B9E\u6765\u6E90", _jsxs("select", { "aria-label": "\u4E8B\u5B9E\u6765\u6E90", value: facts, onChange: event => reset({ facts: event.target.value }), children: [_jsx("option", { value: "CURRENT", children: "\u5F53\u524D\u6765\u6E90" }), _jsx("option", { value: "HISTORICAL", children: "\u5386\u53F2\u6765\u6E90" }), _jsx("option", { value: "UNKNOWN", children: "\u65E0\u6CD5\u6838\u5B9E" })] })] }), _jsxs("label", { className: "iad-filter", children: ["\u5904\u7F6E\u72B6\u6001", _jsxs("select", { "aria-label": "\u5904\u7F6E\u72B6\u6001\u7B5B\u9009", value: review, onChange: event => reset({ reviewFilter: (event.target.value || undefined) }), children: [_jsx("option", { value: "", children: "\u5168\u90E8\u5904\u7F6E\u72B6\u6001" }), _jsx("option", { value: "OPEN", children: "\u5F85\u590D\u6838" }), _jsx("option", { value: "NEEDS_CONTEXT", children: "\u5F85\u8865\u5145\u4F9D\u636E" }), _jsx("option", { value: "RESOLVED", children: "\u5DF2\u88C1\u51B3" })] })] }), _jsx("button", { className: "iad-primary", type: "button", disabled: !datasets.length || actions.busy || !!batchId && !batch || !!batch && ['PENDING', 'RUNNING'].includes(batch.status), onClick: () => void actions.start('/consistency/start', { subjects: subject === 'all' ? { kind: 'all_registered' } : { kind: 'datasets', dataset_ids: [subject] }, corpus_scope: scope, mode: 'exact' }), children: actions.busy ? '正在启动…' : '开始批量检查' }), _jsx(IconButton, { type: "submit", label: "\u5237\u65B0\u7ED3\u679C", children: _jsx(RefreshIcon, {}) })] })] }) }), (error || actions.error) && _jsx("p", { role: "alert", className: "iad-error", children: error || actions.error }), actions.notice && _jsx("p", { role: "status", children: actions.notice }), busy && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u8303\u56F4\u7ED3\u679C\u2026" }), batchId && (batchError || !batch || batch.status !== 'COMPLETED') && _jsxs("div", { className: "iad-consistency-status", role: "status", children: [_jsx("strong", { children: batchError ? '批次状态未核实' : batch ? jobStatuses[batch.status] : '正在读取批次状态' }), batch && _jsxs("span", { children: ["\u5B8C\u6210 ", batch.completed, " / ", batch.total, " \u00B7 \u5931\u8D25 ", batch.failed, " \u00B7 \u672A\u5904\u7406 ", batch.unprocessed] }), batchError && _jsx("span", { className: "iad-error", role: "alert", children: batchError }), _jsx("button", { onClick: () => workspace.updateConsistency({ tab: 'jobs', batchId }, true), children: "\u67E5\u770B\u4F5C\u4E1A" })] }), report && _jsxs(_Fragment, { children: [_jsx(ConsistencyReportSummary, { report: report, facts: facts, children: batchId && _jsx("button", { className: "iad-consistency-text-button", onClick: () => workspace.updateConsistency({ tab: 'jobs', batchId }, true), children: "\u67E5\u770B\u4F5C\u4E1A" }) }), _jsx("section", { "aria-label": tab === 'conflicts' ? '范围比较结果' : '范围重复图组', children: !report.page.total ? _jsx(ConsistencyEmpty, { title: report.page.execution.failed || report.page.execution.unsupported ? '当前范围检查不完整' : report.page.execution.completed ? '当前筛选没有比较结果' : '尚未执行一致性检查', description: report.page.execution.failed || report.page.execution.unsupported ? '请到作业记录查看失败或不支持的原因；未成功检查的图像不代表没有冲突。' : report.page.execution.completed ? '可调整差异或处置状态筛选，查看已保存的检查事实。' : '选择检查范围与检索范围后开始检查，结果将在此显示。', children: _jsx("button", { onClick: () => workspace.updateConsistency({ tab: 'jobs' }), children: "\u524D\u5F80\u6279\u91CF\u68C0\u67E5" }) }) : _jsx(ConsistencyGallery, { queryId: report.page.query_id, kind: tab, onExpired: reopen }) })] })] });
}
