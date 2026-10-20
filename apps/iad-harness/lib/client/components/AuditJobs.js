import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { JobCard } from "./JobCard.js";
import { QualityReport } from "./QualityReport.js";
import { useEffect, useState } from "react";
import { ImageViewer } from "./ImageViewer.js";
import { DatasetKnowledge } from "./DatasetKnowledge.js";
import { message, request } from "../api.js";
import { useKnowledge } from "../useKnowledge.js";
import { useWorkspace } from "../workspace.js";
import { KnowledgeState } from "./KnowledgeState.js";
export function AuditJobs({ dataset, filters, jobs, revision, onJobsChanged }) {
    const { workspace } = useWorkspace();
    const view = workspace.view("industrial-audit");
    const normalQuery = useKnowledge(dataset.dataset_id, "normal", view.normalVersion, revision);
    const defectQuery = useKnowledge(dataset.dataset_id, "defect", view.defectVersion, revision);
    const normal = normalQuery.knowledge;
    const defect = defectQuery.knowledge?.normal_version_id === normal?.version_id ? defectQuery.knowledge : null;
    const loading = normalQuery.loading || defectQuery.loading;
    const loadError = normalQuery.error || defectQuery.error || (!loading && view.defectVersion && !defect ? "所选不良知识与良品版本不匹配，请重新选择" : "");
    const [lightbox, setLightbox] = useState(null);
    const [model, setModel] = useState("Qwen/Qwen3.8-27B-FP8");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    async function start() {
        setBusy(true);
        setError("");
        try {
            const input = { dataset_id: dataset.dataset_id, model_name: model,
                normal_version_id: normal?.version_id, defect_version_id: defect?.version_id, filters };
            await request("/audit/start", input);
            onJobsChanged();
        }
        catch (e) {
            setError(message(e));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs("section", { className: "iad-job-panel", children: [_jsxs("section", { className: "iad-job-section", children: [_jsx("h2", { children: "\u5BA1\u8BA1\u77E5\u8BC6" }), _jsxs("div", { className: "iad-row", children: [_jsxs("label", { className: "iad-field", children: ["\u826F\u54C1\u7248\u672C", _jsxs("select", { "aria-label": "\u5BA1\u8BA1\u826F\u54C1\u77E5\u8BC6\u7248\u672C", value: view.normalVersion, disabled: loading, onChange: event => workspace.updateView("industrial-audit", { normalVersion: event.target.value, defectVersion: "" }), children: [_jsx("option", { value: "", children: "\u5F53\u524D\u7248\u672C" }), normalQuery.versions.map(version => _jsxs("option", { value: version.version_id, children: [version.version_id, " \u00B7 ", version.created_at] }, version.version_id))] })] }), _jsxs("label", { className: "iad-field", children: ["\u4E0D\u826F\u54C1\u7248\u672C", _jsxs("select", { "aria-label": "\u5BA1\u8BA1\u4E0D\u826F\u54C1\u77E5\u8BC6\u7248\u672C", value: view.defectVersion, disabled: loading || !normal, onChange: event => workspace.updateView("industrial-audit", { defectVersion: event.target.value }), children: [_jsx("option", { value: "", children: "\u5339\u914D\u7684\u5F53\u524D\u7248\u672C" }), defectQuery.versions.filter(version => version.normal_version_id === normal?.version_id).map(version => _jsxs("option", { value: version.version_id, children: [version.version_id, " \u00B7 ", version.created_at] }, version.version_id))] })] })] }), loading ? _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u5BA1\u8BA1\u77E5\u8BC6\u2026" }) : loadError ? _jsx("p", { role: "alert", className: "iad-error", children: loadError }) : _jsxs(_Fragment, { children: [normal ? _jsxs(_Fragment, { children: [_jsx(DatasetKnowledge, { knowledge: normal }), _jsx(KnowledgeState, { freshness: normalQuery.freshness }), _jsx("div", { className: "iad-reference-grid", children: normal.evidence.filter(item => item.image.role === "normal" && item.image.representation === "raw").map(item => {
                                            const src = `/api/iad/knowledge/evidence/${encodeURIComponent(normal.version_id)}/${encodeURIComponent(item.image.evidence_id)}`;
                                            return _jsx("button", { title: "\u653E\u5927\u77E5\u8BC6\u6765\u6E90\u56FE", onClick: () => setLightbox({ src, title: item.sample_id.split("/").pop() }), children: _jsx("img", { alt: "\u77E5\u8BC6\u6765\u6E90\u8BC1\u636E", src: src }) }, item.image.evidence_id);
                                        }) })] }) : _jsx("p", { className: "iad-profile iad-muted", children: "\u8BF7\u5148\u8FD0\u884C\u201C\u6316\u6398\u826F\u54C1\u77E5\u8BC6\u201D\u6280\u80FD\uFF0C\u751F\u6210\u53EF\u7528\u7248\u672C\u3002" }), defect ? _jsxs(_Fragment, { children: [_jsx(DatasetKnowledge, { knowledge: defect }), _jsx(KnowledgeState, { freshness: defectQuery.freshness })] }) : _jsx("p", { className: "iad-muted", children: "\u6682\u65E0\u5339\u914D\u7684\u4E0D\u826F\u77E5\u8BC6\uFF0C\u6309\u6B63\u5E38\u5224\u636E\u7B5B\u67E5\u3002" })] })] }), _jsxs("section", { className: "iad-job-section", children: [_jsx("h2", { children: "\u542F\u52A8\u6A21\u578B\u5BA1\u8BA1" }), _jsxs("div", { className: "iad-row", children: [_jsxs("label", { children: ["\u6A21\u578B", _jsx("input", { "aria-label": "\u6A21\u578B\u540D\u79F0", value: model, onChange: e => setModel(e.target.value) })] }), _jsx("button", { className: "iad-primary", onClick: start, disabled: busy || loading || !!loadError || !normal?.checks.some(check => check.status === "supported") || jobs.some(j => j.status === "RUNNING" || j.status === "PENDING"), children: busy ? "启动中…" : "审计当前筛选全部图像" })] }), _jsx("p", { className: "iad-muted", children: "\u7ED3\u5408\u51BB\u7ED3\u77E5\u8BC6\u3001\u5168\u56FE\u4E0E\u5168\u90E8\u5C40\u90E8\u56FE\uFF0C\u7EFC\u5408\u5206\u6790\u4F4D\u7F6E\u548C\u5149\u7167\u3002" }), error && _jsx("p", { role: "alert", className: "iad-error", children: error })] }), _jsxs("section", { className: "iad-job-section", children: [_jsx("h2", { children: "\u5BA1\u8BA1\u4F5C\u4E1A" }), jobs.map(job => _jsx(JobCard, { job: job, onChanged: onJobsChanged }, job.run_id)), !jobs.length && _jsx("p", { className: "iad-muted", children: "\u5C1A\u65E0\u5BA1\u8BA1\u4F5C\u4E1A\u3002" })] }), lightbox && _jsx(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })] });
}
export function AuditReport({ dataset }) {
    const [report, setReport] = useState(null);
    const [error, setError] = useState("");
    useEffect(() => {
        const controller = new AbortController();
        request(`/report/${dataset.task_id}?dataset_id=${dataset.dataset_id}`, undefined, undefined, controller.signal).then(setReport).catch(e => { if (!controller.signal.aborted)
            setError(message(e)); });
        return () => controller.abort();
    }, [dataset]);
    function download() {
        const blob = new Blob([JSON.stringify({ dataset_id: dataset.dataset_id, name: dataset.name, ...report }, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob), anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${dataset.name}-report.json`;
        anchor.click();
        URL.revokeObjectURL(url);
    }
    return _jsxs("section", { className: "iad-job-section iad-quality-report", children: [_jsx("h2", { children: "\u5BA1\u8BA1\u6C47\u603B" }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), report && _jsxs(_Fragment, { children: [_jsx(QualityReport, { report: report }), _jsx("button", { onClick: download, children: "\u5BFC\u51FA JSON" })] })] });
}
