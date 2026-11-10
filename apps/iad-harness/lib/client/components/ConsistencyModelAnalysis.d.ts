import React from 'react';
import type { GalleryMember, GroupAnalysisDraft } from '../../shared/domain.generated.js';
import type { ConsistencyAnalysisReference } from '../consistency-view.js';
export declare function ConsistencyModelAnalysis({ reference, members, result, error }: {
    reference: ConsistencyAnalysisReference;
    members: GalleryMember[];
    result: GroupAnalysisDraft | null;
    error: string;
}): React.JSX.Element;
//# sourceMappingURL=ConsistencyModelAnalysis.d.ts.map