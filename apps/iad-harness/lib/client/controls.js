/** Shared control appearance for workbench pages, dialogs and Agent result cards. */
export const controlStyles = `
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) input,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) select,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) textarea {font:inherit;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button {cursor:pointer;background:var(--iad-surface);color:var(--iad-text);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);min-height:var(--iad-control-height);padding:8px 12px;transition:background-color 140ms,border-color 140ms;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button:hover:not(:disabled) {background:var(--iad-hover);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button:disabled {cursor:default;opacity:1;background:var(--iad-surface-muted);color:var(--iad-muted);border-color:var(--iad-border);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button.iad-danger {color:var(--iad-danger);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) input,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) select,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) textarea {min-width:0;max-width:100%;color:var(--iad-text);background:var(--iad-surface);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);padding:8px 10px;min-height:var(--iad-control-height);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) :is(input,textarea)::placeholder {color:var(--iad-muted);opacity:1;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) textarea {min-height:80px;resize:vertical;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) :is(button,input,select,textarea,summary,[tabindex]):focus-visible {outline:2px solid var(--iad-primary);outline-offset:3px;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) :is(input[type=checkbox],input[type=radio]) {min-height:20px;width:20px;margin:0;accent-color:var(--iad-primary);}
button.iad-button {display:inline-flex;align-items:center;justify-content:center;gap:var(--iad-space-2);box-sizing:border-box;height:var(--iad-control-height);min-height:var(--iad-control-height);padding:0 14px;font-size:var(--iad-font-size);font-weight:400;line-height:1.4;white-space:nowrap;}
button.iad-button svg {width:var(--iad-icon-size);height:var(--iad-icon-size);fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
button.iad-button[data-variant=primary] {background:var(--iad-primary-fill);border-color:var(--iad-primary-fill);color:var(--iad-on-primary);font-weight:500;}
button.iad-button[data-variant=primary]:hover:not(:disabled) {background:var(--iad-primary-hover);border-color:var(--iad-primary-hover);}
button.iad-button[data-variant=danger] {background:var(--iad-danger);border-color:var(--iad-danger);color:var(--iad-on-primary);font-weight:500;}
button.iad-button[data-variant=danger]:hover:not(:disabled) {background:color-mix(in srgb,var(--iad-danger) 85%,#000);border-color:color-mix(in srgb,var(--iad-danger) 85%,#000);}
button.iad-button:disabled {background:var(--iad-surface-muted);color:var(--iad-muted);border-color:var(--iad-border);font-weight:400;}
@media(prefers-reduced-motion:reduce) {:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button {transition:none;}}
/* Icon controls share geometry and interaction states in every page and dialog. */
button.iad-icon-button {
  display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;
  width:var(--iad-icon-button-size,var(--iad-control-height));min-width:var(--iad-icon-button-size,var(--iad-control-height));max-width:var(--iad-icon-button-size,var(--iad-control-height));
  height:var(--iad-icon-button-size,var(--iad-control-height));min-height:var(--iad-icon-button-size,var(--iad-control-height));max-height:var(--iad-icon-button-size,var(--iad-control-height));
  padding:0;flex:none;border:1px solid transparent;border-radius:var(--iad-radius);
  background:transparent;color:var(--iad-icon-color,var(--iad-muted));cursor:pointer;
  font:inherit;line-height:1;box-shadow:none;transition:background-color 140ms,color 140ms;
}
button.iad-icon-button svg {display:block;width:var(--iad-icon-size);height:var(--iad-icon-size);flex:none;}
button.iad-icon-button:hover:not(:disabled) {background:var(--iad-icon-hover-background,var(--iad-hover));color:var(--iad-icon-hover-color,var(--iad-primary));border-color:transparent;}
button.iad-icon-button[data-icon=delete]:hover:not(:disabled) {background:color-mix(in srgb,var(--iad-danger) 10%,transparent);color:var(--iad-danger);}
button.iad-icon-button:focus-visible {outline:2px solid var(--iad-icon-focus,var(--iad-primary));outline-offset:2px;}
button.iad-icon-button:disabled {opacity:.4;cursor:not-allowed;background:transparent;color:var(--iad-icon-color,var(--iad-muted));border-color:transparent;}
:is(.iad-workbench,.iad-detail-dialog) table {--iad-icon-button-size:var(--iad-row-action-size);}
dialog.iad-detail-dialog {--iad-icon-button-size:var(--iad-control-height);}
.iad-filter-action {align-self:flex-end;}
.full-toolbar {--iad-icon-color:var(--iad-on-viewer);--iad-icon-hover-color:var(--iad-on-viewer);--iad-icon-hover-background:rgba(255,255,255,.16);--iad-icon-focus:#a1c6ff;}
`;
