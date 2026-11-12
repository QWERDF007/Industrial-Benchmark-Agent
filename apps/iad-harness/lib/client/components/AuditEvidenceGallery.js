import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect, useRef, useState } from 'react';
import { ThumbnailCard } from './ThumbnailCard.js';
import { Pagination } from './Pagination.js';
import { datasetImageAnnotations } from '../dataset-image-annotations.js';
import { ImageViewer } from './ImageViewer.js';
export function AuditEvidenceGallery({ items, imageUrl }) {
    const grid = useRef(null);
    const [paging, setPaging] = useState({ page: 1, size: 8 });
    const [current, setCurrent] = useState(null);
    useLayoutEffect(() => {
        if (!items.length)
            return;
        const element = grid.current;
        const observer = new ResizeObserver(() => {
            if (!element.getBoundingClientRect().width)
                return;
            const size = getComputedStyle(element).gridTemplateColumns.split(' ').length * 2;
            setPaging(previous => previous.size === size ? previous : { page: 1, size });
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [items.length]);
    if (!items.length)
        return null;
    const images = items.map(item => ({ src: imageUrl(item), title: item.source.sample.relative_path.split('/').pop(),
        width: item.image.original_size[0], height: item.image.original_size[1], sampleId: item.sample_id, evidence: item.image,
        ...datasetImageAnnotations(item.source.dataset_format, item.source.sample, item.source.annotations) }));
    return _jsxs("section", { className: "iad-audit-gallery", "aria-label": "\u56FE\u50CF\u8BC1\u636E", children: [_jsx("h4", { children: "\u56FE\u50CF\u8BC1\u636E" }), _jsx("div", { ref: grid, className: "iad-thumbnail-grid", children: images.slice((paging.page - 1) * paging.size, paging.page * paging.size).map((image, index) => {
                    const position = (paging.page - 1) * paging.size + index;
                    return _jsx(ThumbnailCard, { image: image, label: "", title: image.title, "data-audit-evidence-role": items[position].role, "aria-label": `放大${image.title}`, onClick: () => setCurrent(position) }, items[position].image.evidence_id);
                }) }), _jsx(Pagination, { total: items.length, page: paging.page, size: paging.size, unit: "\u5F20", label: "\u56FE\u50CF\u8BC1\u636E", hideSinglePage: true, onPage: page => setPaging(previous => ({ ...previous, page })) }), current !== null && _jsx(ImageViewer, { image: images[current], onClose: () => setCurrent(null), navigation: items.length > 1 ? { previous: current > 0, next: current < items.length - 1, busy: false, error: '', move: offset => setCurrent(current + offset) } : undefined })] });
}
