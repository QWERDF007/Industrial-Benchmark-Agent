/** Shared control appearance for workbench pages, dialogs and Agent result cards. */
export const controlStyles = `
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) input,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) select,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) textarea {font:inherit;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button {cursor:pointer;background:var(--iad-surface);color:var(--iad-text);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);min-height:var(--iad-control-height);padding:8px 12px;transition:background-color 140ms,border-color 140ms;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button:hover:not(:disabled) {background:var(--iad-hover);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button:disabled {cursor:default;opacity:1;background:var(--iad-surface-muted);color:var(--iad-muted);border-color:var(--iad-border);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button.iad-primary {background:var(--iad-primary-fill);border-color:var(--iad-primary-fill);color:var(--iad-on-primary);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button.iad-primary:hover:not(:disabled) {background:color-mix(in srgb,var(--iad-primary-fill) 88%,#000);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button.iad-danger {color:var(--iad-danger);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) input,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) select,:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) textarea {min-width:0;max-width:100%;color:var(--iad-text);background:var(--iad-surface);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);padding:8px 10px;min-height:var(--iad-control-height);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) :is(input,textarea)::placeholder {color:var(--iad-muted);opacity:1;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) textarea {min-height:80px;resize:vertical;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) :is(button,input,select,textarea,summary,[tabindex]):focus-visible {outline:2px solid var(--iad-primary);outline-offset:3px;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) :is(input[type=checkbox],input[type=radio]) {min-height:20px;width:20px;margin:0;accent-color:var(--iad-primary);}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) .iad-icon-button {display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;padding:8px;flex-shrink:0;}
:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button.iad-primary:disabled{background:var(--iad-surface-muted);color:var(--iad-muted);border-color:var(--iad-border)}
@media(prefers-reduced-motion:reduce) {:is(.iad-workbench,.iad-tool-card,.iad-detail-dialog,.iad-floating-menu-panel) button {transition:none;}}
`;
