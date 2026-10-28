import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconButton } from "./components/IconButton.js";
import { RefreshIcon } from "./AuditIcon.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { initialReviewFilters, message, request, reviewLabel, sampleQuery } from "./api.js";
import { DatasetManager } from "./components/DatasetManager.js";
import { SampleFilters } from "./components/SampleFilters.js";
import { SampleGrid } from "./components/SampleGrid.js";
import { SampleInspector } from "./components/SampleInspector.js";
import { AuditSetup } from "./components/AuditSetup.js";
import { AuditJobs, AuditReport } from "./components/AuditJobs.js";
import { KnowledgeConflictReview } from "./components/KnowledgeConflictReview.js";
import { ExplorationPage } from "./components/ExplorationPage.js";
import { KnowledgePage } from "./components/KnowledgePage.js";
import { Modal } from "./components/Modal.js";
import { ReviewRecords } from "./components/ReviewRecords.js";
import { pageSize } from "./components/Pagination.js";
import { useJobs } from "./useJobs.js";
import { useWorkspace } from "./workspace.js";
import { workbenchStyles } from "./styles.js";
import { useSampleNavigation } from "./useSampleNavigation.js";
import { usePagePosition } from "./usePagePosition.js";
import { PageTabs } from "./components/layout/PageTabs.js";
import { WorkbenchHeader } from './components/layout/WorkbenchHeader.js';
export function WorkbenchPage({ pageId }) {
    const { workspace, state } = useWorkspace();
    const datasetId = state.datasetId, view = workspace.view(pageId);
    const [auditSetupOpen, setAuditSetupOpen] = useState(false);
    const [auditDetailOpen, setAuditDetailOpen] = useState(false);
    const [auditWidth, setAuditWidth] = useState(null);
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
    const audit = useJobs("audit", pageId === "industrial-audit" ? datasetId : "", changed, workspace.view("industrial-audit").job);
    useEffect(() => { const controller = new AbortController(); void loadDatasets(undefined, controller.signal); return () => controller.abort(); }, [loadDatasets]);
    const gallery = pageId === "industrial-images" || ((pageId === "industrial-review" || pageId === "industrial-audit") && view.tab === "results");
    const query = sampleQuery(datasetId, view.filters, view.page, pageSize);
    const navigation = useSampleNavigation(pageId, dataset?.task_id, query, result, gallery);
    const surface = usePagePosition(gallery ? JSON.stringify([pageId, view.tab, query]) : null, state.active && state.pageId === pageId && !!dataset && result.query === query && !loading);
    useEffect(() => {
        if (pageId !== "industrial-audit" || !surface.current)
            return;
        const observer = new ResizeObserver(([entry]) => setAuditWidth(entry.borderBoxSize[0].inlineSize));
        observer.observe(surface.current);
        return () => observer.disconnect();
    }, [pageId, surface]);
    useEffect(() => setAuditDetailOpen(false), [datasetId, view.tab]);
    const auditCompact = auditWidth !== null && auditWidth <= 900;
    const auditModalOpen = auditCompact && (auditDetailOpen || !!view.inspection);
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
    const grid = dataset && _jsx(SampleGrid, { layout: pageId === "industrial-review" ? "queue" : "grid", showFilters: pageId === "industrial-images", dataset: dataset, filters: view.filters, onFilters: updateFilters, items: result.query === query ? result.items : [], total: result.query === query ? result.total : 0, page: view.page, onPage: page => workspace.updateView(pageId, { page, selected: "" }), selected: view.selected, onSelect: selected => { workspace.updateView(pageId, { selected }); if (pageId === "industrial-audit")
            setAuditDetailOpen(auditCompact); }, loading: loading, sourceManagement: pageId === "industrial-images" ? { active: view.tab === "sources", onChanged: changed } : undefined }, datasetId);
    const inspectedSample = pageId === "industrial-review" && view.tab === "records" ? view.historySampleId : view.selected;
    const inspector = dataset && _jsx(SampleInspector, { dataset: dataset, sampleId: inspectedSample, mode: pageId === "industrial-review" ? "review" : pageId === "industrial-images" ? "browse" : "model", queue: pageId === "industrial-review" && view.tab === "results" ? grid : undefined, filters: _jsx(SampleFilters, { defaults: initialReviewFilters, dataset: dataset, filters: view.filters, onFilters: updateFilters }), advanceOnSubmit: view.tab === "results" && view.filters.review_status === "pending", panel: pageId === "industrial-audit" ? { presentation: auditWidth === null ? "closed" : auditModalOpen ? "modal" : auditCompact ? "closed" : "inline", onOpen: setAuditDetailOpen,
            onClose: () => { setAuditDetailOpen(false); workspace.updateView(pageId, { inspection: null }, true); }, restoreFocus: () => surface.current?.querySelector(`.iad-sample[data-sample-id="${CSS.escape(view.selected)}"]`) || null } : undefined, revision: revision, onReviewed: reviewed, jobs: audit.jobs, onJobsChanged: audit.refresh, navigation: gallery ? navigation : undefined }, pageId === "industrial-review" && view.tab === "results" ? datasetId : `${datasetId}:${inspectedSample}`);
    const datasetControls = _jsxs(_Fragment, { children: [_jsxs("select", { "aria-label": "\u5F53\u524D\u6570\u636E\u96C6", value: datasetId, onChange: event => workspace.selectDataset(event.target.value), children: [_jsx("option", { value: "", disabled: true, children: "\u9009\u62E9\u6570\u636E\u96C6" }), datasets.map(item => _jsxs("option", { value: item.dataset_id, children: [item.name, " (", item.total_samples, ")"] }, item.dataset_id))] }), _jsx(IconButton, { label: "\u5237\u65B0", onClick: changed, children: _jsx(RefreshIcon, {}) })] });
    return _jsxs("div", { ref: surface, className: "iad-workbench", "data-page": pageId, children: [_jsx("style", { children: workbenchStyles }), pageId !== "industrial-datasets" && (!dataset || (pageId !== "industrial-exploration" && pageId !== "industrial-knowledge")) && _jsxs(WorkbenchHeader, { pageId: pageId, children: [datasetControls, pageId === "industrial-audit" && _jsx("button", { className: "iad-primary", disabled: !dataset, onClick: () => setAuditSetupOpen(true), children: "\u65B0\u5EFA\u5BA1\u8BA1" })] }), (error || audit.error) && _jsx("p", { role: "alert", className: "iad-error", children: error || audit.error }), pageId === "industrial-datasets" ? _jsx(_Fragment, { children: _jsx(DatasetManager, { datasets: datasets, selected: dataset, onChanged: id => { void loadDatasets(id); setRevision(v => v + 1); } }) }) : !dataset ? _jsxs("section", { className: "iad-job-section", children: [_jsx("p", { children: "\u8BF7\u5148\u6DFB\u52A0\u670D\u52A1\u5668\u4E0A\u7684\u6570\u636E\u96C6\u3002" }), _jsx("button", { onClick: () => workspace.navigate("industrial-datasets"), children: "\u524D\u5F80\u6570\u636E\u96C6\u7BA1\u7406" })] }) : _jsxs(_Fragment, { children: [pageId === "industrial-exploration" && _jsx(ExplorationPage, { dataset: dataset, refreshRevision: revision, headerActions: datasetControls }, datasetId), pageId === "industrial-knowledge" && _jsx(KnowledgePage, { dataset: dataset, kind: state.knowledgeKind, refreshRevision: revision, headerActions: datasetControls }, `${datasetId}:${state.knowledgeKind}`), pageId === "industrial-images" && _jsxs(PageTabs, { label: "\u56FE\u50CF\u89C6\u56FE", items: [{ id: "results", label: "全部图像" }, { id: "sources", label: "良品来源" }], value: view.tab, onChange: tab => workspace.updateView(pageId, { tab, selected: "" }), children: [_jsx("div", { className: "iad-browse", children: grid }), view.selected && _jsx(Modal, { title: "\u56FE\u50CF\u8BE6\u60C5", restoreFocus: () => surface.current?.querySelector(`.iad-sample[data-sample-id="${CSS.escape(view.selected)}"]`) || null, onClose: () => workspace.updateView(pageId, { selected: "" }), children: inspector })] }), pageId === "industrial-audit" && _jsxs(_Fragment, { children: [_jsxs(PageTabs, { label: "\u5BA1\u8BA1\u89C6\u56FE", items: [{ id: "results", label: "结果" }, { id: "jobs", label: "模型审计作业" }, { id: "reports", label: "报告" }], value: view.tab, onChange: tab => workspace.updateView(pageId, { tab }), children: [view.tab !== "jobs" && audit.jobs.some(job => ["RUNNING", "PENDING"].includes(job.status)) && _jsx("p", { role: "status", children: _jsx("button", { onClick: () => workspace.updateView(pageId, { tab: "jobs" }), children: "\u67E5\u770B\u6267\u884C\u4E2D\u7684\u5BA1\u8BA1\u4F5C\u4E1A" }) }), view.tab === "results" && _jsxs(_Fragment, { children: [_jsx(SampleFilters, { dataset: dataset, filters: view.filters, onFilters: updateFilters }), _jsxs("div", { className: "iad-main", "data-compact": auditCompact, children: [grid, inspector] })] }), view.tab === "jobs" && _jsx(AuditJobs, { jobs: audit.jobs, onJobsChanged: audit.refresh }), view.tab === "reports" && _jsx(AuditReport, { dataset: dataset }, datasetId)] }), auditSetupOpen && _jsx(Modal, { title: "\u65B0\u5EFA\u6A21\u578B\u5BA1\u8BA1", className: "iad-drawer", onClose: () => setAuditSetupOpen(false), children: _jsx(AuditSetup, { dataset: dataset, filters: view.filters, jobs: audit.jobs, revision: revision, onJobsChanged: audit.refresh, onStarted: job => { setAuditSetupOpen(false); workspace.updateView(pageId, { tab: "jobs", job: job.run_id }); } }, datasetId) })] }), pageId === "industrial-review" && _jsxs(PageTabs, { label: "\u590D\u6838\u89C6\u56FE", items: [{ id: "results", label: "复核队列" }, { id: "conflicts", label: "知识冲突" }, { id: "records", label: "复核记录" }], value: view.tab, onChange: tab => workspace.updateView(pageId, { tab }), children: [view.tab === "conflicts" && _jsx(KnowledgeConflictReview, { datasetId: datasetId }, datasetId), view.tab === "results" && _jsxs(_Fragment, { children: [reviewConfirmation?.datasetId === datasetId && _jsxs("p", { role: "status", className: "iad-review-confirmation", children: ["\u5DF2\u63D0\u4EA4 ", reviewConfirmation.name, " \u00B7 ", reviewLabel(reviewConfirmation.decision)] }), inspector] }), view.tab === "records" && _jsx(ReviewRecords, { datasetId: datasetId, page: view.historyPage, search: view.historySearch, selected: view.historySampleId, revision: revision, onPage: historyPage => workspace.updateView(pageId, { historyPage }), onSearch: historySearch => workspace.updateView(pageId, { historySearch, historyPage: 1 }, true), onSelect: historySampleId => workspace.updateView(pageId, { historySampleId }), onQueue: () => workspace.updateView(pageId, { tab: "results" }), detail: inspector }, datasetId)] })] })] });
}
