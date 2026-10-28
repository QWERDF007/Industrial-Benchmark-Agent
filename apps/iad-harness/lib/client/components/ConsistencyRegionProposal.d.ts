import React from 'react';
import type { AnnotationDifference, ConsistencyReviewSubmission, FrozenEvidenceSource } from '../../shared/domain.generated.js';
type Proposal = Extract<ConsistencyReviewSubmission['action'], {
    kind: 'PROPOSE_REGION_CHANGE';
}>;
export declare function ConsistencyRegionProposal({ sources, differences, onChange }: {
    sources: FrozenEvidenceSource[];
    differences: AnnotationDifference[];
    onChange(value: Proposal | null): void;
}): React.JSX.Element;
export {};
//# sourceMappingURL=ConsistencyRegionProposal.d.ts.map