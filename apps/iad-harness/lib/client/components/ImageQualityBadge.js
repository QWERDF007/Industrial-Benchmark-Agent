import { jsx as _jsx } from "react/jsx-runtime";
export function ImageQualityBadge({ label }) {
    return label ? _jsx("span", { className: "iad-image-quality", "data-quality": label, children: label }) : null;
}
