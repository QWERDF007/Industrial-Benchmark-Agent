export const moduleSettingsStyles = `
.iad-module-settings{color:var(--iad-text);font:13px/1.45 var(--iad-font-family);min-width:0;max-width:820px}
.iad-module-settings *{box-sizing:border-box}
.iad-module-settings h2{font-size:14px;font-weight:500;line-height:1.5;margin:10px 0 13px}
.iad-module-row{min-height:74px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:17px 0;border-bottom:1px solid var(--iad-panel-border)}
.iad-module-row>span{font-weight:500;flex:1;min-width:0}
.iad-module-settings :is(select,input){height:38px;padding:9px 12px;border:1px solid var(--iad-control-border);border-radius:8px;background:var(--iad-surface);color:inherit;font:inherit;min-width:0;max-width:53%;box-shadow:none}
.iad-module-settings select{width:240px;flex:0 1 240px}.iad-module-settings input{width:145px;flex:0 1 145px}
.iad-module-settings :is(button,input,select):focus-visible{outline:2px solid var(--iad-primary);outline-offset:2px}.iad-module-settings :disabled{cursor:default;opacity:.55}
.iad-module-status{font-size:12px;color:var(--iad-muted);min-height:18px;margin:12px 0 0}
.iad-module-settings [role=alert]{color:var(--iad-danger);font-size:12px}.iad-module-error{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px}.iad-module-error button{border:1px solid var(--iad-control-border);border-radius:8px;background:var(--iad-surface);color:var(--iad-text);font:inherit;padding:8px 12px;cursor:pointer;white-space:nowrap}
@media(max-width:620px){.iad-module-row{gap:8px}.iad-module-settings :is(select,input){max-width:64%}.iad-module-settings select{min-width:120px}.iad-module-error{flex-wrap:wrap}}
`;
