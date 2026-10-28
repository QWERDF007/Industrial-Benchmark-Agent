import { jsx as _jsx } from "react/jsx-runtime";
import { useWorkspace } from '../workspace.js';
import { ConsistencyComparison } from './ConsistencyComparison.js';
export function FrozenConsistencyComparison({ bundle, compact = false }) {
    const { state, workspace } = useWorkspace(), result = bundle.result;
    const member = { sample_id: bundle.sources.right.sample.sample_id, dataset_id: bundle.sources.right.sample.dataset_id,
        quality_status: bundle.sources.right.sample.quality_status, relation: result.verification.relation, pixel: result.verification.pixel,
        near: result.verification.relation === 'EXACT' ? null : result.verification, local: result.verification.local,
        registration: result.verification.registration, annotation: result.annotation, error_code: null, reason: null };
    return _jsx("div", { className: compact ? 'iad-consistency-preview' : 'iad-consistency-layout iad-frozen-comparison', children: _jsx(ConsistencyComparison, { member: member, query: null, temporary: null, frozen: bundle, differenceId: state.consistency.differenceId, onDifference: differenceId => workspace.updateConsistency({ differenceId }, true) }) });
}
