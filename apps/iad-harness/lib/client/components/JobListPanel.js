import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function JobListPanel({ title, actions, children, className = '', ...props }) {
    return _jsxs("section", { ...props, "aria-label": title, className: `iad-job-list ${className}`, children: [_jsxs("header", { className: "iad-job-list-header", children: [_jsx("h2", { children: title }), actions] }), children] });
}
