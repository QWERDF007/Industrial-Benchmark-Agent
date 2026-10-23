export const formsStyles = `.iad-info-group {background:var(--iad-surface-muted);padding:14px;border-radius:8px;margin:14px 0;}
.iad-info-group h3:first-child {margin-top:0;}
.iad-analysis {margin-top:14px;font-size:12px;overflow-wrap:anywhere;}
.iad-analysis summary {cursor:pointer;color:var(--iad-primary);}
.iad-multiselect {align-self:end;min-width:135px;}
.iad-multiselect summary {cursor:pointer;list-style:none;background:var(--iad-surface);color:var(--iad-text);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);padding:8px 12px;min-height:var(--iad-control-height);font-size:14px;}
.iad-floating-menu>summary {display:flex;align-items:center;justify-content:space-between;gap:12px;}
.iad-floating-menu summary::marker {content:"";}
.iad-floating-menu[open]>summary {border-color:var(--iad-primary);}
.iad-reference-grid button {padding:0;border:0;line-height:0;}
.iad-job-section {padding:20px;margin-bottom:18px;background:var(--iad-surface);border:0;border-radius:var(--iad-radius);}
.iad-job-section h2 {margin-top:0;}
.iad-evidence-preview {display:flex;align-items:center;gap:10px;width:100%;margin:10px 0;text-align:left;font-size:12px!important;}
.iad-evidence-preview img {width:90px;height:70px;object-fit:contain;background:var(--iad-surface-muted);}
.iad-quality-report dt {color:var(--iad-muted);}
.iad-profile {padding:14px;background:var(--iad-surface-muted);border-radius:8px;overflow-wrap:anywhere;}
.iad-filter-summary {display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:var(--iad-muted);font-size:13px;margin:8px 0;}
.iad-search {flex:1 1 180px;max-width:300px;}
.iad-search input {width:100%;}
.iad-source-controls {background:var(--iad-hover);border-radius:var(--iad-radius);padding:12px 16px;display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;}
.iad-source-check {position:absolute;right:8px;top:8px;z-index:2;display:flex;padding:5px;background:var(--iad-surface);border-radius:6px;cursor:pointer;}
.iad-source-check input {margin:0;}
.iad-dialog-header {display:flex;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:-16px;z-index:5;background:var(--iad-surface);padding:8px 0;margin-bottom:12px;}
.iad-dialog-header h2 {margin:0;}
.iad-review-options {display:flex;flex-wrap:wrap;gap:8px 16px;border:0;padding:0;margin:16px 0;}
.iad-review-options legend {margin-bottom:8px;}
.iad-review-options label {display:flex;align-items:center;gap:8px;min-height:40px;cursor:pointer;}
.iad-form-actions {display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:20px;}
.iad-section-header {display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;}
.iad-section-header h2 {margin:0;}
.iad-config-bar {display:flex;align-items:end;gap:12px;flex-wrap:wrap;}
.iad-config-bar>.iad-field {flex:1 1 220px;margin:0;min-width:0;}
.iad-config-bar select {width:100%;}
.iad-config-bar>.iad-primary {margin-left:auto;}


.iad-mining-directions {margin:16px 0;}.iad-mining-directions>summary {cursor:pointer;padding:8px 0;min-height:44px;}
.iad-directions-form,.iad-direction-group {border:0;padding:0;margin:12px 0;min-width:0;}.iad-direction-group>legend {font-weight:600;margin:8px 0;}
.iad-direction-grid {display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:8px;align-items:start;}
.iad-direction {display:flex;align-items:start;flex-wrap:wrap;gap:8px;padding:8px 12px;background:var(--iad-surface-muted);border-radius:var(--iad-radius);min-width:0;}
.iad-direction-toggle {display:flex;align-items:center;flex:1;gap:8px;cursor:pointer;min-height:44px;}.iad-direction>details {min-width:0;}.iad-direction>details[open] {flex-basis:100%;}.iad-direction>details>summary {cursor:pointer;min-height:44px;display:flex;align-items:center;color:var(--iad-muted);}
.iad-direction-add {margin:12px 0;}.iad-direction-add>summary {cursor:pointer;min-height:44px;display:flex;align-items:center;}
.iad-mining-directions pre {overflow-wrap:anywhere;}.iad-discovery-area {margin:12px 0;}.iad-discovery-area h3 {margin:0 0 8px;}

@media(max-width:760px) {.iad-main {grid-template-columns:1fr;}.iad-inspector {width:100%;}}

.iad-detail-dialog {width:min(1000px,calc(100% - 32px));max-height:calc(100% - 32px);overflow:auto;margin:auto;background:var(--iad-surface);color:var(--iad-text);border:0;border-radius:8px;padding:16px;}
.iad-detail-dialog.iad-inline-dialog {position:sticky;inset:auto;top:0;width:100%;max-width:none;max-height:none;margin:0;padding:0;overflow:visible;background:transparent;}.iad-inline-dialog .iad-inspector{position:static}
.iad-detail-dialog.iad-drawer {width:min(560px,100%);max-width:100%;height:100dvh;max-height:100dvh;margin:0 0 0 auto;border-radius:0;padding:24px;}.iad-drawer .iad-config-bar {display:grid;gap:16px;}.iad-drawer .iad-config-bar>.iad-field {margin:0;}.iad-drawer .iad-job-panel {min-width:0;}
.iad-detail-dialog.iad-confirm-dialog {width:min(440px,calc(100% - 32px));}
.iad-detail-dialog.iad-viewer-dialog {width:100vw;max-width:none;height:100dvh;max-height:none;margin:0;padding:0;background:var(--iad-viewer);overflow:hidden;}
.iad-detail-dialog::backdrop {background:var(--iad-scrim);}
.iad-detail-dialog>.iad-row {margin-bottom:16px;}
.iad-detail-dialog .iad-inspector {border:0;box-shadow:none;}
.iad-browse {min-width:0;}

@media(max-width:760px) {.iad-header {align-items:start;}.iad-header>.iad-row {width:100%;}.iad-header select {flex:1;max-width:100%;}.iad-tabs {flex-wrap:wrap;}.iad-settings {width:100%;}.iad-pagination {flex-wrap:wrap;}.iad-lightbox {padding:12px;}.iad-lightbox-toolbar strong {flex-basis:100%;}.iad-workbench dl {grid-template-columns:80px minmax(0,1fr);}}
@container workbench (max-width:959px){.iad-workbench{--iad-page-padding:var(--iad-space-6)}}
@container workbench (max-width:639px){.iad-workbench{--iad-page-padding:var(--iad-space-4)}.iad-header{align-items:start}.iad-header-actions{width:100%}.iad-header-actions select{flex:1}.iad-model-fields{grid-template-columns:minmax(0,1fr)}}
@media(prefers-reduced-motion:reduce) {.iad-workbench * {scroll-behavior:auto;transition:none;animation:none;}}

.iad-knowledge-content>p,.iad-knowledge-content [data-field] {overflow-wrap:anywhere;}

`;
