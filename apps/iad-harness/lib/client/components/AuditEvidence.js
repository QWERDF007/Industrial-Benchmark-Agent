import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { auditImageIndex } from "../api.js";
export function AuditEvidence({ analysis, ids, label, onEvidence, selectedId }) {
    const images = auditImageIndex(analysis);
    return _jsx("div", { className: "iad-actions", children: ids.map((id, index) => {
            const image = images.get(id);
            return _jsxs("button", { "data-evidence-id": id, "aria-current": id === selectedId ? "true" : undefined, disabled: !image, onClick: () => image && onEvidence(image), "aria-label": `查看${label}的证据 ${index + 1}`, children: ["\u8BC1\u636E ", index + 1, " \u00B7 ", !image ? "不可用" : image.representation === "annotation_mask" ? "定位图" : image.role === "overview" ? "全图" : "ROI"] }, id);
        }) });
}
