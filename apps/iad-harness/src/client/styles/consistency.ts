export const consistencyStyles=`
.iad-workbench.iad-consistency{padding:28px 30px 36px}.iad-consistency .iad-header{margin-bottom:20px}.iad-consistency .iad-header h1{font-size:27px}
.iad-consistency .iad-consistency-query{padding:18px 20px 16px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;margin-bottom:14px}
.iad-consistency .iad-consistency-query .iad-row{align-items:end;gap:12px;flex-wrap:wrap}.iad-consistency-query .iad-filter{min-width:145px;gap:7px;color:var(--iad-muted);font-size:12px}.iad-consistency-query .iad-filter :is(select,input){font-size:14px;height:40px}
.iad-consistency-summary{margin:12px 0 14px}.iad-consistency-status{display:flex;align-items:center;flex-wrap:wrap;gap:10px 24px;padding:11px 15px;border:1px solid var(--iad-border);border-radius:6px;background:var(--iad-surface-muted);font-size:12px}.iad-consistency-status strong{font-weight:650}.iad-consistency-status>span{white-space:nowrap}
.iad-consistency-summary-details{margin-left:auto;position:relative}.iad-consistency-summary-details>summary{cursor:pointer;color:var(--iad-muted)}.iad-consistency-summary-body{position:absolute;right:0;top:28px;z-index:8;width:540px;max-width:75vw;padding:16px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:6px}.iad-consistency-summary-body .iad-row{gap:10px}
.iad-consistency-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:290px;padding:44px 24px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;text-align:center;color:var(--iad-muted)}.iad-consistency-empty h2{font-size:16px;color:var(--iad-text);margin:16px 0 6px}.iad-consistency-empty p{margin:0 0 18px;max-width:560px}.iad-consistency-empty .iad-row{justify-content:center}
.iad-consistency-list,.iad-consistency-detail{min-width:0;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;overflow:hidden}
.iad-consistency-panel-header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:15px 16px 13px;border-bottom:1px solid var(--iad-border)}.iad-consistency-panel-header strong{font-size:15px}.iad-consistency-panel-header>span{color:var(--iad-muted);font-size:12px}
.iad-consistency-detail-body{padding:16px}.iad-consistency-detail-actions{display:flex;flex-wrap:wrap;gap:8px;padding-top:14px;margin-top:14px;border-top:1px solid var(--iad-border)}
.iad-consistency-search-layout{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:14px;align-items:start}.iad-consistency-candidate-grid{display:grid;align-content:start;align-items:start;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:16px;max-height:570px;overflow:auto;min-height:360px}.iad-consistency-candidate-grid>button{display:flex;flex-direction:column;gap:5px;padding:9px;min-width:0;text-align:left;white-space:normal;border:1px solid var(--iad-border);border-radius:6px;background:var(--iad-surface)}.iad-consistency-candidate-grid>button[aria-pressed=true]{border-color:var(--iad-primary);background:var(--iad-hover)}.iad-consistency-candidate-grid img{display:block;width:100%;height:146px;object-fit:contain;background:var(--iad-viewer);border-radius:3px}.iad-consistency-candidate-grid strong{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}.iad-consistency-candidate-grid :is(span,small){font-size:12px;color:var(--iad-muted)}.iad-consistency-detail-photo{width:100%;height:290px;object-fit:contain;background:var(--iad-viewer);border-radius:3px}.iad-consistency-detail-body dl{display:grid;grid-template-columns:90px minmax(0,1fr);gap:7px;font-size:12px;margin-top:14px}.iad-consistency-detail-body dt{color:var(--iad-muted)}.iad-consistency-detail-body dd{margin:0;overflow-wrap:anywhere}.iad-consistency-result-pagination{margin:12px 0}
.iad-consistency-jobs{display:grid;gap:16px;margin-top:14px}.iad-consistency-jobs .iad-resource-table{width:100%;table-layout:fixed}.iad-consistency-jobs .iad-resource-table :is(th,td){padding:13px 16px}.iad-consistency-jobs .iad-resource-table tr[aria-selected=true]{background:var(--iad-hover)}.iad-consistency-jobs td small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--iad-muted);font-size:11px;margin-top:4px}.iad-consistency-jobs [aria-label="批次详情"]{padding:18px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px}.iad-consistency-jobs progress{width:100%;accent-color:var(--iad-primary)}.iad-consistency-text-button{min-height:0;border:0;background:none;padding:0;text-align:left;color:var(--iad-primary)}
.iad-consistency-expanded{margin-top:14px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px}.iad-consistency-expanded>.iad-consistency-layout{padding:16px;margin:0}
.iad-consistency-query fieldset,.iad-consistency-review fieldset{border:0;padding:0;margin:0;min-width:0}
.iad-consistency-query .iad-filter input{min-width:0;max-width:100%}.iad-consistency-query input[type=file]{width:178px}.iad-consistency-query .iad-query-search{flex:1;min-width:190px}.iad-consistency-query .iad-query-search input{width:100%}.iad-consistency-query .iad-query-sample{flex:0 1 224px;min-width:200px}.iad-consistency-query .iad-query-sample select{width:100%}
.iad-consistency-query .iad-pagination{padding:0;margin-left:auto}.iad-consistency-query-actions{margin-top:14px}.iad-consistency-advanced summary{cursor:pointer;min-height:40px;display:flex;align-items:center;color:var(--iad-muted)}.iad-consistency-advanced[open]{flex:1}.iad-consistency-advanced .iad-row{margin:8px 0}
.iad-consistency-scope summary{cursor:pointer;min-height:40px;display:flex;align-items:center}.iad-consistency-scope label{display:flex;align-items:center;gap:8px;margin:8px 0}
.iad-consistency-results>p{margin:8px 0 16px}.iad-consistency-layout{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:20px;align-items:start;margin-top:20px}
.iad-consistency-differences{min-width:0;max-height:620px;overflow:auto}.iad-consistency-differences button{display:flex;flex-direction:column;align-items:stretch;text-align:left;white-space:normal;width:100%;padding:12px;gap:6px;border:0;background:var(--iad-surface);margin-bottom:8px}
.iad-consistency-differences button.is-selected{background:var(--iad-hover);box-shadow:inset 3px 0 var(--iad-primary)}.iad-consistency-differences button small{color:var(--iad-muted);font-size:12px}
.iad-consistency-comparison{min-width:0}.iad-consistency-canvases{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}.iad-consistency-side{min-width:0}.iad-consistency-side>p{margin-bottom:8px;color:var(--iad-muted)}
.iad-consistency .iad-embedded-canvas{height:470px;min-height:0}.iad-consistency .iad-lightbox-toolbar{gap:6px;padding:10px;flex-wrap:wrap}.iad-consistency .iad-viewer-heading{flex-basis:100%}.iad-consistency .iad-viewer-heading strong{font-size:12px}.iad-consistency .iad-viewer-zoom select{width:112px}
.iad-consistency-differences h2{font-size:16px;margin:0 0 12px}.iad-consistency-differences dl{grid-template-columns:80px minmax(0,1fr)}.iad-consistency-region rect{stroke:var(--iad-danger);fill:none;stroke-width:calc(2px / var(--iad-view-scale,1));vector-effect:non-scaling-stroke}
.iad-consistency .iad-frozen-comparison .iad-embedded-canvas{height:620px}

.iad-consistency-gallery-panel{min-width:0;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;overflow:hidden}
.iad-consistency-gallery-panel .iad-consistency-panel-header{flex-wrap:wrap}.iad-consistency-gallery-panel .iad-row{gap:8px}.iad-consistency-gallery-panel input{width:250px}
.iad-consistency-gallery{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:13px;padding:16px;align-items:stretch}
.iad-consistency-gallery .iad-consistency-image-card{display:flex;flex-direction:column;min-width:0;text-align:left;padding:0;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:6px;overflow:hidden;white-space:normal}
.iad-consistency-gallery .iad-consistency-image-card:hover{border-color:var(--iad-primary);background:var(--iad-surface)}
.iad-consistency-card-image{position:relative;display:flex;align-items:center;justify-content:center;height:159px;background:var(--iad-viewer);color:var(--iad-on-viewer)}.iad-consistency-card-image>img{width:100%;height:100%;object-fit:contain}
.iad-consistency-card-count{position:absolute;top:8px;right:8px;padding:3px 6px;border-radius:3px;background:var(--iad-viewer);color:var(--iad-on-viewer);font-size:11px}
.iad-consistency-model-state{display:block;padding:0 10px 10px;font-size:11px;color:var(--iad-muted)}.iad-group-overall{margin-top:16px}.iad-group-overall h4{margin:0 0 8px;font-size:14px}.iad-group-overall p{margin:0;line-height:1.7}.iad-consistency-card-caption{display:grid;gap:8px;padding:10px;min-width:0}.iad-consistency-card-caption>strong{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.iad-consistency-card-caption>div{display:flex;justify-content:space-between;gap:8px;color:var(--iad-muted);font-size:11px}.iad-consistency-badge{display:inline-block;padding:2px 5px;border-radius:3px;background:var(--iad-hover);color:var(--iad-primary);font-size:11px;font-weight:400}
.iad-detail-dialog.iad-consistency-group-dialog{width:min(1520px,96vw);height:94vh;max-width:96vw;max-height:94vh;padding:0;overflow:hidden;border:0;border-radius:7px}
.iad-consistency-group-dialog[open]{display:flex;flex-direction:column}.iad-group-header,.iad-group-footer{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:15px 22px;flex:none;background:var(--iad-surface)}.iad-group-header{border-bottom:1px solid var(--iad-border)}.iad-group-header>div:first-child{min-width:0}.iad-group-header h2{font-size:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:3px 0}.iad-group-header p{margin:0;font-size:12px;color:var(--iad-muted)}.iad-group-header span{font-size:11px}.iad-group-header .iad-row{flex-wrap:nowrap;gap:8px}.iad-group-header button,.iad-group-footer button{min-height:32px;font-size:12px;padding:6px 10px}
.iad-group-scroll{display:flex;flex-direction:column;flex:1;min-height:0;padding:18px 24px 0;overflow:hidden}.iad-group-visuals{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding-bottom:8px}.iad-consistency-group-dialog .iad-consistency-canvases{margin-top:0}.iad-consistency-group-dialog .iad-consistency-side>p{font-size:13px;font-weight:600;margin:0 0 8px;color:var(--iad-text)}.iad-consistency .iad-consistency-group-dialog .iad-embedded-canvas{height:clamp(280px,39vh,430px)}.iad-consistency-group-dialog .iad-lightbox-toolbar{padding:5px;gap:4px;flex-wrap:nowrap}.iad-consistency-group-dialog .iad-viewer-heading{display:none}.iad-consistency-group-dialog .iad-viewer-zoom select{width:90px}.iad-consistency-group-dialog .iad-viewer-body{margin-top:0}
.iad-group-image-names{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:8px;color:var(--iad-muted);font-size:11px}.iad-group-image-names span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.iad-group-candidates{margin:20px 0 16px}.iad-group-candidates>.iad-row{justify-content:space-between;gap:10px}.iad-group-candidates h3{margin:0 auto 8px 0;font-size:13px}.iad-group-candidates .iad-row>button{min-height:30px;padding:4px 8px;font-size:12px}.iad-group-candidate-strip{display:flex;overflow:auto;gap:10px;padding:3px 1px 8px}.iad-group-candidate-strip>button{display:grid;flex:0 0 116px;gap:4px;padding:5px;text-align:left;min-width:0;border:1px solid var(--iad-border);border-radius:5px;background:var(--iad-surface)}.iad-group-candidate-strip>button[aria-pressed=true]{border-color:var(--iad-primary);background:var(--iad-hover);box-shadow:0 0 0 1px var(--iad-primary)}.iad-group-candidate-strip img{width:104px;height:94px;object-fit:contain;background:var(--iad-viewer);border-radius:3px}.iad-group-candidate-strip strong{font-size:11px}.iad-group-candidate-strip span{font-size:10px;color:var(--iad-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:104px}
.iad-group-analysis{flex:none;max-height:40%;overflow:auto;overscroll-behavior:contain;border-top:1px solid var(--iad-border);padding-bottom:16px}.iad-group-analysis h3{font-size:14px}.iad-group-analysis .iad-tab-panel{padding:16px 0 0}.iad-group-analysis .iad-consistency-differences{max-height:none;overflow:visible}.iad-group-references{display:grid;grid-template-columns:60px minmax(0,1fr);gap:6px;font-size:12px}.iad-group-references dd{margin:0;overflow-wrap:anywhere}.iad-group-fact{display:flex;align-items:center;gap:16px;padding:12px 0;border-top:1px solid var(--iad-border);font-size:12px}.iad-group-fact>button{margin-left:auto}.iad-group-footer{border-top:1px solid var(--iad-border)}
.iad-group-conclusions{display:block}.iad-group-conclusions>p{margin:12px 0;font-size:13px;line-height:1.7}.iad-group-limitations{margin-top:12px;padding:12px;background:var(--iad-surface-muted);color:var(--iad-muted);font-size:12px}.iad-group-limitations p{margin:0}
.iad-consistency-job-summary{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,.6fr) repeat(2,minmax(0,1fr));gap:0;margin:14px 0;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;padding:12px 0}
.iad-consistency-job-summary>div{min-width:0;padding:2px 18px;border-right:1px solid var(--iad-border);display:flex;flex-direction:column;align-items:start;gap:5px}.iad-consistency-job-summary>div:last-child{border-right:0}.iad-consistency-job-summary>div>span:first-child,.iad-consistency-job-summary small{color:var(--iad-muted);font-size:12px}.iad-consistency-job-summary strong{font-size:18px}.iad-consistency-job-summary .iad-job-sync{position:relative;margin:0;padding-right:55px;gap:8px}.iad-consistency-job-summary .iad-job-sync>span[role=status]{color:var(--iad-text);font-weight:600;font-size:14px}.iad-consistency-job-summary .iad-job-sync>button{position:absolute;right:12px;top:12px;margin:0}.iad-consistency-job-detail-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.iad-consistency-job-detail-heading h2{font-size:15px;margin:0}.iad-consistency-job-detail-heading strong{font-size:12px;color:var(--iad-primary)}.iad-consistency-job-progress{gap:16px;margin:12px 0}.iad-consistency-child-jobs{margin:18px 0}.iad-consistency-child-jobs>summary{cursor:pointer;font-size:12px;color:var(--iad-muted);padding:8px 0}.iad-consistency-jobs [aria-label="批次比较结果"] h3{font-size:14px}.iad-consistency-jobs [aria-label="批次比较结果"]>.iad-row{padding:12px 0;border-top:1px solid var(--iad-border);font-size:12px}
.iad-consistency-report-strip{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:0;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;padding:10px 0}.iad-consistency-report-strip>div{display:grid;gap:6px;align-content:start;padding:2px 16px;border-right:1px solid var(--iad-border);min-width:0}.iad-consistency-report-strip>div:last-child{border-right:0}.iad-consistency-report-strip :is(span,small){color:var(--iad-muted);font-size:11px}.iad-consistency-report-strip strong{font-size:16px}.iad-consistency-report-strip>div:first-child strong{font-size:14px}.iad-consistency-report-tools{display:flex;align-items:center;gap:12px;margin:6px 0;font-size:12px}.iad-consistency-summary-details{margin-left:auto}.iad-consistency-summary-details>summary{padding:3px 0}
.iad-consistency-filter-chips{display:flex;gap:10px;padding:12px 16px 0;flex-wrap:wrap}.iad-consistency-filter-chips button{border:1px solid transparent;background:transparent;color:var(--iad-muted);font-size:12px;min-height:30px;padding:5px 9px}.iad-consistency-filter-chips button[aria-pressed=true]{border-color:var(--iad-primary);background:var(--iad-hover);color:var(--iad-primary)}
@container workbench (max-width:1200px){.iad-consistency-gallery{grid-template-columns:repeat(4,minmax(0,1fr))}}


/* =================== V26 Data Consistency Styles =================== */
.dc-root{min-width:0}.dc-root .heading{margin-bottom:24px}.dc-scope{display:flex;gap:14px;align-items:end;flex-wrap:wrap;margin-bottom:22px}.dc-scope .field{gap:7px}.dc-scope .dc-parent{width:265px}.dc-scope .dc-children{width:410px}.dc-scope select{height:38px}.dc-multi{position:relative}.dc-multi-trigger{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;height:38px;min-height:38px;border:1px solid #aebdd2;border-radius:5px;background:white;padding:0 12px;text-align:left;color:var(--ink)}.dc-multi-trigger span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dc-multi-trigger svg{width:15px;height:15px;fill:none;stroke:#536b86;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.dc-options{position:absolute;top:calc(100% + 5px);left:0;right:0;z-index:20;max-height:230px;overflow:auto;padding:5px;background:#fff;border:1px solid var(--border);border-radius:6px;box-shadow:0 10px 24px #1e314b20}.dc-option{display:flex;align-items:center;gap:10px;padding:9px 10px;cursor:pointer;font-size:12px;line-height:1.5}.dc-option:hover{background:#f2f6fd}.dc-option input{height:16px;width:16px;accent-color:var(--blue)}
.dc-section{margin:0 0 24px}.dc-section-heading{display:flex;align-items:center;justify-content:space-between;margin:0 0 12px;min-height:38px;gap:14px}.dc-section-heading h2{font-size:16px;font-weight:650;margin:0}.dc-actionbar{display:flex;gap:9px;align-items:center}.dc-primary{background:var(--blue);border:1px solid var(--blue);color:#fff;border-radius:5px;height:37px;padding:0 14px;font-weight:550}.dc-primary:hover{background:#1b52cd}.dc-minor{border:1px solid var(--border);height:36px;border-radius:5px;background:#fff;color:#41546e;padding:0 12px}.dc-icn{display:inline-grid;place-items:center;min-width:32px;width:32px;height:32px;border:0;background:transparent;border-radius:5px;color:#5c708b;cursor:pointer;vertical-align:middle}.dc-icn:hover{background:#eaf0ff;color:var(--blue)}.dc-icn:disabled{opacity:.28;cursor:default}.dc-icn svg{height:17px;width:17px;stroke:currentColor;stroke-width:1.8;fill:none;stroke-linecap:round;stroke-linejoin:round}
.dc-table-panel{overflow:hidden;background:#fff;border:1px solid var(--border);border-radius:7px}.dc-table{border-collapse:collapse;width:100%;text-align:left;font-size:13px}.dc-table th{font-weight:600;color:#172338;background:#f6f8fb;padding:12px 18px;border-bottom:1px solid var(--border)}.dc-table td{padding:16px 18px;border-bottom:1px solid #ecf0f5;color:#172338;font-size:13px}.dc-table tbody tr:last-child td{border-bottom:0}.dc-table tbody tr{cursor:pointer}.dc-table tbody tr:hover{background:#f7f9fd}.dc-table tbody tr[data-selected=true]{background:#eaf0ff}.dc-table .dc-operations{text-align:right;white-space:nowrap;width:120px}.dc-mono{font-variant-numeric:tabular-nums}.dc-muted{color:#8190a5}.dc-state{color:#477cbe}.dc-state.completed{color:#177b53}.dc-state.failed{color:#b23c43}.dc-state.running{color:#285ed6}.dc-state.pending{color:#285ed6}.dc-table .dc-time{white-space:nowrap}.dc-empty{min-height:132px;display:flex;align-items:center;justify-content:center;color:#8492a6;background:#fff;border:1px solid var(--border);border-radius:7px;padding:24px;text-align:center}
.dc-running{display:grid;gap:10px;padding:17px 20px;border:1px solid #d7e2f9;border-radius:7px;background:#f8fbff;margin-bottom:14px}.dc-running-header{display:flex;justify-content:space-between;align-items:center}.dc-stages{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.dc-stage{min-width:0;border-top:3px solid #dce3ed;padding-top:8px;font-size:12px;color:#8b99ab}.dc-stage.done{color:#28795f;border-color:#51a881}.dc-stage.current{color:#2558c4;border-color:#356be4;font-weight:600}
.dc-result-tools{display:flex;align-items:center;gap:10px}.dc-result-tools select,.dc-result-tools input{height:36px}.dc-result-tools input{width:240px}.dc-result-tools select{width:140px}.dc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:15px}.dc-card{border:1px solid var(--border2);border-radius:7px;background:#fff;overflow:hidden;color:var(--ink);text-align:left;padding:0;transition:box-shadow .15s,border-color .15s}.dc-card:hover{border-color:#91aee8;box-shadow:0 5px 16px #183a6720}.dc-card-img{height:140px;display:flex;align-items:center;justify-content:center;background:#eef2f7;overflow:hidden;position:relative}.dc-card-img img{width:100%;height:100%;object-fit:cover}.dc-card-caption{padding:11px 12px 12px;min-width:0}.dc-card-caption strong{display:block;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;font-size:12px;font-weight:600}.dc-card-caption small{display:block;color:#7f8da2;font-size:11px;margin-top:3px}.dc-counter-pager{display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:18px}.dc-counter-pager button{height:32px;min-width:32px;border:1px solid var(--border);border-radius:4px;background:#fff;padding:0 9px;color:#52637c}.dc-counter-pager button.current{background:var(--blue);color:#fff;border-color:var(--blue)}
.dc-mask{position:fixed;inset:0;background:#101d32a1;z-index:400;display:flex;align-items:stretch;justify-content:flex-end}.dc-mask[hidden]{display:none!important}.dc-drawer{width:min(510px,100vw);height:100dvh;overflow:auto;background:white;box-shadow:-15px 0 40px #11213b25;display:flex;flex-direction:column}.dc-drawer-header{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid var(--border)}.dc-drawer-header h2{margin:0;font-size:18px}.dc-drawer-content{padding:20px 24px}.dc-stats{display:grid;grid-template-columns:1fr 1fr;gap:14px}.dc-stat{padding:14px;border:1px solid var(--border);border-radius:5px}.dc-stat strong{display:block;font-size:26px;font-weight:650;line-height:1.5}.dc-stat span{font-size:12px;color:#7e8da1}.dc-stats-label{font-size:13px;margin:24px 0 10px;font-weight:600}.dc-metrics{border-collapse:collapse;width:100%}.dc-metrics td{border-bottom:1px solid var(--border2);padding:11px 4px;font-size:12px}.dc-metrics td+td{text-align:right}
.dc-modal-mask{position:fixed;inset:0;background:#0b172bba;z-index:430;display:flex;align-items:center;justify-content:center;padding:22px}.dc-modal-mask[hidden]{display:none!important}.dc-dialog{width:min(1190px,calc(100vw - 40px));height:min(820px,calc(100dvh - 44px));background:#fff;border-radius:8px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 18px 60px #07102548}.dc-dialog-head{height:58px;padding:0 23px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:12px;flex:none}.dc-dialog-head h2{font-size:17px;margin:0;font-weight:650}.dc-dialog-head-actions{display:flex;align-items:center;gap:8px}.dc-dialog-body{padding:20px 24px 24px;min-height:0;overflow:auto;flex:1}.dc-compare{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.dc-compare-cell{min-width:0}.dc-compare-title{font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between;margin:0 0 10px}.dc-compare-photo{height:268px;border:1px solid var(--border);border-radius:6px;background:#f0f3f7;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:zoom-in}.dc-compare-photo img{height:100%;width:100%;object-fit:contain}.dc-compare-photo .dc-bbox{position:absolute;border:2px solid #e88c26;background:transparent !important;box-shadow:none !important;pointer-events:none;box-sizing:border-box;left:32%;top:31%;width:16%;height:14%}.dc-compare-caption{font-size:12px;display:flex;gap:10px;justify-content:space-between;padding:10px 0;color:#53647c}.dc-candidate-strip{display:flex;gap:9px;overflow:auto;padding:10px 0 5px;scrollbar-width:thin}.dc-candidate{flex:none;position:relative;width:96px;height:80px;border:2px solid transparent;background:#f0f3f7;padding:0;border-radius:5px;overflow:hidden}.dc-candidate[aria-pressed=true]{border-color:var(--blue)}.dc-candidate:hover{border-color:#91aee8}.dc-candidate img{width:100%;height:100%;object-fit:cover}.dc-candidate small{position:absolute;bottom:2px;left:4px;background:#172b41c9;color:white;border-radius:3px;padding:1px 5px;font-size:11px}.dc-info{border-top:1px solid var(--border);margin-top:19px;padding-top:18px;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px}.dc-info h3{font-size:13px;margin:0 0 10px}.dc-info p{font-size:12px;color:#485972;line-height:1.8;margin:5px 0}.dc-decision-controls{display:flex;gap:16px;flex-wrap:wrap;margin:10px 0}.dc-decision-controls label{display:inline-flex;align-items:center;gap:7px;font-size:12px}.dc-decision-controls input{height:16px;width:16px;accent-color:var(--blue)}.dc-note{width:100%;height:66px;padding:10px;border:1px solid #b7c5d9;border-radius:5px;resize:vertical;color:var(--ink)}.dc-dialog-footer{display:flex;gap:8px;justify-content:flex-end;padding:13px 24px;border-top:1px solid var(--border);flex:none}.dc-small-muted{font-size:11px;color:#8794a6}.dc-alert{border:1px solid #f3d4d4;background:#fff7f7;padding:12px;color:#ac4343;font-size:12px;border-radius:5px}.dc-dialog .dc-dialog-body label{font-size:12px}.dc-esc{display:none}
@media(max-width:1000px){.dc-compare,.dc-info{grid-template-columns:1fr}.dc-compare-photo{height:230px}.dc-dialog{height:min(900px,95dvh)}.dc-section-heading{flex-wrap:wrap}.dc-grid{grid-template-columns:repeat(auto-fill,minmax(154px,1fr))}}@media(max-width:650px){.dc-scope .dc-parent,.dc-scope .dc-children{width:100%}.dc-scope{display:grid}.dc-result-tools{width:100%;flex-wrap:wrap}.dc-result-tools input{width:100%}.dc-modal-mask{padding:5px}.dc-dialog{width:100%;height:96dvh}.dc-compare-photo{height:190px}.dc-table{min-width:720px}.dc-table-panel{overflow:auto}}

/* V18: 统计与冲突网格共用同一套类型口径；保留原有表格/图像样式。 */
.dc-type-tabs{display:flex;align-items:center;gap:20px;overflow-x:auto;white-space:nowrap;border-bottom:1px solid var(--border);margin:0 0 17px;scrollbar-width:thin}
.dc-type-tab{position:relative;display:inline-flex;align-items:center;gap:7px;flex:0 0 auto;min-height:42px;padding:0 2px;border:0;border-bottom:2px solid transparent;background:transparent;color:#526680;font:inherit;cursor:pointer;border-radius:0}
.dc-type-tab[aria-selected="true"]{color:var(--blue);border-bottom-color:var(--blue);font-weight:600}
.dc-type-tab:hover{color:var(--blue)}
.dc-type-tab .dc-tab-num{font-size:12px;color:inherit;font-weight:500;opacity:.85;font-variant-numeric:tabular-nums}
.dc-type-tab:focus-visible,.dc-stat-type:focus-visible{outline:2px solid var(--blue);outline-offset:-2px}
.dc-drawer-total{display:flex;align-items:baseline;gap:12px;padding:6px 0 20px;border-bottom:1px solid var(--border)}
.dc-drawer-total strong{font-size:33px;line-height:1.25;font-variant-numeric:tabular-nums;font-weight:650}
.dc-drawer-total span{font-size:14px;color:#607087}
.dc-drawer-type-list{display:grid;gap:0}
.dc-stat-type{display:grid;grid-template-columns:1fr auto;align-items:center;gap:5px 16px;text-align:left;background:transparent;color:var(--ink);border:0;border-bottom:1px solid var(--border2);padding:15px 2px;cursor:pointer;width:100%;font:inherit}
.dc-stat-type:hover{background:var(--surface-alt)}
.dc-stat-type .dc-stat-label{font-size:13px;font-weight:550}
.dc-stat-type .dc-stat-value{color:#1e3d7c;font-variant-numeric:tabular-nums;font-size:17px;font-weight:600}
.dc-stat-track{height:5px;background:#ecf0f6;border-radius:4px;overflow:hidden;grid-column:1/-1}
.dc-stat-track>span{display:block;height:100%;background:#4f7be2;border-radius:4px}
.dc-result-tools{margin-left:auto}
@media(max-width:650px){.dc-type-tabs{gap:15px}.dc-result-tools{margin-left:0}.dc-result-tools input{width:100%;max-width:240px}}

/* V19 – compact model reasoning + final model verdict below the image comparison. */
.dc-model-panel{border-top:1px solid var(--border);margin-top:16px;padding-top:17px}
.dc-model-panel h3,.dc-review-panel h3{font-size:14px;font-weight:650;margin:0 0 9px;color:var(--ink)}
.dc-model-panel p{margin:0;font-size:13px;line-height:1.85;color:#394b65}
.dc-model-verdict{display:flex;align-items:center;flex-wrap:wrap;gap:10px 15px;background:#f4f7fc;border:1px solid #d9e3f4;border-radius:6px;margin-top:14px;padding:13px 15px}
.dc-model-verdict .dc-verdict-label{font-size:13px;color:#53657f}
.dc-model-verdict strong{font-size:14px;font-weight:650;color:#244b96}
.dc-model-verdict .dc-verdict-pending{margin-left:auto;font-size:12px;color:#607189}
.dc-review-panel{padding-top:16px;margin-top:17px;border-top:1px solid var(--border)}
.dc-review-panel .dc-decision-controls{margin:10px 0 14px}
.dc-review-panel .dc-note{height:58px;min-height:58px}
.dc-dialog-body{scrollbar-gutter:stable}
.dc-compare-photo{height:235px}
.dc-dialog-head-actions button{white-space:nowrap}
@media(max-width:1000px){.dc-compare-photo{height:210px}.dc-model-verdict .dc-verdict-pending{margin-left:0}}

/* V20 — shared near-full-viewport dialog geometry: image details and direction details. */
:root { --iad-content-modal-gutter: 26px; --iad-content-modal-radius: 7px; }
.detail-overlay {
  padding:var(--iad-content-modal-gutter) !important;
  background:rgba(23,34,51,.68) !important;
  align-items:stretch !important;
  justify-content:stretch !important;
}
.detail-dialog {
  width:100% !important;
  max-width:none !important;
  height:100% !important;
  max-height:100% !important;
  min-height:0 !important;
  margin:0 !important;
  border:1px solid #d9e2ed !important;
  border-radius:var(--iad-content-modal-radius) !important;
  box-shadow:0 20px 64px rgba(14,26,48,.27) !important;
  display:flex !important;
  flex-direction:column !important;
  overflow:hidden !important;
}
.detail-header {
  min-height:61px;
  height:auto;
  flex:none;
  padding:14px 28px !important;
  display:flex;
  align-items:center !important;
  justify-content:space-between;
  gap:16px;
  border-bottom:1px solid #e3eaf2;
}
.detail-title {
  font-size:17px;
  font-weight:650;
  color:#182941;
  line-height:1.5;
}
.detail-scroll {
  flex:1;
  min-height:0;
  overflow-y:auto;
  overscroll-behavior-y:contain;
  scrollbar-gutter:stable;
  padding:22px 28px 28px !important;
}
.detail-preview {height:clamp(280px,49dvh,560px);flex:none;}
.detail-content {margin-top:20px;}
@media(max-width:840px) {
  :root { --iad-content-modal-gutter: 14px; }
  .detail-header {padding:13px 18px !important;min-height:56px;}
  .detail-scroll {padding:16px 18px 22px !important;}
  .detail-preview {height:clamp(220px,36dvh,390px);}
}
@media(max-width:500px) {
  :root { --iad-content-modal-gutter: 10px; }
  .detail-title {font-size:15px;}
}


/* V22: Shared 38px controls, 8px icon spacing, page headings, one unified table/section rhythm. */
.exp-heading,.dc-page-heading{min-height:42px;display:flex;justify-content:space-between;align-items:center;gap:16px;margin:0 0 18px}
.dc-page-heading h1,.exp-heading h1{margin:0;font-size:24px;font-weight:670;letter-spacing:-.4px;line-height:1.35}
.exp-heading-actions,.dc-heading-actions{display:flex;align-items:center;gap:8px}
.exp-heading-actions .exp-btn,.dc-heading-actions .dc-primary{height:38px;min-height:38px;padding:0 15px;font-size:13px;border-radius:5px}
.exp-scope,.dc-scope{display:flex;align-items:flex-end;gap:16px;margin:0 0 18px;flex-wrap:wrap}
.exp-parent-controls,.dc-parent-controls{display:flex;align-items:flex-end;gap:8px;min-width:0}
.exp-child-controls,.dc-child-controls{display:flex;align-items:flex-end;gap:8px;min-width:0;flex:0 1 auto}
.exp-child-controls .exp-child-wrap,.dc-child-controls .dc-children{flex:0 1 410px;min-width:0;width:410px}
.exp-parent-controls .exp-input{width:265px;min-width:0}
.exp-parent-controls .exp-select{min-width:0;width:100%;height:38px}
.exp-child-controls .exp-scope-refresh,.dc-child-controls .dc-icn,.dc-parent-controls .dc-icn{width:38px;height:38px;min-width:38px;display:grid;place-items:center;align-self:flex-end;padding:0;flex:none;border:0;background:transparent;border-radius:5px}
.dc-child-controls .dc-icn:hover,.dc-parent-controls .dc-icn:hover,.exp-child-controls .exp-scope-refresh:hover,.exp-parent-controls .exp-scope-refresh:hover{background:#edf3ff;color:#285fd1}
.exp-child-controls .exp-scope-refresh svg,.exp-parent-controls .exp-scope-refresh svg,.dc-child-controls .dc-icn svg,.dc-parent-controls .dc-icn svg{width:18px;height:18px}
.dc-scope .dc-parent{width:265px;min-width:0}
.dc-scope .dc-children{width:410px}
.dc-scope select,.dc-multi-trigger{height:38px;min-height:38px}
.dc-section{margin-bottom:20px}
.dc-section-heading{min-height:36px;margin-bottom:12px}
.dc-result-tools input,.dc-result-tools select{height:36px;font-size:12px}
.dc-results-section{min-width:0}
.dc-result-views{display:flex;align-items:center;gap:24px;border-bottom:1px solid #dce5f0;margin-bottom:14px}
.dc-result-views button{border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;padding:12px 1px;color:#63748a;font:inherit;font-size:13px;min-height:42px;white-space:nowrap;cursor:pointer}
.dc-result-views button[aria-selected="true"]{border-bottom-color:var(--blue);color:var(--blue);font-weight:650}
.dc-result-views button:hover{color:var(--blue)}
.dc-results-toolbar{display:flex;align-items:flex-start;justify-content:space-between;gap:12px 20px;margin-bottom:16px;min-width:0;flex-wrap:wrap}
.dc-results-tabs{min-width:0;flex:1 1 550px}
.dc-results-toolbar .dc-type-tabs{margin:0;gap:18px;max-width:100%}
.dc-results-toolbar .dc-type-tab{min-height:36px;font-size:12px}
.dc-results-toolbar .dc-result-tools{margin:0;flex:0 1 auto}
.dc-card-verdict[data-state="retained"]{color:#2456b0}.dc-card-verdict[data-state="excluded"]{color:#407e69}.dc-card-verdict[data-state="uncertain"]{color:#946923}
.dc-card-caption .dc-card-raw{color:#8592a4;font-size:11px}
.dc-model-stats-heading{margin-top:30px!important}
.dc-verdict-explanation{margin-top:7px!important}
@media(max-width:850px){.dc-results-tabs{flex-basis:100%}.dc-results-toolbar .dc-result-tools{width:100%;justify-content:flex-start}.dc-results-toolbar .dc-result-tools input{flex:1;min-width:140px}.dc-scope .dc-parent,.exp-parent-controls .exp-input{width:min(265px,calc(100vw - 110px))}.dc-scope .dc-children{width:min(410px,100%)}}
@media(max-width:580px){.exp-heading,.dc-page-heading{margin-bottom:14px}.exp-scope,.dc-scope{gap:12px}.dc-results-toolbar .dc-result-tools select{width:135px}.dc-result-views{gap:16px}.dc-result-views button{font-size:12px}}

/* V23: 数据集选择器只显示名称，不重复显示数量；超长名称保留完整悬停提示。 */
.dataset-multi-trigger,.dc-multi-trigger{height:38px;min-height:38px}
.dataset-multi-trigger #child-label{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.exp-child-button>span,.dc-multi-trigger>span:first-child{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.dc-job-datasets{max-width:280px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}

/* V24: one linked conflict view, compact common filters; uncommon filters in covering drawer. */
.dc-refined-filterbar{display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin:0 0 18px;min-height:56px}
.dc-filter-field{display:flex;flex-direction:column;gap:7px;color:#536783;font-size:12px;font-weight:550;min-width:190px}
.dc-filter-field select{height:38px;width:215px;max-width:100%;border:1px solid #b9c7d9;border-radius:5px;padding:0 12px;background:#fff;color:#24364e;font:inherit;font-size:13px}
.dc-more-filters{height:38px;display:inline-flex;align-items:center;justify-content:center;gap:7px;margin-left:2px;padding:0 12px;background:#fff;border:1px solid #c3cfdd;border-radius:5px;color:#465b73;font-size:13px;font-weight:550;cursor:pointer;position:relative}
.dc-more-filters:hover,.dc-more-active{border-color:#7f9bdf;color:#245bd1;background:#f5f8ff}
.dc-more-filters svg{width:17px;height:17px}
.dc-active-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#3266de;margin-left:1px}
.dc-card-caption{padding:11px 12px 12px;gap:8px}
.dc-card-judgments{display:grid;gap:6px}
.dc-card-judgments small{display:flex;align-items:baseline;gap:9px;font-size:12px;line-height:1.45;color:#3b506b;min-width:0}
.dc-card-judgments small em{font-size:11px;color:#8490a2;min-width:24px;flex:none;font-style:normal}
.dc-card-judgments small span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dc-model-retained{color:#2855ab}.dc-model-excluded{color:#417965}.dc-model-uncertain{color:#8f6a31}
.dc-filters-drawer .dc-drawer-content{flex:1}
.dc-advanced-fields{display:grid;align-content:start;gap:23px;padding-top:28px}
.dc-advanced-fields>label:not(.dc-different-only){display:grid;gap:9px;font-weight:550;color:#4b6079;font-size:13px}
.dc-advanced-fields select{height:40px;width:100%;border:1px solid #b9c7d9;border-radius:5px;padding:0 11px;background:white;color:#263954;font:inherit}
.dc-different-only{display:flex;gap:10px;align-items:center;line-height:1.5;font-size:13px;color:#304662;cursor:pointer}
.dc-different-only input{width:16px;height:16px;accent-color:#3568d8}
.dc-filter-footer{margin-top:auto;border-top:1px solid var(--border);padding:16px 24px;display:flex;justify-content:flex-end;gap:10px}
@media(max-width:600px){.dc-filter-field{min-width:0;flex:1 1 175px}.dc-filter-field select{width:100%}.dc-more-filters{margin-left:0;align-self:flex-end}}

/* V25: raw-conflict type is the main result navigation, model conclusion is a compact icon. */
.dc-results-section .dc-type-tabs{margin:1px 0 16px;gap:23px;max-width:100%}
.dc-results-section .dc-type-tab{font-size:13px;min-height:40px;padding:0 1px}
.dc-results-section .dc-refined-filterbar{margin-bottom:17px}
.dc-card-final{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0}
.dc-card-raw-label{font-size:12px;font-weight:550;color:#4b5f7b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.dc-verdict-symbol{display:inline-flex;align-items:center;justify-content:center;flex:none;width:25px;height:25px;border-radius:5px}
.dc-verdict-symbol svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.dc-verdict-symbol.retained{color:#bc6030;background:#fff2e8}
.dc-verdict-symbol.excluded{color:#2a8367;background:#e8f5ee}
.dc-verdict-symbol.uncertain{color:#98702b;background:#fff6df}
.dc-verdict-symbol:focus-visible{outline:2px solid #3873dd}
.dc-new-body{padding:22px 24px 24px;display:grid;gap:20px}
.dc-new-field{display:grid;gap:9px;font-size:13px;color:#405574;font-weight:600}
.dc-new-parent{min-height:38px;display:flex;align-items:center;padding:0 12px;background:#f6f8fb;border:1px solid #dce4ef;border-radius:5px;color:#283b56;font-weight:500}
.dc-new-child-options{display:grid;gap:0;border:1px solid #cbd5e3;border-radius:6px;max-height:280px;overflow:auto}
.dc-new-child-option{display:flex;align-items:center;gap:11px;padding:11px 13px;min-height:43px;font-size:13px;color:#30445f;cursor:pointer;font-weight:500}
.dc-new-child-option+.dc-new-child-option{border-top:1px solid #edf1f6}
.dc-new-child-option:hover{background:#f5f8fd}
.dc-new-child-option:has(input:checked){background:#f1f5ff}
.dc-new-child-option input{width:16px;height:16px;margin:0;accent-color:#2e64da;flex:none}
.dc-new-dialog{overflow:visible}
.dc-new-dialog .dc-dialog-body{overflow:visible}
.dc-new-multi{min-width:0}
.dc-new-multi .dc-multi-trigger{height:40px;min-height:40px;font-size:13px;font-weight:500}
.dc-new-options{z-index:35;max-height:216px;overscroll-behavior:contain}
.dc-new-option:has(input:checked){background:#f1f5ff}
.dc-new-options .dc-new-option span{font-size:13px;color:#30445f}
.dc-search-field{min-width:190px;flex:1 1 200px;max-width:270px}
.dc-search-field input{box-sizing:border-box;width:100%;height:38px;border:1px solid #b9c7d9;border-radius:5px;background:#fff;padding:0 12px;font-size:13px;color:#24364e;outline-offset:2px}
.dc-search-field input:focus{outline:2px solid #bad0f7;border-color:#6d93d7}
@media(max-height:550px){.dc-new-dialog .dc-dialog-body{overflow-y:auto}.dc-new-options{position:static;margin-top:6px}}
@media(max-width:640px){.dc-results-section .dc-type-tabs{gap:15px}.dc-results-section .dc-type-tab{font-size:12px}.dc-new-body{padding:16px}}

/* =========================================================================
   V26 High-Specificity Overrides to Prevent .iad-workbench Button Collision
   ========================================================================= */
:root {
  --blue: #285ed6;
  --blue-light: #eaf0ff;
  --border: #dbe2eb;
  --border2: #e6ebf1;
  --ink: #17233a;
  --sub: #64748b;
  --surface-alt: #f9fafc;
}

:is(.iad-workbench, body) button.dc-primary,
button.dc-primary,
.dc-primary {
  background: var(--blue, #285ed6) !important;
  border: 1px solid var(--blue, #285ed6) !important;
  color: #fff !important;
  border-radius: 5px !important;
  height: 37px !important;
  min-height: 37px !important;
  padding: 0 14px !important;
  font-weight: 550 !important;
  font-size: 13px !important;
  cursor: pointer !important;
  box-shadow: none !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: background-color .15s, border-color .15s !important;
}
:is(.iad-workbench, body) button.dc-primary:hover,
button.dc-primary:hover,
.dc-primary:hover {
  background: #1b52cd !important;
  border-color: #1b52cd !important;
  color: #fff !important;
}
:is(.iad-workbench, body) button.dc-primary:disabled,
button.dc-primary:disabled,
.dc-primary:disabled {
  opacity: .38 !important;
  cursor: default !important;
  background: var(--blue, #285ed6) !important;
  border-color: var(--blue, #285ed6) !important;
  color: #fff !important;
}

:is(.iad-workbench, body) button.dc-minor,
button.dc-minor,
.dc-minor {
  border: 1px solid var(--border, #dbe2eb) !important;
  height: 36px !important;
  min-height: 36px !important;
  border-radius: 5px !important;
  background: #fff !important;
  color: #41546e !important;
  padding: 0 14px !important;
  font-size: 13px !important;
  cursor: pointer !important;
  box-shadow: none !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: background-color .15s, border-color .15s !important;
}
:is(.iad-workbench, body) button.dc-minor:hover,
button.dc-minor:hover,
.dc-minor:hover {
  background: #f4f7fb !important;
  color: #22354e !important;
  border-color: #c5d2e3 !important;
}

:is(.iad-workbench, body) button.dc-icn,
button.dc-icn,
.dc-icn {
  display: inline-grid !important;
  place-items: center !important;
  min-width: 32px !important;
  width: 32px !important;
  height: 32px !important;
  min-height: 32px !important;
  max-height: 32px !important;
  border: 0 !important;
  background: transparent !important;
  border-radius: 5px !important;
  color: #5c708b !important;
  cursor: pointer !important;
  vertical-align: middle !important;
  padding: 0 !important;
  box-shadow: none !important;
  outline: none !important;
  transition: background-color .15s, color .15s !important;
}
:is(.iad-workbench, body) button.dc-icn:hover,
button.dc-icn:hover,
.dc-icn:hover {
  background: #eaf0ff !important;
  color: var(--blue, #285ed6) !important;
}
:is(.iad-workbench, body) button.dc-icn:disabled,
button.dc-icn:disabled,
.dc-icn:disabled {
  opacity: .28 !important;
  cursor: default !important;
  background: transparent !important;
}
:is(.iad-workbench, body) .dc-icn svg,
.dc-icn svg {
  height: 17px !important;
  width: 17px !important;
  stroke: currentColor !important;
  stroke-width: 1.8 !important;
  fill: none !important;
  stroke-linecap: round !important;
  stroke-linejoin: round !important;
}

:is(.iad-workbench, body) .dc-child-controls button.dc-icn,
:is(.iad-workbench, body) .dc-parent-controls button.dc-icn,
.dc-child-controls .dc-icn,
.dc-parent-controls .dc-icn {
  width: 38px !important;
  height: 38px !important;
  min-width: 38px !important;
  min-height: 38px !important;
  max-height: 38px !important;
  align-self: flex-end !important;
  border: 0 !important;
  background: transparent !important;
}
:is(.iad-workbench, body) .dc-child-controls button.dc-icn:hover,
:is(.iad-workbench, body) .dc-parent-controls button.dc-icn:hover,
.dc-child-controls .dc-icn:hover,
.dc-parent-controls .dc-icn:hover {
  background: #edf3ff !important;
  color: #285fd1 !important;
}
:is(.iad-workbench, body) .dc-child-controls .dc-icn svg,
:is(.iad-workbench, body) .dc-parent-controls .dc-icn svg,
.dc-child-controls .dc-icn svg,
.dc-parent-controls .dc-icn svg {
  width: 18px !important;
  height: 18px !important;
}

/* Tabs: Underline tab bar (NO box borders, NO radius, NO background) */
.dc-type-tabs,
.dc-results-section .dc-type-tabs {
  display: flex !important;
  align-items: center !important;
  gap: 23px !important;
  overflow-x: auto !important;
  white-space: nowrap !important;
  border: 0 !important;
  border-bottom: 1px solid var(--border, #dbe2eb) !important;
  margin: 1px 0 16px !important;
  scrollbar-width: thin !important;
  padding: 0 !important;
}

:is(.iad-workbench, body) button.dc-type-tab,
button.dc-type-tab,
.dc-type-tab {
  position: relative !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 7px !important;
  flex: 0 0 auto !important;
  min-height: 40px !important;
  height: 40px !important;
  padding: 0 1px !important;
  border: 0 !important;
  border-bottom: 2px solid transparent !important;
  border-radius: 0 !important;
  background: transparent !important;
  color: #526680 !important;
  font: inherit !important;
  font-size: 13px !important;
  cursor: pointer !important;
  box-shadow: none !important;
  outline: none !important;
}
:is(.iad-workbench, body) button.dc-type-tab[aria-selected="true"],
button.dc-type-tab[aria-selected="true"],
.dc-type-tab[aria-selected="true"] {
  color: var(--blue, #285ed6) !important;
  border-bottom-color: var(--blue, #285ed6) !important;
  font-weight: 600 !important;
  background: transparent !important;
}
:is(.iad-workbench, body) button.dc-type-tab:hover,
button.dc-type-tab:hover,
.dc-type-tab:hover {
  color: var(--blue, #285ed6) !important;
  background: transparent !important;
}
.dc-type-tab .dc-tab-num {
  font-size: 12px !important;
  color: inherit !important;
  font-weight: 500 !important;
  opacity: .85 !important;
  font-variant-numeric: tabular-nums !important;
}

/* Statistics Drawer Rows: Flat 2-column grid with bottom hairline */
:is(.iad-workbench, body) button.dc-stat-type,
button.dc-stat-type,
.dc-stat-type {
  display: grid !important;
  grid-template-columns: 1fr auto !important;
  align-items: center !important;
  gap: 5px 16px !important;
  text-align: left !important;
  background: transparent !important;
  color: var(--ink, #17233a) !important;
  border: 0 !important;
  border-bottom: 1px solid var(--border2, #e6ebf1) !important;
  border-radius: 0 !important;
  padding: 15px 2px !important;
  cursor: pointer !important;
  width: 100% !important;
  min-height: 0 !important;
  font: inherit !important;
  box-shadow: none !important;
  outline: none !important;
}
:is(.iad-workbench, body) button.dc-stat-type:hover,
button.dc-stat-type:hover,
.dc-stat-type:hover {
  background: var(--surface-alt, #f9fafc) !important;
}
.dc-stat-type .dc-stat-label {
  font-size: 13px !important;
  font-weight: 550 !important;
  color: var(--ink, #17233a) !important;
}
.dc-stat-type .dc-stat-value {
  color: #1e3d7c !important;
  font-variant-numeric: tabular-nums !important;
  font-size: 17px !important;
  font-weight: 600 !important;
}
.dc-stat-track {
  height: 5px !important;
  background: #ecf0f6 !important;
  border-radius: 4px !important;
  overflow: hidden !important;
  grid-column: 1 / -1 !important;
  margin-top: 5px !important;
}
.dc-stat-track > span {
  display: block !important;
  height: 100% !important;
  background: #4f7be2 !important;
  border-radius: 4px !important;
}

.dc-drawer-total {
  display: flex !important;
  align-items: baseline !important;
  gap: 12px !important;
  padding: 6px 0 20px !important;
  border-bottom: 1px solid var(--border, #dbe2eb) !important;
}
.dc-drawer-total strong {
  font-size: 33px !important;
  line-height: 1.25 !important;
  font-variant-numeric: tabular-nums !important;
  font-weight: 650 !important;
  color: var(--ink, #17233a) !important;
}
.dc-drawer-total span {
  font-size: 14px !important;
  color: #607087 !important;
}
.dc-stats-label {
  font-size: 13px !important;
  margin: 24px 0 10px !important;
  font-weight: 600 !important;
  color: #3b4e68 !important;
}
.dc-model-stats-heading {
  margin-top: 30px !important;
}

:is(.iad-workbench, body) button.dc-more-filters,
button.dc-more-filters,
.dc-more-filters {
  height: 38px !important;
  min-height: 38px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 7px !important;
  margin-left: 2px !important;
  padding: 0 12px !important;
  background: #fff !important;
  border: 1px solid #c3cfdd !important;
  border-radius: 5px !important;
  color: #465b73 !important;
  font-size: 13px !important;
  font-weight: 550 !important;
  cursor: pointer !important;
  position: relative !important;
  box-shadow: none !important;
}
:is(.iad-workbench, body) button.dc-more-filters:hover,
button.dc-more-filters:hover,
.dc-more-filters:hover,
:is(.iad-workbench, body) button.dc-more-active,
button.dc-more-active,
.dc-more-active {
  border-color: #7f9bdf !important;
  color: #245bd1 !important;
  background: #f5f8ff !important;
}

:is(.iad-workbench, body) button.dc-card,
button.dc-card,
.dc-card {
  border: 1px solid var(--border2, #e6ebf1) !important;
  border-radius: 7px !important;
  background: #fff !important;
  overflow: hidden !important;
  color: var(--ink, #17233a) !important;
  text-align: left !important;
  padding: 0 !important;
  min-height: 0 !important;
  box-shadow: none !important;
  cursor: pointer !important;
  transition: box-shadow .15s, border-color .15s !important;
}
:is(.iad-workbench, body) button.dc-card:hover,
button.dc-card:hover,
.dc-card:hover {
  border-color: #91aee8 !important;
  box-shadow: 0 5px 16px #183a6720 !important;
}

:is(.iad-workbench, body) button.dc-multi-trigger,
button.dc-multi-trigger,
.dc-multi-trigger {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 12px !important;
  width: 100% !important;
  min-height: 38px !important;
  height: 38px !important;
  border: 1px solid #aebdd2 !important;
  border-radius: 5px !important;
  background: #fff !important;
  padding: 0 12px !important;
  text-align: left !important;
  color: var(--ink, #17233a) !important;
  font-size: 13px !important;
  box-shadow: none !important;
  cursor: pointer !important;
}
.dc-new-multi .dc-multi-trigger {
  height: 40px !important;
  min-height: 40px !important;
  font-size: 13px !important;
}

/* =================== V30 Styles =================== */
.dc-verdict-symbol {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex: none !important;
  width: 25px !important;
  height: 25px !important;
  border-radius: 5px !important;
}
.dc-verdict-symbol svg {
  width: 17px !important;
  height: 17px !important;
  stroke: currentColor !important;
  fill: none !important;
  stroke-width: 1.9 !important;
  stroke-linecap: round !important;
  stroke-linejoin: round !important;
}
.dc-verdict-symbol.conflict {
  color: #bc6030 !important;
  background: #fff2e8 !important;
}
.dc-verdict-symbol.no_conflict {
  color: #2a8367 !important;
  background: #e8f5ee !important;
}
.dc-verdict-symbol:focus-visible {
  outline: 2px solid #3873dd !important;
}

/* V30 Unified Dialog Geometry */
:root {
  --iad-content-modal-gutter: clamp(20px, 3.4vw, 60px);
  --iad-content-modal-radius: 8px;
  --iad-content-modal-width: 1260px;
  --iad-content-modal-height: 820px;
}
.detail-overlay,
.dc-modal-mask:has(#dc-dialog-title) {
  padding: var(--iad-content-modal-gutter) !important;
  background: rgba(23, 34, 51, 0.68) !important;
  align-items: center !important;
  justify-content: center !important;
}
.detail-dialog,
.dc-modal-mask:has(#dc-dialog-title) .dc-dialog {
  width: min(var(--iad-content-modal-width), calc(100vw - 2 * var(--iad-content-modal-gutter))) !important;
  height: min(var(--iad-content-modal-height), calc(100dvh - 2 * var(--iad-content-modal-gutter))) !important;
  max-width: none !important;
  max-height: none !important;
  min-height: 0 !important;
  flex: none !important;
  margin: 0 auto !important;
  border-radius: var(--iad-content-modal-radius) !important;
  border: 1px solid #d9e2ed !important;
  overflow: hidden !important;
  box-shadow: 0 20px 64px rgba(14, 26, 48, 0.27) !important;
}

/* V30 Centered Statistical Dialog & 3 Vertical Stacked Bar Charts */
.dc-stats-mask {
  align-items: center !important;
  justify-content: center !important;
  padding: clamp(20px, 4.5vw, 74px) !important;
  background: rgba(23, 34, 51, 0.68) !important;
}
.dc-stats-dialog {
  width: min(1170px, 100%) !important;
  max-height: min(810px, calc(100dvh - 2 * clamp(20px, 4.5vw, 74px))) !important;
  background: #fff !important;
  border: 1px solid #d9e2ed !important;
  border-radius: 8px !important;
  box-shadow: 0 20px 64px rgba(14, 26, 48, 0.27) !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
}
.dc-stats-header {
  min-height: 65px !important;
  padding: 0 25px !important;
  border-bottom: 1px solid var(--border, #dbe2eb) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 16px !important;
  flex: none !important;
}
.dc-stats-header h2 {
  font-size: 17px !important;
  font-weight: 650 !important;
  margin: 0 !important;
  color: var(--ink, #17233a) !important;
}
.dc-stats-content {
  overflow-y: auto !important;
  overflow-x: hidden !important;
  min-height: 0 !important;
  padding: 22px 25px 25px !important;
}
.dc-stats-charts {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) !important;
  gap: 13px !important;
  align-items: stretch !important;
}
.dc-vchart-panel {
  width: 100% !important;
  min-width: 0 !important;
  padding: 14px 18px 12px !important;
  border: 1px solid var(--border, #dbe2eb) !important;
  border-radius: 7px !important;
  background: #fff !important;
}
.dc-vchart-panel h3 {
  font-size: 14px !important;
  font-weight: 650 !important;
  color: var(--ink, #17233a) !important;
  margin: 0 0 11px !important;
}
.dc-vchart-body {
  display: grid !important;
  grid-template-columns: 32px minmax(0, 1fr) !important;
  gap: 9px !important;
  min-width: 0 !important;
}
.dc-vchart-axis {
  height: 115px !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  align-items: flex-end !important;
  color: #7b889b !important;
  font-size: 11px !important;
  font-variant-numeric: tabular-nums !important;
}
.dc-vchart-figure {
  position: relative !important;
  min-width: 0 !important;
  overflow: visible !important;
}
.dc-vchart-lines {
  pointer-events: none !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  height: 115px !important;
  background: linear-gradient(to bottom, #e2e8f0 0 1px, transparent 1px 24.8%, #e2e8f0 25% calc(25% + 1px), transparent calc(25% + 1px) 49.8%, #e2e8f0 50% calc(50% + 1px), transparent calc(50% + 1px) 74.8%, #e2e8f0 75% calc(75% + 1px), transparent calc(75% + 1px) 99.5%, #b9c8dc 100%) !important;
  z-index: 0 !important;
}
.dc-vchart-columns {
  position: relative !important;
  z-index: 1 !important;
  display: grid !important;
  grid-template-columns: repeat(var(--chart-cols, 6), minmax(0, 1fr)) !important;
  gap: 4px !important;
  min-width: 0 !important;
}
.dc-vchart-column {
  min-width: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
}
.dc-vchart-barslot {
  height: 115px !important;
  width: 100% !important;
  display: flex !important;
  align-items: flex-end !important;
  justify-content: center !important;
  min-width: 0 !important;
}
:is(.iad-workbench, body) button.dc-vchart-bar,
button.dc-vchart-bar,
.dc-vchart-bar {
  position: relative !important;
  width: clamp(16px, 65%, 42px) !important;
  border: 0 !important;
  border-radius: 4px 4px 0 0 !important;
  background: #5379d2 !important;
  cursor: pointer !important;
  min-height: 2px !important;
  padding: 0 !important;
  transition: background 0.14s ease !important;
  flex: none !important;
  box-shadow: none !important;
}
:is(.iad-workbench, body) button.dc-vchart-bar:hover,
:is(.iad-workbench, body) button.dc-vchart-bar:focus-visible,
button.dc-vchart-bar:hover,
button.dc-vchart-bar:focus-visible,
.dc-vchart-bar:hover,
.dc-vchart-bar:focus-visible {
  background: #2859c2 !important;
}
:is(.iad-workbench, body) button.dc-vchart-zero,
button.dc-vchart-zero,
.dc-vchart-zero {
  background: #c6d2e4 !important;
}
.dc-vchart-value {
  position: absolute !important;
  bottom: calc(100% + 6px) !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  font-size: 13px !important;
  line-height: 1 !important;
  font-weight: 650 !important;
  font-variant-numeric: tabular-nums !important;
  color: #243b63 !important;
  pointer-events: none !important;
  white-space: nowrap !important;
}
.dc-vchart-label {
  width: 100% !important;
  min-height: 28px !important;
  padding-top: 8px !important;
  display: block !important;
  text-align: center !important;
  font-size: 12px !important;
  line-height: 1.35 !important;
  overflow-wrap: anywhere !important;
  color: #596b84 !important;
}
.dc-vchart-agreement {
  grid-column: auto !important;
  width: 100% !important;
  justify-self: stretch !important;
}
.dc-vchart-agreement .dc-vchart-axis,
.dc-vchart-agreement .dc-vchart-lines,
.dc-vchart-agreement .dc-vchart-barslot {
  height: 115px !important;
}
.dc-vchart-agreement .dc-vchart-columns {
  width: min(640px, 100%) !important;
  margin: 0 auto !important;
}
.dc-vchart-agreement .dc-vchart-bar {
  width: min(54px, 62%) !important;
}

/* V30 Comparison Dialog Panels */
.dc-fact-panel,
.dc-model-panel,
.dc-conclusion-panel,
.dc-review-panel {
  border-top: 1px solid #e4eaf1 !important;
  margin-top: 16px !important;
  padding-top: 16px !important;
}
.dc-fact-panel h3,
.dc-model-panel h3,
.dc-conclusion-panel h3,
.dc-review-panel h3 {
  font-size: 14px !important;
  font-weight: 650 !important;
  color: #22364c !important;
  margin: 0 0 9px !important;
}
.dc-fact-panel .dc-verdict-value,
.dc-conclusion-panel .dc-verdict-value {
  display: block !important;
  color: #294b82 !important;
  font-size: 14px !important;
  font-weight: 650 !important;
  line-height: 1.55 !important;
}
.dc-fact-panel .dc-verdict-description,
.dc-conclusion-panel .dc-verdict-description {
  display: block !important;
  color: #43546a !important;
  font-size: 13px !important;
  line-height: 1.7 !important;
  margin: 5px 0 0 !important;
}
.dc-model-panel p {
  color: #43546a !important;
  font-size: 13px !important;
  line-height: 1.7 !important;
  margin: 0 !important;
}

/* V30 Filter Bar layout */
.dc-results-section .dc-refined-filterbar .dc-search-field {
  order: 0 !important;
  flex: 0 1 248px !important;
  max-width: 300px !important;
  min-width: 185px !important;
}
.dc-results-section .dc-refined-filterbar .dc-filter-field:not(.dc-search-field) {
  order: 1 !important;
  flex: 0 1 205px !important;
}
.dc-results-section .dc-refined-filterbar .dc-more-filters {
  order: 2 !important;
}

/* V30 Comparison Dialog Photo & Bounding Box rules */
.dc-compare-photo .dc-compare-stage-wrapper {
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  position: relative !important;
  overflow: hidden !important;
}

.dc-compare-photo .dc-photo-stage {
  position: relative !important;
  line-height: 0 !important;
  display: block !important;
}

.dc-compare-photo .dc-photo-stage img {
  width: 100% !important;
  height: 100% !important;
  display: block !important;
  pointer-events: none !important;
  user-select: none !important;
}

.dc-compare-photo .dc-bbox {
  position: absolute !important;
  border: 2px solid #e88c26 !important;
  background: transparent !important;
  box-shadow: none !important;
  pointer-events: none !important;
  box-sizing: border-box !important;
}

#dc-compare-mask .dc-candidate-strip, .dc-conflict-dialog .dc-candidate-strip { margin: 12px 0 8px !important; }

#dc-new-mask .dc-prompt-editor {
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
}
#dc-new-mask .dc-prompt-editor label {
  font-weight: 600 !important;
  font-size: 13px !important;
  color: #17233a !important;
}
#dc-new-mask #dc-new-prompt {
  box-sizing: border-box !important;
  width: 100% !important;
  min-height: 180px !important;
  height: 205px !important;
  resize: vertical !important;
  border: 1px solid #b9c7d9 !important;
  border-radius: 5px !important;
  padding: 12px 13px !important;
  font-family: inherit !important;
  font-size: 13px !important;
  font-weight: 400 !important;
  line-height: 1.75 !important;
  color: #293c54 !important;
  background: #fff !important;
  white-space: pre-wrap !important;
}
#dc-new-mask #dc-new-prompt:focus { outline: 2px solid #80a9ff !important; outline-offset: 1px !important; }

/* V38: 数据一致性检查作业分页与对齐规范 */
.dc-section.dc-jobs-section.iba-job-multipage .dc-table-panel{min-height:530px}
.dc-section.dc-jobs-section .dc-table-panel{overflow-x:auto;overflow-y:visible;max-height:none}
.dc-section.dc-jobs-section .iba-job-pager{border:1px solid #dbe2eb;border-top:0;border-radius:0 0 7px 7px}
.dc-section.dc-jobs-section .dc-table-panel:has(+ .iba-job-pager){border-bottom-left-radius:0;border-bottom-right-radius:0}
.dc-section.dc-jobs-section.iba-job-multipage .dc-table-panel{border-bottom-left-radius:0;border-bottom-right-radius:0}

@media(max-width:650px){
  .dc-section.dc-jobs-section.iba-job-multipage .dc-table-panel{min-height:530px}
}

/* V33: common filter controls in one row; the lone review filter no longer needs a drawer. */
.dc-results-section .dc-refined-filterbar .dc-review-field{order:2;flex:0 1 188px}
.dc-results-section .dc-refined-filterbar .dc-review-field select{width:100%}
/* Compact two-line judgments, no cryptic verdict glyph and no card stretch. */
.dc-grid{align-items:start}
.dc-grid .dc-card{display:flex;flex-direction:column;align-self:start;min-width:0;min-height:0}
.dc-card-caption{padding:9px 11px 10px;flex:none}
.dc-card-caption>strong{margin-bottom:8px;line-height:18px}
.dc-card-judgments{display:flex;flex-direction:column;gap:4px;min-width:0}
.dc-judgment-line{display:flex;align-items:baseline;gap:8px;min-width:0;line-height:18px;font-size:12px}
.dc-judgment-key{color:#718197;flex:none;min-width:58px;font-weight:450}
.dc-judgment-value{color:#334b6d;font-weight:550;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.dc-judgment-clear{color:#267657}
@media(max-width:900px){.dc-results-section .dc-refined-filterbar .dc-review-field{flex:1 1 170px}}

/* V35: compact one-line card footer; left aligned raw type, right aligned model type.
   Explanations remain accessible via title/aria-label; no duplicated visible labels. */
.dc-grid .dc-card{height:auto!important;min-height:0!important;align-self:start!important;font-family:inherit!important;}
.dc-grid .dc-card-img{height:140px;flex:none;}
.dc-grid .dc-card-caption{padding:7px 9px 8px!important;flex:none;min-height:0!important;}
.dc-grid .dc-card-caption>strong{margin-bottom:4px!important;line-height:18px!important;font-size:12px!important;font-weight:600!important;color:#17233a!important;font-family:inherit!important;}
.dc-grid .dc-card-judgments{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:center;column-gap:7px;min-width:0;line-height:18px;}
.dc-grid .dc-card-judgments>.dc-judgment-value{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:inherit!important;font-size:12px!important;line-height:18px!important;font-weight:600!important;}
.dc-grid .dc-card-judgments>.dc-raw-value{color:#64748b!important;text-align:left;}
.dc-grid .dc-card-judgments>.dc-model-value{color:#17233a!important;text-align:right;}
.dc-grid .dc-card-judgments>.dc-judgment-clear{color:#267657!important;}

/* V39: data-consistency job table only — two compact status columns, no new vertical scrolling. */
.dc-section.dc-jobs-section .dc-table{min-width:1050px}
.dc-section.dc-jobs-section .dc-table .dc-total,
.dc-section.dc-jobs-section .dc-table .dc-elapsed{white-space:nowrap;font-variant-numeric:tabular-nums}
.dc-section.dc-jobs-section .dc-table .dc-has-conflicts{font-weight:650}

#dc-delete-mask.dc-modal-mask {
  background: #17243ab8 !important;
  z-index: 430 !important;
}
`;
