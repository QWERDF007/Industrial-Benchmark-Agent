import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AuditEvidence } from "./AuditEvidence.js";
const statuses = { normal: "未见异常", anomaly: "发现偏离", insufficient: "证据不足", not_applicable: "不适用" };
export function RuleAssessments({ analysis, knowledge, onEvidence }) {
    const checks = new Map(knowledge.flatMap(snapshot => snapshot.checks.map(check => [check.check_id, check])));
    if (!analysis.check_assessments.length)
        return null;
    return _jsxs("details", { className: "iad-rule-assessments iad-analysis", children: [_jsxs("summary", { children: ["\u68C0\u67E5\u9879 \u00B7 ", analysis.check_assessments.length] }), _jsx("ol", { children: analysis.check_assessments.map(assessment => _jsxs("li", { "data-check-id": assessment.check_id, children: [_jsx("strong", { children: checks.get(assessment.check_id)?.title || assessment.check_id }), " \u00B7 ", statuses[assessment.status], _jsx("p", { children: assessment.description }), !!assessment.limitations.length && _jsx("p", { className: "iad-muted", children: assessment.limitations.join("；") }), _jsx(AuditEvidence, { analysis: analysis, ids: assessment.evidence_ids, label: checks.get(assessment.check_id)?.title || "检查项", onEvidence: onEvidence })] }, assessment.check_id)) })] });
}
