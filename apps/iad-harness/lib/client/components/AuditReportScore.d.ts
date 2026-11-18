import React from 'react';
import type { AuditReportImage, AuditRunReport, QualityScore } from '../../shared/domain.generated.js';
import { type ChartPanel } from './charts/Chart.js';
export declare function AuditScoreSummary({ score, panels, controls }: {
    score: QualityScore | null;
    panels?: readonly ChartPanel[];
    controls?: React.ReactNode;
}): React.JSX.Element;
export declare function AuditReportScore({ report, imageUrl }: {
    report: AuditRunReport;
    imageUrl(item: AuditReportImage): string;
}): React.JSX.Element | null;
//# sourceMappingURL=AuditReportScore.d.ts.map