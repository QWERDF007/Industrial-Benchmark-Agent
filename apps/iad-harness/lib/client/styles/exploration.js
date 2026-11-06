export const explorationStyles = `
.iad-exploration-page{min-width:0}.iad-job-sync{display:flex;align-items:center;flex-wrap:wrap;gap:12px 20px;min-height:44px;margin-bottom:20px;font-size:.8125rem}.iad-job-sync button{margin-left:auto}.iad-job-sync[data-state=stale]{padding:12px 16px;border-left:3px solid var(--iad-warning);background:var(--iad-surface);color:var(--iad-warning)}
.iad-exploration-page textarea{width:100%}
.iad-exploration-page .iad-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:280px;padding:40px 24px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius)}.iad-exploration-page .iad-empty h2{margin:0;color:var(--iad-text)}.iad-exploration-page .iad-empty p{max-width:480px}.iad-exploration-page .iad-empty button{margin-top:8px}
.iad-exploration-results{min-width:0}.iad-exploration-results>.iad-muted{margin-bottom:20px}.iad-exploration-results>.iad-table-scroll{background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius)}
.iad-exploration-summary{margin-bottom:20px}.iad-exploration-summary>p{line-height:1.8;overflow-wrap:anywhere}.iad-exploration-summary>p[data-expanded=false]{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.iad-exploration-results .iad-section-header>select{min-width:260px;max-width:100%}.iad-exploration-results .iad-resource-table th:nth-child(2){width:20%}.iad-exploration-results .iad-resource-table th:nth-child(3){width:80px}.iad-exploration-results .iad-resource-table th:last-child{width:160px}.iad-exploration-results .iad-resource-table td{padding:12px 16px}.iad-exploration-results .iad-resource-table td:first-child{overflow-wrap:anywhere}
.iad-exploration-limitations{margin-top:18px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius);overflow:hidden}.iad-exploration-limitations>summary{list-style:none;display:flex;align-items:center;gap:13px;min-height:54px;padding:0 18px;cursor:pointer;user-select:none}.iad-exploration-limitations>summary::-webkit-details-marker{display:none}.iad-exploration-limitations>summary:hover{background:var(--iad-hover)}.iad-exploration-limitations>summary:focus-visible{outline:2px solid var(--iad-primary);outline-offset:-2px}.iad-exploration-limitations>summary>.iad-muted,.iad-limit-count{font-size:.75rem;color:var(--iad-muted)}.iad-limit-count{margin-left:auto;white-space:nowrap}.iad-limit-chevron{flex:none;color:var(--iad-muted);transition:transform .15s ease}.iad-exploration-limitations[open] .iad-limit-chevron{transform:rotate(90deg)}.iad-limit-list{list-style:none;counter-reset:iad-limitation;margin:0;padding:0 18px;border-top:1px solid var(--iad-border)}.iad-limit-list>li{counter-increment:iad-limitation;display:grid;grid-template-columns:115px minmax(0,1fr);gap:14px;padding:13px 0;line-height:1.8;color:var(--iad-muted);overflow-wrap:anywhere}.iad-limit-list>li::before{content:counter(iad-limitation,decimal-leading-zero);font-weight:600}.iad-limit-list>li+li{border-top:1px solid var(--iad-border)}
@container workbench (max-width:1180px){.iad-exploration-setup-layout{grid-template-columns:minmax(0,1fr) 320px}.iad-exploration-jobs-layout{grid-template-columns:minmax(0,1fr)}}
@container workbench (max-width:960px){.iad-exploration-setup-layout{grid-template-columns:minmax(0,1fr)}.iad-exploration-side{position:static;grid-template-columns:repeat(2,minmax(0,1fr))}}

.iad-detail-dialog.iad-direction-dialog{width:min(1280px,calc(100vw - 64px));height:fit-content;max-height:calc(100dvh - 64px);overflow:hidden;padding:0;display:flex;flex-direction:column}.iad-direction-dialog .iad-dialog-header{position:static;flex:none;padding:22px 28px 14px;margin:0;top:0}.iad-direction-dialog .iad-dialog-header h2{font-size:1.3125rem}.iad-direction-body{min-height:0;overflow:auto;padding:0 28px 20px}.iad-direction-meta{display:flex;gap:16px;flex-wrap:wrap;color:var(--iad-muted);font-size:.75rem;padding:14px 0 20px}.iad-direction-objective{padding-bottom:20px;border-bottom:1px solid var(--iad-border)}.iad-detail-dialog.iad-direction-dialog h3{margin:0 0 12px}.iad-direction-body p{white-space:pre-line;overflow-wrap:anywhere;line-height:1.8}.iad-direction-text-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:20px;padding:20px 0;border-bottom:1px solid var(--iad-border)}.iad-direction-text-grid>section+section{padding-top:20px;border-top:1px solid var(--iad-border)}.iad-direction-text-grid ul{margin:0;padding-left:18px;display:grid;gap:10px}.iad-direction-evidence{padding-top:20px}.iad-evidence-groups{display:grid;grid-template-columns:minmax(0,var(--iad-normal-width,3fr)) minmax(0,var(--iad-defect-width,5fr));gap:24px}.iad-evidence-group{min-width:0}.iad-evidence-group h4{display:flex;justify-content:space-between;gap:8px;margin:0 0 10px;font-size:.75rem;font-weight:500;color:var(--iad-muted)}.iad-evidence-thumbnails>div:first-child{display:grid;grid-template-columns:repeat(var(--iad-evidence-columns),minmax(0,1fr));gap:10px}.iad-direction-evidence-item{display:grid;gap:6px;text-align:left;min-width:0;padding:5px!important;border-color:var(--iad-border)!important}.iad-direction-evidence-item img{width:100%;height:104px;object-fit:contain;background:var(--iad-surface-muted)}.iad-direction-evidence-item strong{font-size:.75rem;font-weight:500}.iad-direction-evidence-item>span{font-size:.625rem;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.iad-direction-evidence-item[data-focused=true]{outline:2px solid var(--iad-primary);outline-offset:2px;border-color:var(--iad-primary)!important}.iad-detail-dialog button.iad-evidence-ref{display:inline-block;max-width:100%;white-space:normal;overflow-wrap:anywhere;text-align:left;min-height:0;padding:1px 5px;vertical-align:baseline;font-size:.75rem;color:var(--iad-primary);background:var(--iad-hover);border-color:var(--iad-border)}.iad-direction-trace{margin-top:16px;padding-top:12px;border-top:1px solid var(--iad-border);overflow-wrap:anywhere}.iad-direction-trace summary{cursor:pointer;min-height:32px}.iad-direction-footer{display:flex;align-items:center;justify-content:flex-end;gap:12px;flex-wrap:wrap;flex:none;padding:14px 28px;border-top:1px solid var(--iad-border)}.iad-direction-destination{display:flex;align-items:center;gap:12px;color:var(--iad-muted);font-size:.75rem}.iad-direction-destination select{width:112px}.iad-missing-evidence{overflow-wrap:anywhere;font-size:.75rem}.iad-missing-evidence code{display:block}
@media(max-width:1050px){.iad-evidence-groups{grid-template-columns:minmax(0,1fr)}.iad-evidence-thumbnails>div:first-child{grid-template-columns:repeat(5,minmax(0,1fr))}}



.iad-exploration-page, #exploration-page {
  --canvas:#f5f7fa;--surface:#fff;--surface-alt:#f9fafc;--border:#dbe2eb;--border2:#e6ebf1;
  --ink:#17233a;--sub:#64748b;--blue:#285ed6;--blue-light:#eaf0ff;--hover:#f0f4fb;
  --ok:#177b53;--ok-bg:#e7f5ed;--ng:#bf394a;--ng-bg:#fdecef;--unknown:#607087;--unknown-bg:#eff2f6;
  max-width: 1580px; min-width: 0; margin: auto;
}

.exp-heading{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:20px;flex-wrap:wrap}
.exp-heading h1{margin:0;font-size:24px;font-weight:670;letter-spacing:-.4px}
.exp-heading .crumb{margin-bottom:4px}.exp-heading-actions{display:flex;align-items:center;gap:11px;min-width:0}
.exp-heading-actions select{width:min(350px,35vw);height:38px;text-overflow:ellipsis}
.exp-select{min-width:260px}
.exp-sync{display:flex;align-items:center;gap:13px;min-height:36px;font-size:12px;color:#6a7a91;margin:0 0 11px}
.exp-sync strong{color:#38506c;font-weight:500}.exp-sync .subtle-icon{margin-left:auto}
.exp-panel{border:1px solid var(--border);background:#fff;border-radius:6px;padding:21px 23px;margin:0 0 16px}
.exp-panel h2{font-size:16px;font-weight:650;margin:0}.exp-panel h3{font-size:13px;font-weight:600;margin:0}
.exp-panel-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:17px;min-height:26px}
.exp-lead{font-size:12px;color:#6c7b90;margin:6px 0 0}
.exp-btn-text{background:transparent;border:0;color:#2d5dcb;padding:0 4px;min-height:32px}
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
.exp-prompt-head .exp-input{max-width:520px}.exp-prompt-head .iad-button{align-self:end}
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
.exp-table thead{background:#f1f4f9;color:#172338}.exp-table th{font-size:13px;font-weight:600;text-align:left;padding:13px 16px;color:#172338}.exp-table td{border-top:1px solid #e5eaf1;padding:14px 16px;color:#172338;font-size:13px}.exp-table tr[data-action]:hover{background:#f7faff;cursor:pointer}.exp-table th:last-child,.exp-table td:last-child{text-align:right}
.exp-table .exp-row-title{font-weight:600;color:#172338}.exp-table .exp-row-info{display:block;font-size:13px;color:#172338;padding-top:4px}
.exp-jobs-filters{display:flex;align-items:center;gap:10px;margin-bottom:13px}.exp-jobs-filters select{width:158px}
.exp-pill{display:inline-block;border-radius:4px;padding:3px 8px;color:#5d708d;background:#eef2f7;font-size:12px}.exp-pill.ok{background:#e8f5ee;color:#177b53}.exp-pill.running{background:#e9f0ff;color:#285ed6}.exp-pill.fail{background:#ffedf0;color:#b23c43}
.exp-detail-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:22px}
.exp-evidence{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 0 0}
.exp-evidence img{width:100%;height:120px;object-fit:contain;background:#f0f4f9;border-radius:4px}
.exp-detail-field{padding:8px 0;border-bottom:1px solid #e8edf3;font-size:13px}.exp-detail-field span{display:block;font-size:12px;color:#76869a;margin-bottom:5px}
.exp-inline-warning{margin:0 0 10px;font-size:12px;color:#a64e3e}
@media(max-width:1120px){.exp-samples{gap:12px}.exp-preview img{height:72px}}
@media(max-width:850px){.exp-heading-actions select{width:220px}.exp-samples{grid-template-columns:1fr}.exp-prompt-head{grid-template-columns:1fr auto}.exp-prompt-head .exp-input{grid-column:1/-1;max-width:none}.exp-phase-grid{grid-template-columns:repeat(2,1fr)}.exp-detail-grid{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.exp-progress>i{animation:none}}

.exp-sample-body{min-width:0}
.exp-sample-toolbar{display:flex;justify-content:space-between;align-items:center;gap:14px;margin:0 0 14px;flex-wrap:wrap}
.exp-sample-toolbar p{margin:0;color:#75869c;font-size:12px}
.exp-sample-toolbar .exp-actions{gap:10px}
.exp-previews.exp-previews-wide{grid-template-columns:repeat(6,minmax(0,1fr));gap:11px;min-height:148px;margin:0 0 3px}
.exp-previews-wide .exp-preview img{height:110px}
.exp-previews-wide .exp-preview.empty{height:156px}
.exp-sample-context{color:#75859c;font-size:12px;padding-bottom:12px}
.exp-samples.exp-samples-tabs{display:block}
@media(max-width:1200px){.exp-previews.exp-previews-wide{grid-template-columns:repeat(5,minmax(0,1fr))}}
@media(max-width:970px){.exp-previews.exp-previews-wide{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:640px){.exp-scope>.exp-input:first-child,.exp-child-wrap{width:100%}.exp-previews.exp-previews-wide{grid-template-columns:repeat(2,minmax(0,1fr))}}


.exp-sample-toolbar{justify-content:flex-end}
.exp-clear-icon svg{pointer-events:none}


.exp-tab-header{display:flex;align-items:stretch;justify-content:space-between;gap:16px;border-bottom:1px solid #dfe7f0;margin-bottom:15px}
.exp-tab-header .iad-tabs{margin:0;min-width:0}
.exp-tab-header .exp-clear-icon{align-self:center;margin:0 1px 2px 0}
.exp-previews.exp-previews-wide{margin:0 0 3px;min-height:148px}
.exp-previews-wide .exp-preview.add-tile{height:145px;min-height:0}
.exp-add-image{width:100%;height:100%;min-height:145px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#fafbfe;border:1px dashed #c8d5e6;border-radius:5px;color:#6b7f9b;font:inherit;font-size:13px;cursor:pointer;transition:background .12s,border-color .12s,color .12s}
.exp-add-image svg{width:25px;height:25px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.exp-add-image:hover:not(:disabled){background:#f1f6ff;color:#2d61cb;border-color:#81a7ec}
.exp-add-image:focus-visible{outline:2px solid var(--blue);outline-offset:2px}
.exp-add-image:disabled{cursor:not-allowed;opacity:.5}
.exp-add-image.exp-add-empty{grid-column:1/-1;height:160px}
.exp-add-image.exp-add-empty svg{width:23px;height:23px}


.exp-heading {margin-bottom:18px}
.exp-heading h1 {font-size:24px}
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
.exp-job-table th{padding:12px 18px;text-align:left;color:#172338;font-weight:600;font-size:13px;border-bottom:1px solid #dfe6f0;white-space:nowrap}
.exp-job-table td{padding:16px 18px;border-bottom:1px solid #e5eaf1;font-size:13px;color:#172338;vertical-align:middle}
.exp-job-table tbody tr:last-child td{border-bottom:none}
.exp-job-table tbody tr[data-action]{cursor:pointer}
.exp-job-table tbody tr[data-action]:hover{background:#f5f8ff}
.exp-job-table tbody tr[data-action]:focus-visible{outline:2px solid #85aaff;outline-offset:-2px}
.exp-job-table th:nth-child(1){width:24%}.exp-job-table th:nth-child(2){width:13%}.exp-job-table th:nth-child(3){width:25%}.exp-job-table th:nth-child(4){width:18%}.exp-job-table th:nth-child(5){width:10%}
.exp-job-dataset{min-width:0;line-height:1.55}
.exp-job-dataset-name,.exp-job-dataset-parent{display:block;color:#172338;font-size:13px;font-weight:550;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.exp-job-dataset-children{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden;overflow-wrap:anywhere;color:#172338;font-size:13px;margin-top:2px}
.exp-job-time,.exp-job-duration{font-variant-numeric:tabular-nums;font-size:13px!important;color:#172338!important}
.exp-job-empty{padding:36px;text-align:center;font-size:13px;color:#76869b}
.exp-job-current{padding:20px 23px 20px;margin-bottom:16px}
.exp-job-current-top{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:18px}
.exp-job-current-title{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.exp-job-current-title strong{font-size:16px;font-weight:650;color:#203650}
.exp-job-current-top .iad-button{flex:none}
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
.exp-job-prompt{white-space:pre-wrap;overflow-wrap:anywhere;background:#f7f9fc;border:1px solid #e2e8f0;border-radius:5px;padding:12px 14px;line-height:1.7;margin-top:6px;max-height:235px;overflow:auto;font-size:12px;color:#31425c}
@media(max-width:980px){.exp-job-table{min-width:780px}.exp-job-stages{gap:7px}.exp-job-stage{font-size:11px}.exp-job-stats{gap:6px 12px}}
@media(max-width:650px){.exp-job-current-top{flex-direction:column}.exp-job-stages{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:14px}.exp-job-stage::after{display:none}.exp-job-list-head{align-items:flex-start;flex-direction:column}.exp-job-list-actions{width:100%;justify-content:space-between}}


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

.exp-prompt-action-col{width:128px;text-align:right!important}
.exp-prompt-link{border:0;background:transparent;color:#245bcc;font:inherit;font-size:12px;padding:6px 5px;cursor:pointer;border-radius:5px;white-space:nowrap}
.exp-prompt-link:hover{background:#edf3ff}
.exp-prompt-link:focus-visible{outline:2px solid #2d65da;outline-offset:1px}


@keyframes exp-drawer-enter{from{transform:translateX(24px);opacity:.7}to{transform:translateX(0);opacity:1}}




@media(max-width:760px){.exp-prompt-action-col{width:110px}}


.exp-direction-table th:nth-child(1){width:auto!important}
.exp-direction-table th:nth-child(2){width:175px!important}
.exp-direction-table th:nth-child(3){width:96px!important}
.exp-direction-table th:nth-child(4){width:135px!important;text-align:right}
.exp-direction-table td:last-child{text-align:right}
.exp-direction-table th:last-child{width:94px!important}
.exp-direction-meta{display:flex;gap:13px;align-items:center;flex-wrap:wrap;padding:12px 0 16px;font-size:12px;color:#64748b}
.exp-direction-meta strong{font-weight:550;color:#415675}
:is(.iad-workbench, [data-page="industrial-exploration"], .exp-direction-dialog, body) :is(button.exp-evidence-ref, .exp-evidence-ref){display:inline-flex!important;vertical-align:baseline!important;align-items:center!important;justify-content:center!important;padding:2px 10px!important;margin:0 4px!important;min-height:27px!important;height:27px!important;max-height:27px!important;box-sizing:border-box!important;border-radius:4px!important;border:1px solid #d9e2ed!important;background:#fff!important;background-color:#fff!important;color:var(--iba-dialog-ink, #172338)!important;font-size:13px!important;font-family:inherit!important;font-weight:400!important;line-height:1.4!important;letter-spacing:normal!important;box-shadow:none!important;outline:none!important;cursor:pointer!important;white-space:nowrap!important;text-decoration:none!important;transition:background .13s ease,border-color .13s ease,box-shadow .13s ease,color .13s ease!important}
:is(.iad-workbench, [data-page="industrial-exploration"], .exp-direction-dialog, body) :is(button.exp-evidence-ref, .exp-evidence-ref):hover,
:is(.iad-workbench, [data-page="industrial-exploration"], .exp-direction-dialog, body) :is(button.exp-evidence-ref, .exp-evidence-ref):focus-visible,
:is(.iad-workbench, [data-page="industrial-exploration"], .exp-direction-dialog, body) :is(button.exp-evidence-ref, .exp-evidence-ref).is-related{background:#dce9ff!important;background-color:#dce9ff!important;border-color:#2458d5!important;color:#1742a0!important;box-shadow:0 0 0 1px #2458d5!important}
.exp-direction-footer-label{color:#697b95;font-size:12px}
.exp-direction-knowledge-select{width:120px!important;min-height:35px}
.exp-direction-foot-spacer{flex:1}
.exp-direction-detail-ids{border-top:1px solid #e1e7f0;padding:12px 0 18px}
.exp-direction-detail-ids summary{font-size:12px;color:#566b86;cursor:pointer}
.exp-direction-detail-ids dl{display:grid;grid-template-columns:85px minmax(0,1fr);gap:12px 14px;font-size:12px;margin:15px 0 0}
.exp-direction-detail-ids dt{color:#70819a}.exp-direction-detail-ids dd{margin:0;color:#34445d;overflow-wrap:anywhere}
.exp-evidence-lightbox{position:fixed;inset:0;z-index:700;background:#1c2534eF;display:flex;align-items:center;justify-content:center}
.exp-evidence-lightbox[hidden]{display:none}
.exp-evidence-lightbox img{display:block;max-width:calc(100vw - 150px);max-height:calc(100dvh - 68px);object-fit:contain}
.exp-evidence-lightbox button{position:absolute;display:grid;place-items:center;width:42px}
.exp-evidence-lightbox .close{right:20px;top:16px}.exp-evidence-lightbox .prev{left:20px;top:50%;transform:translateY(-50%)}.exp-evidence-lightbox .next{right:20px;top:50%;transform:translateY(-50%)}
.exp-evidence-lightbox .caption{position:absolute;bottom:14px;color:#dde8f5;font-size:12px;max-width:75vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}




.exp-direction-table th:nth-child(4){width:105px!important}
.exp-direction-table .exp-direction-action .exp-direction-link{font-size:13px;min-height:30px;padding:3px 8px;border:0;background:transparent;color:#245bcc;border-radius:5px;cursor:pointer}
.exp-direction-table .exp-direction-action .exp-direction-link:hover{background:#edf3ff}
.exp-prompt-action-col{width:110px!important;min-width:100px;text-align:right!important}
.exp-job-icon-actions{display:flex;justify-content:flex-end;align-items:center;gap:6px}
.exp-direction-action{ text-align:right; }
.exp-direction-action .exp-direction-view-icon{margin-left:auto;color:#61738e;}
.exp-direction-action .exp-direction-view-icon:hover{background:#eaf1ff;color:#255ac7;}
.exp-delete-text{font-size:14px;line-height:1.7;margin:0 0 9px}



.exp-direction-action{white-space:nowrap!important}
.exp-direction-action .exp-row-icon{vertical-align:middle;margin-left:5px}
.exp-direction-table th:last-child{width:112px!important}
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

@media(max-width:650px){
  .exp-unified-layout .exp-job-list.iba-job-multipage .exp-job-table-wrap{min-height:640px}
}

.exp-selected-result .exp-direction-table{width:100%!important;table-layout:fixed!important;min-width:850px!important}
.exp-selected-result .exp-direction-table th:nth-child(1){width:25%!important}
.exp-selected-result .exp-direction-table th:nth-child(2){width:39%!important}
.exp-selected-result .exp-direction-table th:nth-child(3){width:14%!important}
.exp-selected-result .exp-direction-table th:nth-child(4){width:10%!important}
.exp-selected-result .exp-direction-table th:nth-child(5){width:12%!important;text-align:right!important}
.exp-selected-result .exp-direction-table td{font-weight:400!important;color:var(--iba-v50-ink, #172338)!important;vertical-align:middle!important}
.exp-selected-result .exp-direction-table td.exp-direction-description{white-space:normal!important;overflow-wrap:anywhere!important;line-height:1.6!important}
.exp-selected-result .exp-direction-table td.exp-direction-name{white-space:normal!important;overflow-wrap:anywhere!important}
.exp-selected-result .exp-direction-table th:nth-child(5),.exp-selected-result .exp-direction-table td:last-child{white-space:nowrap!important;text-align:right!important}
.exp-result-section-head:empty{display:none!important}



`;
