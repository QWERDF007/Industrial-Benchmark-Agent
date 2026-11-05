import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Select } from './Select.js';
import { Button } from './Button.js';
import { IconButton } from "./IconButton.js";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { jobPhases, jobStatuses } from "../../shared/job-display.js";
import { useWorkspace } from "../workspace.js";
import { JobDetail } from "./JobDetail.js";
import { Pagination } from "./Pagination.js";
import { Modal } from "./Modal.js";
const types = {
    DATASET_REPORT: '数据集报告', ANALYSIS_WORKFLOW: "全量分析",
    MODEL_AUDIT: "模型审计",
    MODEL_AUDIT_SAMPLE: "图像审计",
    KNOWLEDGE: "知识挖掘", NORMAL_KNOWLEDGE: "良品知识",
    DEFECT_KNOWLEDGE: "异常知识",
    KNOWLEDGE_BATCH: "分批知识挖掘",
    DIRECTION_EXPLORATION: "方向探索",
    EXPLORATION_BATCH: "分批方向探索",
    IMAGE_INDEX: "图像索引",
    DATA_CONSISTENCY: "数据一致性",
    CONSISTENCY_ANALYSIS: "图组模型分析",
    CONSISTENCY_MODEL_BATCH: "一致性模型批次",
};
export function JobTable({ jobs, pageId, onChanged, stale = false, lastSyncedAt, onCopy, }) {
    const { workspace } = useWorkspace(), selected = workspace.view(pageId).job;
    const [page, setPage] = useState(1), [status, setStatus] = useState("");
    const [search, setSearch] = useState(""), [drawerOpen, setDrawerOpen] = useState(false);
    const [promptJob, setPromptJob] = useState(null);
    const promptTriggerRef = useRef(null);
    const rows = useRef(new Map()), filter = useRef(null);
    const exploration = pageId === "industrial-exploration";
    const knowledge = pageId === "industrial-knowledge";
    useEffect(() => {
        if (!promptJob)
            return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                setPromptJob(null);
                promptTriggerRef.current?.focus();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [promptJob]);
    const filtered = jobs.filter((job) => (!status || job.status === status) && (!knowledge || `${job.run_id} ${job.model_name}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())));
    const index = filtered.findIndex((job) => job.run_id === selected);
    useEffect(() => {
        if (index >= 0)
            setPage(Math.floor(index / 10) + 1);
    }, [selected, index]);
    const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10))), visible = filtered.slice((current - 1) * 10, current * 10);
    const job = jobs.find((job) => job.run_id === selected) || (!knowledge ? visible[0] : undefined);
    function open(item) { workspace.updateView(pageId, { job: item.run_id }); setDrawerOpen(true); }
    return (_jsxs("div", { className: `iad-job-table ${knowledge ? "iad-knowledge-job-table" : exploration && job ? "iad-exploration-jobs-layout" : ""}`, children: [_jsxs("label", { className: "iad-field iad-job-filter", children: ["\u4EFB\u52A1\u72B6\u6001", _jsxs(Select, { ref: filter, "aria-label": "\u4EFB\u52A1\u72B6\u6001", value: status, onChange: (event) => {
                            setStatus(event.target.value);
                            setPage(1);
                        }, children: [_jsx("option", { value: "", children: "\u5168\u90E8\u72B6\u6001" }), Object.entries(jobStatuses).map(([value, label]) => (_jsx("option", { value: value, children: label }, value)))] })] }), knowledge && _jsxs("label", { className: "iad-field iad-job-search", children: ["\u641C\u7D22\u4EFB\u52A1", _jsx("input", { type: "search", "aria-label": "\u641C\u7D22\u4EFB\u52A1", placeholder: "\u4EFB\u52A1 ID / \u6A21\u578B\u540D\u79F0", value: search, onChange: event => { setSearch(event.target.value); setPage(1); } })] }), _jsxs("div", { children: [_jsx("div", { className: "iad-table-scroll", children: _jsxs("table", { className: "iad-resource-table", "aria-label": "\u4F5C\u4E1A\u5217\u8868", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u4EFB\u52A1" }), !exploration && _jsx("th", { children: "\u7C7B\u578B" }), _jsxs("th", { children: ["\u72B6\u6001", exploration && " / 当前阶段"] }), exploration ? (_jsx("th", { children: "\u8F93\u5165\u56FE\u7EC4" })) : (_jsxs(_Fragment, { children: [_jsx("th", { className: "iad-number", children: "\u5B8C\u6210 / \u603B\u6570" }), _jsx("th", { className: "iad-number", children: "\u5931\u8D25" })] })), _jsx("th", { className: "iad-job-time", children: exploration ? "提交时间" : "开始时间" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: visible.map((item) => (_jsxs("tr", { "data-selected": job?.run_id === item.run_id, ref: row => { if (row)
                                            rows.current.set(item.run_id, row);
                                        else
                                            rows.current.delete(item.run_id); }, tabIndex: knowledge ? 0 : undefined, "aria-selected": knowledge ? selected === item.run_id : undefined, "aria-haspopup": knowledge ? "dialog" : undefined, onClick: knowledge ? () => open(item) : undefined, onKeyDown: knowledge ? event => { if (event.key === "Enter" || event.key === " ")
                                            event.preventDefault(); } : undefined, onKeyUp: knowledge ? event => { if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            open(item);
                                        } } : undefined, children: [_jsx("td", { title: item.run_id, children: _jsx("span", { className: "iad-identifier", children: item.run_id }) }), !exploration && _jsx("td", { children: types[item.job_type] }), _jsxs("td", { children: [item.cancel_requested &&
                                                        (item.status === "RUNNING" || item.status === "PENDING")
                                                        ? "正在停止"
                                                        : jobStatuses[item.status], exploration && (_jsx("small", { className: "iad-job-stage", children: item.status === "PENDING"
                                                            ? `排队第 ${item.queue_position} 项`
                                                            : jobPhases[item.phase || ""] || item.message }))] }), exploration ? (_jsxs("td", { children: ["\u826F\u54C1", " ", item.exploration_request?.normal_images.length ?? "—", _jsx("br", {}), "\u5F02\u5E38", " ", item.exploration_request?.defect_images.length ?? "—"] })) : (_jsxs(_Fragment, { children: [_jsxs("td", { className: "iad-number", children: [item.completed, " / ", item.total_samples] }), _jsx("td", { className: "iad-number", children: item.failed })] })), _jsx("td", { className: "iad-job-time", children: _jsx("time", { dateTime: (exploration ? item.submitted_at : item.started_at) ||
                                                        undefined, children: (exploration ? item.submitted_at : item.started_at)
                                                        ? new Date((exploration
                                                            ? item.submitted_at
                                                            : item.started_at)).toLocaleString()
                                                        : "未提供" }) }), _jsx("td", { children: knowledge ? (_jsx("div", { className: "iad-job-actions", children: _jsx(IconButton, { icon: "prompt", type: "button", title: "\u67E5\u770B\u63D0\u793A\u8BCD", label: "\u67E5\u770B\u63D0\u793A\u8BCD", "data-job-prompt": item.run_id, onClick: (e) => {
                                                            e.stopPropagation();
                                                            promptTriggerRef.current = e.currentTarget;
                                                            setPromptJob(item);
                                                        } }) })) : (_jsx("button", { "aria-label": `查看作业 ${item.run_id}`, onClick: () => workspace.updateView(pageId, { job: item.run_id }), children: "\u8BE6\u60C5" })) })] }, item.run_id))) })] }) }), !exploration || filtered.length > 10 ? (_jsx(Pagination, { total: filtered.length, page: current, size: 10, unit: "\u4E2A\u4F5C\u4E1A", onPage: setPage })) : (_jsxs("p", { className: "iad-muted", children: [filtered.length, " \u4E2A\u4F5C\u4E1A\uFF08\u6700\u8FD1 30 \u9879\u53CA\u8FD0\u884C\u9879\uFF09"] })), !filtered.length && _jsx("p", { role: "status", children: "\u6CA1\u6709\u5339\u914D\u7684\u4F5C\u4E1A\u3002" })] }), job && !knowledge && (_jsxs("section", { "aria-label": "\u4F5C\u4E1A\u8BE6\u60C5", children: [_jsx("h3", { children: "\u4F5C\u4E1A\u8BE6\u60C5" }), _jsx(JobDetail, { job: job, onChanged: onChanged, stale: stale, lastSyncedAt: lastSyncedAt, onCopy: onCopy }, job.run_id)] })), knowledge && drawerOpen && job && _jsx(Modal, { title: "\u4F5C\u4E1A\u8BE6\u60C5", className: "iad-drawer iad-knowledge-job-drawer", onClose: () => setDrawerOpen(false), restoreFocus: () => rows.current.get(selected) || filter.current, children: _jsx(JobDetail, { job: job, onChanged: onChanged, stale: stale, lastSyncedAt: lastSyncedAt, onClose: () => setDrawerOpen(false), presentation: "drawer" }, job.run_id) }), typeof document !== "undefined" && promptJob && createPortal(_jsx("div", { className: "overlay knowledge-prompt-overlay", id: "job-prompt-overlay", role: "presentation", onClick: () => {
                    setPromptJob(null);
                    promptTriggerRef.current?.focus();
                }, children: _jsxs("aside", { className: "knowledge-prompt-drawer", role: "dialog", "aria-modal": "true", "aria-labelledby": "job-prompt-title", tabIndex: -1, onClick: (e) => e.stopPropagation(), children: [_jsxs("header", { className: "knowledge-prompt-drawer-head", children: [_jsx("h2", { id: "job-prompt-title", children: "\u67E5\u770B\u63D0\u793A\u8BCD" }), _jsxs("div", { className: "knowledge-prompt-drawer-actions", children: [_jsx(Button, { type: "button", id: "copy-job-prompt", onClick: async () => {
                                                const text = promptJob.mining_prompt?.instruction || promptJob.instruction || "该历史作业未记录冻结提示词。";
                                                try {
                                                    await navigator.clipboard.writeText(text);
                                                }
                                                catch (_) { }
                                            }, children: "\u590D\u5236\u63D0\u793A\u8BCD" }), _jsx(IconButton, { icon: "close", type: "button", className: "knowledge-prompt-drawer-close", id: "close-job-prompt", label: "\u5173\u95ED\u63D0\u793A\u8BCD\u62BD\u5C49", title: "\u5173\u95ED", onClick: () => {
                                                setPromptJob(null);
                                                promptTriggerRef.current?.focus();
                                            } })] })] }), _jsx("div", { className: "knowledge-prompt-drawer-content", id: "job-prompt-body", children: _jsx("pre", { id: "job-prompt-content", className: "knowledge-prompt-readonly", children: promptJob.mining_prompt?.instruction || promptJob.instruction || "该历史作业未记录冻结提示词。" }) })] }) }), document.body)] }));
}
