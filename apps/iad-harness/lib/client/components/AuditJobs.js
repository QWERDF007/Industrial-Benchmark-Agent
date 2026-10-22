import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { message, request } from "../api.js";
import { JobTable } from "./JobTable.js";
import { QualityReport } from "./QualityReport.js";
export function AuditJobs(props) {
    return _jsxs("section", { className: "iad-job-section", children: [_jsx("h2", { children: "\u5BA1\u8BA1\u4F5C\u4E1A" }), _jsx(JobTable, { jobs: props.jobs, pageId: "industrial-audit", onChanged: props.onJobsChanged })] });
}
export function AuditReport({ dataset }) {
    const [report, setReport] = useState(null);
    const [error, setError] = useState("");
    useEffect(() => {
        const controller = new AbortController();
        request(`/report/${dataset.task_id}?dataset_id=${dataset.dataset_id}`, undefined, undefined, controller.signal).then(value => { if (!controller.signal.aborted) {
            setReport(value);
            setError("");
        } }).catch(e => { if (!controller.signal.aborted)
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
    return _jsxs("section", { className: "iad-job-section iad-quality-report", children: [_jsxs("div", { className: "iad-section-header", children: [_jsx("h2", { children: "\u5BA1\u8BA1\u6C47\u603B" }), report && _jsx("button", { onClick: download, children: "\u5BFC\u51FA JSON" })] }), _jsx("p", { className: "iad-muted", children: "\u5168\u90E8\u6570\u636E\u96C6\u56FE\u50CF \u00B7 \u6BCF\u56FE\u6700\u65B0\u5DF2\u4FDD\u5B58\u8BB0\u5F55 \u00B7 \u4E0D\u53D7\u7F51\u683C\u7B5B\u9009\u5F71\u54CD" }), !report && !error && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u5F53\u524D\u6570\u636E\u96C6\u62A5\u544A\u2026" }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), report && _jsx(_Fragment, { children: _jsx(QualityReport, { report: report }) })] });
}
