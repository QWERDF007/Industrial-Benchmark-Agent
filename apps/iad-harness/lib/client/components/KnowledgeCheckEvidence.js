import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useResource } from '../useResource.js';
import { analysisImageUrl, currentKnowledgeDetail } from '../analysis-results.js';
import { Pagination } from './Pagination.js';
import { ThumbnailCard } from './ThumbnailCard.js';
export function KnowledgeCheckEvidence({ source, checkId, role, active, onOpen, onLoaded }) {
    const grid = useRef(null);
    const [paging, setPaging] = useState({ page: 1, size: 0 });
    useLayoutEffect(() => {
        const element = grid.current;
        const observer = new ResizeObserver(() => {
            if (!element.getBoundingClientRect().width)
                return;
            const columns = getComputedStyle(element).gridTemplateColumns.split(' ').length;
            const size = columns * 2;
            setPaging(previous => previous.size === size ? previous : { page: 1, size });
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    const query = new URLSearchParams({ version_id: source.kind === 'published' ? source.versionId : '', check_id: checkId, evidence_role: role,
        page: String(paging.page), page_size: String(paging.size) });
    const result = useResource(active && paging.size && source.kind === 'published' ? `/knowledge/details?${query}` : null);
    const detail = source.kind === 'current' && paging.size ? currentKnowledgeDetail(source.view, checkId, role, paging.page, paging.size) : result.data;
    useEffect(() => { if (detail)
        onLoaded?.(detail); }, [result.data, source, checkId, role, paging.page, paging.size, onLoaded]);
    const label = role === 'support' ? '支持证据' : '反对证据';
    return _jsxs("section", { "data-evidence-role": role, "aria-label": label, children: [_jsx("div", { ref: grid, className: "iad-thumbnail-grid", "aria-busy": result.loading, children: detail?.items.map(item => {
                    const filename = item.sample_id.slice(item.sample_id.indexOf(':') + 1).split('/').pop();
                    return _jsx(ThumbnailCard, { label: filename, "aria-label": `放大${label} ${filename}`, onClick: () => onOpen(item), src: analysisImageUrl(source, item.image.evidence_id) }, item.image.evidence_id);
                }) }), result.error && _jsx("p", { role: "alert", children: result.error }), result.loading && _jsx("p", { children: "\u6B63\u5728\u8BFB\u53D6\u8BC1\u636E\u2026" }), detail && (detail.total ? _jsx(Pagination, { hideSinglePage: true, total: detail.total, page: paging.page, size: paging.size, unit: "\u5F20", label: label, onPage: page => setPaging(previous => ({ ...previous, page })) }) : _jsxs("p", { children: ["\u6682\u65E0", label] }))] });
}
