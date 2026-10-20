import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { AuditEvidence } from "./AuditEvidence.js";
const priorities = { high: "优先复核", medium: "随后复核", low: "补充核对" };
export function AuditFindings({ analysis, onLocate, onEvidence }) {
    const [expanded, setExpanded] = useState(false);
    if (!analysis.findings.length)
        return null;
    const visible = expanded ? analysis.findings : analysis.findings.slice(0, 3);
    return _jsxs("section", { className: "iad-findings", "aria-label": "\u4F18\u5148\u590D\u6838\u7591\u70B9", children: [_jsxs("h3", { children: ["\u91CD\u70B9\u7591\u70B9 \u00B7 ", analysis.findings.length] }), _jsx("ol", { children: visible.map(finding => _jsxs("li", { "data-finding-id": finding.finding_id, children: [_jsx("p", { children: priorities[finding.priority] }), _jsxs("button", { onClick: () => onLocate(finding), title: "\u5728\u5168\u56FE\u5B9A\u4F4D", children: [finding.location.description, " \u00B7 ", finding.description] }), _jsx("p", { children: finding.review_action }), _jsxs("details", { className: "iad-analysis", children: [_jsx("summary", { children: "\u4F9D\u636E\u4E0E\u6B63\u5E38\u89E3\u91CA" }), _jsx(FindingExplanation, { finding: finding }), _jsx(AuditEvidence, { analysis: analysis, ids: finding.evidence_ids, label: finding.description, onEvidence: image => onEvidence(image, finding) })] })] }, finding.finding_id)) }), analysis.findings.length > 3 && _jsx("button", { "aria-expanded": expanded, onClick: () => setExpanded(value => !value), children: expanded ? "收起其他疑点" : `查看其余 ${analysis.findings.length - 3} 项` })] });
}
export function FindingExplanation({ finding }) {
    return _jsxs(_Fragment, { children: [_jsxs("p", { children: ["\u5F02\u5E38\u5047\u8BBE\uFF1A", finding.hypothesis] }), _jsxs("p", { children: ["\u6B63\u5E38\u89E3\u91CA\uFF1A", finding.normal_explanation] }), !!finding.limitations.length && _jsx("p", { className: "iad-muted", children: finding.limitations.join("；") })] });
}
