import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Standard V51 Clear Filter SVG Icon (funnel with cross)
 */
export function ClearFilterIcon() {
    return (_jsxs("svg", { "aria-hidden": "true", viewBox: "0 0 24 24", children: [_jsx("path", { d: "M4 5h16l-6.5 7.5v4.3l-3.5 2v-6.3L4 5Z" }), _jsx("path", { d: "m17 17 4 4m0-4-4 4" })] }));
}
/**
 * Standard V51 Refresh SVG Icon (circular reload arrows)
 */
export function RefreshActionIcon() {
    return (_jsxs("svg", { "aria-hidden": "true", viewBox: "0 0 24 24", children: [_jsx("path", { d: "M20 11a8 8 0 0 0-14.9-3.7L3 10" }), _jsx("path", { d: "M3 4v6h6" }), _jsx("path", { d: "M4 13a8 8 0 0 0 14.9 3.7L21 14" }), _jsx("path", { d: "M21 20v-6h-6" })] }));
}
/**
 * Reusable Clear Filter Icon Button (38x38px)
 * Aligns with V51 specifications across Images, Exploration, Knowledge, Consistency, and DatasetManager.
 */
export function ClearFilterButton({ id, disabled = false, onClick, title = "清除筛选条件", ariaLabel = "清除筛选条件", className = "", ...restDataAttrs }) {
    return (_jsx("button", { type: "button", id: id, className: `iba-filter-clear ${className}`.trim(), "aria-label": ariaLabel, title: title, disabled: disabled, onClick: onClick, ...restDataAttrs, children: _jsx(ClearFilterIcon, {}) }));
}
/**
 * Reusable Refresh Icon Button (38x38px)
 * Replaces ad-hoc unicode arrow symbols with standard SVG geometry.
 */
export function RefreshIconButton({ id, disabled = false, onClick, title = "刷新当前页面", ariaLabel = "刷新当前页面", className = "", ...restDataAttrs }) {
    return (_jsx("button", { type: "button", id: id, className: `iba-refresh-icon ${className}`.trim(), "aria-label": ariaLabel, title: title, disabled: disabled, onClick: onClick, ...restDataAttrs, children: _jsx(RefreshActionIcon, {}) }));
}
