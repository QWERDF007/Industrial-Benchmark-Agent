import { jsx as _jsx } from "react/jsx-runtime";
import { Chart } from './charts/Chart.js';
export function AuditReportChart({ kind, title, rows, unit, maximum }) {
    return _jsx(Chart, { id: kind, title: title, spec: kind === 'outcomes' ? { type: 'donut', unit,
            rows: rows.map((row, index) => ({ id: row.label, ...row, tone: ['success', 'warning', 'muted'][index] })) }
            : { type: 'bar', series: [{ label: '数量', unit }], rows: rows.map(row => ({ id: row.label, label: row.label, values: [row.value] })), maximum } });
}
