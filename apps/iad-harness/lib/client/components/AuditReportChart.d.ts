import React from 'react';
import type { ChartTone } from './charts/types.js';
export declare function AuditReportChart({ kind, title, rows, unit, maximum }: {
    kind: 'outcomes' | 'issues' | 'consistency' | 'program-conflicts' | 'model-conflicts';
    title: string;
    rows: readonly {
        label: string;
        value: number;
        tone?: ChartTone;
    }[];
    unit: string;
    maximum?: number;
}): React.JSX.Element;
//# sourceMappingURL=AuditReportChart.d.ts.map