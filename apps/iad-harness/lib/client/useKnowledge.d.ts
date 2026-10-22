import type { KnowledgeSnapshot } from "../shared/contracts.js";
/** A response belongs to one dataset, kind and version; pending queries never expose another selection. */
export declare function useKnowledge(datasetId: string, kind: KnowledgeSnapshot["kind"] | null, versionId?: string, revision?: number): {
    knowledge: KnowledgeSnapshot | null;
    versions: import("../shared/domain.generated.js").Versions1;
    freshness: import("../shared/domain.generated.js").KnowledgeFreshness | null;
    eligible_source_count: import("../shared/domain.generated.js").EligibleSourceCount;
    unavailable_source_count: import("../shared/domain.generated.js").UnavailableSourceCount;
    loading: boolean;
    error: string;
};
//# sourceMappingURL=useKnowledge.d.ts.map