import React from 'react';
import type { AuditRunReport, AuditReportImage } from '../../shared/domain.generated.js';
export declare function AuditReportConsistency({ report, sources, imageUrl }: {
    report: AuditRunReport;
    sources: readonly {
        key: string;
        label: string;
        value: number;
    }[];
    imageUrl(item: AuditReportImage): string;
}): React.JSX.Element;
//# sourceMappingURL=AuditReportConsistency.d.ts.map