import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { auditIssueLabels } from '../../shared/audit.generated.js';
import { jobIsActive } from '../../shared/job-display.js';
import { useResource } from '../useResource.js';
import { Modal } from './Modal.js';
export function AuditStatisticsDialog({ job, revision, onClose }) {
    const result = useResource(`/audit/jobs/${encodeURIComponent(job.run_id)}/statistics`, `${revision}:${job.status}`, jobIsActive(job));
    const data = result.data;
    return _jsxs(Modal, { title: "\u6A21\u578B\u5BA1\u8BA1\u7EDF\u8BA1", size: "form", onClose: onClose, children: [result.error && _jsx("p", { role: "alert", children: result.error }), result.loading && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u7EDF\u8BA1\u2026" }), data && _jsxs("div", { className: "iad-audit-statistics", children: [_jsx("dl", { children: [['全部图像', data.total_images], ['已处理', data.completed_images], ['正常', data.normal_images], ['疑似问题', data.suspect_images], ['未完成', data.incomplete_images]].map(([label, count]) => _jsxs("div", { children: [_jsx("dt", { children: label }), _jsx("dd", { children: count })] }, label)) }), _jsx("h3", { children: "\u95EE\u9898\u7C7B\u578B\u5206\u5E03" }), Object.keys(data.issue_types).length ? _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u95EE\u9898\u7C7B\u578B" }), _jsx("th", { children: "\u56FE\u50CF\u6570" }), _jsx("th", { children: "\u95EE\u9898\u6570" })] }) }), _jsx("tbody", { children: Object.entries(data.issue_types).map(([kind, count]) => _jsxs("tr", { children: [_jsx("td", { children: auditIssueLabels[kind] || kind }), _jsx("td", { children: count.image_count }), _jsx("td", { children: count.occurrences })] }, kind)) })] }) : _jsx("p", { children: "\u6682\u65E0\u7591\u4F3C\u95EE\u9898" })] })] });
}
