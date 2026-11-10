export const reportStyles = `
.iad-report-body{padding:24px;display:grid;gap:22px;min-width:0}
.iad-report-section{min-width:0;display:grid;gap:12px}
.iad-report-section p{white-space:pre-wrap;line-height:1.85;overflow-wrap:anywhere}
.iad-workbench .iad-report-data{margin:0;display:grid;grid-template-columns:minmax(0,1fr);gap:9px}
.iad-report-data>div{display:grid;grid-template-columns:105px minmax(0,1fr);gap:14px;min-width:0}
.iad-report-data dt,.iad-report-data dd{margin:0;overflow-wrap:anywhere}
.iad-dataset-report .iad-thumbnail-grid>div{min-width:0;display:grid;justify-items:start;gap:8px}
.iad-audit-charts{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:24px;min-width:0}
.iad-audit-charts:empty{display:none}
.iad-audit-chart{margin:0;min-width:0;break-inside:avoid}
.iad-audit-chart figcaption{font-weight:600;margin-bottom:12px}
.iad-audit-chart-canvas{height:340px;width:100%;min-width:0}
.iad-audit-evidence-item{width:100%;min-width:0;display:grid;gap:8px}
.iad-audit-evidence-item>.iad-thumbnail-card{width:100%}
@media(max-width:600px){.iad-report-body{padding:16px}.iad-audit-chart-canvas{height:320px}}
@media print{.iad-audit-charts{grid-template-columns:minmax(0,1fr)}.iad-audit-chart{break-inside:avoid}}
`;
