import type { Dataset, DatasetGroup } from '../shared/contracts.js';
export declare const UNGROUPED_SCOPE_ID = "__ungrouped__";
export type DatasetHierarchyGroup = DatasetGroup & {
    kind: 'group' | 'ungrouped';
};
/** Read-only scope projection; ungrouped data never creates a stored parent. */
export declare function buildHierarchyGroups(datasets: Dataset[], groups?: DatasetGroup[]): DatasetHierarchyGroup[];
export declare function getDatasetGroupId(dataset: Dataset): string;
//# sourceMappingURL=dataset-hierarchy.d.ts.map