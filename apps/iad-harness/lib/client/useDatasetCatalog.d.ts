import type { DatasetCatalog } from '../shared/contracts.js';
export declare function useDatasetCatalog(): {
    data: DatasetCatalog | null;
    loading: boolean;
    error: string;
    refresh: () => Promise<DatasetCatalog | null>;
};
//# sourceMappingURL=useDatasetCatalog.d.ts.map