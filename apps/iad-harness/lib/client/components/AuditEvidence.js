import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function AuditEvidence({ analysis, ids, label, onEvidence }) {
    const images = new Map([analysis.overview, ...analysis.regions.map(region => region.image), ...analysis.auxiliary_evidence]
        .map(image => [image.evidence_id, image]));
    return _jsx("div", { className: "iad-actions", children: ids.map((id, index) => {
            const image = images.get(id);
            return _jsxs("button", { "data-evidence-id": id, disabled: !image, onClick: () => image && onEvidence(image), "aria-label": `查看${label}的证据 ${index + 1}`, children: ["\u8BC1\u636E ", index + 1, " \u00B7 ", !image ? "不可用" : image.representation === "annotation_mask" ? "定位图" : image.role === "overview" ? "全图" : "ROI"] }, id);
        }) });
}
