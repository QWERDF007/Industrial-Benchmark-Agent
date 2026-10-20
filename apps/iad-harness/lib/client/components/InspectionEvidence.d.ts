import React from "react";
import type { AuditAnalysis, AuditFinding } from "../../shared/contracts.js";
import { type InspectionContext, type InspectionSelection } from "../inspection.js";
export declare function InspectionOverlay({ inspection, selectedId, hoveredIds, regions, finding }: {
    inspection: InspectionContext;
    selectedId: string;
    hoveredIds: string[];
    regions: AuditAnalysis["regions"];
    finding?: AuditFinding;
}): React.JSX.Element;
export declare function InspectionPanel({ inspection, selection, onSelect, choices }: {
    inspection: InspectionContext;
    selection: InspectionSelection | null;
    onSelect(target: InspectionSelection | null): void;
    choices: string[];
}): React.JSX.Element;
//# sourceMappingURL=InspectionEvidence.d.ts.map