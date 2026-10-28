export const baseStyles = `.iad-detail-dialog,.iad-floating-menu-panel{overflow-wrap:anywhere;font:var(--dsh-content-font-size,.875rem)/1.571429 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
.iad-panel{min-width:0;padding:24px;border:1px solid var(--iad-border);border-radius:var(--iad-radius);background:var(--iad-surface)}.iad-panel>h3:first-child{margin-top:0}
.iad-workbench {container:workbench / inline-size;height:100%;box-sizing:border-box;overflow:auto;min-width:0;padding:var(--iad-page-padding);color:var(--iad-text);background:var(--iad-canvas);font:var(--dsh-content-font-size,.875rem)/1.571429 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;}
:is(.iad-workbench,.iad-detail-dialog,.iad-floating-menu-panel) * {box-sizing:border-box;}
.iad-visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.iad-field select {width:100%;}
.iad-workbench h1 {font-size:var(--iad-title-size);line-height:1.285714;margin:0;font-weight:600;}
:is(.iad-workbench,.iad-detail-dialog) h2 {font-size:var(--iad-section-size);line-height:1.4;margin:0 0 var(--iad-space-4);font-weight:600;}
:is(.iad-workbench,.iad-detail-dialog) h3 {font-size:var(--iad-group-size);line-height:1.5;margin:var(--iad-space-6) 0 var(--iad-space-2);font-weight:600;}
:is(.iad-workbench,.iad-detail-dialog) p {margin:0;}:is(.iad-workbench,.iad-detail-dialog) p+p {margin-top:12px;}
.iad-header,.iad-row {display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.iad-action-end {margin-inline-start:auto;flex:none;}
.iad-header {flex-shrink:0;justify-content:space-between;align-items:end;margin-bottom:var(--iad-section-gap);}.iad-header-actions{display:flex;align-items:center;gap:var(--iad-space-3);min-width:0;flex-wrap:wrap}.iad-header-actions select{max-width:min(100%,24rem)}.iad-breadcrumb{color:var(--iad-muted);font-size:.75rem;margin:0 0 var(--iad-space-2)}



.iad-type-switch {display:inline-flex;gap:3px;padding:3px;background:var(--iad-surface-muted);border-radius:var(--iad-radius);}
.iad-type-switch button {border-color:transparent;background:transparent;min-width:64px;min-height:32px;padding:5px 16px;}
.iad-type-switch button[aria-pressed=true] {background:var(--iad-surface);color:var(--iad-primary);font-weight:600;}
.iad-tabs {flex-shrink:0;display:flex;gap:var(--iad-space-6);margin-bottom:var(--iad-space-6);border-bottom:1px solid var(--iad-border);overflow:auto;}
.iad-tabs button {border:0;border-radius:0;border-bottom:2px solid transparent;background:transparent;min-height:44px;padding:10px 0;white-space:nowrap;color:var(--iad-muted);}
.iad-tabs button.active {background:transparent;color:var(--iad-primary);border-bottom-color:var(--iad-primary);}.iad-tab-panel{min-width:0;}.iad-tab-panel:focus-visible{outline:2px solid var(--iad-primary);outline-offset:2px;}
.iad-section-layout {display:grid;grid-template-columns:180px minmax(0,1fr);gap:32px;padding:28px 0;border-bottom:1px solid var(--iad-border);min-width:0;}
.iad-section-layout:first-child {padding-top:0;}.iad-section-layout:last-of-type {padding-bottom:0;border-bottom:0;}
.iad-section-layout>div {min-width:0;}.iad-section-layout h3 {margin:0;}.iad-section-layout .iad-field:first-child {margin-top:0;}
@container workbench (max-width:1180px){.iad-section-layout{grid-template-columns:150px minmax(0,1fr);gap:24px}}
@container workbench (max-width:900px){.iad-section-layout{grid-template-columns:minmax(0,1fr);gap:20px}}
`;
