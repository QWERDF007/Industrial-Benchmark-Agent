import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { jobPhases, jobStatuses } from '../../shared/job-display.js';
import { imageRelations, annotationSummary } from '../../shared/consistency-presentation.js';
import { message, request } from '../api.js';
import { useWorkspace } from '../workspace.js';
import { ConsistencyScopePicker } from './ConsistencyScopePicker.js';
import { JobSync } from './JobSync.js';
import { useConsistencyStart } from '../useConsistencyStart.js';
import { ConsistencyEmpty } from './ConsistencyEmpty.js';
export function ConsistencyJobsPanel({ datasets }) {
    const { state, workspace } = useWorkspace(), location = state.consistency;
    const [subject, setSubject] = useState('all'), [mode, setMode] = useState('exact');
    const [batches, setBatches] = useState([]), [revision, setRevision] = useState(0);
    const [cancelling, setCancelling] = useState(false), [error, setError] = useState('');
    const actions = useConsistencyStart(batchId => { workspace.updateConsistency({ batchId }, true); setRevision(value => value + 1); });
    const busy = actions.busy || cancelling;
    const [sync, setSync] = useState({ state: 'syncing', error: '', at: null });
    const [results, setResults] = useState(null), [cursor, setCursor] = useState();
    const [encoder, setEncoder] = useState(null);
    const mounted = useRef(true);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => {
        const controller = new AbortController();
        request('/images/settings', undefined, undefined, controller.signal)
            .then(value => { if (!controller.signal.aborted)
            setEncoder(value); }).catch(failure => { if (!controller.signal.aborted)
            setError(message(failure)); });
        return () => controller.abort();
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        let timer;
        async function poll() {
            let active = false;
            const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]);
            setSync(previous => ({ ...previous, state: previous.error ? 'stale' : 'syncing' }));
            try {
                const catalog = await request('/consistency/runs', undefined, undefined, signal);
                if (location.batchId && !catalog.items.some(item => item.batch_id === location.batchId))
                    catalog.items.push(await request(`/consistency/runs/${encodeURIComponent(location.batchId)}`, undefined, undefined, signal));
                if (controller.signal.aborted)
                    return;
                setBatches(catalog.items);
                setSync({ state: 'current', error: '', at: Date.now() });
                active = catalog.items.some(item => ['RUNNING', 'PENDING'].includes(item.status));
            }
            catch (failure) {
                if (!controller.signal.aborted)
                    setSync(previous => ({ ...previous, state: 'stale', error: message(failure) }));
            }
            finally {
                if (!controller.signal.aborted)
                    timer = setTimeout(poll, active ? 1200 : 5000);
            }
        }
        void poll();
        return () => { controller.abort(); clearTimeout(timer); };
    }, [location.batchId, revision]);
    const selected = batches.find(item => item.batch_id === location.batchId) || (!location.batchId ? batches[0] : undefined);
    useEffect(() => { setCursor(undefined); }, [selected?.batch_id]);
    useEffect(() => {
        const controller = new AbortController();
        setResults(null);
        if (selected)
            request('/consistency/query', { selection: { kind: 'batch', batch_id: selected.batch_id }, cursor, page_size: 20 }, undefined, controller.signal)
                .then(value => { if (!controller.signal.aborted)
                setResults(value); }).catch(failure => { if (!controller.signal.aborted)
                setError(message(failure)); });
        return () => controller.abort();
    }, [selected?.batch_id, selected?.pair_count, cursor]);
    async function cancel() {
        if (!selected)
            return;
        setCancelling(true);
        setError('');
        try {
            await request(`/consistency/runs/${encodeURIComponent(selected.batch_id)}/cancel`, {});
            if (mounted.current)
                setRevision(value => value + 1);
        }
        catch (failure) {
            if (mounted.current)
                setError(message(failure));
        }
        finally {
            if (mounted.current)
                setCancelling(false);
        }
    }
    const scope = location.scope || { kind: 'all_registered' };
    const latestIndex = batches.filter(batch => batch.kind === 'index').sort((left, right) => right.created_at.localeCompare(left.created_at))[0];
    const latestCheck = batches.filter(batch => batch.kind === 'consistency').sort((left, right) => right.created_at.localeCompare(left.created_at))[0];
    return _jsxs("section", { "aria-label": "\u4E00\u81F4\u6027\u6279\u6B21", children: [(error || actions.error) && _jsx("p", { role: "alert", className: "iad-error", children: error || actions.error }), actions.notice && _jsx("p", { role: "status", children: actions.notice }), _jsx("form", { className: "iad-consistency-query", onSubmit: event => { event.preventDefault(); void actions.start('/consistency/start', { subjects: subject === 'all' ? { kind: 'all_registered' } : { kind: 'datasets', dataset_ids: [subject] }, corpus_scope: scope, mode }); }, children: _jsxs("fieldset", { disabled: busy, children: [_jsx("legend", { className: "iad-visually-hidden", children: "\u6279\u91CF\u68C0\u67E5\u8303\u56F4\u4E0E\u68C0\u7D22\u5E93" }), _jsxs("div", { className: "iad-row", children: [_jsxs("label", { className: "iad-filter", children: ["\u68C0\u67E5\u8303\u56F4", _jsxs("select", { "aria-label": "\u68C0\u67E5\u8303\u56F4", value: subject, onChange: event => setSubject(event.target.value), children: [_jsx("option", { value: "all", children: "\u5168\u90E8\u5DF2\u6CE8\u518C\u6570\u636E\u96C6" }), datasets.map(dataset => _jsx("option", { value: dataset.dataset_id, children: dataset.name }, dataset.dataset_id))] })] }), _jsx(ConsistencyScopePicker, { datasets: datasets, value: scope, onChange: value => workspace.updateConsistency({ scope: value }, true) }), _jsxs("label", { className: "iad-filter", children: ["\u68C0\u67E5\u65B9\u5F0F", _jsxs("select", { "aria-label": "\u68C0\u67E5\u65B9\u5F0F", value: mode, onChange: event => setMode(event.target.value), children: [_jsx("option", { value: "exact", children: "\u4E25\u683C\u540C\u56FE" }), _jsx("option", { value: "combined", children: "\u4E25\u683C\u540C\u56FE\u4E0E\u89C6\u89C9\u5019\u9009" }), _jsx("option", { value: "visual", children: "\u89C6\u89C9\u5019\u9009" })] })] }), _jsx("button", { className: "iad-primary", type: "submit", disabled: !datasets.length, children: "\u5F00\u59CB\u6279\u91CF\u68C0\u67E5" }), _jsx("button", { type: "button", disabled: !datasets.length, onClick: () => void actions.start('/images/index/prepare', { corpus_scope: scope }), children: "\u51C6\u5907\u68C0\u7D22\u7D22\u5F15" })] })] }) }), _jsxs("section", { className: "iad-consistency-job-summary", "aria-label": "\u4F5C\u4E1A\u6982\u89C8", children: [_jsx(JobSync, { label: "\u6279\u6B21\u72B6\u6001\u540C\u6B65", syncState: sync.state, lastSyncedAt: sync.at, error: sync.error, refresh: () => setRevision(value => value + 1) }), _jsxs("div", { children: [_jsx("span", { children: "\u4F5C\u4E1A\u603B\u6570" }), _jsx("strong", { children: batches.length })] }), _jsxs("div", { children: [_jsx("span", { children: "\u6700\u8FD1\u7D22\u5F15\u4F5C\u4E1A" }), _jsx("strong", { children: latestIndex ? `${latestIndex.completed} / ${latestIndex.total}` : '尚无记录' }), _jsx("small", { children: latestIndex ? jobStatuses[latestIndex.status] : !encoder ? '正在读取配置' : !encoder.selection ? '图像编码器未配置' : '尚未准备索引' })] }), _jsxs("div", { children: [_jsx("span", { children: "\u6700\u8FD1\u4E00\u81F4\u6027\u68C0\u67E5" }), _jsx("strong", { children: latestCheck ? `${latestCheck.completed} / ${latestCheck.total}` : '尚无记录' }), _jsx("small", { children: latestCheck ? `${jobStatuses[latestCheck.status]} · 比较 ${latestCheck.pair_count} 对` : '尚未执行检查' })] })] }), !batches.length ? _jsx(ConsistencyEmpty, { title: "\u5C1A\u65E0\u68C0\u67E5\u4F5C\u4E1A", description: "\u4E25\u683C\u540C\u56FE\u68C0\u67E5\u53EF\u76F4\u63A5\u6267\u884C\uFF1B\u89C6\u89C9\u68C0\u7D22\u9700\u8981\u5148\u5728\u56FE\u50CF\u68C0\u7D22\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u7F16\u7801\u5668\u5E76\u51C6\u5907\u5BF9\u5E94\u7D22\u5F15\u3002" }) : _jsxs("div", { className: "iad-consistency-jobs", children: [_jsx("div", { className: "iad-consistency-list iad-table-scroll", children: _jsxs("table", { className: "iad-resource-table", "aria-label": "\u4F5C\u4E1A\u8BB0\u5F55", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u4F5C\u4E1A" }), _jsx("th", { children: "\u7C7B\u578B" }), _jsx("th", { children: "\u68C0\u67E5\u8303\u56F4 / \u68C0\u7D22\u5E93" }), _jsx("th", { children: "\u8FDB\u5EA6" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: batches.map(batch => _jsxs("tr", { "aria-selected": batch.batch_id === selected?.batch_id, children: [_jsxs("td", { children: [_jsx("time", { dateTime: batch.created_at, children: new Date(batch.created_at).toLocaleString() }), _jsx("small", { title: batch.batch_id, children: batch.batch_id })] }), _jsx("td", { children: batch.kind === 'index' ? '索引准备' : '一致性检查' }), _jsxs("td", { children: [batch.scopes.subjects.sample_count, " / ", batch.scopes.corpus.sample_count, " \u5F20"] }), _jsxs("td", { children: [batch.completed, " / ", batch.total, !!batch.failed && _jsxs("span", { className: "iad-error", children: [" \u00B7 \u5931\u8D25 ", batch.failed] })] }), _jsx("td", { children: jobStatuses[batch.status] }), _jsx("td", { children: _jsx("button", { "aria-pressed": batch.batch_id === selected?.batch_id, onClick: () => workspace.updateConsistency({ batchId: batch.batch_id }, true), children: "\u67E5\u770B\u7ED3\u679C" }) })] }, batch.batch_id)) })] }) }), selected && _jsxs("section", { "data-batch-id": selected.batch_id, "aria-label": "\u6279\u6B21\u8BE6\u60C5", children: [_jsxs("header", { className: "iad-consistency-job-detail-heading", children: [_jsxs("h2", { children: ["\u6279\u6B21\u8BE6\u60C5 \u00B7 ", selected.kind === 'index' ? '索引准备' : '一致性检查'] }), _jsx("strong", { role: "status", children: selected.cancel_requested && ['PENDING', 'RUNNING'].includes(selected.status) ? '正在停止' : jobStatuses[selected.status] })] }), _jsxs("div", { className: "iad-row iad-consistency-job-progress", children: [_jsxs("span", { children: ["\u5B8C\u6210 ", selected.completed, " \u00B7 \u5931\u8D25 ", selected.failed, " \u00B7 \u672A\u5904\u7406 ", selected.unprocessed, " \u00B7 \u5171 ", selected.total, " \u5F20"] }), _jsxs("span", { children: ["\u6BD4\u8F83 ", selected.pair_count, " \u5BF9"] }), ['PENDING', 'RUNNING'].includes(selected.status) ? _jsx("button", { disabled: busy || selected.cancel_requested, onClick: () => void cancel(), children: "\u505C\u6B62\u6279\u6B21" })
                                        : selected.failed + selected.unprocessed > 0 && _jsx("button", { disabled: busy, onClick: () => void actions.start(`/consistency/runs/${encodeURIComponent(selected.batch_id)}/retry`, {}), children: "\u91CD\u8BD5\u5931\u8D25\u4E0E\u672A\u5904\u7406" })] }), _jsx("progress", { "aria-label": "\u6279\u6B21\u6837\u672C\u8FDB\u5EA6", max: selected.total || 1, value: selected.completed + selected.failed }), _jsxs("p", { className: "iad-muted", children: ["\u51BB\u7ED3\u68C0\u67E5\u8303\u56F4 ", selected.scopes.subjects.sample_count, " \u5F20 \u00B7 \u68C0\u7D22\u5E93 ", selected.scopes.corpus.sample_count, " \u5F20"] }), selected.error && _jsxs("p", { role: "alert", children: [selected.error.code, " \u00B7 ", selected.error.message] }), _jsxs("details", { className: "iad-consistency-child-jobs", open: selected.failed > 0, children: [_jsxs("summary", { children: ["\u5B50\u4F5C\u4E1A\u4E0E\u5931\u8D25\u660E\u7EC6 \u00B7 ", selected.children.length, " \u9879"] }), _jsx("div", { className: "iad-table-scroll", children: _jsxs("table", { className: "iad-resource-table", "aria-label": "\u6279\u6B21\u5B50\u4F5C\u4E1A", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u6570\u636E\u96C6" }), _jsx("th", { children: "\u4EFB\u52A1" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u5B8C\u6210 / \u5931\u8D25 / \u672A\u5904\u7406" })] }) }), _jsx("tbody", { children: selected.children.map(child => _jsxs("tr", { children: [_jsx("td", { children: datasets.find(dataset => dataset.dataset_id === child.dataset_id)?.name || child.dataset_id }), _jsx("td", { children: child.job_type === 'IMAGE_INDEX' ? '图像索引' : '一致性比较' }), _jsxs("td", { children: [jobStatuses[child.status], child.phase && ['PENDING', 'RUNNING'].includes(child.status) ? ` · ${jobPhases[child.phase] || child.phase}` : ''] }), _jsxs("td", { children: [child.completed, " / ", child.failed, " / ", child.unprocessed] })] }, child.run_id)) })] }) }), selected.children.flatMap(child => child.errors.map((failure, index) => _jsxs("p", { className: "iad-error", children: [failure.relative_path || failure.sample_id, "\uFF1A", failure.code ? `${failure.code} · ` : '', failure.message] }, child.run_id + index)))] }), _jsxs("section", { "aria-label": "\u6279\u6B21\u6BD4\u8F83\u7ED3\u679C", children: [_jsxs("h3", { children: ["\u6BD4\u8F83\u7ED3\u679C", results ? ` · ${results.total} 对` : ''] }), results?.items.map(item => _jsxs("div", { className: "iad-row", children: [_jsxs("span", { children: [imageRelations[item.result.verification.relation], " \u00B7 ", annotationSummary(item.result.annotation)] }), _jsxs("span", { children: [item.sample_a.split(':').slice(1).join(':'), " \u2194 ", item.sample_b.split(':').slice(1).join(':')] }), _jsx("button", { onClick: () => workspace.updateConsistency({ batchId: selected.batch_id, evidenceId: item.result.evidence_id, resultId: item.result.result_id }, true), children: "\u6253\u5F00\u6BD4\u8F83\u8BC1\u636E" })] }, item.result.result_id)), results?.next_cursor && _jsx("button", { onClick: () => setCursor(results.next_cursor), children: "\u4E0B\u4E00\u9875\u7ED3\u679C" }), cursor && _jsx("button", { onClick: () => setCursor(undefined), children: "\u8FD4\u56DE\u9996\u6279\u7ED3\u679C" }), results && !results.total && _jsx("p", { className: "iad-muted", children: "\u5F53\u524D\u6279\u6B21\u5C1A\u65E0\u6210\u5BF9\u6BD4\u8F83\u7ED3\u679C\u3002" })] })] })] })] });
}
