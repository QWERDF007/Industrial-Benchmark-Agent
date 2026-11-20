import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useGalleryPagination } from '../useGalleryPagination.js';
import { Pagination } from './Pagination.js';
import { ThumbnailCard } from './ThumbnailCard.js';
import { datasetImageAnnotations } from '../dataset-image-annotations.js';
import { ImageGalleryViewer } from './ImageGalleryViewer.js';
import { AuditReportHeading } from './AuditReportHeading.js';
export function AuditEvidencePairs({ pairs, imageUrl, title = '图像证据', heading = { level: 4 } }) {
    const [current, setCurrent] = useState(null);
    const { grid, page, size, setPage } = useGalleryPagination(pairs.length, 2);
    const images = pairs.flatMap(pair => [pair.main, pair.candidate]).map(item => ({
        src: imageUrl(item), title: item.caption, width: item.image.original_size[0], height: item.image.original_size[1],
        sampleId: item.sample_id, evidence: item.image, ...datasetImageAnnotations(item.source.dataset_format, item.source.sample, item.source.annotations)
    }));
    if (!pairs.length)
        return null;
    return _jsxs("section", { className: "iad-audit-gallery", "data-audit-evidence-pairs": true, children: [_jsx(AuditReportHeading, { ...heading, children: title }), _jsx("div", { ref: grid, className: "iad-thumbnail-grid", children: pairs.slice((page - 1) * size, page * size).map((pair, index) => _jsx("section", { className: "iad-audit-evidence-pair", "aria-label": `第${(page - 1) * size + index + 1}对图像证据`, children: ['主图', '对比图'].map((label, side) => {
                        const position = ((page - 1) * size + index) * 2 + side, image = images[position];
                        return _jsx(ThumbnailCard, { image: image, label: "", title: image.title, "aria-label": `放大第${(page - 1) * size + index + 1}对${label}`, onClick: () => setCurrent(position) }, label);
                    }) }, pair.pair_id)) }), _jsx(Pagination, { total: pairs.length * 2, page: page, size: size * 2, unit: "\u5F20", label: title, hideSinglePage: true, onPage: setPage }), _jsx(ImageGalleryViewer, { images: images, current: current, onChange: setCurrent })] });
}
