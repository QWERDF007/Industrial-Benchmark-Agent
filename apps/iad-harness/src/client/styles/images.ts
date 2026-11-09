export const imagesStyles = `
.iad-image-quality{position:absolute;left:9px;top:9px;z-index:2;padding:4px 9px;border-radius:4px;background:var(--iad-surface);color:var(--iad-text);font-weight:650;pointer-events:none}
.iad-image-quality[data-quality="OK"]{color:var(--iad-success,#24844b)}
.iad-image-quality[data-quality="NG"]{color:var(--iad-danger,#c44545)}
.main{width:100%;min-width:0;padding:0}
.crumb{color:#8190a6;font-size:11px;margin:0 0 2px}
.heading-side{font-size:12px;color:#8190a6}

.dataset-panel{display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.field{display:flex;flex-direction:column;gap:5px;min-width:0}
.field>label,.filter-item>label{font-size:12px;color:#586a84}
.dataset-panel .parent{width:265px}
.dataset-panel .child{width:410px}
.dataset-panel select{width:100%;height:38px}

.filter-bar{background:var(--surface,#fff);border:1px solid var(--border,#dbe2eb);border-radius:7px;padding:10px 14px;display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:12px}
.filter-item{display:flex;flex-direction:column;gap:5px;min-width:0}
.filter-item input,.filter-item select{height:38px}
.filter-search{flex:1 1 240px;min-width:180px}
.filter-search input{width:100%}
.filter-status{width:136px}
.filter-ann{width:142px}
.filter-category{width:176px}
.filter-sort{width:143px}
.btn-reset{border:1px solid var(--border,#dbe2eb);color:#55667e;background:#fff;height:38px;padding:0 14px;border-radius:5px;white-space:nowrap}

.empty{min-height:200px;border:1px dashed var(--border,#dbe2eb);border-radius:8px;display:grid;place-items:center;color:#738398;background:#fff}

.full-overlay {position:fixed;inset:0;z-index:10010;display:flex;align-items:stretch;justify-content:stretch;padding:0;background:#1c2633}
.full-overlay.hidden {display:none !important}
.detail-preview{flex:none;width:100%;height:355px;display:flex;justify-content:center;align-items:center;border:1px solid var(--border2,#e6ebf1);border-radius:6px;background:#f2f5f9;cursor:zoom-in;padding:0;position:relative;overflow:hidden}
.detail-preview:hover{border-color:#95afed}
.detail-preview:focus-visible{outline:2px solid var(--blue,#285ed6)}
.preview-image-frame, .detail-preview .preview-image-frame{position:relative;height:100%;max-width:100%;max-height:100%;display:flex;justify-content:center;align-items:center}
.preview-image-frame img, .detail-preview img{max-width:100%;max-height:100%;object-fit:contain;display:block}
.preview-overlay{position:absolute;inset:0;pointer-events:none}
.preview-overlay .bbox{position:absolute;border:2px solid #f1b14b;box-shadow:0 0 0 1px #16304788;min-height:3px;min-width:3px;box-sizing:border-box}
.preview-overlay .bbox::before{content:attr(data-label);position:absolute;left:-2px;bottom:100%;padding:1px 4px;color:#fff;font-size:11px;line-height:17px;background:#263d59;white-space:nowrap;border-radius:2px}
.preview-overlay .bbox:nth-child(even){border-color:#ffca64}
.detail-preview-hint {position:absolute;right:11px;bottom:11px;background:#17243bd9;border-radius:4px;padding:5px 9px;color:#fff;font-size:11px;opacity:0;transition:opacity .15s}
.detail-preview:hover .detail-preview-hint,.detail-preview:focus-visible .detail-preview-hint{opacity:1}
.detail-content {margin-top:20px;padding:16px 0 0}
.detail-section-heading{font-size:13px;font-weight:650;margin:0 0 12px;color:#26344c}
.detail-meta {display:grid;grid-template-columns:104px minmax(0,1fr);gap:11px 20px;margin:0;font-size:12px;align-items:start}
.detail-meta dt{color:#72829b}
.detail-meta dd{margin:0;color:#24334d;min-width:0;overflow-wrap:anywhere}
.detail-meta dd.monospace{font-family:inherit;font-size:inherit;font-weight:inherit;letter-spacing:inherit}
.detail-meta dd.path-value{overflow-wrap:anywhere}
.detail-part{margin-top:20px;padding-top:16px;border-top:1px solid var(--border2,#e6ebf1)}
.detail-ann-row {display:flex;align-items:center;gap:12px;border:1px solid #e4e9f2;background:#f8fafc;padding:10px 12px;border-radius:5px;font-size:12px}
.detail-ann-row strong {font-weight:600}
.detail-ann-row span {margin-left:auto;color:#718097;font-size:11px}
.detail-fallback{font-size:12px;color:#76859c}
.detail-tip{font-size:11px;color:#8c99ab;margin-top:10px}

.full-overlay {z-index:10010;display:flex;align-items:stretch;justify-content:stretch;padding:0;background:#1c2633}
.full-dialog {display:flex;flex-direction:column;width:100vw;height:100dvh;min-width:0;min-height:0;background:#202a36}
.full-toolbar {position:relative;height:52px;flex:none;display:flex;align-items:center;justify-content:space-between;gap:16px;background:#1c2633;border-bottom:1px solid rgba(255,255,255,.08);padding:0 20px;color:#f4f7fd}
.full-toolbar>.iad-image-quality{left:50%;top:50%;transform:translate(-50%,-50%);padding:0;border-radius:0;background:transparent;color:inherit;font-size:13px;font-weight:600}
.full-file{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;max-width:calc(50% - 48px);flex:1;color:#f4f7fd !important}
.full-stage {flex:1;position:relative;overflow:hidden;min-height:0;background:#202a36;touch-action:none;cursor:grab}
.full-stage.dragging{cursor:grabbing}
.full-image-world {position:absolute;left:50%;top:50%;transform-origin:center;user-select:none}
.full-image-world img {display:block;width:100%;height:100%;pointer-events:none;user-select:none}
.full-annotation-layer{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.full-annotation-layer.hidden{display:none}
.full-annotation-layer .bbox{position:absolute;border:2px solid #ffb74c;box-shadow:0 0 0 1px #152b4099;min-height:3px;min-width:3px;background:transparent !important;box-sizing:border-box}
.full-annotation-layer .bbox::before{content:attr(data-label);position:absolute;bottom:100%;left:-2px;border-radius:2px;background:#152538;color:#fff;font-size:11px;line-height:17px;padding:1px 4px}
.full-annotation-layer .bbox:nth-child(even){border-color:#ffdc72}
.full-side-nav {position:absolute;z-index:1;top:50%;transform:translateY(-50%);height:56px;width:48px;border:1px solid transparent;background:transparent;color:#f4f7fd;border-radius:6px;font-size:34px;display:grid;place-items:center;box-shadow:none;text-shadow:0 1px 2px #10182799;transition:background .15s ease,border-color .15s ease;cursor:pointer}
.full-side-nav:hover:not(:disabled),.full-side-nav:focus-visible{background:rgba(255,255,255,.24) !important;border-color:rgba(255,255,255,.25) !important}
.full-side-nav.prev{left:18px}.full-side-nav.next{right:18px}
.full-side-nav:disabled{opacity:.18;cursor:default}
.full-side-nav:disabled:hover{background:transparent;border-color:transparent}

.full-actions{display:flex;align-items:center;gap:6px;flex:none;white-space:nowrap}

/* Zoom Dropdown: background & border slightly brighter than canvas background */
.full-actions .zoom-wrap{position:relative;flex:none;display:inline-flex;align-items:center;background:rgba(255,255,255,.12) !important;border:1px solid rgba(255,255,255,.22) !important;border-radius:6px;transition:background .15s ease,border-color .15s ease}
.full-actions .zoom-wrap:hover{background:rgba(255,255,255,.20) !important;border-color:rgba(255,255,255,.36) !important}
.full-actions select{min-width:96px;width:96px;height:36px;appearance:none;-webkit-appearance:none;padding:0 24px 0 10px;text-align:center;text-align-last:center;border:none !important;background:transparent !important;color:#f4f7fd !important;font:500 13px/36px system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;cursor:pointer;outline:none}
.full-actions .zoom-wrap:focus-within{outline:2px solid #a1c6ff;outline-offset:1px;border-color:transparent}
.full-actions .zoom-chevron{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:14px;height:14px;display:grid;place-items:center;color:#b2c2d6;pointer-events:none}
.full-actions .zoom-chevron svg{width:14px;height:14px;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round;filter:none}
.full-actions select option{color:#192b46;background:#fff;text-shadow:none}
.full-actions .full-close{margin-left:6px}
.full-actions svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 1px 2px rgba(0,0,0,.72));pointer-events:none}

.detail-ann-table {width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed;color:#293951}
.detail-ann-table th{background:#f2f5fa;color:#6b7b91;font-weight:500;text-align:left;padding:9px 10px;border-bottom:1px solid #e2e8f0}
.detail-ann-table td{padding:11px 10px;border-bottom:1px solid #ebeff5;vertical-align:middle;overflow-wrap:anywhere}
.detail-ann-table tr:last-child td{border-bottom:none}
.detail-ann-table th:first-child,.detail-ann-table td:first-child{width:44px;color:#687b97}
.detail-ann-table th:nth-child(2),.detail-ann-table td:nth-child(2){width:135px}
.detail-ann-table th:nth-child(3),.detail-ann-table td:nth-child(3){width:80px}
.detail-ann-table td.annotation-coord{font-family:inherit;font-size:inherit;white-space:normal}
.detail-ann-summary{font-size:12px;color:#63738c;font-weight:400;padding-left:8px}
.detail-annotation-heading{display:flex;align-items:baseline;margin-bottom:12px}
.detail-annotation-heading h3{margin:0}
.detail-section-heading, .detail-meta dt, .detail-meta dd {font-family:inherit;letter-spacing:normal}
.detail-ann-label{display:grid;grid-template-columns:104px 1fr;gap:20px;font-size:12px;padding:8px 0}
.detail-ann-label span:first-child{color:#72829b}

.dataset-panel .child{position:relative}
.detail-ann-table tr:last-child td{border-bottom:0}
.detail-ann-table .ann-value{font:inherit;color:#34435d;white-space:normal}

.detail-model-section{margin-top:18px;padding-top:16px;border-top:1px solid var(--border2,#e6ebf1)}
.detail-model-section .detail-section-heading{margin-bottom:10px}
.detail-model-text{font:inherit;font-size:12px;color:#596a82;line-height:1.65;margin:0}
.detail-model-result{font:inherit;font-size:12px;color:#31435d;line-height:1.65;margin:0 0 6px}
.detail-model-result strong{font-weight:600}
.detail-model-demo{font-size:11px;color:#8996aa;margin-left:8px}

.dataset-panel select,.filter-item select{
  -webkit-appearance:none;appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23566880' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-size:16px 16px;
  background-position:right 11px center;padding-right:35px;background-color:var(--surface,#fff);
}
#reset{margin-left:0;align-self:flex-end}
#refresh{align-self:flex-end}

.iad-workbench[data-page="industrial-images"] .dataset-panel {
  margin-bottom: 8px !important;
}
.iad-workbench[data-page="industrial-images"] .filter-bar {
  margin-bottom: 8px !important;
  padding: 7px 12px !important;
}
.iad-workbench[data-page="industrial-images"] .grid {
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important;
  gap: 10px 12px !important;
}
.iad-workbench[data-page="industrial-images"] .thumb {
  aspect-ratio: 4/3 !important;
  max-height: none !important;
}
.iad-workbench[data-page="industrial-images"] .pagination {
  margin-top: 10px !important;
  padding: 4px 0 2px !important;
}
`;
