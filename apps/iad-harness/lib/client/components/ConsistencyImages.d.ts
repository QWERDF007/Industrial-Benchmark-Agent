import React from 'react';
import type { ConsistencyFilterValues } from '../consistency-view.js';
import type { ConsistencyImageCollection } from '../useConsistencyImages.js';
export declare function ConsistencyImages({ jobId, images, filters, group, onReviewed, page, onPage }: {
    jobId: string;
    images: ConsistencyImageCollection;
    filters: ConsistencyFilterValues;
    group: string;
    onReviewed(): void;
    page: number;
    onPage(page: number): void;
}): React.JSX.Element;
//# sourceMappingURL=ConsistencyImages.d.ts.map