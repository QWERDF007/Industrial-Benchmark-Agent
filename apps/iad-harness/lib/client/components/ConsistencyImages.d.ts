import React from 'react';
import { type ConsistencyFilterValues, type ConsistencyImageGroup } from '../consistency-view.js';
import type { ConsistencyImageCollection } from '../useConsistencyImages.js';
export declare function ConsistencyImages({ jobId, images, filters, group, onReviewed }: {
    jobId: string;
    images: ConsistencyImageCollection;
    filters: ConsistencyFilterValues;
    group: ConsistencyImageGroup;
    onReviewed(): void;
}): React.JSX.Element;
//# sourceMappingURL=ConsistencyImages.d.ts.map