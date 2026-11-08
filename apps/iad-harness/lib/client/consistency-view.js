import { conflictCategories, modelAssessmentLabels } from '../shared/consistency.parameters.generated.js';
import { request } from './api.js';
export class ConsistencyView {
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
        return { queryId, items: this.cards(items) };
    }
    static async loadCheck(runId, signal) {
        const items = [];
        for (let page = 1;; page++) {
            const result = await request(`/consistency/checks/${encodeURIComponent(runId)}/gallery?page=${page}&page_size=200`, undefined, undefined, signal);
            items.push(...result.items);
            if (items.length >= result.total)
                break;
        }
        return { queryId: runId, items: this.cards(items, runId) };
    }
    static cards(items, checkId) {
        return items.map(item => ({ id: item.group_id, checkId,
            types: checkId ? item.conflict_categories : conflictCategories.filter(category => item.conflict_categories.includes(category) || item.model_categories.includes(category)),
            type: item.annotation_conclusion,
            filename: item.anchor.sample.relative_path.split('/').pop(), url: this.media(item.anchor, true), fullUrl: this.media(item.anchor),
            sourceWidth: item.anchor.sample.width, sourceHeight: item.anchor.sample.height, memberCount: item.member_count, review: item.review_state,
            model: { status: item.model_state === 'MATERIAL' ? 'conflict' : item.model_state === 'EQUIVALENT' ? 'no_conflict' : 'unknown',
                modelType: item.model_conclusion || modelAssessmentLabels[item.model_state] }, rawItem: item,
            agreement: item.model_state === 'EQUIVALENT' ? 'different' : item.model_state === 'MATERIAL' && item.model_conclusion ?
                item.conflict_categories[0] === item.model_conclusion ? 'same' : 'different' : null }));
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
