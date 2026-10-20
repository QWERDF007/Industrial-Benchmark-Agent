import React from "react";
import type { AuditAnalysis, KnowledgeSummary, VisualEvidence } from "../../shared/contracts.js";
export declare function RuleAssessments({ analysis, knowledge, onEvidence }: {
    analysis: AuditAnalysis;
    knowledge: KnowledgeSummary[];
    onEvidence(image: VisualEvidence): void;
}): React.JSX.Element | null;
//# sourceMappingURL=RuleAssessments.d.ts.map