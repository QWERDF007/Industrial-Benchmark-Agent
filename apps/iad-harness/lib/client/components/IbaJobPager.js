import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const IBA_JOBS_PAGE_SIZE = 8;
export function IbaJobPager({ total, page, onPage, label, pageSize = IBA_JOBS_PAGE_SIZE, dataActionAttr, dataActionName }) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (pages <= 1)
        return null;
    const nums = [];
    for (let p = 1; p <= pages; p++) {
        if (p === 1 || p === pages || Math.abs(p - page) <= 1) {
            nums.push(p);
        }
    }
    const items = [];
    let last = 0;
    for (const p of nums) {
        if (last && p - last > 1) {
            items.push({ type: 'ellipsis', key: `ellipsis-${last}-${p}` });
        }
        items.push({ type: 'page', p });
        last = p;
    }
    const makeCustomAttrs = (p) => {
        if (!dataActionAttr || !dataActionName)
            return { 'data-id': p };
        return {
            [dataActionAttr]: dataActionName,
            'data-id': p
        };
    };
    const prevPage = Math.max(1, page - 1);
    const nextPage = Math.min(pages, page + 1);
    return (_jsxs("nav", { className: "iba-job-pager", "aria-label": `${label}分页`, children: [_jsx("button", { type: "button", ...makeCustomAttrs(prevPage), disabled: page <= 1, "aria-label": page <= 1 ? '上一页' : `转到第 ${prevPage} 页`, onClick: () => onPage(prevPage), children: "\u4E0A\u4E00\u9875" }), items.map(item => item.type === 'ellipsis' ? (_jsx("span", { className: "iba-job-ellipsis", "aria-hidden": "true", children: "\u2026" }, item.key)) : (_jsx("button", { type: "button", ...makeCustomAttrs(item.p), "aria-current": item.p === page ? 'page' : undefined, "aria-label": item.p === page ? `当前第 ${item.p} 页` : `转到第 ${item.p} 页`, onClick: () => onPage(item.p), children: item.p }, item.p))), _jsx("button", { type: "button", ...makeCustomAttrs(nextPage), disabled: page >= pages, "aria-label": page >= pages ? '下一页' : `转到第 ${nextPage} 页`, onClick: () => onPage(nextPage), children: "\u4E0B\u4E00\u9875" }), _jsxs("span", { className: "iba-job-total", children: ["\u7B2C ", page, " / ", pages, " \u9875 \u00B7 \u5171 ", total, " \u6761"] })] }));
}
