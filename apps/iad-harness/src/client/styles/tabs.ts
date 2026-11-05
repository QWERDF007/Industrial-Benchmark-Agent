export const tabStyles = `
.iad-tabs[role=tablist] {flex-shrink:0;display:flex;align-items:center;gap:23px;max-width:100%;overflow-x:auto;white-space:nowrap;scrollbar-width:thin;border:0;border-bottom:1px solid var(--iad-border);margin:1px 0 16px;padding:0;}
.iad-tabs[role=tablist] > button[role=tab] {position:relative;display:inline-flex;align-items:center;justify-content:center;gap:7px;flex:0 0 auto;box-sizing:border-box;height:var(--iad-tab-height);min-height:var(--iad-tab-height);padding:0 1px;margin:0;border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;color:var(--iad-muted);font:inherit;font-size:var(--iad-font-size);font-weight:400;box-shadow:none;cursor:pointer;}
.iad-tabs[role=tablist] > button[role=tab][aria-selected=true] {color:var(--iad-primary);border-bottom-color:var(--iad-primary);font-weight:600;}
.iad-tabs[role=tablist] > button[role=tab]:hover {background:transparent;color:var(--iad-primary);}
.iad-tabs[role=tablist] > button[role=tab]:focus-visible {outline:2px solid var(--iad-primary);outline-offset:-2px;}
.iad-tabs .iad-tab-count {font-size:12px;color:inherit;font-weight:500;opacity:.85;font-variant-numeric:tabular-nums;}
.iad-tab-panel {min-width:0;}
.iad-tab-panel:focus-visible {outline:2px solid var(--iad-primary);outline-offset:2px;}
@media(max-width:640px) {.iad-tabs[role=tablist] {gap:15px;}}
`;
