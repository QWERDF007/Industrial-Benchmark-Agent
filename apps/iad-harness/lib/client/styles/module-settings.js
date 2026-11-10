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

.iad-module-model-select{width:240px;max-width:53%;flex:0 1 240px;min-width:0}
.iad-module-model-trigger{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;height:38px;padding:8px 12px;border:1px solid var(--iad-control-border);border-radius:8px;background:var(--iad-surface);color:inherit;font:inherit;text-align:left;cursor:pointer}
.iad-module-model-trigger>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.iad-module-model-trigger svg{flex:none}
.iad-module-model-menu{z-index:2147483000;display:flex;flex-direction:column;width:260px;padding:5px;background:var(--iad-surface,#fff);color:var(--iad-text,#242629);font:13px/1.45 var(--iad-font-family,system-ui);border:1px solid var(--iad-panel-border,#ededf0);border-radius:13px;box-shadow:0 4px 20px #00000012;outline:none;box-sizing:border-box}
.iad-module-model-menu input{width:100%;min-height:32px;margin:0;padding:6px 7px;border:0;border-radius:7px;background:transparent;outline:none;color:inherit;font:inherit;box-sizing:border-box}.iad-module-model-menu input::placeholder{color:var(--iad-muted,#90959e)}
.iad-module-model-options{overflow:auto;min-height:0;padding:0;overscroll-behavior:contain}
.iad-module-model-heading{font-size:11px;font-weight:500;color:var(--iad-muted,#868c95);padding:8px 6px 3px}
.iad-module-model-option{min-height:34px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:7px 6px;border-radius:8px;cursor:pointer;outline:none;box-sizing:border-box}.iad-module-model-option>span{overflow-wrap:anywhere}.iad-module-model-option svg{flex:none}
.iad-module-model-option:hover,.iad-module-model-option.is-active{background:var(--iad-hover,#eff0f2)}
@media(max-width:620px){.iad-module-model-select{max-width:64%}}
`;
