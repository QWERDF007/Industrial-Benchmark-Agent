export const chartStyles=`
:root,.iad-workbench,[data-ds-dark-theme],dialog{
 --iad-chart-ink:var(--iad-text);--iad-chart-muted:var(--iad-muted);--iad-chart-grid:var(--iad-section-border);
 --iad-chart-surface:var(--iad-surface);--iad-chart-primary:var(--iad-primary);
 --iad-chart-success:var(--iad-success);--iad-chart-warning:var(--iad-warning);--iad-chart-danger:var(--iad-danger);--iad-chart-secondary:#8A70BC;
}
.iad-audit-document{--iad-chart-ink:#172338;--iad-chart-muted:#536174;--iad-chart-grid:#E2E8F0;
 --iad-chart-surface:#fff;--iad-chart-primary:#285ED6;--iad-chart-success:#166344;--iad-chart-warning:#8A4B06;--iad-chart-danger:#B42318}
.iad-chart{--iba-unified-ink:var(--iad-chart-ink);container-type:inline-size;margin:8px 0 18px;min-width:0;display:grid;align-content:start;gap:10px;break-inside:avoid;color:var(--iad-chart-ink)}
.iad-chart figcaption{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;font-size:16px;font-weight:650;color:var(--iad-chart-ink);line-height:1.6}
.iad-chart-controls{display:flex;min-width:0;font-size:14px;font-weight:400}
.iad-chart-controls .iad-multiselect{width:220px;max-width:100%}
.iad-chart-description{--iba-unified-ink:var(--iad-chart-muted);color:var(--iad-chart-muted);font-size:13px;margin:0}
.iad-chart-plot,.iad-chart-empty{--iad-chart-height:480px;height:var(--iad-chart-height)}
.iad-chart-plot{width:100%;min-width:0;margin-inline:auto;font-family:var(--iad-font-family)}
.iad-chart:is([data-chart-type="heatmap"],[data-chart-type="donut"]) .iad-chart-plot{width:min(100%,640px)}
.iad-chart[data-chart-type="heatmap"] :is(.iad-chart-plot,.iad-chart-empty){height:min(var(--iad-chart-height),75cqi)}
.iad-chart-empty{display:grid;place-items:center;margin:0;color:var(--iad-chart-muted);font-size:14px}
.iad-chart-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:24px;min-width:0}
.iad-distribution-summary{display:flex;flex-wrap:wrap;gap:12px 28px;font-variant-numeric:tabular-nums}
.iad-distribution-summary span{white-space:nowrap}
@media print{.iad-chart-plot{break-inside:avoid}}
`;
