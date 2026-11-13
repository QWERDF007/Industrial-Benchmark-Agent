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
.iad-audit-definitions{table-layout:fixed;font-size:14px;line-height:1.8}
.iad-audit-definitions caption{font-size:16px}
.iad-audit-definitions th:first-child{width:136px;white-space:nowrap;font-weight:600}
.iad-audit-gallery{display:grid;gap:10px;min-width:0;padding:8px 0 4px}
.iad-audit-gallery .iad-thumbnail-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
.iad-audit-gallery button.iad-thumbnail-card{max-width:none;height:174px;padding:5px}
.iad-audit-document ul{margin:0;padding-left:22px}
@media(max-width:900px){.iad-audit-gallery .iad-thumbnail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){#audit-page .iad-audit-document h1{font-size:25px}#audit-page .iad-audit-document h2{font-size:21px}#audit-page .iad-audit-document h3{font-size:18px}#audit-page .iad-audit-document h4{font-size:16px}.iad-audit-document>.iad-report-section{padding:24px 0}}
@media print{.iad-audit-gallery nav,.iad-fullscreen-dialog{display:none!important}.iad-audit-document>.iad-report-section{break-inside:auto}.iad-audit-gallery .iad-thumbnail-card{break-inside:avoid}}
`;
