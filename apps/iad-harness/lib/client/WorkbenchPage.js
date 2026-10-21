import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { message, request, reviewLabel, sampleQuery } from "./api.js";
import { DatasetManager } from "./components/DatasetManager.js";
import { SampleGrid } from "./components/SampleGrid.js";
import { SampleInspector } from "./components/SampleInspector.js";
import { AuditSetup } from "./components/AuditSetup.js";
import { AuditJobs, AuditReport } from "./components/AuditJobs.js";
import { KnowledgePage } from "./components/KnowledgePage.js";
import { Modal } from "./components/Modal.js";
import { ReviewRecords } from "./components/ReviewRecords.js";
import { pageSize } from "./components/Pagination.js";
import { useJobs } from "./useJobs.js";
import { pages, useWorkspace } from "./workspace.js";
import { workbenchStyles } from "./styles.js";
import { useSampleNavigation } from "./useSampleNavigation.js";
import { usePagePosition } from "./usePagePosition.js";
export function WorkbenchPage({ pageId }) {
    const { workspace, state } = useWorkspace();
    const datasetId = state.datasetId, view = workspace.view(pageId);
    const [datasets, setDatasets] = useState([]);
    const [result, setResult] = useState({ query: "", items: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [revision, setRevision] = useState(0);
    const advance = useRef(null);
    const [reviewConfirmation, setReviewConfirmation] = useState(null);
    const dataset = datasets.find(d => d.dataset_id === datasetId);
    const loadDatasets = useCallback(async (preferred, signal) => {
        try {
            const result = await request("/datasets", undefined, undefined, signal);
            if (signal?.aborted)
                return;
            setDatasets(result.datasets);
            const current = workspace.getSnapshot().datasetId;
            workspace.selectDataset(preferred || (result.datasets.some(d => d.dataset_id === current) ? current : result.datasets[0]?.dataset_id || ""), true);
            setError("");
        }
        catch (e) {
            if (!signal?.aborted)
                setError(message(e));
        }
    }, [workspace]);
    const changed = useCallback(() => { setRevision(v => v + 1); void loadDatasets(); }, [loadDatasets]);
    const audit = useJobs("audit", datasetId, changed, workspace.view("industrial-audit").job);
    useEffect(() => { const controller = new AbortController(); void loadDatasets(undefined, controller.signal); return () => controller.abort(); }, [loadDatasets]);
    const gallery = pageId === "industrial-images" || ((pageId === "industrial-review" || pageId === "industrial-audit") && view.tab === "results");
    const query = sampleQuery(datasetId, view.filters, view.page, pageSize);
    const navigation = useSampleNavigation(pageId, dataset?.task_id, query, result, gallery);
    const surface = usePagePosition(gallery ? JSON.stringify([pageId, view.tab, query]) : null, state.active && state.pageId === pageId && !!dataset && result.query === query && !loading);
    useEffect(() => {
        if (!dataset || !gallery)
            return;
        const controller = new AbortController();
        setLoading(true);
        const requestedAdvance = advance.current;
        request(`/samples/${dataset.task_id}?${query}`, undefined, undefined, controller.signal).then(result => {
            if (controller.signal.aborted)
                return;
            setResult({ ...result, query });
            setError("");
            const current = workspace.view(pageId), snapshot = workspace.getSnapshot();
            if (requestedAdvance && advance.current === requestedAdvance) {
                advance.current = null;
                if (requestedAdvance.query === query && current.selected === requestedAdvance.sampleId && snapshot.active && snapshot.pageId === pageId && snapshot.datasetId === datasetId && current.tab === "results") {
                    if (!result.items.length && result.total > 0 && current.page > 1)
                        workspace.updateView(pageId, { page: Math.ceil(result.total / pageSize), selected: "" }, true);
                    else
                        workspace.updateView(pageId, { selected: (result.items[requestedAdvance.position] || result.items[0])?.sample_id || "" }, true);
                    return;
                }
            }
            if (!current.selected && snapshot.active && snapshot.pageId === pageId && snapshot.datasetId === datasetId && (pageId === "industrial-audit" || pageId === "industrial-review") && result.items.length)
                workspace.updateView(pageId, { selected: result.items[0].sample_id }, true);
        }).catch(e => { if (!controller.signal.aborted)
            setError(message(e)); }).finally(() => { if (!controller.signal.aborted)
            setLoading(false); });
        return () => controller.abort();
    }, [dataset?.task_id, query, gallery, revision, workspace, pageId]);
    function reviewed(record, relativePath) {
        const snapshot = workspace.getSnapshot(), current = workspace.view(pageId);
        if (snapshot.active && snapshot.pageId === pageId && snapshot.datasetId === datasetId && current.selected === record.sample_id && current.tab === "results" && current.filters.review_status === "pending" && current.filters === view.filters && current.page === view.page) {
            const position = result.query === query ? result.items.findIndex(sample => sample.sample_id === record.sample_id) : -1;
            advance.current = { query, sampleId: record.sample_id, position: Math.max(0, position) };
            setReviewConfirmation({ datasetId, name: relativePath.split("/").pop(), decision: record.decision });
        }
        changed();
    }
    const updateFilters = (filters) => workspace.updateView(pageId, { filters, page: 1, selected: "" });
    const inspector = dataset && _jsx(SampleInspector, { dataset: dataset, sampleId: view.selected, mode: pageId === "industrial-review" ? "review" : pageId === "industrial-images" ? "browse" : "model", revision: revision, onReviewed: reviewed, jobs: audit.jobs, onJobsChanged: audit.refresh, navigation: gallery ? navigation : undefined }, `${datasetId}:${view.selected}`);
    const grid = dataset && _jsx(SampleGrid, { dataset: dataset, filters: view.filters, onFilters: updateFilters, items: result.query === query ? result.items : [], total: result.query === query ? result.total : 0, page: view.page, onPage: page => workspace.updateView(pageId, { page, selected: "" }), selected: view.selected, onSelect: selected => workspace.updateView(pageId, { selected }), loading: loading, sourceManagement: pageId === "industrial-images" ? { active: view.tab === "sources", onToggle: () => workspace.updateView(pageId, { tab: view.tab === "sources" ? "results" : "sources" }), onChanged: changed } : undefined }, datasetId);
    return _jsxs("div", { ref: surface, className: "iad-workbench", "data-page": pageId, children: [_jsx("style", { children: workbenchStyles }), _jsxs("header", { className: "iad-header", children: [_jsx("h1", { children: pages[pageId] }), _jsxs("div", { className: "iad-row", children: [_jsxs("select", { "aria-label": "\u5F53\u524D\u6570\u636E\u96C6", value: datasetId, onChange: e => workspace.selectDataset(e.target.value), children: [_jsx("option", { value: "", disabled: true, children: "\u9009\u62E9\u6570\u636E\u96C6" }), datasets.map(item => _jsxs("option", { value: item.dataset_id, children: [item.name, " (", item.total_samples, ")"] }, item.dataset_id))] }), _jsx("button", { onClick: changed, children: "\u5237\u65B0" })] })] }), (error || audit.error) && _jsx("p", { role: "alert", className: "iad-error", children: error || audit.error }), dataset && _jsx("div", { className: "iad-kpis", "aria-label": "\u6570\u636E\u96C6\u6982\u51B5", children: (pageId === "industrial-datasets" ? [["图像", dataset.total_samples], ["标注类别", dataset.annotation_categories.length], ["技术问题", dataset.technical_quality_issues]] :
                    pageId === "industrial-normal" ? [["良品来源", dataset.reference_sample_ids.length], ["图像", dataset.total_samples]] :
                        pageId === "industrial-defect" ? [["图像", dataset.total_samples], ["标注类别", dataset.annotation_categories.length]] :
                            [["图像", dataset.total_samples], ["模型审计", dataset.vlm_audited_count], ["待审计", dataset.total_samples - dataset.vlm_audited_count], ["待复核", dataset.pending_risk_count], ["已人工复核", dataset.human_reviewed_count]]).map(([label, value]) => _jsxs("div", { children: [_jsx("span", { children: label }), _jsx("strong", { children: value })] }, label)) }), pageId === "industrial-datasets" ? _jsx(_Fragment, { children: _jsx(DatasetManager, { datasets: datasets, selected: dataset, onChanged: id => { void loadDatasets(id); setRevision(v => v + 1); } }) }) : !dataset ? _jsxs("section", { className: "iad-job-section", children: [_jsx("p", { children: "\u8BF7\u5148\u6DFB\u52A0\u670D\u52A1\u5668\u4E0A\u7684 Labelme \u6570\u636E\u96C6\u3002" }), _jsx("button", { onClick: () => workspace.navigate("industrial-datasets"), children: "\u524D\u5F80\u6570\u636E\u96C6\u7BA1\u7406" })] }) : _jsxs(_Fragment, { children: [(pageId === "industrial-normal" || pageId === "industrial-defect") && _jsx(KnowledgePage, { dataset: dataset, kind: pageId === "industrial-normal" ? "normal" : "defect", refreshRevision: revision }, `${datasetId}:${pageId}`), pageId === "industrial-audit" && _jsx("nav", { className: "iad-tabs", "aria-label": "\u5BA1\u8BA1\u89C6\u56FE", children: [["results", "结果"], ["jobs", "模型审计作业"], ["reports", "报告"]].map(([tab, label]) => _jsx("button", { "aria-pressed": view.tab === tab, className: view.tab === tab ? "active" : "", onClick: () => workspace.updateView(pageId, { tab }), children: label }, tab)) }), pageId === "industrial-review" && _jsx("nav", { className: "iad-tabs", "aria-label": "\u590D\u6838\u89C6\u56FE", children: [["results", "复核队列"], ["records", "复核记录"]].map(([tab, label]) => _jsx("button", { "aria-pressed": view.tab === tab, className: view.tab === tab ? "active" : "", onClick: () => workspace.updateView(pageId, { tab }), children: label }, tab)) }), pageId === "industrial-review" && view.tab === "results" && reviewConfirmation?.datasetId === datasetId && _jsxs("p", { role: "status", className: "iad-review-confirmation", children: ["\u5DF2\u63D0\u4EA4 ", reviewConfirmation.name, " \u00B7 ", reviewLabel(reviewConfirmation.decision)] }), pageId === "industrial-audit" && view.tab === "results" && _jsx(AuditSetup, { dataset: dataset, filters: view.filters, jobs: audit.jobs, revision: revision, onJobsChanged: audit.refresh }, datasetId), gallery && _jsxs("div", { className: pageId === "industrial-images" ? "iad-browse" : "iad-main", children: [grid, pageId !== "industrial-images" && inspector] }), pageId === "industrial-review" && view.tab === "records" && _jsxs("div", { className: "iad-main", children: [_jsx(ReviewRecords, { datasetId: datasetId, page: view.historyPage, search: view.historySearch, selected: view.selected, revision: revision, onPage: historyPage => workspace.updateView(pageId, { historyPage }), onSearch: historySearch => workspace.updateView(pageId, { historySearch, historyPage: 1 }, true), onSelect: selected => workspace.updateView(pageId, { selected }) }, datasetId), inspector] }), pageId === "industrial-images" && view.selected && _jsx(Modal, { title: "\u56FE\u50CF\u8BE6\u60C5", restoreFocus: () => surface.current?.querySelector(`.iad-sample[data-sample-id="${CSS.escape(view.selected)}"]`) || null, onClose: () => workspace.updateView(pageId, { selected: "" }), children: inspector }), pageId === "industrial-audit" && view.tab === "jobs" && _jsx(AuditJobs, { dataset: dataset, filters: view.filters, jobs: audit.jobs, revision: revision, onJobsChanged: audit.refresh }, datasetId), pageId === "industrial-audit" && view.tab === "reports" && _jsx(AuditReport, { dataset: dataset }, datasetId)] })] });
}
