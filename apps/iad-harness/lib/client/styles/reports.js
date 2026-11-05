export const reportStyles = `
.iad-report-body{padding:24px;display:grid;gap:22px;min-width:0}
.iad-report-prompt textarea{width:100%;min-height:260px;margin-top:12px}
.iad-report-charts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
.iad-report-chart{margin:0;min-width:0}.iad-report-chart figcaption{margin-bottom:12px;font-weight:600}
.iad-report-bar{display:grid;grid-template-columns:100px minmax(0,1fr) 40px;align-items:center;gap:8px;margin:9px 0}
.iad-report-bar meter{width:100%;height:20px;accent-color:var(--iad-primary)}
.iad-report-section{min-width:0;display:grid;gap:12px}
.iad-report-section p{white-space:pre-wrap;line-height:1.85;overflow-wrap:anywhere}
.iad-report-data{margin:0;display:grid;gap:9px}
.iad-report-data>div{display:grid;grid-template-columns:minmax(100px,1fr) minmax(65px,.5fr) minmax(0,3fr);gap:14px}
.iad-report-data dt,.iad-report-data dd{margin:0;overflow-wrap:anywhere}
.iad-dataset-report .iad-thumbnail-grid>div{min-width:0;display:grid;justify-items:start;gap:8px}
@media(max-width:1000px){.iad-report-charts{grid-template-columns:1fr}.iad-report-data>div{grid-template-columns:minmax(0,1fr) 70px}.iad-report-data dd:last-child{grid-column:1/-1}}
`;
