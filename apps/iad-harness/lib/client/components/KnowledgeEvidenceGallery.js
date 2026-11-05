import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ThumbnailCard } from "./ThumbnailCard.js";
import { useState } from "react";
import { Pagination } from "./Pagination.js";
import { useResource } from '../useResource.js';
export function KnowledgeEvidenceGallery({ versionId, items, onOpen }) {
    const scope = JSON.stringify([versionId, items.map(item => item.image.evidence_id)]);
    const [position, setPosition] = useState({ scope: "", page: 1 });
    const page = position.scope === scope ? position.page : 1;
    const query = new URLSearchParams({ version_id: versionId, section: 'evidence',
        evidence_ids: JSON.stringify(items.map(item => item.image.evidence_id)), page: String(page), page_size: '10' });
    const resource = useResource(items.length ? `/knowledge/details?${query}` : null);
    const displayed = resource.data?.items || [];
    return _jsxs(_Fragment, { children: [_jsx("div", { className: "iad-thumbnail-grid", children: displayed.map(({ image, sample_id }, index) => {
                    const src = `/api/iad/knowledge/evidence/${encodeURIComponent(versionId)}/${encodeURIComponent(image.evidence_id)}`;
                    const title = `图像 ${(page - 1) * 10 + index + 1}`;
                    return _jsx(ThumbnailCard, { src: src, label: title, onClick: () => onOpen({ src, title, width: image.sent_size[0], height: image.sent_size[1], sampleId: sample_id, evidence: image }) }, image.evidence_id);
                }) }), resource.loading && _jsx("p", { children: "\u6B63\u5728\u8BFB\u53D6\u8BC1\u636E\u2026" }), resource.error && _jsx("p", { role: "alert", children: resource.error }), !items.length && _jsx("p", { children: "\u672A\u63D0\u4F9B\u6B64\u7EC4\u8BC1\u636E\u3002" }), resource.data && resource.data.total > 10 && _jsx(Pagination, { total: resource.data.total, page: page, size: 10, unit: "\u5F20", onPage: page => setPosition({ scope, page }) })] });
}
