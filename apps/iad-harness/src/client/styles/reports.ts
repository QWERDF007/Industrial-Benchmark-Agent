export const reportStyles=`
.iad-report-body{padding:24px;display:grid;gap:22px;min-width:0}
.iad-report-section{min-width:0;display:grid;gap:12px}
.iad-report-section p{white-space:pre-wrap;line-height:1.85;overflow-wrap:anywhere}
.iad-workbench .iad-report-data{margin:0;display:grid;grid-template-columns:minmax(0,1fr);gap:9px}
.iad-report-data>div{display:grid;grid-template-columns:105px minmax(0,1fr);gap:14px;min-width:0}
.iad-report-data dt,.iad-report-data dd{margin:0;overflow-wrap:anywhere}
.iad-dataset-report .iad-thumbnail-grid>div{min-width:0;display:grid;justify-items:start;gap:8px}
@media(max-width:600px){.iad-report-body{padding:16px}}

.iad-audit-document{--iba-unified-body-size:14px;width:100%;min-width:0;color:var(--audit-ink,#172338);background:#fff;font-size:14px;line-height:1.85}
#audit-page .iad-audit-document h1{font-size:28px;line-height:1.45;margin:0 0 10px;font-weight:700}
#audit-page .iad-audit-document h2{font-size:24px;line-height:1.5;margin:0 0 16px;font-weight:700}
#audit-page .iad-audit-document h3{font-size:20px;line-height:1.55;margin:18px 0 0;font-weight:650}
#audit-page .iad-audit-document h4{font-size:17px;line-height:1.6;margin:6px 0 0;font-weight:650}
#audit-page .iad-audit-document h5{font-size:15px;line-height:1.6;margin:4px 0 0;font-weight:650}
[data-capability-point]{display:grid;gap:10px;padding:8px 0}
#audit-page .iad-audit-document p{font-size:14px;line-height:1.9;margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
.iad-audit-report-intro{display:grid;gap:10px;padding:2px 0 28px}
.iad-audit-report-meta{--iba-unified-body-size:13px;--iba-unified-ink:var(--text-secondary,#536174);display:flex;flex-wrap:wrap;gap:8px 24px;color:var(--text-secondary,#536174);font-size:13px}
.iad-audit-document>.iad-report-section{display:grid;gap:14px;border-top:1px solid var(--audit-border,#dbe2eb);padding:30px 0}
#audit-page .iad-dataset-report>.audit-panel-head{border-bottom:0;background:#fff;justify-content:flex-end;padding-bottom:0}
.iad-audit-status{display:inline-block;border-radius:4px;padding:1px 9px;background:#eff2f6;color:#536174;white-space:nowrap;font-size:13px;font-weight:400}
.iad-audit-status:is([data-status=usable],[data-status=observed],[data-status=supported]){background:#e6f2eb;color:#286b49}
.iad-audit-status:is([data-status=candidate],[data-status=disputed],[data-status=pending]){background:#fff4e5;color:#835515}
.iad-audit-discovery{display:grid;gap:12px;padding:10px 0 18px;min-width:0;break-inside:avoid}
.iad-audit-definitions{width:100%;border-collapse:collapse;table-layout:fixed;text-align:left;font-size:14px;line-height:1.8}
.iad-audit-definitions caption{text-align:left;font-size:16px;font-weight:600;padding:8px 0}
.iad-audit-definitions th,.iad-audit-definitions td{padding:9px 12px;border-bottom:1px solid var(--audit-border,#dbe2eb);vertical-align:top}
.iad-audit-definitions th:first-child{width:136px;white-space:nowrap;font-weight:600}
.iad-audit-definitions thead{background:var(--iad-surface-muted,#f5f7fa)}
.iad-audit-gallery{display:grid;gap:10px;min-width:0;padding:8px 0 4px}
.iad-audit-gallery .iad-thumbnail-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
.iad-audit-gallery button.iad-thumbnail-card{max-width:none;height:174px;padding:5px}
.iad-audit-chart{display:grid;gap:10px;margin:10px 0 16px;min-width:0}
#audit-page .iad-audit-chart figcaption{--iba-unified-body-size:18px;font-size:18px;font-weight:650;margin-bottom:6px}
.iad-audit-chart-bars{display:grid;gap:16px;height:240px;border-bottom:1px solid var(--audit-border,#dbe2eb);background:repeating-linear-gradient(to top,transparent 0,transparent calc(25% - 1px),#e7edf5 calc(25% - 1px),#e7edf5 25%)}
.iad-audit-chart-column{height:100%;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end}
.iad-audit-chart-value{margin-bottom:8px;font-variant-numeric:tabular-nums;font-weight:600}
.iad-audit-chart-bar{width:min(64px,65%);flex:none;background:#5180be;border-radius:3px 3px 0 0}
.iad-audit-chart-column:nth-child(2) .iad-audit-chart-bar{background:#89a7ca}
.iad-audit-chart-column:nth-child(3) .iad-audit-chart-bar{background:#bfcee0}
.iad-audit-chart-labels{display:grid;gap:16px;text-align:center;color:var(--text-secondary,#536174)}
.iad-audit-document ul{margin:0;padding-left:22px}
@media(max-width:900px){.iad-audit-gallery .iad-thumbnail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){#audit-page .iad-audit-document h1{font-size:25px}#audit-page .iad-audit-document h2{font-size:21px}#audit-page .iad-audit-document h3{font-size:18px}#audit-page .iad-audit-document h4{font-size:16px}.iad-audit-document>.iad-report-section{padding:24px 0}.iad-audit-chart-bars{height:180px;gap:6px}.iad-audit-chart-labels{gap:6px;font-size:12px}}
@media print{.iad-audit-gallery nav,.iad-fullscreen-dialog{display:none!important}.iad-audit-document>.iad-report-section{break-inside:auto}.iad-audit-gallery .iad-thumbnail-card{break-inside:avoid}}
`;
