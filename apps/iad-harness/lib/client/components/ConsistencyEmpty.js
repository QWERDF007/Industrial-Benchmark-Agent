import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ConsistencyEmpty({ title, description, children }) {
    return _jsxs("div", { className: "iad-consistency-empty", role: "status", children: [_jsxs("svg", { "aria-hidden": "true", width: "36", height: "36", viewBox: "0 0 36 36", fill: "none", stroke: "currentColor", strokeWidth: "1.5", children: [_jsx("rect", { x: "5", y: "6", width: "26", height: "24", rx: "3" }), _jsx("path", { d: "m9 24 7-7 5 5 4-4 6 6" }), _jsx("circle", { cx: "24", cy: "13", r: "2" })] }), _jsx("h2", { children: title }), _jsx("p", { children: description }), children && _jsx("div", { className: "iad-row", children: children })] });
}
