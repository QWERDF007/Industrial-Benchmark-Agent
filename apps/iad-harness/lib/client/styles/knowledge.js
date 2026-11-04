export const knowledgeStyles = `
.iad-knowledge-setup{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px;align-items:start;min-width:0}.iad-mining-main{min-width:0}.iad-mining-main>.iad-setup-section:first-child{padding-top:0}.iad-mining-rail{display:grid;gap:20px;min-width:0}.iad-mining-rail>.iad-panel{padding:20px}.iad-mining-rail .iad-field{margin-top:0}.iad-mining-rail .iad-row{display:grid;grid-template-columns:minmax(0,1fr);align-items:start}.iad-mining-rail .iad-config-bar{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.iad-source-coverage{margin:12px 0;font-size:.75rem;color:var(--iad-muted)}.iad-source-coverage summary{cursor:pointer}.iad-knowledge-setup .iad-mining-rail .iad-short-field{width:100%}.iad-mining-rail .iad-source-picker>.iad-row{display:flex}.iad-mining-rail .iad-source-preview{margin:12px 0}.iad-mining-rail button[data-action]{width:100%;margin-top:20px}.iad-mining-rail .iad-panel>p{margin-top:16px}
.iad-directions-form{padding:0;margin:0;border:0;min-width:0}.iad-direction-tabs{display:flex;gap:24px;border-bottom:1px solid var(--iad-control-border);margin-bottom:16px;overflow:auto}.iad-direction-tabs>button{border:0;border-radius:0;border-bottom:2px solid transparent;padding:10px 0;background:transparent!important;white-space:nowrap;color:var(--iad-muted)}.iad-direction-tabs>button[aria-pressed=true]{color:var(--iad-primary);border-bottom-color:var(--iad-primary);font-weight:600}.iad-exploration-version{display:flex;align-items:center;gap:12px;max-width:480px;margin:16px 0}.iad-exploration-version select{flex:1;min-width:0}.iad-direction-tools{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin:16px 0}.iad-direction-tools>.iad-field{margin:0;flex:0 1 290px}.iad-direction-tools>.iad-field input{width:100%}.iad-direction-tools>label:not(.iad-field){display:flex;align-items:center;gap:8px;white-space:nowrap}.iad-direction-tools>button{margin-left:auto}.iad-direction-list{margin-top:8px;border-top:1px solid var(--iad-border)}.iad-direction-list>div{border-bottom:1px solid var(--iad-border);min-width:0}.iad-direction-list>div[data-focused=true]{box-shadow:inset 3px 0 var(--iad-primary)}.iad-direction-row{display:grid;grid-template-columns:20px minmax(0,1fr) 128px;gap:16px;align-items:center;min-height:76px;padding:16px 0}.iad-direction-label{min-width:0}.iad-direction-label strong{font-weight:500}.iad-direction-label p{margin:4px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.75rem;color:var(--iad-muted)}.iad-direction-actions{display:flex;justify-content:flex-end;gap:8px;align-items:center}.iad-direction-actions>button:not(.iad-icon-button){border-color:transparent;background:transparent;color:var(--iad-primary);padding:4px;min-height:32px}.iad-direction-editor{padding:0 0 20px 36px}.iad-direction-editor .iad-field{margin-top:0}.iad-direction-savebar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:20px;padding-top:20px;border-top:1px solid var(--iad-border)}.iad-direction-savebar>.iad-muted{margin-right:auto}.iad-direction-list+.iad-muted{padding:20px 0}.iad-mining-directions .iad-setup-section:last-child{border-bottom:0;padding-bottom:0}
@container workbench (max-width:1040px){.iad-knowledge-setup{grid-template-columns:minmax(0,1fr)}.iad-mining-rail{position:static;grid-template-columns:repeat(2,minmax(0,1fr))}}

.iad-knowledge-context {display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:20px;min-width:0;}
.iad-knowledge-context>.iad-field {margin:0;max-width:260px;min-width:0;}.iad-knowledge-context>.iad-field select {width:220px;max-width:100%;}
.iad-knowledge-context .iad-row {gap:12px;}.iad-knowledge-context .iad-row>button{border-color:transparent;background:transparent;color:var(--iad-primary);padding:6px 4px}
.iad-knowledge-content:not(:has(.iad-knowledge-split)){padding:24px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius)}.iad-knowledge-overview{margin:8px 0}.iad-knowledge-overview>summary{cursor:pointer;color:var(--iad-muted);font-size:12px}.iad-knowledge-content>button{margin-top:16px}
.iad-knowledge-split {display:grid;grid-template-columns:272px minmax(0,1fr);align-items:start;margin-top:20px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius);}
.iad-check-list {display:grid;gap:4px;padding:16px;border-right:1px solid var(--iad-border);min-width:0;}.iad-check-list>button {display:grid;gap:8px;text-align:left;border:0;padding:16px;}.iad-check-list>button[aria-pressed=true] {background:var(--iad-hover);color:var(--iad-primary);}.iad-check-list span {color:var(--iad-muted);font-size:12px;}
.iad-check-list [aria-label="知识条目筛选"]{display:grid;gap:12px}.iad-check-list .iad-field{margin:0}.iad-check-list [aria-label="知识条目筛选"] input{width:100%}
.iad-check-detail {min-width:0;padding:20px 32px;}.iad-freshness {margin:16px 0;}.iad-freshness>summary {cursor:pointer;min-height:40px;padding:8px 0;}
.iad-check-detail .iad-knowledge-evidence{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.iad-check-detail .iad-knowledge-evidence button{min-width:0;text-align:left}.iad-check-detail .iad-knowledge-evidence img{width:100%;height:auto;aspect-ratio:4/3;object-fit:contain}.iad-check-detail .iad-knowledge-evidence small{max-width:100%}
@container workbench (max-width:1180px){.iad-knowledge-split {grid-template-columns:240px minmax(0,1fr);}.iad-check-detail{padding:20px 24px}}
@container workbench (max-width:900px){.iad-knowledge-split {grid-template-columns:220px minmax(0,1fr);}.iad-check-detail .iad-knowledge-evidence{grid-template-columns:repeat(2,minmax(0,1fr));}}

/* V47 Knowledge Table, Prompt Drawer & Unified Actions */
.knowledge-list{width:100%;min-width:0;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:var(--iad-radius);overflow:hidden;margin-top:20px}
.knowledge-head,.knowledge-row{display:grid;grid-template-columns:minmax(250px,1fr) 122px 90px 90px 110px 84px;align-items:center;gap:12px;padding:0 20px}
.knowledge-head{min-height:43px;background:#f1f4f9;color:#172338;font-size:13px;font-weight:600;border-bottom:1px solid #dfe6f0}
.knowledge-head>span:last-child{text-align:center}
.knowledge-row{min-height:64px;padding-top:10px;padding-bottom:10px;border-bottom:1px solid #e5eaf1;background:#fff;color:#172338;cursor:pointer;font-size:13px;transition:background .12s}
.knowledge-row:hover{background:#f7faff}
.knowledge-row:focus-visible{outline:2px solid #8caef1;outline-offset:-2px;background:#f3f7ff}
.knowledge-row .row-title{display:block;color:#172338;font-size:13px;font-weight:600;line-height:1.5}
.knowledge-row .row-desc{display:block;color:#172338;font-size:13px;line-height:1.55;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.knowledge-row .col-evidence{display:flex;align-items:center}
.knowledge-row .col-action{display:flex;align-items:center;justify-content:center;min-width:0}
.knowledge-view-action{width:auto!important;min-width:70px;height:33px;padding:0 8px!important;display:inline-flex;align-items:center;justify-content:center;gap:5px;border:0;border-radius:5px;background:transparent;color:#172338!important;cursor:pointer;font-size:12px}
.knowledge-view-action svg{height:17px;width:17px;flex:none;stroke:currentColor;stroke-width:1.75;fill:none;stroke-linecap:round;stroke-linejoin:round}
.knowledge-view-action span{font-size:12px;line-height:1;color:#172338;white-space:nowrap}
.knowledge-view-action:hover{background:#edf2f8!important;color:#172338!important}
.knowledge-view-action:focus-visible{outline:2px solid #7fa3e9;outline-offset:1px}
.knowledge-pager{display:flex;align-items:center;gap:10px;justify-content:flex-end;min-height:54px;padding:10px 20px;font-size:13px;color:#172338;border-top:1px solid #e6ebf1}
.knowledge-pager .pages{display:flex;gap:6px;align-items:center}
.knowledge-pager .pagebtn{min-width:32px;height:30px;padding:0 8px;border:1px solid #cfd8e3;background:#fff;border-radius:4px;cursor:pointer;font-size:13px;color:#172338}
.knowledge-pager .pagebtn:hover{background:#f1f5fa}
.knowledge-pager .pagebtn[aria-current="page"]{background:#2458d5;color:#fff;border-color:#2458d5}
@media(max-width:960px){.knowledge-head,.knowledge-row{grid-template-columns:minmax(195px,1fr) 90px 65px 65px 90px 76px;gap:8px;padding-left:14px;padding-right:14px}}
@media(max-width:680px){.knowledge-head{display:none}.knowledge-row{grid-template-columns:minmax(0,1fr) auto 78px;gap:8px}.knowledge-row .col-evidence,.knowledge-row .col-support,.knowledge-row .col-counter{display:none}.knowledge-row .col-review{grid-column:2}.knowledge-row .col-action{grid-column:3}}

/* V47 Prompt Drawer */
.knowledge-prompt-overlay{position:fixed!important;inset:0!important;z-index:410!important;display:flex!important;align-items:stretch!important;justify-content:flex-end!important;padding:0!important;background:rgba(22,33,51,.36)!important}
.knowledge-prompt-drawer{box-sizing:border-box;width:min(560px,100vw);height:100dvh;max-height:100dvh;flex:none;background:#fff;box-shadow:-15px 0 45px #15223830;border-left:1px solid #d6deeb;display:flex;flex-direction:column;min-width:0;animation:knowledge-drawer-enter .15s ease-out}
@keyframes knowledge-drawer-enter{from{transform:translateX(24px);opacity:.7}to{transform:translateX(0);opacity:1}}
.knowledge-prompt-drawer-head{flex:none;height:68px;display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid #e3e9f1;padding:0 22px}
.knowledge-prompt-drawer-head h2{font-size:17px;line-height:1.5;font-weight:650;margin:0;color:#172338}
.knowledge-prompt-drawer-actions{display:flex;align-items:center;gap:8px}
.knowledge-prompt-drawer-close{width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;flex:none;border:0;border-radius:5px;background:transparent;color:#172338;cursor:pointer;padding:7px}
.knowledge-prompt-drawer-close svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round}
.knowledge-prompt-drawer-close:hover,.knowledge-prompt-drawer-close:focus-visible{background:#edf2f8}
.knowledge-prompt-drawer-content{padding:22px;overflow:auto;flex:1;min-height:0;overscroll-behavior:contain}
.knowledge-prompt-readonly{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;line-height:1.9;color:#172338;margin:0}
@media(max-width:760px){.knowledge-prompt-drawer-head{height:56px;padding:0 16px}.knowledge-prompt-drawer-content{padding:17px}}
@media(prefers-reduced-motion:reduce){.knowledge-prompt-drawer{animation:none}}

.job-mini-icon{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;padding:6px;border:0;border-radius:5px;background:transparent;color:#455570;cursor:pointer}
.job-mini-icon:hover{background:#edf2f8;color:#172338}
.job-mini-icon:focus-visible{outline:2px solid #7fa3e9;outline-offset:1px}
.job-mini-icon svg{width:18px;height:18px;stroke:currentColor}


`;
