import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAuditReportSections } from '../audit-report.js';
export function AuditReportSection({ section, children }) {
    const heading = useAuditReportSections()[section];
    if (!heading)
        return null;
    return _jsxs("section", { className: "iad-report-section", "data-report-section": section, children: [_jsx("h2", { children: heading.title }), children] });
}
