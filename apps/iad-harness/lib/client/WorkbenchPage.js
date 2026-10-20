import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { message, request } from "./api.js";
import { DatasetManager } from "./components/DatasetManager.js";
import { SampleGrid } from "./components/SampleGrid.js";
import { SampleInspector } from "./components/SampleInspector.js";
import { AuditJobs, AuditReport } from "./components/AuditJobs.js";
import { KnowledgePage } from "./components/KnowledgePage.js";
import { Modal } from "./components/Modal.js";
import { useJobs } from "./useJobs.js";
import { pages, useWorkspace } from "./workspace.js";
import { workbenchStyles } from "./styles.js";
export function WorkbenchPage({ pageId }) {
    const { workspace, state } = useWorkspace();
    const datasetId = state.datasetId, view = workspace.view(pageId);
    const [datasets, setDatasets] = useState([]);
    const [result, setResult] = useState({ datasetId: "", items: [], total: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [revision, setRevision] = useState(0);
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
    const audit = useJobs("audit", datasetId, changed);
    useEffect(() => { const controller = new AbortController(); void loadDatasets(undefined, controller.signal); return () => controller.abort(); }, [loadDatasets]);
    const gallery = pageId === "industrial-datasets" || pageId === "industrial-images" || pageId === "industrial-review" || (pageId === "industrial-audit" && view.tab === "results");
    useEffect(() => {
        if (!dataset || !gallery)
            return;
        const controller = new AbortController();
        setLoading(true);
        const query = new URLSearchParams({ ...view.filters, annotation_filters: JSON.stringify(view.filters.annotation_filters), dataset_id: datasetId, page: String(view.page), page_size: "24" });
        request(`/samples/${dataset.task_id}?${query}`, undefined, undefined, controller.signal).then(result => {
            if (controller.signal.aborted)
                return;
            setResult({ ...result, datasetId });
            setError("");
            if (!view.selected && (pageId === "industrial-audit" || pageId === "industrial-review") && result.items.length)
                workspace.updateView(pageId, { selected: result.items[0].sample_id }, true);
        }).catch(e => { if (!controller.signal.aborted)
            setError(message(e)); }).finally(() => { if (!controller.signal.aborted)
            setLoading(false); });
        return () => controller.abort();
    }, [datasetId, dataset?.task_id, view.filters, view.page, gallery, revision, workspace, pageId]);
    const updateFilters = (filters) => workspace.updateView(pageId, { filters, page: 1, selected: "" });
    const inspector = dataset && _jsx(SampleInspector, { dataset: dataset, sampleId: view.selected, mode: pageId === "industrial-review" ? "review" : pageId === "industrial-datasets" ? "dataset" : pageId === "industrial-images" ? "browse" : "model", revision: revision, onChanged: changed, jobs: audit.jobs, onJobsChanged: audit.refresh }, `${datasetId}:${view.selected}`);
    const grid = dataset && _jsx(SampleGrid, { dataset: dataset, filters: view.filters, onFilters: updateFilters, items: result.datasetId === datasetId ? result.items : [], total: result.datasetId === datasetId ? result.total : 0, page: view.page, onPage: page => workspace.updateView(pageId, { page, selected: "" }), selected: view.selected, onSelect: selected => workspace.updateView(pageId, { selected }), loading: loading });
    return _jsxs("div", { className: "iad-workbench", "data-page": pageId, children: [_jsx("style", { children: workbenchStyles }), _jsxs("header", { className: "iad-header", children: [_jsx("h1", { children: pages[pageId] }), _jsxs("div", { className: "iad-row", children: [_jsxs("select", { "aria-label": "\u5F53\u524D\u6570\u636E\u96C6", value: datasetId, onChange: e => workspace.selectDataset(e.target.value), children: [_jsx("option", { value: "", disabled: true, children: "\u9009\u62E9\u6570\u636E\u96C6" }), datasets.map(item => _jsxs("option", { value: item.dataset_id, children: [item.name, " (", item.total_samples, ")"] }, item.dataset_id))] }), _jsx("button", { onClick: changed, children: "\u5237\u65B0" })] })] }), (error || audit.error) && _jsx("p", { role: "alert", className: "iad-error", children: error || audit.error }), dataset && _jsxs("div", { className: "iad-kpis", children: [_jsxs("div", { children: [_jsx("span", { children: "\u56FE\u50CF" }), _jsx("strong", { children: dataset.total_samples })] }), _jsxs("div", { children: [_jsx("span", { children: "\u6A21\u578B\u5BA1\u8BA1" }), _jsxs("strong", { children: [dataset.vlm_audited_count, " ", _jsxs("small", { children: ["/ ", dataset.total_samples] })] })] }), _jsxs("div", { children: [_jsx("span", { children: "\u5F85\u590D\u6838\u5F02\u5E38\u5EFA\u8BAE" }), _jsx("strong", { children: dataset.pending_risk_count })] }), _jsxs("div", { children: [_jsx("span", { children: "\u5DF2\u4EBA\u5DE5\u590D\u6838" }), _jsx("strong", { children: dataset.human_reviewed_count })] })] }), pageId === "industrial-datasets" ? _jsxs(_Fragment, { children: [_jsx(DatasetManager, { datasets: datasets, selected: dataset, onChanged: id => { void loadDatasets(id); setRevision(v => v + 1); } }), dataset && _jsx("button", { onClick: () => workspace.navigate("industrial-images"), children: "\u6D4F\u89C8\u56FE\u50CF" }), dataset && _jsxs("details", { className: "iad-reference-manager", children: [_jsxs("summary", { children: ["\u826F\u54C1\u53C2\u8003\u8D44\u683C \u00B7 ", dataset.reference_sample_ids.length, " \u5F20"] }), grid] }), dataset && view.selected && _jsxs(Modal, { title: "\u826F\u54C1\u53C2\u8003\u8D44\u683C", onClose: () => workspace.updateView(pageId, { selected: "" }), children: [_jsx("button", { onClick: () => workspace.updateView(pageId, { selected: "" }), children: "\u8FD4\u56DE\u6570\u636E\u96C6\u7BA1\u7406" }), inspector] })] }) : !dataset ? _jsxs("section", { className: "iad-job-section", children: [_jsx("p", { children: "\u8BF7\u5148\u6DFB\u52A0\u670D\u52A1\u5668\u4E0A\u7684 Labelme \u6570\u636E\u96C6\u3002" }), _jsx("button", { onClick: () => workspace.navigate("industrial-datasets"), children: "\u524D\u5F80\u6570\u636E\u96C6\u7BA1\u7406" })] }) : _jsxs(_Fragment, { children: [(pageId === "industrial-normal" || pageId === "industrial-defect") && _jsx(KnowledgePage, { dataset: dataset, kind: pageId === "industrial-normal" ? "normal" : "defect" }, datasetId), pageId === "industrial-audit" && _jsx("nav", { className: "iad-tabs", "aria-label": "\u5BA1\u8BA1\u89C6\u56FE", children: [["results", "结果"], ["jobs", "模型审计作业"], ["reports", "报告"]].map(([tab, label]) => _jsx("button", { "aria-pressed": view.tab === tab, className: view.tab === tab ? "active" : "", onClick: () => workspace.updateView(pageId, { tab }), children: label }, tab)) }), gallery && _jsxs("div", { className: pageId === "industrial-images" ? "iad-browse" : "iad-main", children: [grid, pageId !== "industrial-images" && inspector] }), pageId === "industrial-images" && view.selected && _jsxs(Modal, { title: "\u56FE\u50CF\u8BE6\u60C5", onClose: () => workspace.updateView(pageId, { selected: "" }), children: [_jsxs("div", { className: "iad-row", children: [_jsx("button", { onClick: () => workspace.updateView(pageId, { selected: "" }), children: "\u8FD4\u56DE\u56FE\u50CF\u6D4F\u89C8" }), _jsx("button", { onClick: () => workspace.navigate("industrial-audit", view.selected), children: "\u524D\u5F80\u6A21\u578B\u5BA1\u8BA1" }), _jsx("button", { onClick: () => workspace.navigate("industrial-review", view.selected), children: "\u524D\u5F80\u4EBA\u5DE5\u590D\u6838" })] }), inspector] }), pageId === "industrial-audit" && view.tab === "jobs" && _jsx(AuditJobs, { dataset: dataset, filters: view.filters, jobs: audit.jobs, onJobsChanged: audit.refresh }, datasetId), pageId === "industrial-audit" && view.tab === "reports" && _jsx(AuditReport, { dataset: dataset })] })] });
}
