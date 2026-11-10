export const consistencyStyles = `
.iad-consistency .iad-consistency-query{padding:18px 20px 16px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;margin-bottom:14px}
.iad-consistency .iad-consistency-query .iad-row{align-items:end;gap:12px;flex-wrap:wrap}.iad-consistency-query .iad-filter{min-width:145px;gap:7px;color:var(--iad-muted);font-size:12px}.iad-consistency-query .iad-filter :is(select,input){font-size:14px;height:40px}
.iad-consistency-summary{margin:12px 0 14px}.iad-consistency-status{display:flex;align-items:center;flex-wrap:wrap;gap:10px 24px;padding:11px 15px;border:1px solid var(--iad-border);border-radius:6px;background:var(--iad-surface-muted);font-size:12px}.iad-consistency-status strong{font-weight:650}.iad-consistency-status>span{white-space:nowrap}
.iad-consistency-summary-details{margin-left:auto;position:relative}.iad-consistency-summary-details>summary{cursor:pointer;color:var(--iad-muted)}.iad-consistency-summary-body{position:absolute;right:0;top:28px;z-index:8;width:540px;max-width:75vw;padding:16px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:6px}.iad-consistency-summary-body .iad-row{gap:10px}
.iad-consistency-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:290px;padding:44px 24px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;text-align:center;color:var(--iad-text);font-weight:400}.iad-consistency-empty p{margin:0 0 18px;max-width:560px}.iad-consistency-empty .iad-row{justify-content:center}
.iad-consistency-list,.iad-consistency-detail{min-width:0;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;overflow:hidden}
.iad-consistency-panel-header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:15px 16px 13px;border-bottom:1px solid var(--iad-border)}.iad-consistency-panel-header strong{font-size:15px}.iad-consistency-panel-header>span{color:var(--iad-muted);font-size:12px}
.iad-consistency-detail-body{padding:16px}.iad-consistency-detail-actions{display:flex;flex-wrap:wrap;gap:8px;padding-top:14px;margin-top:14px;border-top:1px solid var(--iad-border)}
.iad-consistency-search-layout{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:14px;align-items:start}.iad-consistency-candidate-grid{display:grid;align-content:start;align-items:start;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:16px;max-height:570px;overflow:auto;min-height:360px}.iad-consistency-candidate-grid>button{display:flex;flex-direction:column;gap:5px;min-width:0;text-align:left;white-space:normal}.iad-consistency-candidate-grid img{display:block;width:100%;height:146px;object-fit:contain;background:var(--iad-viewer);border-radius:3px}.iad-consistency-candidate-grid strong{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}.iad-consistency-candidate-grid :is(span,small){font-size:12px;color:var(--iad-muted)}.iad-consistency-detail-photo{width:100%;height:290px;object-fit:contain;background:var(--iad-viewer);border-radius:3px}.iad-consistency-detail-body dl{display:grid;grid-template-columns:90px minmax(0,1fr);gap:7px;font-size:12px;margin-top:14px}.iad-consistency-detail-body dt{color:var(--iad-muted)}.iad-consistency-detail-body dd{margin:0;overflow-wrap:anywhere}.iad-consistency-result-pagination{margin:12px 0}
.iad-consistency-jobs{display:grid;gap:16px;margin-top:14px}.iad-consistency-jobs .iad-resource-table{width:100%;table-layout:fixed}.iad-consistency-jobs .iad-resource-table :is(th,td){padding:13px 16px}.iad-consistency-jobs .iad-resource-table tr[aria-selected=true]{background:var(--iad-hover)}.iad-consistency-jobs td small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--iad-muted);font-size:11px;margin-top:4px}.iad-consistency-jobs [aria-label="批次详情"]{padding:18px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px}.iad-consistency-jobs progress{width:100%;accent-color:var(--iad-primary)}.iad-consistency-text-button{min-height:0;border:0;background:none;padding:0;text-align:left;color:var(--iad-primary)}
.iad-consistency-expanded{margin-top:14px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px}.iad-consistency-expanded>.iad-consistency-layout{padding:16px;margin:0}
.iad-consistency-query fieldset,.iad-consistency-review fieldset{border:0;padding:0;margin:0;min-width:0}
.iad-consistency-query .iad-filter input{min-width:0;max-width:100%}.iad-consistency-query input[type=file]{width:178px}.iad-consistency-query .iad-query-search{flex:1;min-width:190px}.iad-consistency-query .iad-query-search input{width:100%}.iad-consistency-query .iad-query-sample{flex:0 1 224px;min-width:200px}.iad-consistency-query .iad-query-sample select{width:100%}
.iad-consistency-query .iad-pagination{padding:0;margin-left:auto}.iad-consistency-query-actions{margin-top:14px}.iad-consistency-advanced summary{cursor:pointer;min-height:40px;display:flex;align-items:center;color:var(--iad-muted)}.iad-consistency-advanced[open]{flex:1}.iad-consistency-advanced .iad-row{margin:8px 0}
.iad-consistency-scope summary{cursor:pointer;min-height:40px;display:flex;align-items:center}.iad-consistency-scope label{display:flex;align-items:center;gap:8px;margin:8px 0}
.iad-consistency-results>p{margin:8px 0 16px}.iad-consistency-layout{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:20px;align-items:start;margin-top:20px}
.iad-consistency-differences{min-width:0;max-height:620px;overflow:auto}.iad-consistency-differences button{display:flex;flex-direction:column;align-items:stretch;text-align:left;white-space:normal;width:100%;gap:6px;margin-bottom:8px}
.iad-consistency-comparison{min-width:0}
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
.iad-consistency-group-dialog[open]{display:flex;flex-direction:column}.iad-group-header,.iad-group-footer{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:15px 22px;flex:none;background:var(--iad-surface)}.iad-group-header{border-bottom:1px solid var(--iad-border)}.iad-group-header>div:first-child{min-width:0}.iad-group-header h2{font-size:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:3px 0}.iad-group-header p{margin:0;font-size:12px;color:var(--iad-muted)}.iad-group-header span{font-size:11px}.iad-group-header .iad-row{flex-wrap:nowrap;gap:8px}
.iad-group-scroll{display:flex;flex-direction:column;flex:1;min-height:0;padding:18px 24px 0;overflow:hidden}.iad-group-visuals{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding-bottom:8px}.iad-consistency-group-dialog .iad-image-pair{margin-top:0}.iad-consistency-group-dialog .iad-image-pair-side>p{font-size:13px;font-weight:600;margin:0 0 8px;color:var(--iad-text)}.iad-consistency .iad-consistency-group-dialog .iad-embedded-canvas{height:clamp(280px,39vh,430px)}.iad-consistency-group-dialog .iad-lightbox-toolbar{padding:5px;gap:4px;flex-wrap:nowrap}.iad-consistency-group-dialog .iad-viewer-heading{display:none}.iad-consistency-group-dialog .iad-viewer-zoom select{width:90px}.iad-consistency-group-dialog .iad-viewer-body{margin-top:0}
.iad-group-image-names{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:8px;color:var(--iad-muted);font-size:11px}.iad-group-image-names span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.iad-group-candidates{margin:20px 0 16px}.iad-group-candidates>.iad-row{justify-content:space-between;gap:10px}.iad-group-candidates h3{margin:0 auto 8px 0;font-size:13px}.iad-group-candidate-strip{display:flex;overflow:auto;gap:10px;padding:3px 1px 8px}.iad-group-candidate-strip>button{display:grid;flex:0 0 116px;gap:4px;text-align:left;min-width:0}.iad-group-candidate-strip img{width:104px;height:94px;object-fit:contain;background:var(--iad-viewer);border-radius:3px}.iad-group-candidate-strip strong{font-size:11px}.iad-group-candidate-strip span{font-size:10px;color:var(--iad-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:104px}
.iad-group-analysis{flex:none;max-height:40%;overflow:auto;overscroll-behavior:contain;border-top:1px solid var(--iad-border);padding-bottom:16px}.iad-group-analysis h3{font-size:14px}.iad-group-analysis .iad-tab-panel{padding:16px 0 0}.iad-group-analysis .iad-consistency-differences{max-height:none;overflow:visible}.iad-group-references{display:grid;grid-template-columns:60px minmax(0,1fr);gap:6px;font-size:12px}.iad-group-references dd{margin:0;overflow-wrap:anywhere}.iad-group-fact{display:flex;align-items:center;gap:16px;padding:12px 0;border-top:1px solid var(--iad-border);font-size:12px}.iad-group-fact>button{margin-left:auto}.iad-group-footer{border-top:1px solid var(--iad-border)}
.iad-group-conclusions{display:block}.iad-group-conclusions>p{margin:12px 0;font-size:13px;line-height:1.7}.iad-group-limitations{margin-top:12px;padding:12px;background:var(--iad-surface-muted);color:var(--iad-muted);font-size:12px}.iad-group-limitations p{margin:0}
.iad-consistency-job-summary{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,.6fr) repeat(2,minmax(0,1fr));gap:0;margin:14px 0;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;padding:12px 0}
.iad-consistency-job-summary>div{min-width:0;padding:2px 18px;border-right:1px solid var(--iad-border);display:flex;flex-direction:column;align-items:start;gap:5px}.iad-consistency-job-summary>div:last-child{border-right:0}.iad-consistency-job-summary>div>span:first-child,.iad-consistency-job-summary small{color:var(--iad-muted);font-size:12px}.iad-consistency-job-summary strong{font-size:18px}.iad-consistency-job-summary .iad-job-sync{position:relative;margin:0;padding-right:55px;gap:8px}.iad-consistency-job-summary .iad-job-sync>span[role=status]{color:var(--iad-text);font-weight:600;font-size:14px}.iad-consistency-job-summary .iad-job-sync>button{position:absolute;right:12px;top:12px;margin:0}.iad-consistency-job-detail-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.iad-consistency-job-detail-heading h2{font-size:15px;margin:0}.iad-consistency-job-detail-heading strong{font-size:12px;color:var(--iad-primary)}.iad-consistency-job-progress{gap:16px;margin:12px 0}.iad-consistency-child-jobs{margin:18px 0}.iad-consistency-child-jobs>summary{cursor:pointer;font-size:12px;color:var(--iad-muted);padding:8px 0}.iad-consistency-jobs [aria-label="批次比较结果"] h3{font-size:14px}.iad-consistency-jobs [aria-label="批次比较结果"]>.iad-row{padding:12px 0;border-top:1px solid var(--iad-border);font-size:12px}
.iad-consistency-report-strip{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:0;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;padding:10px 0}.iad-consistency-report-strip>div{display:grid;gap:6px;align-content:start;padding:2px 16px;border-right:1px solid var(--iad-border);min-width:0}.iad-consistency-report-strip>div:last-child{border-right:0}.iad-consistency-report-strip :is(span,small){color:var(--iad-muted);font-size:11px}.iad-consistency-report-strip strong{font-size:16px}.iad-consistency-report-strip>div:first-child strong{font-size:14px}.iad-consistency-report-tools{display:flex;align-items:center;gap:12px;margin:6px 0;font-size:12px}.iad-consistency-summary-details{margin-left:auto}.iad-consistency-summary-details>summary{padding:3px 0}
.iad-consistency-filter-chips{display:flex;gap:10px;padding:12px 16px 0;flex-wrap:wrap}
@container workbench (max-width:1200px){.iad-consistency-gallery{grid-template-columns:repeat(4,minmax(0,1fr))}}

:root {
  --blue: #285ed6;
  --blue-light: #eaf0ff;
  --border: #dbe2eb;
  --border2: #e6ebf1;
  --ink: #17233a;
  --sub: #64748b;
  --surface-alt: #f9fafc;
}

.dc-root{min-width:0}
.dc-heading-actions{display:flex;align-items:center;gap:8px}
.dc-section{margin:0 0 var(--iad-layout-gap)}
.dc-results-section{background:var(--iad-surface);border:1px solid var(--iad-panel-border);border-radius:6px;box-shadow:none;padding:0}
.dc-results-body{padding:18px 20px 22px}
.dc-result-panel{min-height:100dvh}
.dc-table-panel{overflow-x:auto}
.dc-table{border-collapse:collapse;width:100%;min-width:1050px;text-align:left;font-size:13px}
.dc-table th{font-weight:400;background:var(--iad-surface-muted);border-bottom:1px solid var(--iad-border)}
.dc-table td{border-bottom:1px solid var(--iad-border);font-size:13px}
.dc-table:not(.iad-job-table-grid) th{padding:12px 18px}
.dc-table:not(.iad-job-table-grid) td{padding:14px 18px}
.dc-table tbody tr:last-child td{border-bottom:0}
.dc-table tbody tr{cursor:pointer}
.dc-table tbody tr:hover{background:var(--iad-hover)}
.dc-table tbody tr[data-selected=true]{background:var(--iad-hover)}
.dc-table tbody tr:focus-visible{outline:2px solid var(--iad-primary);outline-offset:-2px}
.dc-table .dc-operations{text-align:right;white-space:nowrap;width:120px}
.dc-job-datasets{max-width:280px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.dc-mono,.dc-total,.dc-elapsed{font-variant-numeric:tabular-nums}
.dc-time,.dc-total,.dc-elapsed{white-space:nowrap}
.dc-state.exp-pill{font-weight:650}
.dc-empty{min-height:132px;display:flex;align-items:center;justify-content:center;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:7px;padding:24px;text-align:center}
.dc-jobs-section>.dc-empty{border:0;border-radius:0}
.dc-refined-filterbar{display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin:0 0 17px;min-height:56px}
.dc-filter-field{display:flex;flex-direction:column;gap:7px;min-width:0}
.dc-search-field input{width:100%;height:38px;border:1px solid var(--iad-control-border);border-radius:5px;background:var(--iad-surface);padding:0 12px;font:inherit;color:var(--iad-text)}
.dc-results-section .dc-conflict-grid{gap:14px}
.dc-results-section .dc-conflict-grid>button.iad-thumbnail-card{border-color:var(--iad-panel-border);border-radius:5px}
.dc-dialog-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex:none}
.dc-dialog-head-actions{display:flex;align-items:center;gap:8px}
.dc-dialog-head-actions button{white-space:nowrap}
.dc-dialog-body{display:block;min-height:0;overflow:auto;flex:1;scrollbar-gutter:stable}
.dc-group-review-form{display:flex;flex-direction:column;flex:1;min-height:0}
.dc-compare{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.dc-compare-cell{min-width:0}
.dc-compare-photo{height:235px;border:1px solid var(--iad-border);border-radius:6px;background:var(--iad-surface-muted);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:zoom-in}
.dc-compare-photo img{height:100%;width:100%;object-fit:contain}
.dc-photo-filename{line-height:20px;margin:7px 2px 0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.dc-decision-controls{display:flex;gap:16px;flex-wrap:wrap;margin:10px 0 14px}
.dc-decision-controls label{display:inline-flex;align-items:center;gap:7px}
.dc-decision-controls input{height:16px;width:16px;accent-color:var(--iad-primary)}
.dc-note{width:100%;height:58px;min-height:58px;padding:10px;border:1px solid var(--iad-control-border);border-radius:5px;resize:vertical;color:var(--iad-text);background:var(--iad-surface)}
.dc-dialog-footer{display:flex;gap:8px;justify-content:flex-end;flex:none}
.dc-new-body{padding:22px 26px 24px;display:grid;gap:20px}
.dc-new-field{display:grid;gap:9px;font-size:13px;font-weight:600}
.dc-new-parent{min-height:38px;display:flex;align-items:center;padding:0 12px;background:var(--iad-surface-muted);border:1px solid var(--iad-border);border-radius:5px;font-weight:400}
.dc-prompt-editor{display:flex;flex-direction:column;gap:8px}
.dc-prompt-editor label{font-weight:600}
#dc-new-prompt{box-sizing:border-box;width:100%;min-height:180px;height:205px;resize:vertical;border:1px solid var(--iad-control-border);border-radius:5px;padding:12px 13px;font:inherit;font-weight:400;line-height:1.75;color:var(--iad-text);background:var(--iad-surface);white-space:pre-wrap}
#dc-new-prompt:focus-visible{outline:2px solid var(--iad-primary);outline-offset:1px}
@media(max-width:1000px){.dc-compare{grid-template-columns:1fr}}
@media(max-width:650px){.dc-scope{display:grid}.dc-dialog-head-actions{gap:4px}}

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
:is(.iad-workbench, body) button.dc-vchart-bar,button.dc-vchart-bar {
  position: relative !important;
  width: clamp(16px, 65%, 42px) !important;
  flex: none !important;
}
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
.dc-vchart-bar:hover,.dc-vchart-bar:focus-visible {
  background: #2859c2 !important;
}
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

.dc-images-panel,
.dc-fact-panel,
.dc-model-panel,
.dc-conclusion-panel,
.dc-review-panel {
  border-top: 1px solid #e4eaf1 !important;
  margin-top: 16px !important;
  padding-top: 16px !important;
}
.dc-images-panel h3,
.dc-fact-panel h3,
.dc-model-panel h3,
.dc-conclusion-panel h3,
.dc-review-panel h3 {
  font-size: 14px !important;
  font-weight: 650 !important;
  color: var(--iba-unified-ink, #172338) !important;
  margin: 0 0 8px !important;
}
.dc-fact-panel .dc-verdict-value,
.dc-conclusion-panel .dc-verdict-value {
  display: block !important;
  color: var(--iba-unified-ink, #172338) !important;
  font-size: 13px !important;
  font-weight: 400 !important;
  line-height: 1.6 !important;
}
.dc-fact-panel .dc-verdict-description,
.dc-conclusion-panel .dc-verdict-description,
.dc-model-panel p,
.dc-fact-panel p,
.dc-conclusion-panel p {
  display: block !important;
  color: var(--iba-unified-ink, #172338) !important;
  font-size: 13px !important;
  font-weight: 400 !important;
  line-height: 1.7 !important;
  margin: 5px 0 0 !important;
}
.dc-candidate-group h4{font-size:13px;font-weight:500;margin:10px 0 4px}
.dc-candidate-group p{font-size:13px;margin:5px 0}
.dc-model-panel .dc-analysis-sources{font-weight:600!important;overflow-wrap:anywhere}
.dc-model-panel p{white-space:pre-wrap;overflow-wrap:anywhere}
`;
