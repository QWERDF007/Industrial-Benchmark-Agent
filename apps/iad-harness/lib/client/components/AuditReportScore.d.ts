import React from 'react';
import type { AuditReportImage, AuditRunReport, QualityScore } from '../../shared/domain.generated.js';
export declare function AuditScoreSummary({ score }: {
    score: QualityScore;
}): React.JSX.Element;
export declare function AuditReportScore({ report, imageUrl }: {
    report: AuditRunReport;
    imageUrl(item: AuditReportImage): string;
}): React.JSX.Element | null;
//# sourceMappingURL=AuditReportScore.d.ts.map