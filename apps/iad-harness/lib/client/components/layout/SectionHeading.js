import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SectionHeading({ title, titleId, children, className = '' }) {
    return _jsxs("header", { className: `iad-section-heading ${className}`, children: [_jsx("h2", { id: titleId, className: "iad-section-title", children: title }), children && _jsx("div", { className: "iad-section-actions", children: children })] });
}
