import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useResource } from '../useResource.js';
import { nativeAuditEvidenceUrl } from '../api.js';
import { analysisImageUrl } from '../analysis-results.js';
import { Button } from './Button.js';
import { AuditReportContent } from './AuditReportContent.js';
export function AuditReport({ job, revision }) {
    const terminal = !!job && !['PENDING', 'RUNNING'].includes(job.status);
    const resource = useResource(terminal ? `/audit/jobs/${encodeURIComponent(job.run_id)}/report` : null, revision);
    const report = resource.data;
    const knowledgeImages = new Set(Object.entries(report?.evidence_groups || {}).filter(([key]) => key.startsWith('knowledge-source:'))
        .flatMap(([, images]) => images.map(item => item.image.evidence_id)));
    return _jsxs("section", { className: "audit-panel iad-dataset-report", id: "audit-report", "data-run-id": job?.run_id, children: [_jsxs("header", { className: "audit-panel-head", children: [!report && _jsx("h2", { children: "\u6A21\u578B\u5BA1\u8BA1\u62A5\u544A" }), _jsx("div", { className: "iad-actions", children: _jsx(Button, { disabled: !report?.export_ready, onClick: () => window.location.assign(`/api/iad/audit/jobs/${encodeURIComponent(job.run_id)}/export`), children: "\u5BFC\u51FA HTML" }) })] }), _jsxs("div", { className: "iad-report-body", children: [!job && _jsx("p", { className: "iad-result-empty", children: "\u5F53\u524D\u6CA1\u6709\u5BA1\u8BA1\u4F5C\u4E1A" }), job && !terminal && _jsx("p", { role: "status", children: "\u5BA1\u8BA1\u5B8C\u6210\u540E\u751F\u6210\u672C\u4F5C\u4E1A\u62A5\u544A\u3002" }), resource.loading && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u672C\u4F5C\u4E1A\u62A5\u544A\u2026" }), resource.error && _jsx("p", { role: "alert", children: resource.error }), report?.statistics && report.report_state !== 'COMPLETED' && _jsx("p", { role: "status", children: "\u6574\u4F53\u62A5\u544A\u672A\u5B8C\u6210" }), report?.archived && _jsx("p", { children: "\u5386\u53F2\u5BA1\u8BA1\u5DF2\u5F52\u6863\uFF0C\u53EF\u4E0B\u8F7D\u51BB\u7ED3\u62A5\u544A\u3002" }), report && !report.archived && _jsx(AuditReportContent, { report: report, imageUrl: item => report.knowledge_version_id && knowledgeImages.has(item.image.evidence_id)
                            ? analysisImageUrl({ kind: 'published', versionId: report.knowledge_version_id }, item.image.evidence_id)
                            : nativeAuditEvidenceUrl(report.run_id, item.sample_id, item.image) })] })] });
}
