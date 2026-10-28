import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconButton } from "./IconButton.js";
import { RefreshIcon } from "../AuditIcon.js";
import { useEffect, useState } from 'react';
import { imageRelations } from '../../shared/consistency-presentation.js';
import { mediaUrl, message, request } from '../api.js';
import { useWorkspace } from '../workspace.js';
import { ConsistencyScopePicker } from './ConsistencyScopePicker.js';
import { ConsistencyGroups } from './ConsistencyGroups.js';
import { ConsistencyReportSummary } from './ConsistencyReportSummary.js';
import { ConsistencyEmpty } from './ConsistencyEmpty.js';
import { ConsistencyEvidencePreview } from './ConsistencyEvidencePreview.js';
import { useConsistencyStart } from '../useConsistencyStart.js';
import { jobStatuses } from '../../shared/job-display.js';
export function ConsistencyScopeResults({ datasets, tab }) {
    const { state, workspace } = useWorkspace();
    const scope = state.consistency.scope || { kind: 'all_registered' };
    const facts = state.consistency.facts || 'CURRENT';
    const [subject, setSubject] = useState('all'), [conflict, setConflict] = useState('confirmed');
    const [review, setReview] = useState('');
    const [report, setReport] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const [cursor, setCursor] = useState(), [revision, setRevision] = useState(0);
    const selected = state.consistency.resultId;
    const batchId = state.consistency.batchId || '';
    const [batch, setBatch] = useState(null);
    const [batchError, setBatchError] = useState('');
    const actions = useConsistencyStart(id => { setBatch(null); workspace.updateConsistency({ batchId: id }, true); });
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
                    setCursor(undefined);
                    setRevision(value => value + 1);
                }
            }
            catch (failure) {
                if (!controller.signal.aborted) {
                    setBatchError(message(failure));
                    timer = setTimeout(poll, 5000);
                }
            }
        }
        void poll();
        return () => { controller.abort(); clearTimeout(timer); };
    }, [batchId]);
    const scopeKey = JSON.stringify(scope);
    useEffect(() => { setCursor(undefined); }, [scopeKey, subject, conflict, facts, tab, review]);
    useEffect(() => {
        const controller = new AbortController();
        setBusy(true);
        setError('');
        setReport(null);
        const input = { selection: { kind: 'scope', subjects: subject === 'all' ? { kind: 'all_registered' } : { kind: 'datasets', dataset_ids: [subject] }, corpus_scope: scope, facts, mode: 'exact' },
            relation: tab === 'groups' ? 'EXACT' : undefined, confirmed_conflict: tab === 'conflicts' && conflict === 'confirmed' ? true : undefined,
            review_state: review || undefined, cursor, page_size: 20 };
        request('/consistency/report', input, undefined, controller.signal)
            .then(data => { if (!controller.signal.aborted)
            setReport(data); }).catch(failure => { if (!controller.signal.aborted)
            setError(message(failure)); })
            .finally(() => { if (!controller.signal.aborted)
            setBusy(false); });
        return () => controller.abort();
    }, [scopeKey, subject, conflict, facts, tab, cursor, revision, review]);
    const item = report?.page.items.find(row => row.result.result_id === selected) || report?.page.items[0];
    return _jsxs("section", { "aria-label": "\u8303\u56F4\u4E00\u81F4\u6027\u7ED3\u679C", children: [_jsx("form", { className: "iad-consistency-query", onSubmit: event => { event.preventDefault(); setCursor(undefined); setRevision(value => value + 1); }, children: _jsxs("fieldset", { disabled: busy, children: [_jsx("legend", { className: "iad-visually-hidden", children: "\u7ED3\u679C\u8303\u56F4" }), _jsxs("div", { className: "iad-row", children: [_jsxs("label", { className: "iad-filter", children: ["\u68C0\u67E5\u8303\u56F4", _jsxs("select", { "aria-label": "\u7ED3\u679C\u68C0\u67E5\u8303\u56F4", value: subject, onChange: event => setSubject(event.target.value), children: [_jsx("option", { value: "all", children: "\u5168\u90E8\u5DF2\u6CE8\u518C\u6570\u636E\u96C6" }), datasets.map(item => _jsx("option", { value: item.dataset_id, children: item.name }, item.dataset_id))] })] }), _jsx(ConsistencyScopePicker, { datasets: datasets, value: scope, onChange: value => workspace.updateConsistency({ scope: value, groupId: undefined, groupPage: 1, memberPage: 1 }, true) }), _jsxs("label", { className: "iad-filter", children: ["\u4E8B\u5B9E\u6765\u6E90", _jsxs("select", { "aria-label": "\u4E8B\u5B9E\u6765\u6E90", value: facts, onChange: event => workspace.updateConsistency({ facts: event.target.value }, true), children: [_jsx("option", { value: "CURRENT", children: "\u5F53\u524D\u6765\u6E90" }), _jsx("option", { value: "HISTORICAL", children: "\u5386\u53F2\u6765\u6E90" }), _jsx("option", { value: "UNKNOWN", children: "\u65E0\u6CD5\u6838\u5B9E" })] })] }), tab === 'conflicts' && _jsxs("label", { className: "iad-filter", children: ["\u5DEE\u5F02\u7B5B\u9009", _jsxs("select", { "aria-label": "\u5DEE\u5F02\u7B5B\u9009", value: conflict, onChange: event => setConflict(event.target.value), children: [_jsx("option", { value: "confirmed", children: "\u5DF2\u786E\u8BA4\u51B2\u7A81" }), _jsx("option", { value: "all", children: "\u5168\u90E8\u6BD4\u8F83\u4E0E\u5F85\u786E\u8BA4" })] })] }), _jsxs("label", { className: "iad-filter", children: ["\u5904\u7F6E\u72B6\u6001", _jsxs("select", { "aria-label": "\u5904\u7F6E\u72B6\u6001\u7B5B\u9009", value: review, onChange: event => setReview(event.target.value), children: [_jsx("option", { value: "", children: "\u5168\u90E8\u5904\u7F6E\u72B6\u6001" }), _jsx("option", { value: "OPEN", children: "\u5F85\u590D\u6838" }), _jsx("option", { value: "NEEDS_CONTEXT", children: "\u5F85\u8865\u5145\u4F9D\u636E" }), _jsx("option", { value: "RESOLVED", children: "\u5DF2\u88C1\u51B3" })] })] }), _jsx("button", { className: "iad-primary", type: "button", disabled: !datasets.length || actions.busy || !!batchId && !batch || !!batch && ['PENDING', 'RUNNING'].includes(batch.status), onClick: () => void actions.start('/consistency/start', { subjects: subject === 'all' ? { kind: 'all_registered' } : { kind: 'datasets', dataset_ids: [subject] }, corpus_scope: scope, mode: 'exact' }), children: actions.busy ? '正在启动…' : '开始批量检查' }), _jsx(IconButton, { type: "submit", label: "\u5237\u65B0\u7ED3\u679C", children: _jsx(RefreshIcon, {}) })] })] }) }), (error || actions.error) && _jsx("p", { role: "alert", className: "iad-error", children: error || actions.error }), actions.notice && _jsx("p", { role: "status", children: actions.notice }), busy && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u8303\u56F4\u7ED3\u679C\u2026" }), batchId && (batchError || !batch || batch.status !== 'COMPLETED') && _jsxs("div", { className: "iad-consistency-status", role: "status", children: [_jsx("strong", { children: batchError ? '批次状态未核实' : batch ? jobStatuses[batch.status] : '正在读取批次状态' }), batch && _jsxs("span", { children: ["\u5B8C\u6210 ", batch.completed, " / ", batch.total, " \u00B7 \u5931\u8D25 ", batch.failed, " \u00B7 \u672A\u5904\u7406 ", batch.unprocessed] }), batchError && _jsx("span", { className: "iad-error", role: "alert", children: batchError }), _jsx("button", { onClick: () => workspace.updateConsistency({ tab: 'jobs', batchId }, true), children: "\u67E5\u770B\u4F5C\u4E1A" })] }), report && _jsxs(_Fragment, { children: [_jsx(ConsistencyReportSummary, { report: report, facts: facts, children: batchId && _jsx("button", { className: "iad-consistency-text-button", onClick: () => workspace.updateConsistency({ tab: 'jobs', batchId }, true), children: "\u67E5\u770B\u4F5C\u4E1A" }) }), tab === 'groups' ? _jsx(ConsistencyGroups, { queryId: report.page.query_id, datasets: datasets }) : _jsxs("section", { "aria-label": "\u8303\u56F4\u6BD4\u8F83\u7ED3\u679C", children: [!report.page.total ? _jsx(ConsistencyEmpty, { title: report.page.execution.failed || report.page.execution.unsupported ? '当前范围检查不完整' : report.page.execution.completed ? '当前筛选没有比较结果' : '尚未执行一致性检查', description: report.page.execution.failed || report.page.execution.unsupported ? '请到作业记录查看失败或不支持的原因；未成功检查的图像不代表没有冲突。' : report.page.execution.completed ? '可调整差异或处置状态筛选，查看已保存的检查事实。' : '选择检查范围与检索范围后开始检查，结果将在此显示。', children: _jsx("button", { onClick: () => workspace.updateConsistency({ tab: 'jobs' }), children: "\u524D\u5F80\u6279\u91CF\u68C0\u67E5" }) }) : _jsxs("div", { className: "iad-consistency-master-detail", children: [_jsxs("aside", { className: "iad-consistency-list", "aria-label": "\u51B2\u7A81\u6BD4\u8F83\u5217\u8868", children: [_jsxs("header", { className: "iad-consistency-panel-header", children: [_jsx("strong", { children: "\u6807\u6CE8\u51B2\u7A81" }), _jsxs("span", { children: [report.page.total, " \u5BF9\u6BD4\u8F83"] })] }), _jsx("div", { className: "iad-consistency-list-scroll", children: report.page.items.map(row => {
                                                    const source = row.facts_state === 'CURRENT' ? datasets.find(dataset => row.sample_a.startsWith(dataset.dataset_id + ':')) : undefined;
                                                    return _jsxs("button", { className: source ? 'iad-consistency-thumbnail-item' : undefined, "data-facts-state": row.facts_state, "aria-pressed": row === item, onClick: () => workspace.updateConsistency({ resultId: row.result.result_id, differenceId: undefined }, true), children: [source && _jsx("img", { alt: "\u6BD4\u8F83\u56FE\u50CF\u7F29\u7565\u56FE", loading: "lazy", src: mediaUrl({ task_id: source.task_id, sample_id: row.sample_a }, 'thumbnail') }), _jsxs("span", { className: "iad-consistency-list-caption", children: [_jsxs("strong", { title: `${row.sample_a} ↔ ${row.sample_b}`, children: [row.sample_a.split(':').slice(1).join(':'), " \u2194 ", row.sample_b.split(':').slice(1).join(':')] }), _jsxs("span", { children: [imageRelations[row.result.verification.relation], " \u00B7 ", row.result.annotation.differences.length, " \u9879\u5DEE\u5F02"] }), _jsxs("small", { children: [row.facts_state === 'CURRENT' ? '当前' : row.facts_state === 'HISTORICAL' ? '历史' : '无法核实', " \u00B7 ", row.result.annotation.confirmed_conflict ? '已确认冲突' : '待确认', !row.evidence_available && ' · 原图不可恢复'] })] })] }, row.result.result_id);
                                                }) })] }), item?.evidence_available ? _jsx(ConsistencyEvidencePreview, { evidenceId: item.result.evidence_id }, item.result.evidence_id) : _jsx(ConsistencyEmpty, { title: "\u8BC1\u636E\u4E0D\u53EF\u6062\u590D", description: "\u4FDD\u7559\u5DF2\u6709\u6BD4\u8F83\u4E8B\u5B9E\uFF1B\u5F53\u524D\u65E0\u6CD5\u8BFB\u53D6\u8BE5\u7EC4\u7684\u539F\u56FE\u8BC1\u636E\u3002" })] }), report.page.next_cursor && _jsx("button", { onClick: () => setCursor(report.page.next_cursor), children: "\u4E0B\u4E00\u9875\u6BD4\u8F83" }), cursor && _jsx("button", { onClick: () => setCursor(undefined), children: "\u8FD4\u56DE\u9996\u6279\u6BD4\u8F83" })] })] })] });
}
