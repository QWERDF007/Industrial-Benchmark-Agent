import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect, useRef, useState } from 'react';
import { PageTabs } from './layout/PageTabs.js';
import { ThumbnailCard } from './ThumbnailCard.js';
import { Pagination } from './Pagination.js';
import { datasetImageAnnotations } from '../dataset-image-annotations.js';
export function auditEvidenceImage(item, src) {
    return { src, title: item.source.sample.relative_path, width: item.image.original_size[0], height: item.image.original_size[1],
        sampleId: item.sample_id, evidence: item.image, ...datasetImageAnnotations(item.source.dataset_format, item.source.sample, item.source.annotations) };
}
export function AuditEvidenceGallery({ items, imageUrl, onOpen }) {
    const [role, setRole] = useState('representative');
    const [page, setPage] = useState(1), [size, setSize] = useState(8);
    const grid = useRef(null);
    useLayoutEffect(() => {
        const observer = new ResizeObserver(() => {
            const element = grid.current;
            if (!element.getBoundingClientRect().width)
                return;
            const next = Math.max(1, getComputedStyle(element).gridTemplateColumns.split(' ').length) * 2;
            if (size !== next) {
                setSize(next);
                setPage(1);
            }
        });
        observer.observe(grid.current);
        return () => observer.disconnect();
    }, [size]);
    const selected = items.filter(item => item.role === role);
    return _jsx(PageTabs, { label: "\u5BA1\u8BA1\u56FE\u50CF\u8BC1\u636E", items: [{ id: 'representative', label: '典型证据' }, { id: 'counter', label: '对照证据' }], value: role, onChange: next => { setRole(next); setPage(1); }, children: _jsxs("div", { "data-audit-evidence-role": role, children: [_jsx("div", { ref: grid, className: "iad-thumbnail-grid", children: selected.slice((page - 1) * size, page * size).map(item => _jsxs("div", { className: "iad-audit-evidence-item", children: [_jsx(ThumbnailCard, { image: auditEvidenceImage(item, imageUrl(item)), label: item.caption, title: item.source.sample.relative_path, "aria-label": `放大${item.caption}`, onClick: () => onOpen(auditEvidenceImage(item, imageUrl(item))) }), item.reason && _jsx("p", { children: item.reason })] }, item.image.evidence_id)) }), _jsx(Pagination, { total: selected.length, page: page, size: size, unit: "\u5F20", label: "\u5BA1\u8BA1\u8BC1\u636E", onPage: setPage })] }) });
}
