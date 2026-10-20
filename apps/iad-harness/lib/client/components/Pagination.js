import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const pageSize = 24;
export function Pagination({ total, page, unit, onPage }) {
    return _jsxs("div", { className: "iad-pagination", children: [_jsxs("span", { children: [total, " ", unit] }), _jsx("button", { disabled: page <= 1, onClick: () => onPage(page - 1), children: "\u4E0A\u4E00\u9875" }), _jsxs("span", { children: [page, " / ", Math.max(1, Math.ceil(total / pageSize))] }), _jsx("button", { disabled: page * pageSize >= total, onClick: () => onPage(page + 1), children: "\u4E0B\u4E00\u9875" })] });
}
