export const reviewStyles = `.iad-workbench[data-page=industrial-review]:has(.iad-review-focused) {display:flex;flex-direction:column;overflow:auto;}
.iad-workbench[data-page=industrial-review]:has(.iad-review-focused)>.iad-tab-panel {display:flex;flex-direction:column;flex:1;min-height:min-content;}
.iad-focused-inspector {display:flex;flex-direction:column;flex:1;min-height:min-content;padding:0;background:transparent;}
.iad-review-focused {display:flex;flex-direction:column;flex:1;min-height:0;gap:16px;}
.iad-review-focused>.iad-filters {margin:0;flex:none;background:transparent;padding:0;}
.iad-review-columns {display:grid;grid-template-columns:180px minmax(0,1fr) 300px;gap:16px;flex:1;min-height:20rem;}
.iad-review-columns>aside,.iad-review-center {min-width:0;min-height:0;}.iad-review-columns>aside {contain:size;}
.iad-review-center {display:flex;flex-direction:column;gap:12px;}
.iad-review-information {max-height:40%;overflow:auto;background:var(--iad-surface);padding:12px;border-radius:var(--iad-radius);flex:none;}
.iad-review-information>summary {cursor:pointer;min-height:24px;}
.iad-review-queue-slot {overflow:auto;}
.iad-review-queue {padding:0;background:transparent;}
.iad-review-queue .iad-grid {display:flex;flex-direction:column;gap:8px;}
.iad-review-queue button.iad-sample {display:grid;grid-template-columns:40px minmax(0,1fr);gap:0 8px;padding:8px;height:64px;}
.iad-review-queue .iad-thumb {grid-row:1/3;align-self:center;}
.iad-review-queue .iad-sample>strong {padding:0;line-height:22px;}
.iad-review-queue .iad-sample-label {padding:0;line-height:22px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.iad-review-queue .iad-pagination {flex-wrap:wrap;justify-content:center;}
.iad-review-decision-slot>.iad-decision {height:100%;}
.iad-decision {display:flex;flex-direction:column;min-height:0;background:var(--iad-surface);padding:16px;border-radius:var(--iad-radius);}
.iad-decision>h3 {margin:0 0 16px;}.iad-decision .iad-review-options{display:grid;grid-template-columns:minmax(0,1fr);gap:3px;margin:12px 0 20px}.iad-decision .iad-review-options label{min-height:36px;padding:7px 8px;border-radius:4px}.iad-decision .iad-review-options label:has(input:checked){background:var(--iad-hover);color:var(--iad-primary)}.iad-decision textarea{min-height:76px}.iad-review-records>.iad-field{max-width:360px;}
.iad-decision-scroll {min-height:0;overflow:auto;flex:1;padding:4px;scroll-padding:12px;}
.iad-review-submit {display:flex;flex-direction:column;gap:8px;padding-top:16px;flex:none;background:var(--iad-surface);}
.iad-review-submit .iad-error {margin:0;max-height:100px;overflow:auto;}
.iad-review-submit small {text-align:center;}
.iad-review-tools {display:none;gap:8px;flex:none;}
.iad-review-tools button {display:none;}
.iad-detail-dialog.iad-review-drawer {width:min(440px,100%);height:100dvh;max-height:100dvh;margin:0 0 0 auto;border-radius:0;flex-direction:column;}.iad-detail-dialog.iad-review-drawer[open]{display:flex;}
.iad-review-drawer>.iad-decision {flex:1;min-height:0;}
.iad-review-drawer .iad-review-queue {overflow:auto;}
.iad-embedded-canvas {position:relative;display:flex;flex-direction:column;flex:1;min-height:0;background:var(--iad-viewer);border-radius:var(--iad-radius);padding:12px;color:var(--iad-on-viewer);overflow:hidden;}
.iad-embedded-canvas .iad-lightbox-toolbar {gap:8px;}
.iad-embedded-canvas .iad-viewer-body {margin-top:12px;}
.iad-embedded-evidence {position:absolute;right:12px;bottom:12px;z-index:2;max-width:calc(100% - 24px);width:340px;color:var(--iad-text);background:var(--iad-surface);border-radius:var(--iad-radius);}
.iad-embedded-evidence>summary {cursor:pointer;padding:12px;min-height:44px;}
.iad-embedded-evidence .iad-inspection-panel {max-height:260px;}
@container workbench (max-width:1180px) {.iad-review-columns {grid-template-columns:minmax(0,1fr) 300px;}.iad-review-queue-slot {display:none;}.iad-review-tools {display:flex;}.iad-review-tools .iad-queue-trigger {display:block;}}
@container workbench (max-width:900px) {.iad-review-columns {grid-template-columns:minmax(0,1fr);}.iad-review-decision-slot {display:none;}.iad-review-tools .iad-decision-trigger {display:block;}}
.iad-conflict-workspace {display:grid;grid-template-columns:240px minmax(0,1fr);gap:24px;align-items:start;}
.iad-conflict-detail {display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;min-width:0;}.iad-conflict-detail>article,.iad-conflict-detail>aside {min-width:0;}
.iad-disposition-fields {border:0;min-width:0;margin:0;padding:0;}
@container workbench (max-width:1180px){.iad-conflict-detail {grid-template-columns:minmax(0,1fr);}.iad-conflict-workspace {grid-template-columns:220px minmax(0,1fr);}}
@container workbench (max-width:900px){.iad-conflict-workspace {grid-template-columns:minmax(0,1fr);}}

`;
