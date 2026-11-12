export function analysisReadSource(view) {
    return 'version_id' in view ? { kind: 'published', versionId: view.version_id } : { kind: 'current', view };
}
export function analysisReadPath(source) {
    return source.kind === 'published' ? `/analysis/publications/${encodeURIComponent(source.versionId)}` : `/analysis/results/${encodeURIComponent(source.view.job_id)}`;
}
export function analysisImageUrl(source, evidenceId) {
    return `/api/iad${analysisReadPath(source)}/evidence/${encodeURIComponent(evidenceId)}`;
}
export function currentKnowledgeDetail(view, checkId, role, page, size) {
    const check = view.checks.find(item => item.check_id === checkId);
    const entry = view.catalog.checks.find(item => item.check_id === checkId);
    const evidence = view.check_evidence[checkId];
    return { version_id: null, dataset_id: entry.dataset_ids[0], check,
        directions: view.selected_directions.filter(direction => entry.direction_refs.includes(direction.ref)),
        support_evidence_ids: evidence.support.map(item => item.image.evidence_id), counter_evidence_ids: evidence.counter.map(item => item.image.evidence_id),
        total: evidence[role].length, page, page_size: size, items: evidence[role].slice((page - 1) * size, page * size) };
}
