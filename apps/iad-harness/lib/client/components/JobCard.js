import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { message, request } from "../api.js";
import { useWorkspace } from "../workspace.js";
import { KnowledgeJobEvidence } from "./KnowledgeJobEvidence.js";
import { jobStatuses } from "../../shared/job-display.js";
import { DeleteAction } from "./DeleteAction.js";
const phases = {
    PREPARING_KNOWLEDGE: "准备冻结知识", GLOBAL: "全图观察", REGIONS: "ROI 细看",
    SYNTHESIS: "全图与 ROI 联合分析", SAMPLE_COMPLETED: "图像审计完成",
    LEARNING_NORMAL: "归纳良品知识", LEARNING_DEFECT: "归纳不良品知识",
    VERIFYING_NORMAL: "核验良品疑点", VERIFYING_DEFECT: "核验标注与异常知识",
    OBSERVING_PRESET: "观察冻结判据", RECHECKING_HUMAN_KNOWLEDGE: "核验人工知识处置",
    COMPARING_KNOWLEDGE: "比较新旧证据", RECHECKING_CRITERIA: "重核验修订判据",
    KNOWLEDGE_PUBLISHED: "知识已发布", KNOWLEDGE_REUSED: "复用已核验知识",
};
const sampleName = (sample) => sample.relative_path || sample.sample_uuid;
export function JobCard({ job, onChanged }) {
    const { workspace } = useWorkspace();
    const kind = job.job_type === "MODEL_AUDIT" ? "audit" : "knowledge";
    const page = kind === "audit" ? "industrial-audit" : "industrial-knowledge";
    const active = job.status === "RUNNING" || job.status === "PENDING";
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [expanded, setExpanded] = useState(false);
    const [options, setOptions] = useState(null);
    const [selected, setSelected] = useState([]);
    const [revision, setRevision] = useState(0);
    const article = useRef(null);
    const focused = workspace.view(page, job.kind ?? undefined).job === job.run_id;
    useEffect(() => { if (focused)
        article.current?.scrollIntoView({ block: "nearest" }); }, [focused]);
    useEffect(() => {
        if (!expanded)
            return;
        const controller = new AbortController();
        setOptions(null);
        setError("");
        request(`/${kind}/retry/${encodeURIComponent(job.run_id)}`, undefined, undefined, controller.signal)
            .then(options => { if (!controller.signal.aborted) {
            setOptions(options);
            setSelected(options.samples.map(sample => sample.sample_id));
        } })
            .catch(error => { if (!controller.signal.aborted)
            setError(message(error)); });
        return () => controller.abort();
    }, [expanded, revision, job.run_id, kind]);
    async function cancel() {
        setBusy(true);
        setError("");
        try {
            await request(`/${kind}/cancel/${encodeURIComponent(job.run_id)}`, {});
            onChanged();
        }
        catch (error) {
            setError(message(error));
        }
        finally {
            setBusy(false);
        }
    }
    async function retry() {
        setBusy(true);
        setError("");
        try {
            await request(`/${kind}/retry/${encodeURIComponent(job.run_id)}`, { sample_ids: selected });
            setExpanded(false);
            onChanged();
        }
        catch (error) {
            setError(message(error));
        }
        finally {
            setBusy(false);
        }
    }
    function locate(sampleId) {
        workspace.navigate(kind === "audit" ? "industrial-audit" : "industrial-images", sampleId);
    }
    function related(runId) {
        workspace.openLocation({ pageId: page, datasetId: job.dataset_id, knowledgeKind: job.kind ?? undefined, job: runId, tab: "jobs" });
    }
    return _jsxs("article", { ref: article, className: "iad-job", "data-job-id": job.run_id, "aria-label": `作业 ${job.run_id}`, "aria-current": focused || undefined, children: [_jsxs("div", { className: "iad-row", children: [_jsx("strong", { role: "status", children: active && job.cancel_requested ? "正在停止" : jobStatuses[job.status] }), _jsx("span", { children: job.model_name }), active && _jsx("button", { disabled: busy || job.cancel_requested, onClick: cancel, children: job.cancel_requested ? "正在停止…" : kind === "audit" ? "取消审计" : "取消挖掘" }), kind === "knowledge" && !active && !job.deleted_at && _jsx(DeleteAction, { title: "\u5220\u9664\u4F5C\u4E1A", name: job.run_id, className: "iad-action-end", description: "\u4ECE\u4F5C\u4E1A\u5217\u8868\u5220\u9664\uFF0C\u4FDD\u7559\u5DF2\u53D1\u5E03\u77E5\u8BC6\u3001\u51BB\u7ED3\u8BC1\u636E\u53CA\u5386\u53F2\u5F15\u7528\u3002", restoreFocus: () => document.querySelector(".iad-knowledge-page .iad-tabs button.active"), onDelete: async () => {
                            await request(`/knowledge/jobs/${encodeURIComponent(job.run_id)}`, undefined, "DELETE");
                            if (focused)
                                workspace.updateView(page, { job: "" });
                            onChanged();
                        } })] }), _jsx("progress", { "aria-label": "\u4F5C\u4E1A\u5904\u7406\u8FDB\u5EA6", value: job.progress, max: 1 }), _jsxs("p", { children: ["\u5B8C\u6210 ", job.completed, " \u00B7 \u5931\u8D25 ", job.failed, " \u00B7 \u672A\u5904\u7406 ", job.unprocessed, " \u00B7 \u5171 ", job.total_samples, " \u5F20"] }), kind === "knowledge" && job.observation_progress && _jsxs("p", { className: "iad-muted", children: ["\u5DF2\u89C2\u5BDF ", job.observation_progress.observed_sources, " / ", job.observation_progress.planned_sources, " \u5F20 \u00B7 \u5B8C\u6574\u89C6\u56FE ", job.observation_progress.complete_sources, " \u5F20 \u00B7 \u5DF2\u53D1\u5E03 ", job.observation_progress.published_sources, " \u5F20"] }), kind === "knowledge" && _jsx(KnowledgeJobEvidence, { job: job }), active && job.cancel_requested ? _jsx("p", { className: "iad-muted", children: "\u7B49\u5F85\u5F53\u524D\u6A21\u578B\u8BF7\u6C42\u8FD4\u56DE\u540E\u505C\u6B62\u3002" }) : _jsx("p", { className: "iad-muted", children: phases[job.phase || ""] || job.message }), job.current_sample && _jsxs("p", { children: ["\u5F53\u524D\u56FE\u50CF ", _jsx("button", { onClick: () => locate(job.current_sample.sample_id), title: job.current_sample.sample_uuid, children: sampleName(job.current_sample) })] }), !!job.planned_regions && _jsxs("p", { className: "iad-muted", children: ["ROI ", job.inspected_regions || 0, " / ", job.planned_regions] }), !!job.total_batches && _jsxs("p", { className: "iad-muted", children: ["\u8054\u5408\u5224\u65AD ", job.completed_batches || 0, " / ", job.total_batches] }), job.normal_version_id && _jsxs("small", { className: "iad-muted", children: ["\u826F\u54C1\u7248\u672C ", job.normal_version_id, _jsx("br", {}), job.defect_version_id && _jsxs(_Fragment, { children: ["\u4E0D\u826F\u7248\u672C ", job.defect_version_id, _jsx("br", {})] })] }), _jsx("small", { className: "iad-muted", children: job.run_id }), job.origin_session_id && _jsx("p", { children: _jsx("button", { disabled: busy, onClick: async () => {
                        setBusy(true);
                        setError("");
                        try {
                            await workspace.openSession(job.origin_session_id);
                        }
                        catch (error) {
                            setError(message(error));
                        }
                        finally {
                            setBusy(false);
                        }
                    }, children: "\u8FD4\u56DE\u53D1\u8D77\u4F1A\u8BDD" }) }), job.parent_run_id && _jsxs("p", { className: "iad-job-links", children: [_jsxs("button", { onClick: () => related(job.parent_run_id), children: ["\u539F\u4F5C\u4E1A ", job.parent_run_id] }), job.root_run_id !== job.parent_run_id && _jsxs("button", { onClick: () => related(job.root_run_id), children: ["\u8D77\u59CB\u4F5C\u4E1A ", job.root_run_id] })] }), job.knowledge_version_id && _jsx("p", { children: _jsx("button", { onClick: () => { workspace.openLocation({ pageId: page, datasetId: job.dataset_id, knowledgeKind: job.kind ?? undefined, version: job.knowledge_version_id, tab: "results" }); }, children: "\u67E5\u770B\u5DF2\u53D1\u5E03\u7248\u672C" }) }), !!job.errors.length && _jsxs("details", { children: [_jsxs("summary", { children: ["\u5931\u8D25\u8BE6\u60C5 \u00B7 ", job.errors.length] }), _jsx("ul", { className: "iad-job-errors", children: job.errors.map((error, index) => _jsxs("li", { children: [_jsx("button", { onClick: () => locate(error.sample_id), title: error.sample_uuid, children: sampleName(error) }), _jsx("p", { className: "iad-error", children: error.message })] }, index)) })] }), !active && !job.deleted_at && job.status !== "COMPLETED" && _jsx("button", { "aria-expanded": expanded, onClick: () => setExpanded(value => !value), children: expanded ? "收起重试范围" : "选择重试范围" }), expanded && _jsxs("section", { className: "iad-retry-scope", "aria-label": "\u91CD\u8BD5\u8303\u56F4", children: [options ? _jsxs(_Fragment, { children: [options.active_run_id && _jsx("p", { role: "status", children: "\u540C\u7C7B\u4F5C\u4E1A\u4ECD\u5728\u6267\u884C\uFF0C\u8BF7\u7ED3\u675F\u540E\u91CD\u65B0\u8BFB\u53D6\u8303\u56F4\u3002" }), !options.samples.length ? _jsx("p", { children: "\u5173\u8054\u4F5C\u4E1A\u5DF2\u5B8C\u6210\u5168\u90E8\u56FE\u50CF\uFF0C\u65E0\u9700\u91CD\u8BD5\u3002" }) : _jsxs(_Fragment, { children: [options.selection_mode === "all_sources" ? _jsx("p", { className: "iad-muted", children: "\u77E5\u8BC6\u8054\u5408\u5F52\u7EB3\u987B\u4F7F\u7528\u6574\u7EC4\u51BB\u7ED3\u6765\u6E90\u3002" }) : _jsxs("div", { className: "iad-row", children: [_jsx("button", { onClick: () => setSelected(options.samples.map(sample => sample.sample_id)), children: "\u5168\u9009" }), _jsx("button", { onClick: () => setSelected(options.samples.filter(sample => sample.state === "failed").map(sample => sample.sample_id)), children: "\u4EC5\u5931\u8D25" }), _jsx("button", { onClick: () => setSelected(options.samples.filter(sample => sample.state === "unprocessed").map(sample => sample.sample_id)), children: "\u4EC5\u672A\u5904\u7406" })] }), _jsxs("fieldset", { disabled: busy || !!options.active_run_id, children: [_jsx("legend", { children: "\u5931\u8D25\u6216\u672A\u5904\u7406\u56FE\u50CF" }), _jsx("div", { className: "iad-retry-samples", children: options.samples.map(sample => _jsxs("label", { title: sample.sample_uuid, children: [_jsx("input", { type: "checkbox", checked: selected.includes(sample.sample_id), disabled: options.selection_mode === "all_sources", onChange: event => setSelected(values => event.target.checked ? [...values, sample.sample_id] : values.filter(id => id !== sample.sample_id)) }), _jsx("span", { children: sampleName(sample) }), _jsx("small", { children: sample.state === "failed" ? "失败" : "未处理" })] }, sample.sample_id)) })] }), _jsx("button", { className: "iad-primary", disabled: busy || !selected.length || !!options.active_run_id, onClick: retry, children: busy ? "启动重试中…" : `重试所选 ${selected.length} 张` })] })] }) : !error && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u53EF\u91CD\u8BD5\u8303\u56F4\u2026" }), _jsx("button", { disabled: busy, onClick: () => setRevision(value => value + 1), children: "\u91CD\u65B0\u8BFB\u53D6\u8303\u56F4" })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error })] });
}
