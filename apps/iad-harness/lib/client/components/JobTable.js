import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { jobStatuses } from "../../shared/job-display.js";
import { useWorkspace } from "../workspace.js";
import { JobDetail } from "./JobDetail.js";
import { Pagination } from "./Pagination.js";
const types = { MODEL_AUDIT: "模型审计", NORMAL_KNOWLEDGE: "良品知识", DEFECT_KNOWLEDGE: "异常知识", DIRECTION_EXPLORATION: "方向探索" };
export function JobTable({ jobs, pageId, onChanged }) {
    const { workspace } = useWorkspace(), selected = workspace.view(pageId).job;
    const [page, setPage] = useState(1), [status, setStatus] = useState("");
    const filtered = jobs.filter(job => !status || job.status === status);
    const index = filtered.findIndex(job => job.run_id === selected);
    useEffect(() => {
        if (index >= 0)
            setPage(Math.floor(index / 10) + 1);
    }, [selected, index]);
    const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10))), visible = filtered.slice((current - 1) * 10, current * 10);
    const job = jobs.find(job => job.run_id === selected) || visible[0];
    return _jsxs("div", { className: "iad-job-table", children: [_jsxs("label", { className: "iad-field", children: ["\u4EFB\u52A1\u72B6\u6001", _jsxs("select", { "aria-label": "\u4EFB\u52A1\u72B6\u6001", value: status, onChange: event => { setStatus(event.target.value); setPage(1); }, children: [_jsx("option", { value: "", children: "\u5168\u90E8\u72B6\u6001" }), Object.entries(jobStatuses).map(([value, label]) => _jsx("option", { value: value, children: label }, value))] })] }), _jsx("div", { className: "iad-table-scroll", children: _jsxs("table", { className: "iad-resource-table", "aria-label": "\u4F5C\u4E1A\u5217\u8868", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u4EFB\u52A1" }), _jsx("th", { children: "\u7C7B\u578B" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { className: "iad-number", children: "\u5B8C\u6210 / \u603B\u6570" }), _jsx("th", { className: "iad-number", children: "\u5931\u8D25" }), _jsx("th", { children: "\u5F00\u59CB\u65F6\u95F4" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: visible.map(item => _jsxs("tr", { "data-selected": job?.run_id === item.run_id, children: [_jsx("td", { title: item.run_id, children: _jsx("span", { className: "iad-identifier", children: item.run_id }) }), _jsx("td", { children: types[item.job_type] }), _jsx("td", { children: item.cancel_requested && (item.status === "RUNNING" || item.status === "PENDING") ? "正在停止" : jobStatuses[item.status] }), _jsxs("td", { className: "iad-number", children: [item.completed, " / ", item.total_samples] }), _jsx("td", { className: "iad-number", children: item.failed }), _jsx("td", { children: _jsx("time", { dateTime: item.started_at || undefined, children: item.started_at ? new Date(item.started_at).toLocaleString() : "未提供" }) }), _jsx("td", { children: _jsx("button", { "aria-label": `查看作业 ${item.run_id}`, onClick: () => workspace.updateView(pageId, { job: item.run_id }), children: "\u8BE6\u60C5" }) })] }, item.run_id)) })] }) }), _jsx(Pagination, { total: filtered.length, page: current, size: 10, unit: "\u4E2A\u4F5C\u4E1A", onPage: setPage }), !filtered.length && _jsx("p", { role: "status", children: "\u6CA1\u6709\u5339\u914D\u7684\u4F5C\u4E1A\u3002" }), job && _jsxs("section", { "aria-label": "\u4F5C\u4E1A\u8BE6\u60C5", children: [_jsx("h3", { children: "\u4F5C\u4E1A\u8BE6\u60C5" }), _jsx(JobDetail, { job: job, onChanged: onChanged }, job.run_id)] })] });
}
