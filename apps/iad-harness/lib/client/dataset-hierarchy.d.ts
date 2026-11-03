import type { Dataset, DatasetGroup } from "../shared/contracts.js";
/**
 * Derives parent dataset groups from dataset list and existing groups.
 * Provides a single source of truth (SSOT) across all workbench pages.
 */
export declare function buildHierarchyGroups(datasets: Dataset[], groups?: DatasetGroup[]): DatasetGroup[];
/**
 * Matches a child dataset to its parent group_id.
 */
export declare function getDatasetGroupId(dataset: Dataset, hierarchyGroups: DatasetGroup[]): string;
//# sourceMappingURL=dataset-hierarchy.d.ts.map