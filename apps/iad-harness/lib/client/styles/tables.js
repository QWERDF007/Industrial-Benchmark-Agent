export const tableStyles = `
.iad-audit-document{--iad-table-header:#F1F4F9;--iad-table-border:var(--audit-border,#dbe2eb)}
.iad-data-table{width:100%;border-collapse:collapse;text-align:left;font-variant-numeric:tabular-nums}
.iad-data-table caption{text-align:left;padding:8px 0;font-weight:600}
.iad-data-table thead{background:var(--iad-table-header,var(--iad-surface-muted))}
.iad-data-table th,.iad-data-table td{padding:10px 12px;border:0;border-bottom:1px solid var(--iad-table-border,var(--iad-section-border));text-align:left;vertical-align:top;white-space:normal;overflow-wrap:anywhere}
.iad-data-table th{font-weight:600}
@media(max-width:600px){.iad-data-table th,.iad-data-table td{padding:9px 6px}}
`;
