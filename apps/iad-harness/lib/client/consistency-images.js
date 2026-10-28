export function frozenConsistencyImage(bundle, side) {
    const source = bundle.sources[side], media = bundle.media.find(item => item.side === side && item.representation === 'preview' && !item.difference_id);
    const url = (mediaId) => `/api/iad/consistency/evidence/${encodeURIComponent(bundle.result.evidence_id)}/media/${encodeURIComponent(mediaId)}`;
    const valid = bundle.media.find(item => item.media_id === side + '-annotation_overlay')?.available;
    return { src: url(media.media_id), title: source.sample.relative_path, width: source.sample.width, height: source.sample.height,
        annotationLayer: valid ? { kind: 'sample', sample: source.sample, annotations: source.annotations.annotations,
            maskUrls: Object.fromEntries(bundle.media.filter(item => item.side === side && item.annotation_id).map(item => [item.annotation_id, url(item.media_id)])) } : undefined };
}
export function frozenConsistencyMember(bundle) {
    const result = bundle.result;
    return { sample_id: bundle.sources.right.sample.sample_id, dataset_id: bundle.sources.right.sample.dataset_id,
        quality_status: bundle.sources.right.sample.quality_status, relation: result.verification.relation, pixel: result.verification.pixel,
        near: result.verification.relation === 'EXACT' ? null : result.verification, local: result.verification.local,
        registration: result.verification.registration, annotation: result.annotation, error_code: null, reason: null };
}
export const galleryImageUrl = (image) => `/api/iad/consistency/evidence/${encodeURIComponent(image.evidence_id)}/media/${image.side}-preview`;
