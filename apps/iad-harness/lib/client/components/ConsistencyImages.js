import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { ConsistencyView } from '../consistency-view.js';
import { ConsistencyConflictDialog } from './ConsistencyConflictDialog.js';
import { ConsistencyResultCard } from './ConsistencyResultCard.js';
import { Pagination } from './Pagination.js';
export function ConsistencyImages({ jobId, images, filters, group, onReviewed }) {
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState('');
    useEffect(() => { setPage(1); setSelectedId(''); }, [group, filters.search, filters.model, filters.agreement, filters.review]);
    const cards = useMemo(() => ConsistencyView.filter(images.items, filters, group === 'images' ? undefined : group), [images.items, group, filters.search, filters.model, filters.agreement, filters.review]);
    const currentPage = Math.min(page, Math.max(1, Math.ceil(cards.length / 18)));
    const selected = cards.find(item => item.id === selectedId);
    return _jsxs(_Fragment, { children: [images.pending ? _jsx("p", { className: "iad-result-empty", role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u56FE\u50CF\u2026" }) : images.error ?
                _jsx("p", { className: "iad-error", role: "alert", children: images.error }) : _jsxs(_Fragment, { children: [_jsx("div", { className: "iad-thumbnail-grid dc-conflict-grid", children: cards.slice((currentPage - 1) * 18, currentPage * 18).map(item => _jsx(ConsistencyResultCard, { item: item, action: "job-image", onOpen: () => setSelectedId(item.id) }, item.id)) }), _jsx(Pagination, { total: cards.length, page: currentPage, size: 18, unit: "\u5F20", onPage: setPage })] }), selected && _jsx(ConsistencyConflictDialog, { conflict: selected, items: cards, onSelect: setSelectedId, onClose: () => setSelectedId(''), onReviewed: onReviewed }, `${jobId}:${selected.id}`)] });
}
