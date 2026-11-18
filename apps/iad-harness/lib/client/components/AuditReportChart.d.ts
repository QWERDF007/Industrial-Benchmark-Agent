import React from 'react';
export declare function AuditOutcomeChart({ title, normal, suspect, incomplete, description }: {
    title: string;
    normal: number;
    suspect: number;
    incomplete?: number;
    description?: string;
}): React.JSX.Element;
export declare function AuditReportChart({ kind, title, rows, unit, maximum }: {
    kind: 'issues' | 'consistency' | 'program-conflicts' | 'model-conflicts';
    title: string;
    rows: readonly {
        label: string;
        value: number;
    }[];
    unit: string;
    maximum?: number;
}): React.JSX.Element;
//# sourceMappingURL=AuditReportChart.d.ts.map