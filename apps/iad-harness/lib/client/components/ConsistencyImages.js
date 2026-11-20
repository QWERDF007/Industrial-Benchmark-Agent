import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { ConsistencyConflictDialog } from './ConsistencyConflictDialog.js';
import { ConsistencyResultCard } from './ConsistencyResultCard.js';
import { Pagination } from './Pagination.js';
export function ConsistencyImages({ jobId, images, filters, group, onReviewed, page, onPage }) {
    const [selected, setSelected] = useState(null);
    const pendingMove = useRef(null);
    useEffect(() => {
        if (!images.pending && page > Math.max(1, Math.ceil(images.total / 18)))
            onPage(Math.max(1, Math.ceil(images.total / 18)));
    }, [images.pending, images.total, page, onPage]);
    useEffect(() => { setSelected(null); pendingMove.current = null; }, [group, filters.search, filters.model, filters.agreement, filters.review]);
    useEffect(() => {
        if (!images.pending && pendingMove.current) {
            if (!images.error)
                setSelected(pendingMove.current === 1 ? images.items[0] || null : images.items.at(-1) || null);
            pendingMove.current = null;
        }
    }, [images.items, images.pending, images.error]);
    function move(offset) {
        if (!selected || images.pending)
            return;
        const index = images.items.findIndex(item => item.id === selected.id) + offset;
        const next = images.items[index];
        if (next)
            setSelected(next);
        else if ((offset === -1 && page > 1) || (offset === 1 && page * 18 < images.total)) {
            pendingMove.current = offset;
            onPage(page + offset);
        }
    }
    const action = group === 'images' || ['NO_CANDIDATES', 'NO_ELIGIBLE_CANDIDATES', 'PROGRAM_CONSISTENT'].includes(group) ? 'job-image' : 'open-conflict';
    return _jsxs(_Fragment, { children: [images.error ? _jsx("p", { className: "iad-error", role: "alert", children: images.error }) : !images.items.length && images.pending ?
                _jsx("p", { className: "iad-result-empty", role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u56FE\u50CF\u2026" }) : _jsxs(_Fragment, { children: [_jsx("div", { className: "iad-thumbnail-grid dc-conflict-grid", "data-job-id": jobId, "aria-busy": images.pending, children: images.items.map(item => _jsx(ConsistencyResultCard, { item: item, action: action, onOpen: () => { if (!images.pending)
                                setSelected(item); } }, item.id)) }), !images.items.length && _jsx("p", { className: "iad-result-empty", children: "\u5F53\u524D\u7B5B\u9009\u6761\u4EF6\u4E0B\u6CA1\u6709\u5339\u914D\u7684\u56FE\u50CF\u3002" }), _jsx(Pagination, { total: images.total, page: page, size: 18, unit: "\u5F20", onPage: onPage })] }), selected && _jsx(ConsistencyConflictDialog, { conflict: selected, items: images.items, navigation: { previous: !!selected && (images.items.findIndex(item => item.id === selected.id) > 0 || page > 1),
                    next: !!selected && (images.items.findIndex(item => item.id === selected.id) < images.items.length - 1 || page * 18 < images.total),
                    busy: images.pending, error: images.error || '', move }, onSelect: id => setSelected(images.items.find(item => item.id === id) || null), onMove: move, onClose: () => { pendingMove.current = null; setSelected(null); }, onReviewed: onReviewed }, jobId)] });
}
