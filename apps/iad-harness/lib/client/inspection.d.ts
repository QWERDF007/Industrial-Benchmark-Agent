import type { AuditAnalysis } from "../shared/contracts.js";
export interface InspectionContext {
    suggestionId: string;
    analysis: AuditAnalysis;
}
export type InspectionSelection = {
    kind: "finding";
    id: string;
} | {
    kind: "evidence";
    id: string;
    findingId?: string;
};
export declare function resolveInspection(analysis: AuditAnalysis | undefined, selection: InspectionSelection | null): {
    finding: import("../shared/domain.generated.js").AuditFinding | undefined;
    evidence: import("../shared/domain.generated.js").VisualEvidence | undefined;
    region: import("../shared/domain.generated.js").RegionEvidence | undefined;
};
//# sourceMappingURL=inspection.d.ts.map