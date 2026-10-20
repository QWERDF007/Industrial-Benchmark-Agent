import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { message, request } from "../api.js";
import { JobCard } from "./JobCard.js";
import { QualityReport } from "./QualityReport.js";
import { AuditSetup } from "./AuditSetup.js";
export function AuditJobs(props) {
    return _jsxs(_Fragment, { children: [_jsx(AuditSetup, { ...props }), _jsxs("section", { className: "iad-job-section", children: [_jsx("h2", { children: "\u5BA1\u8BA1\u4F5C\u4E1A" }), props.jobs.map(job => _jsx(JobCard, { job: job, onChanged: props.onJobsChanged }, job.run_id)), !props.jobs.length && _jsx("p", { className: "iad-muted", children: "\u5C1A\u65E0\u5BA1\u8BA1\u4F5C\u4E1A\u3002" })] })] });
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
    return _jsxs("section", { className: "iad-job-section iad-quality-report", children: [_jsx("h2", { children: "\u5BA1\u8BA1\u6C47\u603B" }), !report && !error && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u5F53\u524D\u6570\u636E\u96C6\u62A5\u544A\u2026" }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), report && _jsxs(_Fragment, { children: [_jsx(QualityReport, { report: report }), _jsx("button", { onClick: download, children: "\u5BFC\u51FA JSON" })] })] });
}
