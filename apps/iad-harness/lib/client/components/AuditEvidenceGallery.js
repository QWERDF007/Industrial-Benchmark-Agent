import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useGalleryPagination } from '../useGalleryPagination.js';
import { ThumbnailCard } from './ThumbnailCard.js';
import { Pagination } from './Pagination.js';
import { datasetImageAnnotations } from '../dataset-image-annotations.js';
import { ImageViewer } from './ImageViewer.js';
import { TabBar } from './layout/TabBar.js';
import { AuditReportHeading } from './AuditReportHeading.js';
export function AuditEvidenceGallery({ items, imageUrl, title = '图像证据', heading = { level: 4 } }) {
    const [current, setCurrent] = useState(null);
    const [role, setRole] = useState('representative');
    const compare = items.some(item => item.role === 'counter') && items.some(item => item.role === 'representative');
    const selected = compare ? items.filter(item => item.role === role) : items;
    const { grid, page, size, setPage } = useGalleryPagination(selected.length);
    if (!items.length)
        return null;
    const images = selected.map(item => ({ src: imageUrl(item), title: item.source.sample.relative_path.split('/').pop(),
        width: item.image.original_size[0], height: item.image.original_size[1], sampleId: item.sample_id, evidence: item.image,
        ...datasetImageAnnotations(item.source.dataset_format, item.source.sample, item.source.annotations) }));
    return _jsxs("section", { className: "iad-audit-gallery", "aria-label": title, children: [_jsx(AuditReportHeading, { ...heading, children: title }), compare && _jsx(TabBar, { label: title + '对照', value: role, onChange: value => { setRole(value); setPage(1); setCurrent(null); }, items: [{ id: 'representative', label: '当前图组' }, { id: 'counter', label: '对照图组' }] }), _jsx("div", { ref: grid, className: "iad-thumbnail-grid", children: images.slice((page - 1) * size, page * size).map((image, index) => {
                    const position = (page - 1) * size + index;
                    return _jsx(ThumbnailCard, { image: image, label: "", title: selected[position].reason, "data-audit-evidence-role": selected[position].role, "aria-label": `放大${selected[position].reason}`, onClick: () => setCurrent(position) }, selected[position].image.evidence_id);
                }) }), _jsx(Pagination, { total: selected.length, page: page, size: size, unit: "\u5F20", label: title, hideSinglePage: true, onPage: setPage }), current !== null && _jsx(ImageViewer, { image: images[current], onClose: () => setCurrent(null), navigation: selected.length > 1 ? { previous: current > 0, next: current < selected.length - 1, busy: false, error: '', move: offset => setCurrent(current + offset) } : undefined })] });
}
