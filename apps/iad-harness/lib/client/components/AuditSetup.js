import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { ImageViewer } from "./ImageViewer.js";
import { DatasetKnowledge } from "./DatasetKnowledge.js";
import { message, request } from "../api.js";
import { useKnowledge } from "../useKnowledge.js";
import { useWorkspace } from "../workspace.js";
import { KnowledgeState } from "./KnowledgeState.js";
export function AuditSetup({ dataset, filters, jobs, revision, onJobsChanged }) {
    const { workspace } = useWorkspace();
    const view = workspace.view("industrial-audit");
    const normalQuery = useKnowledge(dataset.dataset_id, "normal", view.normalVersion, revision);
    const defectQuery = useKnowledge(dataset.dataset_id, "defect", view.defectVersion, revision);
    const normal = normalQuery.knowledge;
    const defect = defectQuery.knowledge?.normal_version_id === normal?.version_id ? defectQuery.knowledge : null;
    const loading = normalQuery.loading || defectQuery.loading;
    const loadError = normalQuery.error || defectQuery.error || (!loading && view.defectVersion && !defect ? "所选不良知识与良品版本不匹配，请重新选择" : "");
    const [lightbox, setLightbox] = useState(null);
    const model = view.model;
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    async function start() {
        setBusy(true);
        setError("");
        try {
            const input = { dataset_id: dataset.dataset_id, model_name: model || undefined,
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
    const normalDetails = normal && _jsxs(_Fragment, { children: [_jsx(DatasetKnowledge, { knowledge: normal }), _jsx("div", { className: "iad-reference-grid", children: normal.evidence.filter(item => item.image.role === "normal" && item.image.representation === "raw").map(item => {
                    const src = `/api/iad/knowledge/evidence/${encodeURIComponent(normal.version_id)}/${encodeURIComponent(item.image.evidence_id)}`;
                    return _jsx("button", { title: "\u653E\u5927\u77E5\u8BC6\u6765\u6E90\u56FE", onClick: () => setLightbox({ src, title: item.sample_id.split("/").pop() }), children: _jsx("img", { alt: "\u77E5\u8BC6\u6765\u6E90\u8BC1\u636E", src: src }) }, item.image.evidence_id);
                }) })] });
    return _jsxs("section", { className: "iad-job-panel", children: [_jsxs("section", { className: "iad-job-section", children: [_jsx("h2", { children: "\u6A21\u578B\u5BA1\u8BA1\u8BBE\u7F6E" }), _jsxs("div", { className: "iad-config-bar", children: [_jsxs("label", { className: "iad-field", children: ["\u826F\u54C1\u7248\u672C", _jsxs("select", { "aria-label": "\u5BA1\u8BA1\u826F\u54C1\u77E5\u8BC6\u7248\u672C", value: view.normalVersion, disabled: loading, onChange: event => workspace.updateView("industrial-audit", { normalVersion: event.target.value, defectVersion: "" }), children: [_jsx("option", { value: "", children: "\u5F53\u524D\u7248\u672C" }), normalQuery.versions.map(version => _jsxs("option", { value: version.version_id, children: [version.version_id, " \u00B7 ", version.created_at] }, version.version_id))] })] }), _jsxs("label", { className: "iad-field", children: ["\u4E0D\u826F\u54C1\u7248\u672C", _jsxs("select", { "aria-label": "\u5BA1\u8BA1\u4E0D\u826F\u54C1\u77E5\u8BC6\u7248\u672C", value: view.defectVersion, disabled: loading || !normal, onChange: event => workspace.updateView("industrial-audit", { defectVersion: event.target.value }), children: [_jsx("option", { value: "", children: "\u5339\u914D\u7684\u5F53\u524D\u7248\u672C" }), defectQuery.versions.filter(version => version.normal_version_id === normal?.version_id).map(version => _jsxs("option", { value: version.version_id, children: [version.version_id, " \u00B7 ", version.created_at] }, version.version_id))] })] }), _jsx("button", { className: "iad-primary", disabled: busy || loading || !!loadError || !normal?.checks.some(check => check.status === "supported") || jobs.some(job => job.status === "RUNNING" || job.status === "PENDING"), onClick: start, children: busy ? "启动中…" : "审计当前筛选全部图像" })] }), _jsxs("details", { className: "iad-model-settings", children: [_jsx("summary", { children: "\u6A21\u578B\u8BBE\u7F6E" }), _jsxs("label", { className: "iad-field", children: ["\u6A21\u578B", _jsx("input", { "aria-label": "\u6A21\u578B\u540D\u79F0", value: model, placeholder: "\u4F7F\u7528\u9879\u76EE\u914D\u7F6E\u6A21\u578B", onChange: e => workspace.updateView("industrial-audit", { model: e.target.value }, true) })] })] }), _jsx("p", { className: "iad-muted", children: "\u8303\u56F4\uFF1A\u5F53\u524D\u7B5B\u9009\u7684\u5168\u90E8\u56FE\u50CF \u00B7 \u5168\u56FE\u4E0E\u5168\u90E8\u9002\u7528 ROI \u8054\u5408\u5206\u6790" }), loading ? _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u5BA1\u8BA1\u77E5\u8BC6\u2026" }) : loadError ? _jsx("p", { role: "alert", className: "iad-error", children: loadError }) : _jsxs(_Fragment, { children: [normal ? _jsxs(_Fragment, { children: [_jsx(KnowledgeState, { freshness: normalQuery.freshness }), _jsxs("details", { children: [_jsxs("summary", { children: ["\u826F\u54C1\u77E5\u8BC6 \u00B7 ", normal.checks.filter(check => check.status === "supported").length, " \u9879\u6709\u8BC1\u636E\u652F\u6301"] }), normalDetails] })] }) : _jsxs("p", { className: "iad-profile iad-muted", children: ["\u8BF7\u5148\u8FD0\u884C\u201C\u6316\u6398\u826F\u54C1\u77E5\u8BC6\u201D\u6280\u80FD\uFF0C\u751F\u6210\u53EF\u7528\u7248\u672C\u3002", _jsx("button", { onClick: () => workspace.navigate("industrial-normal"), children: "\u524D\u5F80\u6316\u6398\u826F\u54C1\u77E5\u8BC6" })] }), defect ? _jsxs(_Fragment, { children: [_jsx(KnowledgeState, { freshness: defectQuery.freshness }), _jsxs("details", { children: [_jsxs("summary", { children: ["\u4E0D\u826F\u77E5\u8BC6 \u00B7 ", defect.checks.length, " \u9879\u5224\u636E"] }), _jsx(DatasetKnowledge, { knowledge: defect })] })] }) : _jsx("p", { className: "iad-muted", children: "\u6682\u65E0\u5339\u914D\u7684\u4E0D\u826F\u77E5\u8BC6\uFF0C\u6309\u6B63\u5E38\u5224\u636E\u7B5B\u67E5\u3002" })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error })] }), lightbox && _jsx(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })] });
}
