import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Pagination } from "./Pagination.js";
export function KnowledgeEvidenceGallery({ versionId, items, onOpen }) {
    const scope = JSON.stringify([versionId, items.map(item => item.image.evidence_id)]);
    const [position, setPosition] = useState({ scope: "", page: 1 });
    const page = position.scope === scope ? Math.min(position.page, Math.max(1, Math.ceil(items.length / 10))) : 1;
    return _jsxs(_Fragment, { children: [_jsx("div", { className: "iad-knowledge-evidence iad-reference-grid", children: items.slice((page - 1) * 10, page * 10).map(({ image }) => {
                    const src = `/api/iad/knowledge/evidence/${encodeURIComponent(versionId)}/${encodeURIComponent(image.evidence_id)}`;
                    return _jsxs("button", { title: "\u653E\u5927\u51BB\u7ED3\u8BC1\u636E", onClick: () => onOpen({ src, title: `${image.role} · ${image.representation} · ${image.crop_bbox.join(", ")}`, width: image.sent_size[0], height: image.sent_size[1] }), children: [_jsx("img", { src: src, alt: `${image.role} · ${image.representation}`, loading: "lazy" }), _jsxs("small", { children: [image.role, " \u00B7 ", image.representation] })] }, image.evidence_id);
                }) }), !items.length && _jsx("p", { className: "iad-muted", children: "\u672A\u63D0\u4F9B\u6B64\u7EC4\u8BC1\u636E\u3002" }), items.length > 10 && _jsx(Pagination, { total: items.length, page: page, size: 10, unit: "\u9879\u8BC1\u636E", onPage: page => setPosition({ scope, page }) })] });
}
