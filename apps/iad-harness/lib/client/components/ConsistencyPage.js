import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { consistencyTabs } from '../../shared/navigation.js';
import { temporaryImageLimits } from '../../shared/consistency.parameters.generated.js';
import { initialFilters, message, request, sampleQuery } from '../api.js';
import { useWorkspace } from '../workspace.js';
import { workbenchStyles } from '../styles.js';
import { WorkbenchHeader } from './layout/WorkbenchHeader.js';
import { PageTabs } from './layout/PageTabs.js';
import { Pagination } from './Pagination.js';
import { ConsistencyComparison } from './ConsistencyComparison.js';
import { ConsistencyEvidencePage } from './ConsistencyEvidencePage.js';
import { ConsistencyJobsPanel } from './ConsistencyJobsPanel.js';
import { ConsistencyScopePicker } from './ConsistencyScopePicker.js';
import { ConsistencyScopeResults } from './ConsistencyScopeResults.js';
import { ConsistencyEmpty } from './ConsistencyEmpty.js';
import { ConsistencyCandidates } from './ConsistencyCandidates.js';
export function ConsistencyPage() {
    const { state } = useWorkspace();
    return state.consistency.evidenceId ? _jsx(ConsistencyEvidencePage, { evidenceId: state.consistency.evidenceId }) : _jsx(RetrievalWorkspace, {});
}
function RetrievalWorkspace() {
    const { workspace, state } = useWorkspace(), location = state.consistency;
    const tab = location.tab || 'conflicts', scope = location.scope || { kind: 'all_registered' };
    const [datasets, setDatasets] = useState([]), [sourceDataset, setSourceDataset] = useState(state.datasetId);
    const [samples, setSamples] = useState(null), [search, setSearch] = useState(''), [page, setPage] = useState(1);
    const [temporary, setTemporary] = useState(null);
    const [mode, setMode] = useState('exact'), [topK, setTopK] = useState(50);
    const [result, setResult] = useState(null), [submitted, setSubmitted] = useState(null);
    const [queryDetail, setQueryDetail] = useState(null);
    const [comparing, setComparing] = useState(false);
    const comparison = useRef(null), comparisonTrigger = useRef(null);
    useEffect(() => { if (comparing) {
        comparison.current?.focus({ preventScroll: true });
        comparison.current?.scrollIntoView({ block: 'start' });
    } }, [comparing]);
    const [busy, setBusy] = useState(false), [uploading, setUploading] = useState(false), [error, setError] = useState('');
    const mounted = useRef(true), operation = useRef(0);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; operation.current++; }; }, []);
    useEffect(() => {
        const controller = new AbortController();
        request('/datasets', undefined, undefined, controller.signal).then(data => {
            if (controller.signal.aborted)
                return;
            setDatasets(data.datasets);
            setSourceDataset(current => data.datasets.find(row => location.query?.sample_id.startsWith(row.dataset_id + ':'))?.dataset_id || current || data.datasets[0]?.dataset_id || '');
        }).catch(failure => { if (!controller.signal.aborted)
            setError(message(failure)); });
        return () => controller.abort();
    }, []);
    const dataset = datasets.find(row => row.dataset_id === sourceDataset);
    useEffect(() => {
        if (tab !== 'search')
            return;
        setSamples(null);
        if (!dataset)
            return;
        const controller = new AbortController();
        request(`/samples/${encodeURIComponent(dataset.task_id)}?${sampleQuery(dataset.dataset_id, { ...initialFilters, search }, page, 24)}`, undefined, undefined, controller.signal)
            .then(data => { if (!controller.signal.aborted)
            setSamples(data); }).catch(failure => { if (!controller.signal.aborted)
            setError(message(failure)); });
        return () => controller.abort();
    }, [tab, dataset, search, page]);
    const sampleId = location.query?.sample_id;
    useEffect(() => { operation.current++; setBusy(false); setResult(null); setSubmitted(null); setComparing(false); }, [sampleId, temporary?.image_ref]);
    useEffect(() => {
        if (tab !== 'search')
            return;
        setQueryDetail(null);
        if (!sampleId)
            return;
        const controller = new AbortController();
        request(`/sample/${encodeURIComponent(sampleId)}`, undefined, undefined, controller.signal).then(data => { if (!controller.signal.aborted)
            setQueryDetail(data); })
            .catch(failure => { if (!controller.signal.aborted)
            setError(message(failure)); });
        return () => controller.abort();
    }, [tab, sampleId]);
    useEffect(() => () => {
        if (!temporary)
            return;
        URL.revokeObjectURL(temporary.preview);
        void fetch(`/api/iad/images/temporary/${encodeURIComponent(temporary.image_ref)}`, { method: 'DELETE', keepalive: true }).catch(console.error);
    }, [temporary]);
    const query = temporary ? { kind: 'temporary', image_ref: temporary.image_ref } : sampleId ? { kind: 'sample', sample_id: sampleId } : null;
    async function upload(file) {
        setError('');
        if (file.size > temporaryImageLimits.max_source_bytes) {
            setError('图像超过上传大小限制');
            return;
        }
        setUploading(true);
        operation.current++;
        setResult(null);
        setSubmitted(null);
        const form = new FormData();
        form.append('image', file);
        try {
            const accepted = await request('/images/temporary', form);
            if (!mounted.current) {
                await request(`/images/temporary/${encodeURIComponent(accepted.image_ref)}`, undefined, 'DELETE');
                return;
            }
            setTemporary({ ...accepted, preview: URL.createObjectURL(file), name: file.name });
            workspace.updateConsistency({ query: undefined, groupId: undefined, differenceId: undefined }, true);
        }
        catch (failure) {
            if (mounted.current)
                setError(message(failure));
        }
        finally {
            if (mounted.current) {
                setUploading(false);
                setBusy(false);
            }
        }
    }
    async function retrieve(cursor) {
        if (!query)
            return;
        const current = ++operation.current, input = cursor && submitted ? { ...submitted, cursor } : { query, corpus_scope: scope, mode, top_k: topK };
        setBusy(true);
        setError('');
        try {
            const data = await request('/images/retrieve', input);
            if (!mounted.current || current !== operation.current)
                return;
            setResult(data);
            setSubmitted({ ...input, cursor: undefined });
        }
        catch (failure) {
            if (mounted.current && current === operation.current)
                setError(message(failure));
        }
        finally {
            if (mounted.current && current === operation.current)
                setBusy(false);
        }
    }
    const allGroups = result ? [...result.exact.groups, ...result.visual.groups] : [];
    const groups = allGroups;
    const group = groups.find(row => row.content_group_id === location.groupId) || groups[0];
    const member = group?.members.find(row => row.sample_id === location.memberId) || group?.members[0];
    const draftChanged = submitted && JSON.stringify({ ...submitted, cursor: undefined }) !== JSON.stringify({ query, corpus_scope: scope, mode, top_k: topK });
    return _jsxs("div", { className: "iad-workbench iad-consistency", "data-page": "industrial-consistency", children: [_jsx("style", { children: workbenchStyles }), _jsxs(WorkbenchHeader, { pageId: "industrial-consistency", children: [queryDetail && _jsx("button", { onClick: () => {
                            const page = location.returnPage || 'industrial-images';
                            workspace.openLocation({ pageId: page, datasetId: queryDetail.sample.dataset_id, ...workspace.view(page, undefined, queryDetail.sample.dataset_id), selected: queryDetail.sample.sample_id });
                        }, children: "\u8FD4\u56DE\u56FE\u50CF" }), _jsx("button", { onClick: () => workspace.navigate('industrial-model-settings'), children: "\u56FE\u50CF\u68C0\u7D22\u8BBE\u7F6E" })] }), _jsxs(PageTabs, { label: "\u6570\u636E\u4E00\u81F4\u6027\u5206\u533A", items: consistencyTabs, value: tab, onChange: value => workspace.updateConsistency({ tab: value, differenceFilter: undefined, queryId: undefined, groupId: undefined, memberId: undefined, memberPage: 1, galleryPage: 1, detailTab: undefined, differenceId: undefined }), children: [error && _jsx("p", { role: "alert", className: "iad-error", children: error }), tab === 'search' && _jsx("form", { className: "iad-consistency-query", onSubmit: event => { event.preventDefault(); void retrieve(); }, children: _jsxs("fieldset", { disabled: busy || uploading, children: [_jsx("legend", { className: "iad-visually-hidden", children: "\u67E5\u8BE2\u56FE\u50CF\u4E0E\u68C0\u7D22\u8303\u56F4" }), _jsxs("div", { className: "iad-row", children: [_jsxs("label", { className: "iad-filter", children: ["\u67E5\u8BE2\u56FE\u50CF\u6240\u5728\u96C6", _jsxs("select", { "aria-label": "\u67E5\u8BE2\u56FE\u50CF\u6240\u5728\u96C6", value: sourceDataset, onChange: event => { setSourceDataset(event.target.value); setPage(1); setSearch(''); setTemporary(null); workspace.updateConsistency({ query: undefined, groupId: undefined, differenceId: undefined }, true); }, children: [!datasets.length && _jsx("option", { value: "", children: "\u65E0\u5DF2\u6CE8\u518C\u6570\u636E\u96C6" }), datasets.map(row => _jsx("option", { value: row.dataset_id, children: row.name }, row.dataset_id))] })] }), _jsxs("label", { className: "iad-filter iad-query-search", children: ["\u641C\u7D22\u56FE\u50CF", _jsx("input", { type: "search", "aria-label": "\u641C\u7D22\u67E5\u8BE2\u56FE\u50CF", value: search, onChange: event => { setSearch(event.target.value); setPage(1); } })] }), _jsxs("label", { className: "iad-filter iad-query-sample", children: ["\u67E5\u8BE2\u56FE\u50CF", _jsxs("select", { "aria-label": "\u67E5\u8BE2\u56FE\u50CF", value: temporary ? '' : sampleId || '', onChange: event => {
                                                        setTemporary(null);
                                                        workspace.updateConsistency({ query: event.target.value ? { kind: 'sample', sample_id: event.target.value } : undefined, groupId: undefined, differenceId: undefined }, true);
                                                    }, children: [_jsx("option", { value: "", children: "\u9009\u62E9\u56FE\u50CF" }), sampleId && !samples?.items.some(row => row.sample_id === sampleId) && _jsx("option", { value: sampleId, children: queryDetail?.sample.relative_path || sampleId }), samples?.items.map(row => _jsx("option", { value: row.sample_id, children: row.relative_path }, row.sample_id))] })] }), _jsxs("label", { className: "iad-filter", children: ["\u6216\u4E0A\u4F20\u4E34\u65F6\u56FE", _jsx("input", { type: "file", "aria-label": "\u4E0A\u4F20\u67E5\u8BE2\u56FE\u50CF", accept: "image/*,.tif,.tiff", onChange: event => { const file = event.target.files?.[0]; if (file)
                                                        void upload(file); event.target.value = ''; } })] }), _jsx(ConsistencyScopePicker, { datasets: datasets, value: scope, onChange: value => workspace.updateConsistency({ scope: value }, true) })] }), _jsxs("div", { className: "iad-row iad-consistency-query-actions", children: [_jsxs("details", { className: "iad-consistency-advanced", children: [_jsx("summary", { children: "\u9AD8\u7EA7\u53C2\u6570" }), _jsxs("div", { className: "iad-row", children: [_jsxs("label", { className: "iad-filter", children: ["\u68C0\u7D22\u65B9\u5F0F", _jsxs("select", { "aria-label": "\u68C0\u7D22\u65B9\u5F0F", value: mode, onChange: event => setMode(event.target.value), children: [_jsx("option", { value: "exact", children: "\u4E25\u683C\u540C\u56FE" }), _jsx("option", { value: "combined", children: "\u4E25\u683C\u540C\u56FE\u4E0E\u89C6\u89C9\u5019\u9009" }), _jsx("option", { value: "visual", children: "\u89C6\u89C9\u5019\u9009" })] })] }), _jsxs("label", { className: "iad-filter", children: ["\u89C6\u89C9\u5019\u9009\u7EC4\u6570", _jsx("input", { "aria-label": "\u89C6\u89C9\u5019\u9009\u7EC4\u6570", type: "number", min: 1, max: 200, value: topK, onChange: event => setTopK(event.target.valueAsNumber) })] })] })] }), _jsx("button", { className: "iad-primary", type: "submit", disabled: !query || !Number.isInteger(topK) || topK < 1 || topK > 200, children: busy ? '正在检索…' : '查找同图' }), uploading && _jsx("span", { role: "status", children: "\u6B63\u5728\u63A5\u6536\u56FE\u50CF\u2026" }), temporary && _jsxs("span", { children: [temporary.name, " \u00B7 \u4E34\u65F6\u67E5\u8BE2"] }), _jsx(Pagination, { total: samples?.total || 0, page: page, size: 24, unit: "\u5F20\u67E5\u8BE2\u56FE\u50CF", onPage: setPage })] })] }) }), tab === 'jobs' ? _jsx(ConsistencyJobsPanel, { datasets: datasets }) : tab === 'conflicts' || tab === 'groups' ? _jsx(ConsistencyScopeResults, { datasets: datasets, tab: tab }) : !result ? _jsx(ConsistencyEmpty, { title: busy ? '正在检索图像' : query ? '准备开始图像检索' : '选择查询图像', description: "\u9009\u62E9\u6570\u636E\u96C6\u4E2D\u7684\u56FE\u50CF\uFF0C\u6216\u4E0A\u4F20\u4E00\u5F20\u4E34\u65F6\u67E5\u8BE2\u56FE\uFF1B\u68C0\u7D22\u4E0D\u4F1A\u5C06\u4E34\u65F6\u56FE\u5BFC\u5165\u6570\u636E\u96C6\u3002", children: _jsx("button", { disabled: !query || busy || uploading, onClick: () => void retrieve(), children: "\u5F00\u59CB\u68C0\u7D22" }) })
                        : _jsxs(_Fragment, { children: [draftChanged && _jsx("p", { role: "status", className: "iad-muted", children: "\u67E5\u8BE2\u6761\u4EF6\u5DF2\u6539\u53D8\uFF0C\u4EE5\u4E0B\u4FDD\u7559\u4E0A\u6B21\u68C0\u7D22\u7ED3\u679C\u3002" }), _jsxs("section", { className: "iad-consistency-results", "aria-label": "\u68C0\u7D22\u7ED3\u679C", "aria-busy": busy, children: [_jsxs("div", { className: "iad-consistency-status", children: [_jsxs("strong", { children: [busy ? '正在检索' : '检索完成', " \u00B7 ", result.group_count, " \u7EC4 \u00B7 ", result.member_count, " \u6210\u5458"] }), _jsx("span", { children: result.retrieval_completeness === 'PARTIAL' ? '索引或比较不完整' : result.retrieval_completeness === 'TOP_K' ? '视觉 Top-K 候选' : '严格同图范围' }), _jsx("span", { className: "iad-muted", children: "\u672C\u6B21\u68C0\u7D22" })] }), _jsxs("p", { className: "iad-muted", children: ["\u539F\u56FE\u6838\u9A8C ", result.coverage.verification.completed, "/", result.coverage.verification.total, " \u00B7 \u5931\u8D25 ", result.coverage.verification.failed, " \u00B7 \u6807\u6CE8\u6BD4\u8F83 ", result.coverage.annotation.completed, "/", result.coverage.annotation.total, " \u00B7 \u5931\u8D25 ", result.coverage.annotation.failed, " \u00B7 \u5F85\u5B9A ", result.coverage.annotation.pending] }), [result.exact, result.visual].map((branch, index) => branch.reason && _jsxs("p", { className: "iad-muted", children: [index ? '视觉检索' : '严格同图', "\uFF1A", branch.reason] }, index)), !groups.length ? _jsx(ConsistencyEmpty, { title: "\u5F53\u524D\u8FD4\u56DE\u9875\u6CA1\u6709\u5019\u9009\u56FE\u7EC4", description: "\u7ED3\u679C\u4EC5\u4EE3\u8868\u672C\u6B21\u5B9E\u9645\u68C0\u7D22\u8303\u56F4\u548C\u5DF2\u8FD4\u56DE\u7684\u8986\u76D6\uFF1B\u53EF\u8C03\u6574\u67E5\u8BE2\u6761\u4EF6\u540E\u91CD\u65B0\u68C0\u7D22\u3002" }) : _jsxs(_Fragment, { children: [_jsx(ConsistencyCandidates, { groups: groups, selected: member, datasets: datasets, onCompare: trigger => { comparisonTrigger.current = trigger; setComparing(true); comparison.current?.scrollIntoView({ block: 'start' }); }, onSelect: (groupId, memberId) => workspace.updateConsistency({ groupId, memberId, differenceId: undefined }, true) }), _jsxs("div", { className: "iad-row iad-consistency-result-pagination", children: [group?.next_member_cursor && _jsx("button", { disabled: busy, onClick: () => void retrieve(group.next_member_cursor), children: "\u4E0B\u4E00\u9875\u6210\u5458" }), ['exact', 'visual'].map(branch => result[branch].next_cursor && _jsxs("button", { disabled: busy, onClick: () => void retrieve(result[branch].next_cursor), children: ["\u4E0B\u4E00\u9875", branch === 'exact' ? '同图' : '视觉', "\u7EC4"] }, branch))] }), comparing && _jsxs("div", { className: "iad-consistency-expanded", ref: comparison, tabIndex: -1, "aria-label": "\u539F\u56FE\u5BF9\u6BD4", children: [_jsxs("header", { className: "iad-consistency-panel-header", children: [_jsx("strong", { children: "\u539F\u56FE\u5BF9\u6BD4" }), _jsx("button", { onClick: () => { setComparing(false); comparisonTrigger.current?.focus(); }, children: "\u6536\u8D77\u5BF9\u6BD4" })] }), _jsx("div", { className: "iad-consistency-layout iad-frozen-comparison", children: member && _jsx(ConsistencyComparison, { member: member, query: submitted?.query.kind === 'sample' ? queryDetail : null, temporary: temporary, differenceId: location.differenceId, onDifference: differenceId => workspace.updateConsistency({ groupId: group.content_group_id, memberId: member.sample_id, differenceId }, true) }, member.sample_id + JSON.stringify(submitted?.query)) })] })] })] })] })] })] });
}
