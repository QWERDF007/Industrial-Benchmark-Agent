import React from "react";
import type { AuditAnalysis, AnalysisPublicationView, VisualEvidence } from "../../shared/contracts.js";
export declare function RuleAssessments({ analysis, knowledge, onEvidence }: {
    analysis: AuditAnalysis;
    knowledge: AnalysisPublicationView[];
    onEvidence(image: VisualEvidence): void;
}): React.JSX.Element | null;
//# sourceMappingURL=RuleAssessments.d.ts.map