import React from "react";
import type { AuditAnalysis, AuditFinding, VisualEvidence } from "../../shared/contracts.js";
export declare function AuditFindings({ analysis, onLocate, onEvidence }: {
    analysis: AuditAnalysis;
    onLocate(finding: AuditFinding): void;
    onEvidence(image: VisualEvidence, finding: AuditFinding): void;
}): React.JSX.Element | null;
export declare function FindingExplanation({ finding }: {
    finding: AuditFinding;
}): React.JSX.Element;
//# sourceMappingURL=AuditFindings.d.ts.map