import { jsx as _jsx } from "react/jsx-runtime";
import { Chart } from './charts/Chart.js';
export function AuditOutcomeChart({ title, normal, suspect, incomplete, description }) {
    return _jsx(Chart, { id: "outcomes", title: title, description: description, spec: { type: 'donut', unit: '张', rows: [
                { id: 'normal', label: '审计正常', value: normal, tone: 'success' },
                { id: 'suspect', label: '发现疑点', value: suspect, tone: 'warning' },
                ...(incomplete === undefined ? [] : [{ id: 'incomplete', label: '未完成', value: incomplete, tone: 'muted' }]),
            ] } });
}
export function AuditReportChart({ kind, title, rows, unit, maximum }) {
    return _jsx(Chart, { id: kind, title: title, spec: { type: 'bar', series: [{ label: '数量', unit }],
            rows: rows.map(row => ({ id: row.label, label: row.label, values: [row.value] })), maximum } });
}
