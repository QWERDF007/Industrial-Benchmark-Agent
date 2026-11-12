import React from 'react';
import type { AuditRunReport, AuditReportImage } from '../../shared/domain.generated.js';
import type { AuditReportHeadingSpec } from './AuditReportHeading.js';
export declare function auditCaseImages(report: AuditRunReport, ids: readonly string[]): AuditReportImage[];
export declare function AuditCaseGallery({ ids, report, imageUrl, heading }: {
    ids: readonly string[];
    report: AuditRunReport;
    imageUrl(item: AuditReportImage): string;
    heading?: AuditReportHeadingSpec;
}): React.JSX.Element;
//# sourceMappingURL=AuditReportCases.d.ts.map