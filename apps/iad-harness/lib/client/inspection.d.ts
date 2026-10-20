import type { AuditAnalysis, InspectionReference } from "../shared/contracts.js";
import type { ImageSource } from "./components/ImageViewer.js";
export interface InspectionContext {
    reference: InspectionReference;
    analysis: AuditAnalysis;
    historical?: boolean;
}
export type InspectionSelection = {
    kind: "finding";
    id: string;
} | {
    kind: "evidence";
    id: string;
    findingId?: string;
};
export interface InspectionTransform {
    zoom: number;
    x: number;
    y: number;
}
export interface InspectionView {
    reference: InspectionReference;
    selection: InspectionSelection | null;
    transform: InspectionTransform;
    sessionId?: string;
}
export declare function inspectionImage(inspection: InspectionContext, selection?: InspectionSelection | null, transform?: InspectionTransform): ImageSource;
export declare function restoreInspection(value: unknown, datasetId: string, sampleId: string): InspectionView | null;
export declare function resolveInspection(analysis: AuditAnalysis | undefined, selection: InspectionSelection | null): {
    finding: import("../shared/domain.generated.js").AuditFinding | undefined;
    evidence: import("../shared/domain.generated.js").VisualEvidence | undefined;
    region: import("../shared/domain.generated.js").RegionEvidence | undefined;
};
//# sourceMappingURL=inspection.d.ts.map