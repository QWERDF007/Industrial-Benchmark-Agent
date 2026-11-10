import { conflictCategories, conflictCategoryLabels } from '../shared/consistency.parameters.generated.js';
import { mediaUrl, request } from './api.js';
export class ConsistencyView {
    static modelConclusion(value) {
        return value && Object.hasOwn(conflictCategoryLabels, value) ? value : '';
    }
    static media(image, thumbnail = false) {
        return `/api/iad/consistency/evidence/${encodeURIComponent(image.evidence_id)}/media/${image.side}-original${thumbnail ? '?max_side=480' : ''}`;
    }
    static async load(batchId, signal) {
        const report = await request('/consistency/report', {
            selection: { kind: 'batch', batch_id: batchId }, page_size: 1
        }, undefined, signal);
        const queryId = report.page.query_id, items = [];
        for (let page = 1;; page++) {
            const result = await request('/consistency/gallery', { query_id: queryId, kind: 'conflicts', page, page_size: 200 }, undefined, signal);
            items.push(...result.items);
            if (items.length >= result.total)
                break;
        }
        return { queryId, items: this.cards(items, { query_id: queryId }) };
    }
    static async loadCheck(runId, signal) {
        const items = [];
        for (let page = 1;; page++) {
            const result = await request(`/consistency/checks/${encodeURIComponent(runId)}/gallery?page=${page}&page_size=200`, undefined, undefined, signal);
            items.push(...result.items);
            if (items.length >= result.total)
                break;
        }
        return { queryId: runId, items: this.cards(items, { job_id: runId }) };
    }
    static cards(items, source) {
        const checkId = 'job_id' in source ? source.job_id : undefined;
        return items.map(item => ({ id: item.group_id, checkId,
            reference: 'job_id' in source ? { job_id: source.job_id, anchor_id: item.group_id } : { query_id: source.query_id, kind: 'conflicts', group_id: item.group_id, facts_state: item.facts_state },
            image: item.anchor, candidateCount: item.candidate_count,
            types: checkId ? item.conflict_categories : conflictCategories.filter(category => item.conflict_categories.includes(category) || item.model_categories.includes(category)),
            type: item.annotation_conclusion,
            filename: item.anchor.sample.relative_path.split('/').pop(), url: this.media(item.anchor, true), fullUrl: this.media(item.anchor),
            sourceWidth: item.anchor.sample.width, sourceHeight: item.anchor.sample.height, memberCount: item.member_count, review: item.review_state,
            model: { status: item.model_state === 'MATERIAL' ? 'conflict' : item.model_state === 'EQUIVALENT' ? 'no_conflict' : 'unknown',
                modelType: this.modelConclusion(item.model_conclusion) }, rawItem: item,
            agreement: item.model_state === 'EQUIVALENT' ? 'different' : item.model_state === 'MATERIAL' && item.model_conclusion ?
                item.conflict_categories[0] === item.model_conclusion ? 'same' : 'different' : null }));
    }
    static imageCards(runId, items) {
        return items.map(({ sample, summary, image }) => ({ id: sample.sample_id, type: summary.program_conclusion,
            filename: (image?.sample.relative_path || sample.sample_id.slice(sample.sample_id.indexOf(':') + 1)).split('/').pop(),
            url: image ? this.media(image, true) : mediaUrl(sample, 'thumbnail'), fullUrl: image ? this.media(image) : mediaUrl(sample),
            sourceWidth: image?.sample.width, sourceHeight: image?.sample.height, image: image ?? undefined,
            candidateCount: summary.outcome?.candidate_stats?.eligible ?? ((summary.selected_exact ?? 0) + (summary.selected_similar ?? 0)),
            reference: { job_id: runId, anchor_id: sample.sample_id },
            model: { status: summary.reason === 'MODEL_REVIEWED' && summary.verdict === 'MATERIAL' ? 'conflict' : summary.reason === 'MODEL_REVIEWED' && summary.verdict === 'EQUIVALENT' ? 'no_conflict' : 'unknown',
                modelType: this.modelConclusion(summary.model_conclusion) }, }));
    }
    static async members(reference, signal) {
        if ('job_id' in reference) {
            return (await request(`/consistency/checks/${encodeURIComponent(reference.job_id)}/anchors/${encodeURIComponent(reference.anchor_id)}/members`, undefined, undefined, signal)).items;
        }
        const items = [];
        for (let page = 1;; page++) {
            const result = await request('/consistency/gallery/members', { ...reference, page, page_size: 200 }, undefined, signal);
            items.push(...result.items);
            if (items.length >= result.total)
                return items;
        }
    }
}
