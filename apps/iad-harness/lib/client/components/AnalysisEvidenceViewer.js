import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useResource } from '../useResource.js';
import { datasetImageAnnotations } from '../dataset-image-annotations.js';
import { FullscreenViewer } from './FullscreenViewer.js';
export function AnalysisEvidenceViewer({ versionId, source, onClose }) {
    const resource = useResource(`/analysis/publications/${encodeURIComponent(versionId)}/samples/${encodeURIComponent(source.sampleId)}/evidence`);
    const [selected, setSelected] = useState(source.id);
    const items = useMemo(() => resource.data?.items.map(item => {
        const registration = resource.data.registration;
        return { id: item.evidence_id, sampleId: item.sample_id, title: item.filename,
            imageUrl: `/api/iad/${resource.data.module}/evidence/${encodeURIComponent(versionId)}/${encodeURIComponent(item.evidence_id)}`,
            width: item.image.sent_size[0], height: item.image.sent_size[1], evidence: item.image,
            ...datasetImageAnnotations(registration.dataset_format, registration.sample, registration.annotations) };
    }), [resource.data, versionId]);
    const index = items?.findIndex(item => item.id === selected) ?? 0;
    return _jsx(FullscreenViewer, { open: true, item: items?.[index] || { ...source, annotationLayer: null }, items: items || [source], currentIndex: index, onNavigate: position => setSelected(items[position].id), onClose: onClose, context: resource.error ? _jsx("p", { role: "alert", children: resource.error }) : undefined });
}
