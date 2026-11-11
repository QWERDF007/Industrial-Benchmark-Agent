import { mediaUrl, request } from './api.js';
import { directionEvidence } from './direction-evidence.js';
export class ExplorationNarrative {
    names = new Map();
    pattern;
    constructor(publication, datasetNames = {}) {
        for (const [id, name] of Object.entries(datasetNames))
            this.names.set(id, name);
        for (const direction of publication.catalog.directions) {
            for (const id of direction.dataset_ids)
                if (!this.names.has(id))
                    this.names.set(id, '所选子数据集');
            this.names.set(direction.direction_id, direction.title);
        }
        for (const item of publication.evidence) {
            this.names.set(item.sample_id, item.filename);
            this.names.set(item.evidence_id, item.filename);
            for (const id of item.image.annotation_ids ?? [])
                this.names.set(id, '原始标注');
        }
        for (const [id, name] of [[publication.job_id, '本次探索'], [publication.version_id, '本次结果'], [publication.session_id, '探索会话']])
            if (id)
                this.names.set(id, name);
        const ids = [...this.names.keys()].sort((a, b) => b.length - a.length).map(id => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        this.pattern = new RegExp(`(?<![A-Za-z0-9_])(${ids.join('|')})(?![A-Za-z0-9_])`, 'g');
    }
    text(value, references) {
        return value.replace(this.pattern, id => references?.has(id) ? id : this.names.get(id));
    }
}
export async function explorationCandidates(datasetIds, signal) {
    const sources = await request(`/analysis/sources?${new URLSearchParams({ dataset_ids: JSON.stringify(datasetIds) })}`, undefined, undefined, signal);
    return sources.items.map(item => ({ id: item.sample_id, filename: item.relative_path.replace(/^.*[\\/]/, ''), datasetId: item.dataset_id,
        candidate_role: item.candidate_role, annotation_categories: item.annotation_categories,
        url: mediaUrl({ task_id: item.dataset_id, sample_id: item.sample_id }, 'thumbnail') }));
}
export function explorationDirections(publication, referencedDirectionId, datasetNames = {}) {
    const narrative = publication ? new ExplorationNarrative(publication, datasetNames) : null;
    return publication?.catalog.directions.filter(direction => direction.direction_id === referencedDirectionId || !publication.removed_direction_ids.includes(direction.direction_id)).map(direction => {
        const projection = directionEvidence(publication, direction);
        const evidences = projection.entries.flatMap((item) => {
            if (!item.evidence)
                return [];
            const url = `/api/iad/exploration/evidence/${encodeURIComponent(publication.version_id)}/${encodeURIComponent(item.id)}`;
            return [{ evidenceId: item.id, sampleId: item.evidence.sample_id, kind: item.kind, ref: item.ref, label: item.label,
                    url, fullUrl: url, filename: item.title }];
        });
        return { id: direction.direction_id, versionId: publication.version_id, datasetId: direction.dataset_ids[0], title: narrative.text(direction.title),
            applies: direction.applies_to === 'normal' ? '良品' : direction.applies_to === 'defect' ? '异常' : '通用',
            brief: narrative.text(direction.instruction, projection.references), rationale: narrative.text(direction.rationale, projection.references),
            limitations: direction.limitations.map(text => narrative.text(text, projection.references)), evidences,
            references: projection.references };
    }) || [];
}
