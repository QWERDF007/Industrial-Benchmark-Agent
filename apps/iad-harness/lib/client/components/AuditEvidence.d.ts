import React from "react";
import type { AuditAnalysis, VisualEvidence } from "../../shared/contracts.js";
export declare function AuditEvidence({ analysis, ids, label, onEvidence, selectedId }: {
    analysis: AuditAnalysis;
    ids: string[];
    label: string;
    onEvidence(image: VisualEvidence): void;
    selectedId?: string;
}): React.JSX.Element;
//# sourceMappingURL=AuditEvidence.d.ts.map