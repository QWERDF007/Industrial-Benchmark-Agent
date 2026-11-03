export const baseStyles = `.iad-detail-dialog,.iad-floating-menu-panel{overflow-wrap:anywhere;font:var(--dsh-content-font-size,.875rem)/1.571429 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
.iad-panel{min-width:0;padding:24px;border:1px solid var(--iad-border);border-radius:var(--iad-radius);background:var(--iad-surface)}.iad-panel>h3:first-child{margin-top:0}
.iad-workbench {container:workbench / inline-size;height:100%;box-sizing:border-box;overflow:auto;scrollbar-gutter:stable;min-width:0;padding:var(--iad-page-padding);color:var(--iad-text);background:var(--iad-canvas);font:var(--dsh-content-font-size,.875rem)/1.571429 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;}
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

/* IBA Unified Two-Tier Dataset Hierarchy Scope Selector */
.iba-scope-selector{display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap;margin:0 0 20px}
.iba-scope-selector .parent-controls{display:flex;align-items:flex-end}
.iba-scope-selector .parent-controls .field.parent{width:265px}
.iba-scope-selector .child-controls{display:flex;align-items:flex-end;gap:10px}
.iba-scope-selector .child-controls .field.child{width:410px;position:relative}
.iba-scope-selector .field{display:flex;flex-direction:column;gap:7px;min-width:0}
.iba-scope-selector .field>label{font-size:12px;color:#586a84;font-weight:500;line-height:1.2}
.iba-scope-selector select{height:38px;min-height:38px;max-height:38px;width:100%;padding:0 34px 0 12px;border:1px solid var(--border,#c8d2e2);border-radius:5px;background-color:#fff;font-size:13px;color:#25344e;cursor:pointer;-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23566880' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-size:16px 16px;background-position:right 12px center;transition:border-color .15s ease;box-sizing:border-box}
.iba-scope-selector select:hover{border-color:#91a7d1}
.iba-scope-selector select:focus-visible{outline:2px solid #3167df;outline-offset:1px}
.iba-scope-selector .dataset-multi{position:relative;min-width:0;width:100%}
.iba-scope-selector .dataset-multi-trigger{height:38px;min-height:38px;max-height:38px;width:100%;padding:0 12px;border:1px solid var(--border,#c8d2e2);border-radius:5px;background:#fff;font-size:13px;color:#25344e;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;transition:border-color .15s ease;box-sizing:border-box;text-align:left}
.iba-scope-selector .dataset-multi-trigger:hover{border-color:#91a7d1}
.iba-scope-selector .dataset-multi-trigger:focus-visible{outline:2px solid #3167df;outline-offset:1px}
.iba-scope-selector .dataset-multi-trigger span:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1}
.iba-scope-selector .dataset-multi-chevron{width:16px;height:16px;flex:0 0 16px;display:grid;place-items:center;color:#566880;line-height:1}
.iba-scope-selector .dataset-multi-chevron svg{width:16px;height:16px;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round}
.iba-scope-selector .dataset-multi-menu{position:absolute;top:calc(100% + 5px);left:0;width:100%;min-width:290px;background:#fff;border:1px solid #cbd5e4;border-radius:6px;box-shadow:0 12px 26px rgba(27,48,82,.11);padding:5px;max-height:270px;overflow-y:auto;z-index:30}
.iba-scope-selector .dataset-multi-menu[hidden]{display:none!important}
.iba-scope-selector .child-multi-option{display:flex;align-items:center;gap:10px;min-height:36px;border-radius:4px;padding:7px 9px;cursor:pointer;color:#293852;font-size:12px;transition:background .12s ease}
.iba-scope-selector .child-multi-option:hover{background:#f2f5fb}
.iba-scope-selector .child-multi-option input{width:15px;height:15px;accent-color:#2c61da;margin:0;flex:none}
.iba-scope-selector .child-multi-option span{flex:1;overflow-wrap:anywhere;line-height:1.4}
.iba-scope-selector .refresh-btn,.iba-scope-selector .iad-subtle-icon,.iba-scope-selector .dc-icn{width:38px;height:38px;min-width:38px;max-width:38px;display:grid;place-items:center;align-self:flex-end;padding:0;flex:none;border:0;background:transparent;border-radius:5px;color:#566880;cursor:pointer;transition:background-color .15s ease,color .15s ease}
.iba-scope-selector .refresh-btn:hover,.iba-scope-selector .iad-subtle-icon:hover,.iba-scope-selector .dc-icn:hover{background:#edf3ff;color:#285fd1}
.iba-scope-selector .refresh-btn svg,.iba-scope-selector .iad-subtle-icon svg,.iba-scope-selector .dc-icn svg{width:17px;height:17px}
@media(max-width:760px){.iba-scope-selector .parent-controls,.iba-scope-selector .child-controls,.iba-scope-selector .parent-controls .field.parent,.iba-scope-selector .child-controls .field.child{width:100%}}
`;
