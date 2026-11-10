import type { ModelCatalog } from '../shared/domain.generated.js';
export declare function useModelProviders(): {
    view: ModelCatalog | null;
    providers: import("../shared/domain.generated.js").Providers;
    loading: boolean;
    error: string;
    refresh: () => Promise<void>;
};
//# sourceMappingURL=models.d.ts.map