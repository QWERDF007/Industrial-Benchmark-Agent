import React from "react";
import type { AuditAnalysis } from "../../shared/contracts.js";
export interface InspectionContext {
    suggestionId: string;
    analysis: AuditAnalysis;
}
export declare function InspectionOverlay({ inspection, selectedId, hoveredIds, regions }: {
    inspection: InspectionContext;
    selectedId: string;
    hoveredIds: string[];
    regions: AuditAnalysis["regions"];
}): React.JSX.Element;
export declare function InspectionPanel({ inspection, selectedId, onSelect, choices }: {
    inspection: InspectionContext;
    selectedId: string;
    onSelect(id: string): void;
    choices: string[];
}): React.JSX.Element;
//# sourceMappingURL=InspectionEvidence.d.ts.map