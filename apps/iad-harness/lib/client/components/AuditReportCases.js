import { jsx as _jsx } from "react/jsx-runtime";
import { AuditEvidenceGallery } from './AuditEvidenceGallery.js';
export function auditCaseImages(report, ids) {
    const images = new Map();
    for (const id of ids)
        for (const item of report.evidence_groups['case:' + id] || [])
            if (!images.has(item.image.evidence_id))
                images.set(item.image.evidence_id, item);
    return [...images.values()].slice(0, 8);
}
export function AuditCaseGallery({ ids, report, imageUrl, heading }) {
    return _jsx(AuditEvidenceGallery, { items: auditCaseImages(report, ids), imageUrl: imageUrl, heading: heading });
}
