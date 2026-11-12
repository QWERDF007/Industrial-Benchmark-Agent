import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useResource } from '../useResource.js';
import { analysisReadPath, analysisImageUrl } from '../analysis-results.js';
import { datasetImageAnnotations } from '../dataset-image-annotations.js';
import { FullscreenViewer } from './FullscreenViewer.js';
export function AnalysisEvidenceViewer({ result, source, onClose }) {
    const resource = useResource(`${analysisReadPath(result)}/samples/${encodeURIComponent(source.sampleId)}/evidence${result.kind === 'current' ? `?revision=${result.view.revision}` : ''}`);
    const [selected, setSelected] = useState(source.id);
    const items = useMemo(() => resource.data?.items.filter(item => result.kind === 'published' || result.view.evidence.some(value => value.evidence_id === item.evidence_id)).map(item => {
        const registration = resource.data.registration;
        return { id: item.evidence_id, sampleId: item.sample_id, title: item.filename,
            imageUrl: analysisImageUrl(result, item.evidence_id),
            width: item.image.sent_size[0], height: item.image.sent_size[1], evidence: item.image,
            ...datasetImageAnnotations(registration.dataset_format, registration.sample, registration.annotations) };
    }), [resource.data, result]);
    const index = items?.findIndex(item => item.id === selected) ?? 0;
    return _jsx(FullscreenViewer, { open: true, item: items?.[index] || { ...source, annotationLayer: null }, items: items || [source], currentIndex: index, onNavigate: position => setSelected(items[position].id), onClose: onClose, context: resource.error ? _jsx("p", { role: "alert", children: resource.error }) : undefined });
}
