import { mediaUrl, request } from './api.js';
import { directionEvidence } from './direction-evidence.js';
export async function explorationCandidates(datasetIds, signal) {
    const sources = await request(`/analysis/sources?${new URLSearchParams({ dataset_ids: JSON.stringify(datasetIds) })}`, undefined, undefined, signal);
    return sources.items.map(item => ({ id: item.sample_id, filename: item.relative_path, datasetId: item.dataset_id,
        url: mediaUrl({ task_id: item.dataset_id, sample_id: item.sample_id }, 'thumbnail') }));
}
export function explorationDirections(publication, referencedDirectionId) {
    return publication?.catalog.directions.filter(direction => direction.direction_id === referencedDirectionId || !publication.removed_direction_ids.includes(direction.direction_id)).map(direction => {
        const projection = directionEvidence(publication, direction);
        const evidences = projection.entries.flatMap((item) => {
            if (!item.evidence)
                return [];
            const url = `/api/iad/exploration/evidence/${encodeURIComponent(publication.version_id)}/${encodeURIComponent(item.id)}`;
            return [{ evidenceId: item.id, sampleId: item.evidence.sample_id, kind: item.kind, ref: item.ref, label: item.label,
                    url, fullUrl: url, filename: item.title }];
        });
        return { id: direction.direction_id, versionId: publication.version_id, datasetId: direction.dataset_ids[0], title: direction.title,
            applies: direction.applies_to === 'normal' ? '良品' : direction.applies_to === 'defect' ? '异常' : '通用',
            brief: direction.instruction, rationale: direction.rationale, limitations: direction.limitations, evidences,
            references: projection.references };
    }) || [];
}
