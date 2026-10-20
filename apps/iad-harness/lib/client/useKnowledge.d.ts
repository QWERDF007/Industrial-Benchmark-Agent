import type { KnowledgeSnapshot } from "../shared/contracts.js";
/** A response belongs to one dataset, kind and version; pending queries never expose another selection. */
export declare function useKnowledge(datasetId: string, kind: KnowledgeSnapshot["kind"] | null, versionId?: string, revision?: number): {
    knowledge: KnowledgeSnapshot | null;
    versions: import("../shared/domain.generated.js").Versions;
    freshness: import("../shared/domain.generated.js").KnowledgeFreshness | null;
    loading: boolean;
    error: string;
};
//# sourceMappingURL=useKnowledge.d.ts.map