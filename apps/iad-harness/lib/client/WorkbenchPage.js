import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { initialFilters, message, request } from "./api.js";
import { DatasetManager } from "./components/DatasetManager.js";
import { SampleGrid } from "./components/SampleGrid.js";
import { SampleInspector } from "./components/SampleInspector.js";
import { AuditJobs, AuditReport } from "./components/AuditJobs.js";
import { workbenchStyles } from "./styles.js";
function WorkbenchPage({ mode }) {
    const [datasets, setDatasets] = useState([]);
    const [datasetId, setDatasetId] = useState(localStorage.getItem("iad.dataset") || "");
    const [tab, setTab] = useState("samples");
    const [filters, setFilters] = useState({ ...initialFilters, review_status: mode === "review" ? "pending" : "all" });
    const [page, setPage] = useState(1);
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [selected, setSelected] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [revision, setRevision] = useState(0);
    const dataset = datasets.find(d => d.dataset_id === datasetId);
    const loadDatasets = useCallback(async (preferred) => {
        try {
            const result = await request("/datasets");
            setDatasets(result.datasets);
            setDatasetId(current => preferred || (result.datasets.some(d => d.dataset_id === current) ? current : result.datasets[0]?.dataset_id || ""));
            setError("");
        }
        catch (e) {
            setError(message(e));
        }
    }, []);
    const changed = useCallback(() => { setRevision(v => v + 1); loadDatasets(); }, [loadDatasets]);
    useEffect(() => { loadDatasets(); }, [loadDatasets]);
    useEffect(() => {
        localStorage.setItem("iad.dataset", datasetId);
        setPage(1);
        setSelected("");
    }, [datasetId]);
    useEffect(() => {
        if (!dataset)
            return;
        const controller = new AbortController();
        setLoading(true);
        const query = new URLSearchParams({ ...filters, annotation_filters: JSON.stringify(filters.annotation_filters), dataset_id: datasetId, page: String(page), page_size: "24" });
        request(`/samples/${dataset.task_id}?${query}`, undefined, undefined, controller.signal).then(result => {
            setItems(result.items);
            setTotal(result.total);
            setSelected(current => result.items.some(sample => sample.sample_id === current) ? current : result.items[0]?.sample_id || "");
        }).catch(e => { if (!controller.signal.aborted)
            setError(message(e)); }).finally(() => { if (!controller.signal.aborted)
            setLoading(false); });
        return () => controller.abort();
    }, [datasetId, dataset?.task_id, filters, page, revision]);
    const updateFilters = (value) => { setFilters(value); setPage(1); setSelected(""); };
    return _jsxs("div", { className: "iad-workbench", children: [_jsx("style", { children: workbenchStyles }), _jsxs("header", { className: "iad-header", children: [_jsxs("div", { children: [_jsx("span", { className: "iad-eyebrow", children: "INDUSTRIAL BENCHMARK" }), _jsx("h1", { children: mode === "review" ? "人工复核" : "模型审计" })] }), _jsxs("div", { className: "iad-row", children: [_jsxs("select", { "aria-label": "\u5F53\u524D\u6570\u636E\u96C6", value: datasetId, onChange: e => setDatasetId(e.target.value), children: [_jsx("option", { value: "", disabled: true, children: "\u9009\u62E9\u6570\u636E\u96C6" }), datasets.map(item => _jsxs("option", { value: item.dataset_id, children: [item.name, " (", item.total_samples, ")"] }, item.dataset_id))] }), _jsx("button", { onClick: changed, children: "\u5237\u65B0" })] })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), dataset && _jsxs("div", { className: "iad-kpis", children: [_jsxs("div", { children: [_jsx("span", { children: "\u56FE\u50CF" }), _jsx("strong", { children: dataset.total_samples })] }), _jsxs("div", { children: [_jsx("span", { children: "\u6A21\u578B\u5BA1\u8BA1" }), _jsxs("strong", { children: [dataset.vlm_audited_count, " ", _jsxs("small", { children: ["/ ", dataset.total_samples] })] })] }), _jsxs("div", { children: [_jsx("span", { children: "\u5F85\u590D\u6838\u5F02\u5E38\u5EFA\u8BAE" }), _jsx("strong", { children: dataset.pending_risk_count })] }), _jsxs("div", { children: [_jsx("span", { children: "\u5DF2\u4EBA\u5DE5\u590D\u6838" }), _jsx("strong", { children: dataset.human_reviewed_count })] })] }), mode === "model" && _jsx("nav", { className: "iad-tabs", children: [["samples", "图像样本"], ["datasets", "数据集管理"], ["jobs", "模型审计作业"], ["reports", "报告"]].map(([key, label]) => _jsx("button", { className: tab === key ? "active" : "", onClick: () => setTab(key), children: label }, key)) }), mode === "model" && (tab === "datasets" || !datasets.length) ? _jsx(DatasetManager, { datasets: datasets, selected: dataset, onChanged: id => { loadDatasets(id); setRevision(v => v + 1); } }) : dataset ? _jsxs(_Fragment, { children: [(mode === "review" || tab === "samples") && _jsxs("div", { className: "iad-main", children: [_jsx(SampleGrid, { dataset: dataset, filters: filters, onFilters: updateFilters, items: items, total: total, page: page, onPage: setPage, selected: selected, onSelect: setSelected, loading: loading }), _jsx(SampleInspector, { dataset: dataset, sampleId: selected, mode: mode, revision: revision, onChanged: changed })] }), mode === "model" && tab === "jobs" && _jsx(AuditJobs, { dataset: dataset, filters: filters, onChanged: changed }), mode === "model" && tab === "reports" && _jsx(AuditReport, { dataset: dataset })] }) : _jsx("p", { className: "iad-empty", children: "\u8BF7\u5728\u6A21\u578B\u5BA1\u8BA1\u7684\u6570\u636E\u96C6\u7BA1\u7406\u4E2D\u5BFC\u5165\u6570\u636E\u96C6\u3002" })] });
}
export function ModelAuditPage() { return _jsx(WorkbenchPage, { mode: "model" }); }
export function HumanReviewPage() { return _jsx(WorkbenchPage, { mode: "review" }); }
