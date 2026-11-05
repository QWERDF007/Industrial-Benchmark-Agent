import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const pageSize = 24;
export const IBA_JOBS_PAGE_SIZE = 8;
export function Pagination({ total, page, unit = '条', onPage, size = pageSize, label = '', id, availablePages }) {
    if (!total)
        return null;
    const pages = Math.max(1, Math.ceil(total / size));
    const current = Math.max(1, Math.min(page, pages));
    const start = Math.max(1, Math.min(current - 2, pages - 4));
    return _jsxs("nav", { id: id, className: "iad-pagination", "aria-label": `${label}分页`, children: [_jsx("button", { type: "button", disabled: current <= 1, onClick: () => onPage(current - 1), children: "\u4E0A\u4E00\u9875" }), Array.from({ length: Math.min(pages, 5) }, (_, index) => start + index).map(number => _jsx("button", { type: "button", "aria-label": `第 ${number} 页`, "aria-current": number === current ? 'page' : undefined, "data-page": number, disabled: availablePages !== undefined && number > availablePages, onClick: () => onPage(number), children: number }, number)), _jsx("button", { type: "button", disabled: current >= pages || availablePages !== undefined && current >= availablePages, onClick: () => onPage(current + 1), children: "\u4E0B\u4E00\u9875" }), _jsxs("span", { children: [current, " / ", pages, " \u9875"] }), _jsxs("span", { children: ["\u5171 ", total, " ", unit] })] });
}
