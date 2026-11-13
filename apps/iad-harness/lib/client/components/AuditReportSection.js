import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { auditReportSections } from '../audit-report.js';
export function AuditReportSection({ section, children }) {
    return _jsxs("section", { className: "iad-report-section", "data-report-section": section, children: [_jsx("h2", { children: auditReportSections[section].title }), children] });
}
