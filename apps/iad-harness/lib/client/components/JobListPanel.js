import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SectionHeading } from './layout/SectionHeading.js';
export function JobListPanel({ title, actions, children, className = '', ...props }) {
    return _jsxs("section", { ...props, "aria-label": title, className: `iad-job-list ${className}`, children: [_jsx(SectionHeading, { className: "iad-job-list-header", title: title, children: actions }), children] });
}
