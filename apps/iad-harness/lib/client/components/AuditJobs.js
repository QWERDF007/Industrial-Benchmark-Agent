import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { ImageViewer } from "./ImageViewer.js";
import { NormalKnowledge } from "./NormalKnowledge.js";
import { auditPhases, mediaUrl, message, request } from "../api.js";
export function AuditJobs({ dataset, filters, jobs, onJobsChanged }) {
    const [lightbox, setLightbox] = useState(null);
    const [profile, setProfile] = useState(null);
    const [model, setModel] = useState("Qwen/Qwen3.8-27B-FP8");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        const controller = new AbortController();
        request(`/audit/profile?${new URLSearchParams({ dataset_id: dataset.dataset_id, model_name: model })}`, undefined, undefined, controller.signal)
            .then(result => setProfile(result.profile)).catch(error => { if (!controller.signal.aborted)
            setError(message(error)); });
        return () => controller.abort();
    }, [dataset.dataset_id, dataset.reference_sample_ids.join("\n"), model, jobs[0]?.profile_id]);
    async function start() {
        setBusy(true);
        setError("");
        try {
            await request("/audit/start", { dataset_id: dataset.dataset_id, model_name: model, filters });
            onJobsChanged();
        }
        catch (e) {
            setError(message(e));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs("section", { className: "iad-job-panel", children: [_jsxs("section", { className: "iad-job-section", children: [_jsx("h2", { children: "\u53C2\u8003\u826F\u54C1" }), _jsx("div", { className: "iad-reference-grid", children: dataset.reference_sample_ids.map(id => _jsxs("div", { children: [_jsx("button", { title: "\u653E\u5927\u53C2\u8003\u826F\u54C1", onClick: () => setLightbox({ src: mediaUrl({ task_id: dataset.task_id, sample_id: id }), title: id.split("/").pop() }), children: _jsx("img", { alt: "\u6B63\u5E38\u53C2\u8003\u56FE", src: mediaUrl({ task_id: dataset.task_id, sample_id: id }, true) }) }), _jsx("small", { children: id.split("/").pop() })] }, id)) }), !dataset.reference_sample_ids.length && _jsx("p", { className: "iad-error", children: "\u6682\u65E0\u826F\u54C1\u53C2\u8003\uFF0C\u8BF7\u5148\u5728\u56FE\u50CF\u6837\u672C\u4E2D\u9009\u62E9\u3002" }), profile ? _jsx(NormalKnowledge, { profile: profile }) : _jsx("p", { className: "iad-profile iad-muted", children: "\u5F53\u524D\u53C2\u8003\u56FE\u5C1A\u672A\u5B66\u4E60\uFF1B\u542F\u52A8\u540E\u7531 MLLM\u5B66\u4E60\u5E76\u4FDD\u5B58\u826F\u54C1\u6A21\u5F0F\u3002" })] }), _jsxs("section", { className: "iad-job-section", children: [_jsx("h2", { children: "\u542F\u52A8\u6A21\u578B\u5BA1\u8BA1" }), _jsxs("div", { className: "iad-row", children: [_jsxs("label", { children: ["\u6A21\u578B", _jsx("input", { "aria-label": "\u6A21\u578B\u540D\u79F0", value: model, onChange: e => setModel(e.target.value) })] }), _jsx("button", { className: "iad-primary", onClick: start, disabled: busy || !dataset.reference_sample_ids.length || jobs.some(j => j.status === "RUNNING"), children: busy ? "启动中…" : "审计当前筛选全部图像" })] }), _jsx("p", { className: "iad-muted", children: "\u5168\u56FE\u89C2\u5BDF \u2192 \u6807\u6CE8\u53CA\u53EF\u7591\u533A\u57DF\u7EC6\u770B \u2192 \u7ED3\u5408\u4F4D\u7F6E\u3001\u5149\u7167\u7EFC\u5408\u5224\u65AD\u3002" }), error && _jsx("p", { role: "alert", className: "iad-error", children: error })] }), _jsxs("section", { className: "iad-job-section", children: [_jsx("h2", { children: "\u5BA1\u8BA1\u4F5C\u4E1A" }), jobs.map(job => _jsxs("article", { className: "iad-job", children: [_jsxs("div", { className: "iad-row", children: [_jsx("strong", { children: job.status }), _jsx("span", { children: job.model_name }), (job.status === "RUNNING" || job.status === "PENDING") && _jsx("button", { onClick: async () => { try {
                                            await request(`/audit/cancel/${job.run_id}`, {});
                                            onJobsChanged();
                                        }
                                        catch (e) {
                                            setError(message(e));
                                        } }, children: "\u53D6\u6D88" })] }), _jsx("progress", { value: job.progress, max: 1 }), _jsxs("p", { children: ["\u5B8C\u6210 ", job.completed, " \u00B7 \u5931\u8D25 ", job.failed, " \u00B7 \u5171 ", job.total_samples, " \u5F20"] }), _jsx("p", { className: "iad-muted", children: auditPhases[job.phase || ""] || job.message }), !!job.planned_regions && _jsxs("p", { className: "iad-muted", children: ["ROI ", job.inspected_regions || 0, " / ", job.planned_regions] }), !!job.total_batches && _jsxs("p", { className: "iad-muted", children: ["\u8054\u5408\u5224\u65AD ", job.completed_batches || 0, " / ", job.total_batches] }), job.profile_id && _jsxs("small", { className: "iad-muted", children: ["\u6A21\u5F0F\u7248\u672C ", job.profile_id, _jsx("br", {})] }), _jsx("small", { className: "iad-muted", children: job.run_id }), job.errors.length > 0 && _jsxs("details", { children: [_jsx("summary", { children: "\u5931\u8D25\u8BE6\u60C5" }), job.errors.map((error, i) => _jsxs("p", { children: [error.sample_id, ": ", error.message] }, i))] })] }, job.run_id)), !jobs.length && _jsx("p", { className: "iad-muted", children: "\u5C1A\u65E0\u5BA1\u8BA1\u4F5C\u4E1A\u3002" })] }), lightbox && _jsx(ImageViewer, { image: lightbox, onClose: () => setLightbox(null) })] });
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
    return _jsxs("section", { children: [_jsx("h2", { children: "\u5BA1\u8BA1\u6C47\u603B" }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), report && _jsxs(_Fragment, { children: [_jsxs("dl", { children: [_jsx("dt", { children: "\u6A21\u578B\u8986\u76D6" }), _jsxs("dd", { children: [report.vlm_audited_count, " / ", report.total_samples, " (", report.vlm_coverage_pct, "%)"] }), _jsx("dt", { children: "\u6A21\u578B\u5EFA\u8BAE\u5F02\u5E38" }), _jsx("dd", { children: report.vlm_anomalies_count }), _jsx("dt", { children: "\u6280\u672F\u8D28\u91CF\u95EE\u9898" }), _jsx("dd", { children: report.technical_quality_issues }), _jsx("dt", { children: "\u4EBA\u5DE5\u590D\u6838" }), _jsx("dd", { children: report.human_reviewed_count }), _jsx("dt", { children: "\u4EBA\u5BA1\u826F\u54C1 / \u5F02\u5E38 / \u4E0D\u786E\u5B9A" }), _jsxs("dd", { children: [report.human_pass_count, " / ", report.human_fail_count, " / ", report.human_uncertain_count] })] }), _jsx("button", { onClick: download, children: "\u5BFC\u51FA JSON" })] })] });
}
