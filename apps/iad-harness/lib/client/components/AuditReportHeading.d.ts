import React from 'react';
export interface AuditReportHeadingSpec {
    level: 2 | 3 | 4 | 5 | 6;
    number?: string;
}
export declare function AuditReportHeading({ level, number, children }: AuditReportHeadingSpec & {
    children: React.ReactNode;
}): React.JSX.Element;
//# sourceMappingURL=AuditReportHeading.d.ts.map