import React from "react";
import type { AuditAnalysis, AuditFinding, VisualEvidence } from "../../shared/contracts.js";
export declare function AuditFindings({ analysis, onLocate, onEvidence }: {
    analysis: AuditAnalysis;
    onLocate(finding: AuditFinding): void;
    onEvidence(image: VisualEvidence): void;
}): React.JSX.Element | null;
//# sourceMappingURL=AuditFindings.d.ts.map