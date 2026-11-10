import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { ConsistencyView } from '../consistency-view.js';
import { useResource } from '../useResource.js';
import { ConsistencyConflictDialog } from './ConsistencyConflictDialog.js';
import { ConsistencyResultCard } from './ConsistencyResultCard.js';
import { Pagination } from './Pagination.js';
export function ConsistencyImages({ jobId, revision, onReviewed }) {
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState('');
    const result = useResource(`/consistency/checks/${encodeURIComponent(jobId)}/images?page=${page}&page_size=18`, revision);
    const cards = useMemo(() => ConsistencyView.imageCards(jobId, result.data?.items || []), [jobId, result.data]);
    const selected = cards.find(item => item.id === selectedId);
    return _jsxs(_Fragment, { children: [result.loading ? _jsx("p", { className: "iad-result-empty", role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u56FE\u50CF\u2026" }) : result.error ?
                _jsx("p", { className: "iad-error", role: "alert", children: result.error }) : result.data && _jsxs(_Fragment, { children: [_jsx("div", { className: "iad-thumbnail-grid dc-conflict-grid", children: cards.map(item => _jsx(ConsistencyResultCard, { item: item, action: "job-image", onOpen: () => setSelectedId(item.id) }, item.id)) }), _jsx(Pagination, { total: result.data.total, page: page, size: 18, unit: "\u5F20", onPage: setPage })] }), selected && _jsx(ConsistencyConflictDialog, { conflict: selected, items: cards, onSelect: setSelectedId, onClose: () => setSelectedId(''), onReviewed: onReviewed }, `${jobId}:${selected.id}`)] });
}
