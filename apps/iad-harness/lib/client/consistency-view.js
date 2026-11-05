import { differenceLabels } from '../shared/consistency-presentation.js';
import { modelAssessmentLabels } from '../shared/consistency.parameters.generated.js';
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
        const cards = [];
        for (let offset = 0; offset < items.length; offset += 8) {
            cards.push(...await Promise.all(items.slice(offset, offset + 8).map(async (item) => {
                const context = await request('/consistency/review/context', { evidence_id: item.anchor.evidence_id }, undefined, signal);
                const latest = new Map();
                for (const decision of context.decisions)
                    for (const id of decision.request.difference_ids)
                        latest.set(id, decision.request.action.kind);
                const kinds = context.differences.map(difference => latest.get(difference.difference_id));
                const review = kinds.length && kinds.every(kind => kind === 'CONFIRM_DIFFERENCE') ? 'confirmed' :
                    kinds.length && kinds.every(kind => kind === 'REJECT_DIFFERENCE' || kind === 'EXPECTED_POLICY_DIFFERENCE') ? 'rejected' : 'pending';
                return { id: item.group_id,
                    type: item.difference_types.map(type => differenceLabels[type]).join('、') || '标注待核对',
                    filename: item.anchor.sample.relative_path.split('/').pop(), url: this.media(item.anchor, true), fullUrl: this.media(item.anchor),
                    sourceWidth: item.anchor.sample.width, sourceHeight: item.anchor.sample.height, memberCount: item.member_count, review,
                    model: { status: item.model_state === 'MATERIAL' ? 'conflict' : item.model_state === 'EQUIVALENT' ? 'no_conflict' : 'unknown',
                        modelType: modelAssessmentLabels[item.model_state] }, rawItem: item };
            })));
        }
        return { queryId, items: cards };
    }
    static async members(reference, signal) {
        const items = [];
        for (let page = 1;; page++) {
            const result = await request('/consistency/gallery/members', { ...reference, page, page_size: 200 }, undefined, signal);
            items.push(...result.items);
            if (items.length >= result.total)
                return items;
        }
    }
}
