export const explorationStyles = `
.iad-exploration-page{min-width:0}.iad-job-sync{display:flex;align-items:center;flex-wrap:wrap;gap:12px 20px;min-height:44px;margin-bottom:20px;font-size:.8125rem}.iad-job-sync button{margin-left:auto}.iad-job-sync[data-state=stale]{padding:12px 16px;border-left:3px solid var(--iad-warning);background:var(--iad-surface);color:var(--iad-warning)}
.iad-exploration-setup-layout{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:24px;align-items:start}.iad-exploration-side{display:grid;gap:24px;min-width:0}.iad-exploration-side>.iad-panel{padding:20px}.iad-exploration-side .iad-form-footer{display:grid}.iad-exploration-side dl{display:grid;grid-template-columns:76px minmax(0,1fr);gap:16px 12px;margin:24px 0}.iad-exploration-side dd{margin:0;overflow-wrap:anywhere}
.iad-exploration-groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.iad-exploration-groups>section+section{border-left:1px solid var(--iad-border);padding-left:24px!important}.iad-exploration-groups h3{margin:0 0 14px}.iad-exploration-groups fieldset{border:0;padding:0;min-width:0}.iad-exploration-page textarea{width:100%}.iad-prompt-controls{display:flex;gap:12px;flex-wrap:wrap;align-items:center}.iad-prompt-controls>.iad-field{flex:1 1 220px;margin:0}.iad-prompt-controls+label{margin-top:20px}
.iad-exploration-page .iad-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:280px;padding:40px 24px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius)}.iad-exploration-page .iad-empty h2{margin:0;color:var(--iad-text)}.iad-exploration-page .iad-empty p{max-width:480px}.iad-exploration-page .iad-empty button{margin-top:8px}
.iad-exploration-results{min-width:0}.iad-exploration-results>.iad-muted{margin-bottom:20px}.iad-exploration-results>.iad-table-scroll{background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius)}
.iad-exploration-summary{margin-bottom:20px}.iad-exploration-summary>p{line-height:1.8;overflow-wrap:anywhere}.iad-exploration-summary>p[data-expanded=false]{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}.iad-exploration-summary>button{min-height:28px;padding:4px 0;border:0;background:transparent;color:var(--iad-primary);font-size:.8125rem}
.iad-exploration-results .iad-section-header>select{min-width:260px;max-width:100%}.iad-exploration-results .iad-resource-table th:nth-child(2){width:20%}.iad-exploration-results .iad-resource-table th:nth-child(3){width:80px}.iad-exploration-results .iad-resource-table th:last-child{width:160px}.iad-exploration-results .iad-resource-table td{padding:12px 16px}.iad-exploration-results .iad-resource-table td:first-child{overflow-wrap:anywhere}
.iad-exploration-limitations{margin-top:18px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius);overflow:hidden}.iad-exploration-limitations>summary{list-style:none;display:flex;align-items:center;gap:13px;min-height:54px;padding:0 18px;cursor:pointer;user-select:none}.iad-exploration-limitations>summary::-webkit-details-marker{display:none}.iad-exploration-limitations>summary:hover{background:var(--iad-hover)}.iad-exploration-limitations>summary:focus-visible{outline:2px solid var(--iad-primary);outline-offset:-2px}.iad-exploration-limitations>summary>.iad-muted,.iad-limit-count{font-size:.75rem;color:var(--iad-muted)}.iad-limit-count{margin-left:auto;white-space:nowrap}.iad-limit-chevron{flex:none;color:var(--iad-muted);transition:transform .15s ease}.iad-exploration-limitations[open] .iad-limit-chevron{transform:rotate(90deg)}.iad-limit-list{list-style:none;counter-reset:iad-limitation;margin:0;padding:0 18px;border-top:1px solid var(--iad-border)}.iad-limit-list>li{counter-increment:iad-limitation;display:grid;grid-template-columns:115px minmax(0,1fr);gap:14px;padding:13px 0;line-height:1.8;color:var(--iad-muted);overflow-wrap:anywhere}.iad-limit-list>li::before{content:counter(iad-limitation,decimal-leading-zero);font-weight:600}.iad-limit-list>li+li{border-top:1px solid var(--iad-border)}
.iad-exploration-jobs-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,38%);gap:24px;align-items:start}.iad-exploration-jobs-layout>.iad-job-filter{grid-column:1/-1}.iad-job-stage{display:block;white-space:normal;margin-top:6px;color:var(--iad-muted)}.iad-execution-stages{list-style:none;display:grid;gap:20px;padding:0;margin:24px 0}.iad-execution-stages li{display:flex;gap:12px;color:var(--iad-muted);align-items:start}.iad-execution-stages li>span{display:grid;place-items:center;width:24px;height:24px;flex:none;border:1px solid var(--iad-border);border-radius:50%;font-size:12px}.iad-execution-stages strong{display:block;font-weight:500}.iad-execution-stages small{display:block;margin-top:4px}.iad-execution-stages li[data-state=current]{color:var(--iad-text)}.iad-execution-stages li[data-state=current]>span{background:var(--iad-primary-fill);color:var(--iad-on-primary);border-color:var(--iad-primary-fill)}.iad-execution-stages li[data-state=done]>span{color:var(--iad-success);border-color:var(--iad-success)}
.iad-indeterminate{height:4px;overflow:hidden;border-radius:3px;background:var(--iad-border);margin:20px 0}.iad-indeterminate span{display:block;width:30%;height:100%;background:var(--iad-primary-fill);animation:iad-exploration-wait 1.8s linear infinite}.iad-indeterminate.is-stale span{animation-play-state:paused;background:var(--iad-muted)}@keyframes iad-exploration-wait{from{transform:translateX(-100%)}to{transform:translateX(433%)}}
@container workbench (max-width:1180px){.iad-exploration-setup-layout{grid-template-columns:minmax(0,1fr) 320px}.iad-exploration-jobs-layout{grid-template-columns:minmax(0,1fr)}.iad-execution-stages{grid-template-columns:repeat(4,minmax(0,1fr))}.iad-execution-stages li{flex-direction:column}}
@container workbench (max-width:960px){.iad-exploration-setup-layout{grid-template-columns:minmax(0,1fr)}.iad-exploration-side{position:static;grid-template-columns:repeat(2,minmax(0,1fr))}.iad-execution-stages{grid-template-columns:repeat(2,minmax(0,1fr))}}

.iad-execution-rail .iad-execution-stages{grid-template-columns:minmax(0,1fr)}.iad-execution-rail .iad-execution-stages li{flex-direction:row}
.iad-detail-dialog.iad-direction-dialog{width:min(1280px,calc(100vw - 64px));height:fit-content;max-height:calc(100dvh - 64px);overflow:hidden;padding:0;display:flex;flex-direction:column}.iad-direction-dialog .iad-dialog-header{position:static;flex:none;padding:22px 28px 14px;margin:0;top:0}.iad-direction-dialog .iad-dialog-header h2{font-size:1.3125rem}.iad-direction-body{min-height:0;overflow:auto;padding:0 28px 20px}.iad-direction-meta{display:flex;gap:16px;flex-wrap:wrap;color:var(--iad-muted);font-size:.75rem;padding:14px 0 20px}.iad-direction-objective{padding-bottom:20px;border-bottom:1px solid var(--iad-border)}.iad-detail-dialog.iad-direction-dialog h3{margin:0 0 12px}.iad-direction-body p{white-space:pre-line;overflow-wrap:anywhere;line-height:1.8}.iad-direction-text-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:32px;padding:20px 0;border-bottom:1px solid var(--iad-border)}.iad-direction-text-grid>section+section{padding-left:28px;border-left:1px solid var(--iad-border)}.iad-direction-text-grid ul{margin:0;padding-left:18px;display:grid;gap:10px}.iad-direction-evidence{padding-top:20px}.iad-evidence-groups{display:grid;grid-template-columns:minmax(0,var(--iad-normal-width,3fr)) minmax(0,var(--iad-defect-width,5fr));gap:24px}.iad-evidence-group{min-width:0}.iad-evidence-group h4{display:flex;justify-content:space-between;gap:8px;margin:0 0 10px;font-size:.75rem;font-weight:500;color:var(--iad-muted)}.iad-evidence-thumbnails>div:first-child{display:grid;grid-template-columns:repeat(var(--iad-evidence-columns),minmax(0,1fr));gap:10px}.iad-direction-evidence-item{display:grid;gap:6px;text-align:left;min-width:0;padding:5px!important;border-color:var(--iad-border)!important}.iad-direction-evidence-item img{width:100%;height:104px;object-fit:contain;background:var(--iad-surface-muted)}.iad-direction-evidence-item strong{font-size:.75rem;font-weight:500}.iad-direction-evidence-item>span{font-size:.625rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.iad-direction-evidence-item[data-focused=true]{outline:2px solid var(--iad-primary);outline-offset:2px;border-color:var(--iad-primary)!important}.iad-detail-dialog button.iad-evidence-ref{display:inline-block;max-width:100%;white-space:normal;overflow-wrap:anywhere;text-align:left;min-height:0;padding:1px 5px;vertical-align:baseline;font-size:.75rem;color:var(--iad-primary);background:var(--iad-hover);border-color:var(--iad-border)}.iad-direction-trace{margin-top:16px;padding-top:12px;border-top:1px solid var(--iad-border);overflow-wrap:anywhere}.iad-direction-trace summary{cursor:pointer;min-height:32px}.iad-direction-footer{display:flex;align-items:center;justify-content:flex-end;gap:12px;flex-wrap:wrap;flex:none;padding:14px 28px;border-top:1px solid var(--iad-border)}.iad-direction-destination{display:flex;align-items:center;gap:12px;color:var(--iad-muted);font-size:.75rem}.iad-direction-destination select{width:112px}.iad-missing-evidence{overflow-wrap:anywhere;font-size:.75rem}.iad-missing-evidence code{display:block}
@media(max-width:1050px){.iad-evidence-groups{grid-template-columns:minmax(0,1fr)}.iad-evidence-thumbnails>div:first-child{grid-template-columns:repeat(5,minmax(0,1fr))}}

@media(prefers-reduced-motion:reduce){.iad-indeterminate span{animation:none;margin:auto}}


.iad-exploration-page, #exploration-page {
  --canvas:#f5f7fa;--surface:#fff;--surface-alt:#f9fafc;--border:#dbe2eb;--border2:#e6ebf1;
  --ink:#17233a;--sub:#64748b;--blue:#285ed6;--blue-light:#eaf0ff;--hover:#f0f4fb;
  --ok:#177b53;--ok-bg:#e7f5ed;--ng:#bf394a;--ng-bg:#fdecef;--unknown:#607087;--unknown-bg:#eff2f6;
  max-width: 1580px; min-width: 0; margin: auto;
}

.exp-heading{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:20px;flex-wrap:wrap}
.exp-heading h1{margin:0;font-size:24px;font-weight:670;letter-spacing:-.4px}
.exp-heading .crumb{margin-bottom:4px}.exp-heading-actions{display:flex;align-items:center;gap:11px;min-width:0}
.exp-heading-actions select{width:min(350px,35vw);height:38px;text-overflow:ellipsis}.exp-heading-actions .primary{height:38px;padding:0 17px}
.exp-select{min-width:260px}
.exp-sync{display:flex;align-items:center;gap:13px;min-height:36px;font-size:12px;color:#6a7a91;margin:0 0 11px}
.exp-sync strong{color:#38506c;font-weight:500}.exp-sync .subtle-icon{margin-left:auto}
.exp-tabs{display:flex;gap:24px;border-bottom:1px solid var(--border);margin:0 0 22px}
.exp-tabs button{border:0;background:transparent;border-bottom:2px solid transparent;padding:12px 1px;color:#65758e;font-size:13px;border-radius:0}
.exp-tabs button.active{border-color:var(--blue);color:var(--blue);font-weight:600}
.exp-panel{border:1px solid var(--border);background:#fff;border-radius:6px;padding:21px 23px;margin:0 0 16px}
.exp-panel h2{font-size:16px;font-weight:650;margin:0}.exp-panel h3{font-size:13px;font-weight:600;margin:0}
.exp-panel-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:17px;min-height:26px}
.exp-lead{font-size:12px;color:#6c7b90;margin:6px 0 0}
.iad-workbench button.exp-btn,.exp-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;padding:0 12px!important;height:37px!important;min-height:37px!important;background:#fff!important;color:#3b4c65!important;border:1px solid #b7c5d9!important;border-radius:5px!important;font-size:12px!important}
.iad-workbench button.exp-btn:hover,.exp-btn:hover{background:#f2f6fd!important}.exp-btn:disabled{opacity:.45}
.iad-workbench button.exp-primary,.exp-primary{background:var(--blue, #285ed6)!important;color:#fff!important;border:1px solid var(--blue, #285ed6)!important;font-weight:600}
.iad-workbench button.exp-primary:hover,.exp-primary:hover{background:#1e51c2!important;border-color:#1e51c2!important}
.exp-btn-text{background:transparent;border:0;color:#2d5dcb;padding:0 4px;min-height:32px}
.exp-ghost{border:0;background:transparent;box-shadow:none;border-radius:5px;color:#67778d}
.exp-ghost:hover{background:var(--hover)}
.exp-ghost svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.exp-input{display:flex;flex-direction:column;gap:7px;color:#52637c;font-size:12px}
.exp-input input,.exp-input select{width:100%;height:38px;background:#fff}
.exp-input textarea{width:100%;resize:vertical;background:#fff;min-height:140px;max-height:470px;border:1px solid #aebdd2;border-radius:5px;padding:11px;color:#1b2b45;line-height:1.7;font:13px/1.7 system-ui,'Microsoft YaHei',sans-serif;outline:none}
.exp-input textarea:focus{border-color:var(--blue);outline:2px solid #b4c8ff}
.exp-config-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px}
.exp-steps{display:flex;align-items:center;gap:8px;color:#63748b;font-size:12px}
.exp-step{display:flex;align-items:center;gap:6px;white-space:nowrap}
.exp-step b{width:23px;height:23px;display:grid;place-items:center;border-radius:50%;font-size:11px;font-weight:650;border:1px solid #cdd7e6}
.exp-step.on{color:#2459c5;font-weight:650}.exp-step.on b{background:#285ed6;color:#fff;border-color:#285ed6}
.exp-step-line{width:29px;height:1px;background:#cbd5e5}
.exp-samples{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.exp-sample{border:1px solid #dce4ee;border-radius:6px;padding:16px;min-width:0;background:#fff}
.exp-sample-head{display:flex;align-items:end;justify-content:space-between;gap:14px}
.exp-sample-head strong{font-size:14px}.exp-sample-head span{font-size:12px;color:#6b7b90}
.exp-sample-tools{display:flex;align-items:end;gap:10px;margin:12px 0}.exp-sample-tools .exp-input{width:120px}
.exp-sample-tools .exp-input input{height:36px}
.exp-previews{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;min-height:102px;margin:16px 0 12px}
.exp-preview{min-width:0}.exp-preview img{display:block;width:100%;height:89px;object-fit:contain;background:#f0f4f9;border-radius:4px;border:1px solid #e5eaf1}
.exp-preview span{font-size:11px;color:#6b7b90;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;padding-top:4px}
.exp-preview.empty{min-height:0;grid-column:1/-1;border:1px dashed #dce4ef;background:#fafbfe;display:flex;align-items:center;justify-content:center;color:#8190a6;font-size:12px;height:100px}
.exp-prompt-head{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:end;gap:10px;margin-bottom:16px}
.exp-prompt-head .exp-input{max-width:520px}.exp-prompt-head .exp-btn{align-self:end}
.exp-prompt-note{color:#64748b;font-size:12px;margin:8px 0 0}
.exp-summarybar{display:flex;align-items:center;gap:14px;justify-content:space-between;border-top:1px solid #e2e8f1;margin-top:22px;padding-top:18px}
.exp-brief{display:flex;align-items:center;gap:20px;flex-wrap:wrap;color:#53647f;font-size:12px}.exp-brief b{font-weight:650;color:#263a56}
.exp-actions{display:flex;align-items:center;gap:8px;flex:none}
.exp-alert{color:#ba3f46;font-size:12px;margin:9px 0 0}
.exp-empty{padding:62px 20px;display:flex;flex-direction:column;align-items:center;gap:14px;background:#fff;border:1px solid #dce4ee;border-radius:6px;text-align:center}
.exp-empty strong{font-size:16px;color:#26344d}.exp-empty p{font-size:13px;color:#7b8ba1;margin:0}
.exp-status{margin-bottom:17px;display:flex;justify-content:space-between;gap:15px;align-items:center}
.exp-state{font-weight:600;font-size:13px;color:#2b4d88}.exp-progress{height:5px;background:#e4eaf3;border-radius:4px;overflow:hidden;margin:12px 0}
.exp-progress>i{height:100%;width:35%;display:block;background:#3771df;animation:exp-slide 2s linear infinite}
@keyframes exp-slide{from{transform:translateX(-110%)}to{transform:translateX(300%)}}
.exp-phase-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:6px 0 0}
.exp-phase{display:flex;gap:8px;align-items:start;font-size:12px;color:#8190a6;min-width:0}.exp-phase b{display:grid;place-items:center;width:22px;height:22px;border:1px solid #ccd8e7;border-radius:50%;flex:none;font-size:11px}
.exp-phase.done{color:#16825e}.exp-phase.active{color:#2c5ecb;font-weight:600}.exp-phase.active b{background:#2b61d5;color:#fff;border-color:#2b61d5}
.exp-result-controls{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:0 0 14px}
.exp-result-controls select{min-width:230px}
.exp-table{width:100%;border-collapse:collapse;font-size:13px;background:#fff}
.exp-table thead{background:#f1f4f9;color:#68798f}.exp-table th{font-size:12px;font-weight:500;text-align:left;padding:13px 16px}.exp-table td{border-top:1px solid #e5eaf1;padding:14px 16px;color:#35445c}.exp-table tr[data-action]:hover{background:#f7faff;cursor:pointer}.exp-table th:last-child,.exp-table td:last-child{text-align:right}
.exp-table .exp-row-title{font-weight:600;color:#253854}.exp-table .exp-row-info{display:block;font-size:12px;color:#77879c;padding-top:4px}
.exp-jobs-filters{display:flex;align-items:center;gap:10px;margin-bottom:13px}.exp-jobs-filters select{width:158px}
.exp-pill{display:inline-block;border-radius:4px;padding:3px 8px;color:#5d708d;background:#eef2f7;font-size:12px}.exp-pill.ok{background:#e8f5ee;color:#188356}.exp-pill.running{background:#e9f0ff;color:#2b5fc7}.exp-pill.fail{background:#ffedf0;color:#ae3d46}
.exp-modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#17243ab8;z-index:150;padding:30px}.exp-modal[hidden]{display:none!important}
.exp-dialog{display:flex;flex-direction:column;background:white;border:1px solid #d3ddea;width:min(900px,96vw);height:min(760px,90vh);border-radius:7px;overflow:hidden;box-shadow:0 22px 65px #1a294355}
.exp-dialog.small{width:min(530px,95vw);height:auto;max-height:90vh}
.exp-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 21px;border-bottom:1px solid #e1e7ef}
.exp-dialog-head strong{font-size:16px}.exp-dialog-main{padding:20px 22px;overflow:auto;flex:1;min-height:0}
.exp-dialog-foot{display:flex;justify-content:flex-end;align-items:center;gap:9px;padding:12px 22px;border-top:1px solid #e5eaf2}
.exp-source-tools{display:flex;justify-content:space-between;gap:14px;align-items:end;margin-bottom:12px;flex-wrap:wrap}
.exp-source-tools .exp-input{flex:1;min-width:210px}.exp-source-tools span{font-size:12px;color:#64748b}
.exp-source-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin:12px 0 0}
.exp-source-option{border:1px solid #dee6f0;background:#fff;padding:5px 5px 9px;border-radius:5px;text-align:left;min-width:0}
.exp-source-option.chosen{border-color:#3671e0;background:#f4f7ff}.exp-source-option:hover{border-color:#94b1ea}
.exp-source-option img{display:block;width:100%;height:100px;object-fit:contain;background:#eef2f8;border-radius:3px}
.exp-source-option .exp-select-meta{display:flex;gap:6px;padding:8px 2px 0;align-items:center;font-size:11px;color:#53617c}
.exp-source-option .exp-select-meta span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.exp-source-option input{height:14px;width:14px;flex:none;padding:0;accent-color:#2e62d0}
.exp-detail-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:22px}
.exp-evidence{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0 0}
.exp-evidence img{width:100%;height:120px;object-fit:contain;background:#f0f4f9;border-radius:4px}
.exp-detail-field{padding:8px 0;border-bottom:1px solid #e8edf3;font-size:13px}.exp-detail-field span{display:block;font-size:12px;color:#76869a;margin-bottom:5px}
.exp-inline-warning{margin:0 0 10px;font-size:12px;color:#a64e3e}
@media(max-width:1120px){.exp-source-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.exp-samples{gap:12px}.exp-preview img{height:72px}}
@media(max-width:850px){.exp-heading-actions select{width:220px}.exp-samples{grid-template-columns:1fr}.exp-prompt-head{grid-template-columns:1fr auto}.exp-prompt-head .exp-input{grid-column:1/-1;max-width:none}.exp-phase-grid{grid-template-columns:repeat(2,1fr)}.exp-source-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.exp-detail-grid{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.exp-progress>i{animation:none}}

/* Direction exploration scope selector: identical UI and interaction to image browsing */
.exp-scope{display:flex;align-items:flex-end;gap:14px;margin:4px 0 16px;flex-wrap:wrap}
.exp-scope .field{display:flex;flex-direction:column;gap:7px;min-width:0}
.exp-scope .field>label{font-size:12px;color:#586a84}
.exp-scope .parent{width:265px}
.exp-scope .child{position:relative;width:410px}
.exp-scope select.exp-select{
  width:100%;height:40px;padding:0 35px 0 12px;font:inherit;color:#25344e;
  background-color:#fff;border:1px solid #c8d2e2;border-radius:5px;
  -webkit-appearance:none;appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23566880' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-size:16px 16px;background-position:right 11px center;cursor:pointer;
  transition:border-color .15s ease;
}
.exp-scope select.exp-select:hover{border-color:#91a7d1}
.exp-scope select.exp-select:focus-visible{outline:2px solid #3167df;outline-offset:1px}

.exp-scope .dataset-multi{position:relative;min-width:0;width:100%}
.exp-scope .dataset-multi-trigger{
  height:40px;width:100%;padding:0 11px 0 12px;font:inherit;color:#25344e;
  background:#fff;border:1px solid #c8d2e2;border-radius:5px;
  display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;cursor:pointer;
  transition:border-color .15s ease;
}
.exp-scope .dataset-multi-trigger:hover{border-color:#91a7d1}
.exp-scope .dataset-multi-trigger:focus-visible{outline:2px solid #3167df;outline-offset:1px}
.exp-scope .dataset-multi-trigger:disabled{opacity:.5;cursor:not-allowed}
.exp-scope .dataset-multi-trigger span:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.exp-scope .dataset-multi-chevron{width:16px;height:16px;flex:0 0 16px;display:grid;place-items:center;color:#556880}
.exp-scope .dataset-multi-chevron svg{width:16px;height:16px;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round}

.exp-scope .dataset-multi-menu{
  z-index:35;position:absolute;top:calc(100% + 5px);left:0;width:100%;min-width:290px;
  background:#fff;border:1px solid #cbd5e4;border-radius:6px;
  box-shadow:0 12px 26px #1b30521c;padding:5px;max-height:270px;overflow:auto;
}
.exp-scope .dataset-multi-menu[hidden]{display:none!important}
.exp-scope .child-multi-option{
  display:flex;align-items:center;gap:10px;min-height:38px;border-radius:4px;
  padding:7px 9px;cursor:pointer;color:#293852;font-size:12px;
}
.exp-scope .child-multi-option:hover{background:#f2f5fb}
.exp-scope .child-multi-option input{accent-color:#2c61da;width:15px;height:15px;flex:none;margin:0}
.exp-scope .child-multi-option span{flex:1;overflow-wrap:anywhere;line-height:1.4}
.exp-scope .exp-child-empty{color:#748398;padding:12px}
.exp-sample-tabs{display:flex;gap:26px;border-bottom:1px solid #dfe7f0;margin-bottom:13px}
.exp-sample-tabs button{padding:12px 3px;border:0;border-bottom:2px solid transparent;background:transparent;color:#67788f;font:inherit;font-size:13px;border-radius:0}
.exp-sample-tabs button.active{border-bottom-color:var(--blue);color:var(--blue);font-weight:600}
.exp-sample-body{min-width:0}
.exp-sample-toolbar{display:flex;justify-content:space-between;align-items:center;gap:14px;margin:0 0 14px;flex-wrap:wrap}
.exp-sample-toolbar p{margin:0;color:#75869c;font-size:12px}
.exp-sample-toolbar .exp-actions{gap:10px}
.exp-previews.exp-previews-wide{grid-template-columns:repeat(6,minmax(0,1fr));gap:11px;min-height:148px;margin:0 0 3px}
.exp-previews-wide .exp-preview img{height:110px}
.exp-previews-wide .exp-preview.empty{height:156px}
.exp-source-dialog{width:min(1110px,96vw);height:min(840px,92vh)}
.exp-source-scope{display:grid;grid-template-columns:minmax(160px,1.5fr) minmax(185px,1fr) minmax(150px,1fr) auto;gap:12px;align-items:end}
.exp-source-scope .exp-input{min-width:0}
.exp-source-scope .exp-source-only{display:flex;gap:7px;align-items:center;font-size:12px;color:#52637c;min-height:38px;white-space:nowrap}
.exp-source-scope .exp-source-only input{accent-color:#2b60d2}
.exp-source-summary{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;color:#62748e;font-size:12px}
.exp-source-summary .exp-actions{gap:8px}
.exp-source-grid{grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
.exp-source-option img{height:100px}
.exp-source-option .exp-select-meta{font-size:12px}
.exp-sample-context{color:#75859c;font-size:12px;padding-bottom:12px}
.exp-samples.exp-samples-tabs{display:block}
@media(max-width:1200px){.exp-source-grid{grid-template-columns:repeat(5,minmax(0,1fr))}.exp-previews.exp-previews-wide{grid-template-columns:repeat(5,minmax(0,1fr))}}
@media(max-width:970px){.exp-source-scope{grid-template-columns:repeat(2,minmax(0,1fr))}.exp-source-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.exp-previews.exp-previews-wide{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:640px){.exp-scope>.exp-input:first-child,.exp-child-wrap{width:100%}.exp-source-scope{grid-template-columns:1fr}.exp-source-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.exp-previews.exp-previews-wide{grid-template-columns:repeat(2,minmax(0,1fr))}}


/* Exploration V3: simplify image selection without changing dataset scope or business rules */
.exp-dialog.exp-source-dialog{height:auto;max-height:min(840px,92vh);min-height:min(520px,90vh)}
.exp-sample-toolbar{justify-content:flex-end}
.exp-source-dialog .exp-source-scope-clean{display:flex;align-items:end;gap:14px;flex-wrap:wrap;margin-bottom:17px}
.exp-source-scope-clean .exp-input:first-child{flex:1 1 270px;max-width:440px}
.exp-source-scope-clean .exp-input:has(select){flex:0 1 230px;min-width:180px}
.exp-source-scope-clean .exp-source-only{margin-left:auto;min-width:80px;justify-content:center}
.exp-clear-icon{height:38px;width:38px;display:inline-flex;align-items:center;justify-content:center;flex:none;border:0;border-radius:5px;background:transparent;color:#62758d;cursor:pointer;padding:8px;transition:background .12s,color .12s}
.exp-clear-icon:hover:not(:disabled){background:#e9edf4;color:#263c5e}
.exp-clear-icon:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.exp-clear-icon:disabled{opacity:.36;cursor:not-allowed}
.exp-clear-icon svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}
.exp-source-dialog .exp-source-grid{margin-top:0}
.exp-source-dialog .exp-dialog-foot{justify-content:flex-end}
@media(max-width:650px){.exp-source-scope-clean .exp-input:first-child{max-width:none}.exp-source-scope-clean .exp-input:has(select){flex:1 1 170px}.exp-source-scope-clean .exp-source-only{margin-left:0}}

/* Exploration V4: the image grid itself is the add-image entry; clear only the active tab. */
.exp-tab-header{display:flex;align-items:stretch;justify-content:space-between;gap:16px;border-bottom:1px solid #dfe7f0;margin-bottom:15px}
.exp-tab-header .exp-sample-tabs{margin:0;border:0;gap:25px;min-width:0}
.exp-tab-header .exp-clear-icon{align-self:center;width:36px;height:36px;margin:0 1px 2px 0}
.exp-previews.exp-previews-wide{margin:0 0 3px;min-height:148px}
.exp-previews-wide .exp-preview.add-tile{height:145px;min-height:0}
.exp-add-image{width:100%;height:100%;min-height:145px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#fafbfe;border:1px dashed #c8d5e6;border-radius:5px;color:#6b7f9b;font:inherit;font-size:13px;cursor:pointer;transition:background .12s,border-color .12s,color .12s}
.exp-add-image svg{width:25px;height:25px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.exp-add-image:hover:not(:disabled){background:#f1f6ff;color:#2d61cb;border-color:#81a7ec}
.exp-add-image:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.exp-add-image:disabled{cursor:not-allowed;opacity:.5}
.exp-add-image.exp-add-empty{grid-column:1/-1;height:160px}
.exp-add-image.exp-add-empty svg{width:23px;height:23px}
@media(max-width:640px){.exp-tab-header .exp-sample-tabs{gap:12px}.exp-tab-header .exp-sample-tabs button{font-size:12px}}


/* V6：与数据集管理 / 图像浏览一致的布局，仅重整作业区 */
.exp-heading {margin-bottom:18px}
.exp-heading h1 {font-size:24px}
.exp-tabs{margin-top:16px;margin-bottom:18px}
.exp-scope{margin-top:4px;margin-bottom:12px}
.exp-job-list{padding:0;overflow:hidden}
.exp-job-list-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:17px 20px;border-bottom:1px solid #e2e8f0}
.exp-job-list-head h2{font-size:15px;font-weight:650;margin:0}
.exp-job-list-actions{display:flex;align-items:center;gap:12px}
.exp-job-list-actions .exp-input{min-width:154px;gap:0}
.exp-job-list-actions select{height:35px;width:158px}
.exp-job-count{color:#77869a;font-size:12px}
.exp-job-table-wrap{overflow-x:auto}
.exp-job-table{width:100%;border-collapse:collapse;table-layout:fixed}
.exp-job-table thead{background:#f2f5fa}
.exp-job-table th{padding:12px 18px;text-align:left;color:#65758c;font-weight:500;font-size:12px;border-bottom:1px solid #dfe6f0;white-space:nowrap}
.exp-job-table td{padding:16px 18px;border-bottom:1px solid #e5eaf1;font-size:13px;color:#354763;vertical-align:middle}
.exp-job-table tbody tr:last-child td{border-bottom:none}
.exp-job-table tbody tr[data-action]{cursor:pointer}
.exp-job-table tbody tr[data-action]:hover{background:#f5f8ff}
.exp-job-table tbody tr[data-action]:focus-visible{outline:2px solid #85aaff;outline-offset:-2px}
.exp-job-table th:nth-child(1){width:24%}.exp-job-table th:nth-child(2){width:13%}.exp-job-table th:nth-child(3){width:25%}.exp-job-table th:nth-child(4){width:18%}.exp-job-table th:nth-child(5){width:10%}
.exp-job-dataset{min-width:0;line-height:1.55}
.exp-job-dataset-name,.exp-job-dataset-parent{display:block;color:#2c405d;font-size:13px;font-weight:550;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.exp-job-dataset-children{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden;overflow-wrap:anywhere;color:#718198;font-size:12px;margin-top:2px}
.exp-job-time,.exp-job-duration{font-variant-numeric:tabular-nums;font-size:12px!important;color:#66758d!important}
.exp-job-empty{padding:36px;text-align:center;font-size:13px;color:#76869b}
.exp-job-current{padding:20px 23px 20px;margin-bottom:16px}
.exp-job-current-top{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:18px}
.exp-job-current-title{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.exp-job-current-title strong{font-size:16px;font-weight:650;color:#203650}
.exp-job-current-top .exp-btn{flex:none}
.exp-job-stats{display:flex;flex-wrap:wrap;gap:6px 20px;font-size:12px;color:#667890}
.exp-job-stats strong{font-weight:600;color:#364a68}
.exp-job-stages{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:20px}
.exp-job-stage{display:flex;gap:10px;align-items:flex-start;position:relative;min-width:0;color:#8795a9;font-size:12px}
.exp-job-stage:not(:last-child)::after{content:'';position:absolute;height:1px;background:#dce4ef;top:13px;left:37px;right:-4px}
.exp-job-stage[data-state="done"]::after{background:#b6c8ef}
.exp-job-stage-icon{position:relative;z-index:1;border:1px solid #cad5e4;background:white;color:#7a8aa2;border-radius:50%;display:grid;place-items:center;flex:none;width:27px;height:27px;font-size:12px}
.exp-job-stage[data-state="done"] .exp-job-stage-icon{border-color:#a9c0eb;color:#285ecb;background:#edf3ff}
.exp-job-stage[data-state="current"]{color:#2458c4;font-weight:600}
.exp-job-stage[data-state="current"] .exp-job-stage-icon{background:#285ed6;color:#fff;border-color:#285ed6}
.exp-job-stage-label{margin-top:4px;background:white;position:relative;z-index:1;padding-right:5px}
.exp-job-running-indicator{display:inline-block;width:6px;height:6px;background:#3164d4;border-radius:50%;margin-right:2px}
.exp-job-update-note{color:#667995;font-size:12px;margin:14px 0 0}
.exp-job-table .exp-pill{font-size:12px;border-radius:4px;font-weight:500}
.exp-pill.pending{color:#8e6d24;background:#fff5df}
.exp-job-info{margin:0;color:#64758d;font-size:12px}
.exp-job-dialog-info{display:grid;grid-template-columns:96px minmax(0,1fr);gap:13px 18px;font-size:13px;line-height:1.6}
.exp-job-dialog-info dt{color:#6e7f96}.exp-job-dialog-info dd{margin:0;overflow-wrap:anywhere;color:#273a55}
.exp-job-prompt{white-space:pre-wrap;overflow-wrap:anywhere;background:#f7f9fc;border:1px solid #e2e8f0;border-radius:5px;padding:12px 14px;line-height:1.7;margin-top:6px;max-height:235px;overflow:auto;font-size:12px;color:#31425c}
.exp-job-dialog-sub{margin:18px 0 10px;font-size:13px;font-weight:600}
.exp-job-dialog{width:min(670px,95vw)!important;height:auto!important;max-height:min(720px,90vh)!important}.exp-job-dialog .exp-dialog-main{flex:0 1 auto;max-height:calc(90vh - 140px)}
@media(max-width:980px){.exp-job-table{min-width:780px}.exp-job-stages{gap:7px}.exp-job-stage{font-size:11px}.exp-job-stats{gap:6px 12px}}
@media(max-width:650px){.exp-job-current-top{flex-direction:column}.exp-job-stages{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:14px}.exp-job-stage::after{display:none}.exp-job-list-head{align-items:flex-start;flex-direction:column}.exp-job-list-actions{width:100%;justify-content:space-between}}


/* V7: one continuous vertical workspace — job selection above, selected result below. */
.exp-unified-layout{display:flex;flex-direction:column;gap:18px;min-width:0}
.exp-unified-layout>.exp-panel{width:100%;min-width:0;box-sizing:border-box}
.exp-job-list-head{padding:18px 22px}
.exp-job-list-head .exp-job-list-actions{margin-left:auto}
.exp-job-table tbody tr[data-action="select-job"]{cursor:pointer;transition:background .12s}
.exp-job-table tbody tr[data-action="select-job"]:hover{background:#f6f9ff}
.exp-job-table tbody tr[data-selected="true"]{background:#eaf0ff}
.exp-job-table tbody tr[data-selected="true"] td:first-child{box-shadow:inset 3px 0 0 #2a62d8}
.exp-job-table tbody tr:focus-visible{outline:2px solid #2a62d8;outline-offset:-2px}
.exp-job-footer{display:flex;justify-content:flex-end;padding:10px 22px;color:#7a8a9d;font-size:12px;border-top:1px solid #edf0f5}
.exp-selected-result{padding:22px 24px 24px}
.exp-selected-head{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:0 0 19px}
.exp-selected-head>div{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.exp-selected-head h2,.exp-job-list-head h2{font-size:16px;font-weight:650;margin:0!important}
.exp-selected-sub{font-size:12px;color:#6b7b93;line-height:1.4}
.exp-result-summary{font-size:13px;color:#475a73;line-height:1.75;margin:0 0 22px;max-width:none}
.exp-result-section-head{display:flex;align-items:center;justify-content:space-between;margin:0 0 13px}
.exp-result-section-head h3{font-size:14px;margin:0;font-weight:650}
.exp-result-count{font-size:12px;color:#75869b}
.exp-direction-table th:nth-child(1){width:66%}
.exp-direction-table th:nth-child(2){width:22%}
.exp-direction-table td{vertical-align:middle}
.exp-direction-table tbody tr{cursor:pointer}
.exp-direction-table tbody tr:hover{background:#f6f9ff}
.exp-direction-table tbody tr:focus-visible{outline:2px solid #2a62d8;outline-offset:-2px}
.exp-limitations{margin-top:24px;border-top:1px solid #e2e8f0;padding-top:19px}
.exp-limitations ol{margin:0;padding-left:20px;display:grid;gap:8px;color:#465670;font-size:13px;line-height:1.75}
.exp-limitations ol li{padding-left:3px}
.exp-result-neutral{font-size:12px;color:#70819a;margin-top:18px}
.exp-error-message{color:#a23043;background:#fff6f7;border:1px solid #f3d7dc;padding:13px 15px;border-radius:5px;font-size:13px;line-height:1.6}
.exp-unified-empty{min-height:165px!important}
@media(max-width:900px){.exp-selected-result{padding:17px}.exp-selected-head{align-items:flex-start;flex-direction:column}.exp-direction-table th:nth-child(1){width:auto}}

/* V8: fixed overlay drawer, does NOT resize the page or the job/results workspace. */
.exp-prompt-action-col{width:128px;text-align:right!important}
.exp-prompt-link{border:0;background:transparent;color:#245bcc;font:inherit;font-size:12px;padding:6px 5px;cursor:pointer;border-radius:5px;white-space:nowrap}
.exp-prompt-link:hover{background:#edf3ff}
.exp-prompt-link:focus-visible{outline:2px solid #2d65da;outline-offset:1px}
.exp-prompt-overlay{position:fixed!important;inset:0!important;z-index:400!important;display:flex!important;align-items:stretch!important;justify-content:flex-end!important;padding:0!important;background:rgba(22,33,51,.36)!important}
.exp-prompt-drawer{box-sizing:border-box;flex:none;width:min(560px,100vw);height:100dvh;max-height:100dvh;background:white;border-left:1px solid #d6deeb;box-shadow:-15px 0 45px #15223830;display:flex;flex-direction:column;min-width:0;animation:exp-drawer-enter .15s ease-out}
@keyframes exp-drawer-enter{from{transform:translateX(24px);opacity:.7}to{transform:translateX(0);opacity:1}}
.exp-prompt-drawer-head{flex:none;height:68px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid #e3e9f1;padding:0 22px}
.exp-prompt-drawer-head h2{font-size:17px;line-height:1.5;font-weight:650;margin:0;color:#26344c}
.exp-prompt-close{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border:0;background:transparent;border-radius:5px;padding:7px;color:#53667f;cursor:pointer}
.exp-prompt-close svg{height:19px;width:19px;fill:none;stroke:currentColor;stroke-width:1.7}
.exp-prompt-close:hover{background:#edf2f8}
.exp-prompt-drawer-content{padding:22px;overflow:auto;flex:1;min-height:0}
.exp-prompt-readonly{font:inherit;font-size:13px;font-weight:400;line-height:1.9;color:#26364f;white-space:pre-wrap;overflow-wrap:anywhere}
@media(max-width:760px){.exp-prompt-drawer-head{height:56px;padding:0 16px}.exp-prompt-drawer-content{padding:17px}.exp-prompt-action-col{width:110px}}
@media(prefers-reduced-motion:reduce){.exp-prompt-drawer{animation:none}}

/* V9 direction detail: same IBA visual system as dataset manager and image browser. */
.exp-direction-table th:nth-child(1){width:auto!important}
.exp-direction-table th:nth-child(2){width:175px!important}
.exp-direction-table th:nth-child(3){width:96px!important}
.exp-direction-table th:nth-child(4){width:135px!important;text-align:right}
.exp-direction-table td:last-child{text-align:right}
.exp-direction-table .exp-direction-action .exp-btn{min-height:32px;white-space:nowrap}
.exp-modal:has(.exp-direction-dialog),
.exp-modal.exp-direction-modal{padding:22px;background:rgba(22,34,53,.68)}
.exp-direction-dialog{width:min(1160px,calc(100vw - 44px))!important;height:auto!important;max-height:calc(100dvh - 44px)!important;min-height:0!important;border-radius:7px;box-shadow:0 18px 55px #14233f48}
.exp-direction-dialog .exp-dialog-head{padding:19px 26px 15px!important;border-bottom:1px solid #e3e9f2;align-items:start;flex:none}
.exp-direction-dialog .exp-dialog-head>strong{font-size:17px!important;font-weight:650;line-height:1.55;min-width:0}
.exp-direction-dialog .exp-dialog-main{padding:0 26px;min-height:0;overflow:auto}
.exp-direction-dialog .exp-dialog-foot{padding:13px 26px;gap:12px;justify-content:flex-end;flex:none;background:#fff}
.exp-direction-meta{display:flex;gap:13px;align-items:center;flex-wrap:wrap;padding:12px 0 16px;font-size:12px;color:#64748b}
.exp-direction-meta strong{font-weight:550;color:#415675}
.exp-direction-body{display:block!important}
.exp-direction-body h3{font-size:13px!important;font-weight:650!important;color:#263850!important;margin:0 0 10px!important}
.exp-direction-goal{padding:0 0 17px!important;border-bottom:1px solid #e1e7f0;flex:none!important}
.exp-direction-goal p{font-size:13px!important;line-height:1.85!important;color:#31425b!important;margin:0!important}
.exp-direction-reasoning{display:grid!important;grid-template-columns:minmax(0,1.26fr) minmax(0,1fr)!important;gap:30px!important;padding:17px 0!important;border-bottom:1px solid #e1e7f0;flex:none!important}
.exp-direction-reasoning section+section{padding-left:27px!important;border-left:1px solid #e1e7f0}
.exp-direction-reasoning h3{font-size:13px!important;font-weight:650!important;color:#263850!important;margin:0 0 10px!important}
.exp-direction-reasoning p,.exp-direction-reasoning li{font-size:12.5px!important;line-height:1.85!important;color:#41516b!important;margin:0 0 9px!important}
.exp-direction-reasoning ul{padding-left:18px!important;margin:0!important}
.exp-direction-reasoning li{margin-bottom:6px!important}
:is(.iad-workbench, [data-page="industrial-exploration"], .exp-direction-dialog, body) :is(button.exp-evidence-ref, .exp-evidence-ref){display:inline-flex!important;vertical-align:baseline!important;align-items:center!important;justify-content:center!important;padding:2px 10px!important;margin:0 4px!important;min-height:27px!important;height:27px!important;max-height:27px!important;box-sizing:border-box!important;border-radius:4px!important;border:1px solid #d5e1f5!important;background:#f3f7ff!important;background-color:#f3f7ff!important;color:#285bc0!important;font-size:12px!important;font-family:inherit!important;font-weight:550!important;line-height:1.4!important;letter-spacing:normal!important;box-shadow:none!important;outline:none!important;cursor:pointer!important;white-space:nowrap!important;text-decoration:none!important;transition:background .13s ease,border-color .13s ease,box-shadow .13s ease,color .13s ease!important}
:is(.iad-workbench, [data-page="industrial-exploration"], .exp-direction-dialog, body) :is(button.exp-evidence-ref, .exp-evidence-ref):hover,
:is(.iad-workbench, [data-page="industrial-exploration"], .exp-direction-dialog, body) :is(button.exp-evidence-ref, .exp-evidence-ref):focus-visible,
:is(.iad-workbench, [data-page="industrial-exploration"], .exp-direction-dialog, body) :is(button.exp-evidence-ref, .exp-evidence-ref).is-related{background:#dce9ff!important;background-color:#dce9ff!important;border-color:#4982e9!important;color:#19499d!important;box-shadow:0 0 0 1px #91b5f2!important}
.exp-direction-evidence{padding:17px 0 22px!important;flex:none!important;display:block!important}
.exp-direction-evidence-head{display:flex;align-items:baseline;justify-content:space-between;gap:14px;margin-bottom:12px;flex:none!important}
.exp-direction-evidence-head h3{font-size:13px!important;font-weight:650!important;color:#263850!important;margin:0!important}
.exp-direction-count{font-size:12px;color:#7b899f}
.exp-direction-evidence-groups{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:24px!important;align-items:stretch!important;flex:1 1 auto!important;min-height:0!important}
.exp-direction-evidence-groups>section{min-width:0!important;display:flex!important;flex-direction:column!important;flex:1 1 auto!important;min-height:0!important}
.exp-direction-group-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:0 0 8px;font-size:12px;color:#536780}
.exp-direction-group-head strong{font-weight:550}
.exp-direction-evidence-grid{display:grid;grid-template-columns:repeat(var(--group-columns,2),minmax(0,1fr));gap:9px}
.exp-direction-evidence-card{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;position:relative!important;min-width:clamp(210px,46%,290px)!important;width:clamp(210px,46%,290px)!important;flex:1 1 auto!important;padding:8px!important;border:1px solid #dce4ef!important;border-radius:6px!important;background:#fff!important;color:#26344c;cursor:pointer!important;overflow:hidden!important;transition:background .13s,border-color .13s,box-shadow .13s}
.exp-direction-evidence-card img{width:100%!important;height:215px!important;max-height:230px!important;object-fit:contain!important;display:block;background:#f1f4f8;border-radius:4px}
.exp-direction-evidence-card .exp-ev-title{font-size:12px;font-weight:600;white-space:nowrap;padding:7px 3px 2px}
.exp-direction-evidence-card .exp-ev-file{font-size:11px;color:#7c8a9f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 3px 3px}
.exp-direction-evidence-card:hover,.exp-direction-evidence-card:focus-visible,.exp-direction-evidence-card.is-related{border-color:#3472e7;background:#f7faff;box-shadow:0 0 0 2px #3372e529}
.exp-direction-evidence-card.is-related img{background:#eaf1ff}
.exp-direction-footer-label{color:#697b95;font-size:12px}
.exp-direction-knowledge-select{width:120px!important;min-height:35px}
.exp-direction-foot-spacer{flex:1}
.exp-direction-icon{width:32px;height:32px;border:0;background:transparent;border-radius:5px;display:grid;place-items:center;color:#586a85;padding:5px;cursor:pointer}
.exp-direction-icon svg{stroke:currentColor;stroke-width:1.8;fill:none;width:20px;height:20px}
.exp-direction-icon:hover{background:#edf2fb}
.exp-direction-empty{font-size:12px;color:#7889a2;margin:0}
.exp-direction-detail-ids{border-top:1px solid #e1e7f0;padding:12px 0 18px}
.exp-direction-detail-ids summary{font-size:12px;color:#566b86;cursor:pointer}
.exp-direction-detail-ids dl{display:grid;grid-template-columns:85px minmax(0,1fr);gap:12px 14px;font-size:12px;margin:15px 0 0}
.exp-direction-detail-ids dt{color:#70819a}.exp-direction-detail-ids dd{margin:0;color:#34445d;overflow-wrap:anywhere}
.exp-evidence-lightbox{position:fixed;inset:0;z-index:700;background:#1c2534eF;display:flex;align-items:center;justify-content:center}
.exp-evidence-lightbox[hidden]{display:none}
.exp-evidence-lightbox img{display:block;max-width:calc(100vw - 150px);max-height:calc(100dvh - 68px);object-fit:contain}
.exp-evidence-lightbox button{position:absolute;display:grid;place-items:center;border:0;border-radius:6px;width:42px;height:42px;background:transparent;color:#fff;font-size:30px;cursor:pointer}
.exp-evidence-lightbox button:hover{background:#ffffff29}
.exp-evidence-lightbox .close{right:20px;top:16px}.exp-evidence-lightbox .prev{left:20px;top:50%;transform:translateY(-50%)}.exp-evidence-lightbox .next{right:20px;top:50%;transform:translateY(-50%)}
.exp-evidence-lightbox .caption{position:absolute;bottom:14px;color:#dde8f5;font-size:12px;max-width:75vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media(max-width:960px){.exp-direction-reasoning{grid-template-columns:1fr;gap:16px}.exp-direction-reasoning section+section{padding-left:0;border-left:0;border-top:1px solid #e1e7f0;padding-top:15px}.exp-direction-evidence-groups{grid-template-columns:1fr}.exp-direction-dialog .exp-dialog-main{padding:0 17px}.exp-direction-evidence-card img{height:125px}}
@media(max-width:600px){.exp-direction-evidence-groups{grid-template-columns:1fr}.exp-direction-evidence-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.exp-direction-dialog .exp-dialog-head{padding:15px 17px}.exp-direction-dialog .exp-dialog-foot{padding:12px 17px}.exp-direction-dialog .exp-dialog-foot{flex-wrap:wrap}.exp-direction-table th:nth-child(2){width:auto!important}}


/* V10 Direction evidence FlipView: two equally sized, independently scrollable panes */
.exp-direction-evidence-groups{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;align-items:stretch}
.exp-flip-pane{min-width:0;border:1px solid #dce4ef;border-radius:6px;background:#fff;overflow:hidden}
.exp-flip-pane-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 13px;border-bottom:1px solid #e5eaf2;color:#334660;font-size:13px}
.exp-flip-pane-head strong{font-weight:650}
.exp-flip-position{font-size:12px;color:#7587a2;font-variant-numeric:tabular-nums}
.exp-flip-stage{position:relative;height:268px;background:#f1f4f8;overflow:hidden;outline:none}
.exp-flip-stage:focus-visible{outline:2px solid #3474e9;outline-offset:-2px}
.exp-flip-hit{position:absolute;inset:0;display:grid;place-items:center;border:0;background:transparent;padding:0;cursor:zoom-in;width:100%;height:100%;color:inherit}
.exp-flip-hit img{display:block;height:100%;width:100%;object-fit:contain;pointer-events:none}
.exp-flip-hit:hover,.exp-flip-hit:focus-visible,.exp-flip-hit.is-related{box-shadow:inset 0 0 0 3px #4d83e8}
.exp-flip-arrow{position:absolute;z-index:2;top:50%;transform:translateY(-50%);border:0;border-radius:6px;color:#4d607b;background:rgba(255,255,255,.20);width:34px;height:48px;display:grid;place-items:center;padding:0;font-size:29px;line-height:1;transition:background .16s,color .16s;cursor:pointer}
.exp-flip-arrow:hover,.exp-flip-arrow:focus-visible{background:rgba(255,255,255,.90);color:#255fce}
.exp-flip-arrow.prev{left:8px}.exp-flip-arrow.next{right:8px}
.exp-flip-caption{min-height:51px;padding:9px 13px 11px;display:flex;align-items:baseline;gap:11px;font-size:12px;color:#273954}
.exp-flip-caption strong{flex:none;font-weight:650}
.exp-flip-caption span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#75839b;min-width:0}
.exp-flip-dots{display:flex;align-items:center;justify-content:center;gap:6px;padding:0 12px 10px;min-height:17px}
.exp-flip-dot{width:5px;height:5px;border-radius:50%;background:#c5d0e0;display:block;transition:width .15s,background .15s}
.exp-flip-dot.active{width:17px;border-radius:4px;background:#3773d9}
.exp-flip-empty{height:268px;display:grid;place-items:center;color:#8492a7;font-size:12px;background:#f6f8fb}
.exp-flip-stage[data-flip-wheel=true]:hover{cursor:default}
@media(max-width:720px){.exp-direction-evidence-groups{grid-template-columns:1fr}.exp-flip-stage,.exp-flip-empty{height:240px}}


/* V11: compact evidence thumbnail scroll strips, two equal regions. */
.exp-direction-evidence-groups{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;align-items:start}
.exp-scroll-group{min-width:0}
.exp-scroll-group .exp-direction-group-head{font-size:13px;margin-bottom:9px}
.exp-evidence-viewport{display:flex;align-items:stretch;gap:10px;overflow-x:auto;overflow-y:hidden;overscroll-behavior-inline:contain;scrollbar-width:thin;scrollbar-color:#c4d0e2 transparent;scroll-snap-type:x proximity;min-height:169px;padding:2px 2px 8px;outline:none}
.exp-evidence-viewport:focus-visible{outline:2px solid #4a7ee4;outline-offset:2px}
.exp-evidence-viewport .exp-direction-evidence-card{width:clamp(166px,45%,225px);min-width:clamp(166px,45%,225px);flex:none;padding:5px;scroll-snap-align:start}
.exp-evidence-viewport .exp-direction-evidence-card img{width:100%;height:108px;object-fit:contain}
.exp-evidence-viewport .exp-direction-evidence-card .exp-ev-title{font-weight:550;font-size:12px}
.exp-evidence-viewport .exp-direction-evidence-card .exp-ev-file{font-size:11px}
.exp-direction-table th:nth-child(4){width:105px!important}
.exp-direction-table .exp-direction-action .exp-direction-link{font-size:13px;min-height:30px;padding:3px 8px;border:0;background:transparent;color:#245bcc;border-radius:5px;cursor:pointer}
.exp-direction-table .exp-direction-action .exp-direction-link:hover{background:#edf3ff}
.exp-prompt-action-col{width:110px!important;min-width:100px;text-align:right!important}
.exp-job-icon-actions{display:flex;justify-content:flex-end;align-items:center;gap:6px}
.exp-row-icon{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;padding:6px;border:0;border-radius:5px;background:transparent;color:#61738e;cursor:pointer}
.exp-row-icon svg{width:18px;height:18px;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round;fill:none}
.exp-row-icon:hover{background:#eaf1ff;color:#255ac7}
.exp-row-icon.danger:hover{background:#fff0f2;color:#bb3246}
.exp-row-icon:disabled{opacity:.36;cursor:not-allowed}
.exp-row-icon:disabled:hover{background:transparent;color:#61738e}
.exp-row-icon:focus-visible{outline:2px solid #2765dc;outline-offset:1px}
.exp-direction-action{ text-align:right; }
.exp-direction-action .exp-direction-view-icon{margin-left:auto;color:#61738e;}
.exp-direction-action .exp-direction-view-icon:hover{background:#eaf1ff;color:#255ac7;}
.exp-delete-text{font-size:14px;line-height:1.7;margin:0 0 9px}.exp-delete-note{font-size:12px;color:#697b92;line-height:1.7;margin:0}
.iad-workbench button.exp-delete-confirm,.exp-dialog .exp-delete-confirm,.exp-delete-confirm{color:#fff!important;background:#bf384a!important;border:1px solid #bf384a!important;border-color:#bf384a!important;font-weight:550!important}
.iad-workbench button.exp-delete-confirm:hover,.exp-dialog .exp-delete-confirm:hover,.exp-delete-confirm:hover{background:#a82f41!important;border-color:#a82f41!important;color:#fff!important}
@media(max-width:840px){.exp-direction-evidence-groups{grid-template-columns:1fr}.exp-evidence-viewport .exp-direction-evidence-card{width:182px;min-width:182px}}


.exp-direction-goal{padding-top:20px}
/* V13 — lean direction evidence; no auxiliary count, caption or footer controls. */
.exp-direction-dialog .exp-dialog-main{padding-bottom:20px!important}
.exp-direction-evidence{padding-bottom:0!important;flex:1 1 auto!important;display:flex!important;flex-direction:column!important;min-height:0!important;margin-top:auto!important}
.exp-direction-evidence-head{margin-bottom:14px!important;flex:none!important}
.exp-direction-evidence-groups{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:24px!important;flex:1 1 auto!important;min-height:0!important;align-items:stretch!important}
.exp-scroll-group{min-width:0!important;display:flex!important;flex-direction:column!important;flex:1 1 auto!important;min-height:0!important}
.exp-evidence-viewport{min-height:245px!important;padding:4px!important;display:flex!important;gap:14px!important;overflow-x:auto!important;overflow-y:hidden!important;flex:1 1 auto!important;align-items:stretch!important}
.exp-evidence-viewport .exp-direction-evidence-card{position:relative!important;padding:8px!important;width:clamp(210px,46%,290px)!important;min-width:clamp(210px,46%,290px)!important;flex:1 1 auto!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;border:1px solid #dce4ef!important;border-radius:6px!important;background:#fff!important;cursor:pointer!important;overflow:hidden!important}
.exp-evidence-viewport .exp-direction-evidence-card img{height:215px!important;max-height:230px!important;width:100%!important;object-fit:contain!important;background:#f1f4f8;border-radius:4px}
.exp-ev-chip{position:absolute!important;top:12px!important;left:12px!important;z-index:2!important;background:rgba(255,255,255,.94)!important;border:1px solid #d0dbe9!important;color:#28446b!important;border-radius:4px!important;padding:3px 7px!important;font-size:12px!important;font-weight:650!important;line-height:1.3!important;pointer-events:none!important}
.exp-direction-evidence-card.is-related .exp-ev-chip,.exp-direction-evidence-card:hover .exp-ev-chip{background:#dbe8ff!important;border-color:#6a9bed!important;color:#2054b9!important}
.exp-direction-evidence-groups>.exp-scroll-group+ .exp-scroll-group{border-left:1px solid #e0e7f1;padding-left:19px}
@media(max-width:840px){.exp-direction-evidence-groups{grid-template-columns:1fr;gap:12px}.exp-direction-evidence-groups>.exp-scroll-group + .exp-scroll-group{border-left:0;border-top:1px solid #e0e7f1;padding-left:0;padding-top:12px}}

/* V14: aligned transparent action icons; image evidence remains visual-only. */
.exp-direction-action{white-space:nowrap!important}
.exp-direction-action .exp-row-icon{display:inline-grid!important;vertical-align:middle;margin-left:5px}
.exp-direction-table th:last-child{width:112px!important}
.exp-direction-evidence-card{overflow:hidden}
/* V15 — Align the lower candidate-directions table with the upper jobs table.
   The jobs table is full-bleed inside its panel (padding:0).
   Keep the selected-result text sections inset, but let the lower table
   reach the same panel edges and use the same header/body cell paddings. */
.exp-unified-layout .exp-selected-result{padding:22px 22px 24px;}
.exp-unified-layout .exp-selected-result > .exp-job-table-wrap{
  margin-inline:-22px;
  width:calc(100% + 44px);
  max-width:none;
}
.exp-unified-layout .exp-selected-result .exp-direction-table th{
  padding:12px 18px;
}
.exp-unified-layout .exp-selected-result .exp-direction-table td{
  padding:16px 18px;
}
@media(max-width:650px){
  .exp-unified-layout .exp-selected-result{padding:17px;}
  .exp-unified-layout .exp-selected-result > .exp-job-table-wrap{
    margin-inline:-17px;
    width:calc(100% + 34px);
  }
}

/* Unified Icon Button styles with Dataset Manager and Image Browsing */
:is(.iad-workbench, [data-page="industrial-exploration"], #exploration-page, .iad-exploration-page) :is(
  .iad-icon-button,
  .iad-subtle-icon,
  .exp-row-icon,
  .exp-ghost,
  .exp-clear-icon,
  .exp-direction-icon,
  .exp-prompt-close
) {
  border: 0 !important;
  border-color: transparent !important;
  min-height: 0 !important;
  box-shadow: none !important;
  outline: none !important;
  cursor: pointer !important;
  transition: background-color 140ms ease, color 140ms ease !important;
}

:is(.iad-workbench, [data-page="industrial-exploration"], #exploration-page, .iad-exploration-page) :is(
  .iad-icon-button,
  .iad-subtle-icon,
  .exp-row-icon,
  .exp-ghost,
  .exp-clear-icon,
  .exp-direction-icon,
  .exp-prompt-close
):not(:hover) {
  background: transparent !important;
  background-color: transparent !important;
}

:is(.iad-workbench, [data-page="industrial-exploration"], #exploration-page, .iad-exploration-page) :is(
  .iad-icon-button,
  .iad-subtle-icon,
  .exp-row-icon,
  .exp-ghost,
  .exp-clear-icon,
  .exp-direction-icon
):hover:not(:disabled) {
  background: #eaf0fe !important;
  background-color: #eaf0fe !important;
  color: var(--blue, #2458d5) !important;
}

:is(.iad-workbench, [data-page="industrial-exploration"], #exploration-page, .iad-exploration-page) :is(
  .exp-row-icon.danger,
  button[data-delete],
  button.danger
):hover:not(:disabled) {
  background: #fee4e2 !important;
  background-color: #fee4e2 !important;
  color: #d92d20 !important;
}

:is(.iad-workbench, [data-page="industrial-exploration"], #exploration-page, .iad-exploration-page) :is(
  .exp-prompt-close,
  .modal-x,
  .drawer-close
):hover:not(:disabled) {
  background: var(--hover, #eaf0fe) !important;
  background-color: var(--hover, #eaf0fe) !important;
  color: #182230 !important;
}

:is(.iad-workbench, [data-page="industrial-exploration"], #exploration-page, .iad-exploration-page) :is(
  .exp-row-icon,
  .exp-direction-icon
) {
  width: 32px !important;
  height: 32px !important;
  border-radius: 5px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 6px !important;
  color: #61738e !important;
}

:is(.iad-workbench, [data-page="industrial-exploration"], #exploration-page, .iad-exploration-page) :is(
  #refresh,
  .exp-heading-actions button.iad-subtle-icon,
  .exp-heading-actions button.exp-ghost,
  .exp-clear-icon
) {
  width: 38px !important;
  height: 38px !important;
  border-radius: 5px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  color: #667892 !important;
}

:is(.iad-workbench, [data-page="industrial-exploration"], #exploration-page, .iad-exploration-page) :is(
  .exp-row-icon,
  .exp-ghost,
  .exp-clear-icon,
  .exp-direction-icon,
  .iad-subtle-icon
) svg {
  width: 18px !important;
  height: 18px !important;
  stroke: currentColor !important;
  stroke-width: 1.8 !important;
  fill: none !important;
  stroke-linecap: round !important;
  stroke-linejoin: round !important;
}

[data-ds-dark-theme] :is(.iad-workbench, [data-page="industrial-exploration"], #exploration-page, .iad-exploration-page) :is(
  .iad-icon-button,
  .iad-subtle-icon,
  .exp-row-icon,
  .exp-ghost,
  .exp-clear-icon,
  .exp-direction-icon,
  .exp-prompt-close
):hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12) !important;
  background-color: rgba(255, 255, 255, 0.12) !important;
}

[data-ds-dark-theme] :is(.iad-workbench, [data-page="industrial-exploration"], #exploration-page, .iad-exploration-page) :is(
  .exp-row-icon.danger,
  button[data-delete],
  button.danger
):hover:not(:disabled) {
  background: rgba(217, 45, 32, 0.22) !important;
  background-color: rgba(217, 45, 32, 0.22) !important;
  color: #ff8b80 !important;
}

/* V38: 作业分页及整页滚动规范 */
.exp-unified-layout .exp-job-list .exp-job-table thead th{position:static;background:#f2f5fa}
.exp-unified-layout .exp-job-list.iba-job-multipage .exp-job-table-wrap{min-height:640px}
/* 结果面板及候选方向完整参与页面滚动，不保留任何内部纵向滚动高度限制。 */
.exp-unified-layout .exp-selected-result:not(.exp-empty-result){
  max-height:none!important;height:auto!important;overflow:visible!important;
  overscroll-behavior:auto;
}
.exp-unified-layout .exp-selected-result:not(.exp-empty-result) .exp-selected-head{position:static;background:transparent}
.exp-unified-layout .exp-selected-result > .exp-job-table-wrap{max-height:none!important;overflow-y:visible;overflow-x:auto}
.exp-result-empty-message{color:#6c7d93;font-size:13px;line-height:1.75;padding:8px 0 16px}
.exp-empty-result{min-height:165px!important}

/* 两种作业共享同一分页样式，沿用已有按钮颜色、字号、边界、圆角。 */
.iba-job-pager{display:flex;justify-content:flex-end;align-items:center;flex-wrap:wrap;gap:8px;padding:13px 20px;border-top:1px solid #e6ebf1;background:#fff;font-size:12px;color:#687993}
.iba-job-pager button{min-width:32px;height:32px;padding:0 10px;background:#fff;border:1px solid #dbe2eb;border-radius:5px;color:#445a77;cursor:pointer}
.iba-job-pager button[aria-current="page"]{background:var(--blue, #2458d5);color:#fff;border-color:var(--blue, #2458d5);font-weight:600}
.iba-job-pager button:disabled{opacity:.4;cursor:not-allowed}
.iba-job-pager .iba-job-total{margin-left:8px;white-space:nowrap;color:#73839a}
.iba-job-pager .iba-job-ellipsis{padding:0 2px;color:#8190a5}

@media(max-width:650px){
  .exp-unified-layout .exp-job-list.iba-job-multipage .exp-job-table-wrap{min-height:640px}
  .iba-job-pager{justify-content:flex-start;padding:11px 12px;gap:6px}
  .iba-job-pager .iba-job-total{margin-left:auto}
}


`;
