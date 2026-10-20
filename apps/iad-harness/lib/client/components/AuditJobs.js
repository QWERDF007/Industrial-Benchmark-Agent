import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { JobCard } from "./JobCard.js";
import { QualityReport } from "./QualityReport.js";
import { useEffect, useState } from "react";
import { ImageViewer } from "./ImageViewer.js";
import { DatasetKnowledge } from "./DatasetKnowledge.js";
import { message, request } from "../api.js";
export function AuditJobs({ dataset, filters, jobs, onJobsChanged }) {
    const [lightbox, setLightbox] = useState(null);
    const [normal, setNormal] = useState(null);
    const [defect, setDefect] = useState(null);
    const [model, setModel] = useState("Qwen/Qwen3.8-27B-FP8");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        const controller = new AbortController();
        setNormal(null);
        setDefect(null);
        Promise.all(["normal", "defect"].map(kind => request(`/knowledge?${new URLSearchParams({ dataset_id: dataset.dataset_id, kind })}`, undefined, undefined, controller.signal)))
            .then(([normal, defect]) => { setNormal(normal.knowledge); setDefect(defect.knowledge?.normal_version_id === normal.knowledge?.version_id ? defect.knowledge : null); })
            .catch(error => { if (!controller.signal.aborted)
            setError(message(error)); });
        return () => controller.abort();
    }, [dataset.dataset_id, jobs[0]?.normal_version_id]);
    async function start() {
        setBusy(true);
        setError("");
        try {
            await request("/audit/start", { dataset_id: dataset.dataset_id, model_name: model,
                normal_version_id: normal?.version_id, defect_version_id: defect?.version_id, filters });
            onJobsChanged();
        }
        catch (e) {
            setError(message(e));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs("section", { className: "iad-job-panel", children: [_jsxs("section", { className: "iad-job-section", children: [_jsx("h2", { children: "\u51BB\u7ED3\u77E5\u8BC6" }), normal ? _jsxs(_Fragment, { children: [_jsx(DatasetKnowledge, { knowledge: normal }), _jsx("div", { className: "iad-reference-grid", children: normal.evidence.filter(item => item.image.role === "normal" && item.image.representation === "raw").map(item => {
                                    const src = `/api/iad/knowledge/evidence/${encodeURIComponent(normal.version_id)}/${encodeURIComponent(item.image.evidence_id)}`;
                                    return _jsx("button", { title: "\u653E\u5927\u77E5\u8BC6\u6765\u6E90\u56FE", onClick: () => setLightbox({ src, title: item.sample_id.split("/").pop() }), children: _jsx("img", { alt: "\u77E5\u8BC6\u6765\u6E90\u8BC1\u636E", src: src }) }, item.image.evidence_id);
                                }) })] }) : _jsx("p", { className: "iad-profile iad-muted", children: "\u8BF7\u5148\u8FD0\u884C\u201C\u6316\u6398\u826F\u54C1\u77E5\u8BC6\u201D\u6280\u80FD\uFF0C\u751F\u6210\u53EF\u7528\u7248\u672C\u3002" }), defect ? _jsx(DatasetKnowledge, { knowledge: defect }) : _jsx("p", { className: "iad-muted", children: "\u6682\u65E0\u5339\u914D\u7684\u4E0D\u826F\u77E5\u8BC6\uFF0C\u6309\u6B63\u5E38\u5224\u636E\u7B5B\u67E5\u3002" })] }), _jsxs("section", { className: "iad-job-section", children: [_jsx("h2", { children: "\u542F\u52A8\u6A21\u578B\u5BA1\u8BA1" }), _jsxs("div", { className: "iad-row", children: [_jsxs("label", { children: ["\u6A21\u578B", _jsx("input", { "aria-label": "\u6A21\u578B\u540D\u79F0", value: model, onChange: e => setModel(e.target.value) })] }), _jsx("button", { className: "iad-primary", onClick: start, disabled: busy || !normal?.checks.some(check => check.status === "supported") || jobs.some(j => j.status === "RUNNING" || j.status === "PENDING"), children: busy ? "启动中…" : "审计当前筛选全部图像" })] }), _jsx("p", { className: "iad-muted", children: "\u7ED3\u5408\u51BB\u7ED3\u77E5\u8BC6\u3001\u5168\u56FE\u4E0E\u5168\u90E8\u5C40\u90E8\u56FE\uFF0C\u7EFC\u5408\u5206\u6790\u4F4D\u7F6E\u548C\u5149\u7167\u3002" }), error && _jsx("p", { role: "alert", className: "iad-error", children: error })] }), _jsxs("section", { className: "iad-job-section", children: [_jsx("h2", { children: "\u5BA1\u8BA1\u4F5C\u4E1A" }), jobs.map(job => _jsx(JobCard, { job: job, onChanged: onJobsChanged }, job.run_id)), !jobs.length && _jsx("p", { className: "iad-muted", children: "\u5C1A\u65E0\u5BA1\u8BA1\u4F5C\u4E1A\u3002" })] }), lightbox && _jsx(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })] });
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
