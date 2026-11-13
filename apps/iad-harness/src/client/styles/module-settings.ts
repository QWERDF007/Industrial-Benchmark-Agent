export const moduleSettingsStyles=`
.iad-module-settings{container-type:inline-size;min-width:0;width:100%;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:14px;line-height:22px}
.iad-module-settings *{box-sizing:border-box}
.iad-module-row{display:flex;align-items:center;gap:8px;padding:16px 0;border-bottom:.5px solid var(--dsw-alias-border-l2)}
.iad-module-row-text{display:flex;flex-direction:column;flex:1;gap:4px;min-width:0;padding-right:48px}
.iad-setting-label{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px;overflow-wrap:anywhere}
.iad-setting-hint{margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400;line-height:18px;overflow-wrap:anywhere}
.iad-module-control{display:flex;justify-content:flex-end;flex:none;min-width:0;max-width:70%}
.iad-module-selector{display:inline-flex;align-items:center;gap:12px;max-width:100%;min-height:36px;padding:7px 14px;border:0;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;line-height:22px;cursor:pointer}
.iad-module-selector:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.iad-module-selector:disabled{cursor:default}
.iad-module-selector>span{min-width:0;overflow-wrap:anywhere;text-align:left}.iad-module-selector>svg{flex:none}
.iad-module-settings input[type=number]{width:72px;max-width:100%;height:36px;border:0;border-radius:var(--dsw-radius-md);padding:0 8px;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:14px;line-height:22px;text-align:center;font-variant-numeric:tabular-nums}
.iad-module-settings input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
.iad-module-settings input[aria-invalid=true]{outline:1px solid var(--dsw-alias-state-error-primary)}
.iad-settings-group{border:0;min-width:0;margin:0;padding:0}.iad-settings-group+ .iad-settings-group{margin-top:16px}
.iad-settings-group legend{margin:0;padding:0;font-size:14px;font-weight:400;line-height:22px;color:var(--dsw-alias-label-primary)}
.iad-module-status{margin:12px 0 0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.iad-module-status:empty{display:none}
.iad-module-settings [role=alert]{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}
.iad-module-error{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px}
.iad-module-model-select{min-width:0;max-width:100%}
.iad-module-model-menu{width:300px;max-width:calc(100vw - 24px);max-height:min(360px,calc(100vh - 24px))}
.iad-module-model-search{flex:none;margin-bottom:4px}
.iad-module-model-options{min-height:0;overflow:auto;overscroll-behavior:contain}
.iad-module-model-label{display:flex;align-items:center;gap:6px}
.iad-module-model-label>span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
.iad-module-model-label>svg{flex:none;width:14px;height:14px}
@container(max-width:400px){
 .iad-module-row{flex-direction:column;align-items:stretch;gap:8px}
 .iad-module-row-text{padding-right:0}
 .iad-module-control{width:100%;max-width:100%}
 .iad-module-control>.iad-module-model-select,.iad-module-control>span,.iad-module-selector{width:100%}
 .iad-module-error{flex-wrap:wrap}
}
`;
