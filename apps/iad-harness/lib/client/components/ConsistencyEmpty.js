import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ConsistencyEmpty({ message, children }) {
    return _jsxs("div", { className: "iad-consistency-empty", role: "status", children: [_jsx("p", { children: message }), children && _jsx("div", { className: "iad-row", children: children })] });
}
