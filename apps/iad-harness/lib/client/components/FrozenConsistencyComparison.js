import { jsx as _jsx } from "react/jsx-runtime";
import { frozenConsistencyMember } from '../consistency-images.js';
import { useWorkspace } from '../workspace.js';
import { ConsistencyComparison } from './ConsistencyComparison.js';
export function FrozenConsistencyComparison({ bundle }) {
    const { state, workspace } = useWorkspace();
    const member = frozenConsistencyMember(bundle);
    return _jsx("div", { className: "iad-consistency-layout iad-frozen-comparison", children: _jsx(ConsistencyComparison, { member: member, query: null, temporary: null, frozen: bundle, differenceId: state.consistency.differenceId, onDifference: differenceId => workspace.updateConsistency({ differenceId }, true) }) });
}
