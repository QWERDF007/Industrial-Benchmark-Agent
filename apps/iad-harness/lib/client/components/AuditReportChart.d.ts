import React from 'react';
export declare function AuditReportChart({ kind, title, rows, unit, maximum }: {
    kind: 'outcomes' | 'issues' | 'consistency' | 'program-conflicts' | 'model-conflicts';
    title: string;
    rows: readonly {
        label: string;
        value: number;
    }[];
    unit: string;
    maximum?: number;
}): React.JSX.Element;
//# sourceMappingURL=AuditReportChart.d.ts.map