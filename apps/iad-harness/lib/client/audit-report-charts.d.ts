import type { EChartsCoreOption } from 'echarts/core';
import type { AuditRunReport } from '../shared/domain.generated.js';
export interface AuditReportChart {
    key: string;
    title: string;
    option: EChartsCoreOption;
    summary: string;
}
export declare function auditReportCharts(report: AuditRunReport): AuditReportChart[];
//# sourceMappingURL=audit-report-charts.d.ts.map