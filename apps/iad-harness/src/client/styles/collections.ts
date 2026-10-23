export const collectionsStyles = `.iad-main {display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;align-items:start;}
.iad-audit-sample:not(.iad-inline-dialog) .iad-inspector{position:static;padding:0}.iad-audit-sample:not(.iad-inline-dialog) .iad-inspector>h2{display:none}
.iad-main[data-compact=true]{grid-template-columns:minmax(0,1fr)}
.iad-gallery {min-width:0;color:var(--iad-text);background:transparent;border:0;border-radius:var(--iad-radius);padding:0;}.iad-filters {display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin-bottom:20px;background:transparent;padding:0;}
.iad-filter {font-size:12px;color:var(--iad-muted);display:flex;flex-direction:column;gap:8px;min-width:0;max-width:100%;}
.iad-filter select {font-size:14px;width:150px;max-width:100%;color:var(--iad-text);}
.iad-pagination {display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:12px 0;font-size:12px;}
.iad-pagination button {font-size:12px;}
.iad-grid {display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,184px),1fr));gap:24px 16px;}
.iad-sample-item {position:relative;min-width:0;}
.iad-workbench button.iad-sample {display:flex;flex-direction:column;justify-content:flex-start;align-items:stretch;width:100%;height:100%;padding:0;text-align:left;overflow:hidden;border:2px solid transparent;box-shadow:none;background:var(--iad-surface);}
.iad-workbench button.iad-sample:hover {background:var(--iad-hover);}
.iad-workbench button.iad-sample.is-selected {border-color:var(--iad-primary);}
.iad-sample>strong {display:block;margin:0;padding:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:20px;font-weight:500;}
.iad-thumb {position:relative;width:100%;aspect-ratio:4/3;flex:none;overflow:hidden;background:var(--iad-surface-muted);}.iad-thumb img {position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:contain;}
.iad-sample-label {font-size:.75rem;line-height:44px;padding:0 8px;color:var(--iad-muted);}
.iad-workbench .iad-status-trigger {position:absolute;right:4px;bottom:2px;z-index:1;display:flex;align-items:center;justify-content:end;gap:6px;min-height:44px;padding:4px 8px;border:0;background:transparent;font-size:.75rem;color:var(--iad-muted);}
.iad-status-mark {width:6px;height:6px;border-radius:50%;background:currentColor;flex:none;}
.iad-reference {padding:2px 5px;color:var(--iad-on-viewer);border-radius:4px;font-size:12px;}
.iad-reference {position:absolute;left:6px;bottom:6px;background:var(--iad-success-badge);}
.iad-inspector {background:var(--iad-surface);border:0;border-radius:var(--iad-radius);padding:20px;min-width:0;position:sticky;top:0;}
.iad-image-button {display:block;width:100%;padding:0!important;border:0!important;background:var(--iad-surface-muted)!important;}
.iad-image-frame {position:relative;width:100%;line-height:0;}.iad-image-frame img {display:block;width:100%;height:auto;}
.iad-inspector-filename{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}.iad-observation-summary{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.iad-inspector>h3{margin-top:16px}.iad-inspector-basis{margin-top:12px!important;overflow-wrap:anywhere}.iad-audit-details{margin-top:20px}.iad-audit-details>summary{cursor:pointer;min-height:40px;color:var(--iad-muted)}
.iad-inspector>.iad-media-load .iad-image-button {height:156px;margin:16px 0;display:flex;justify-content:center;align-items:center;overflow:hidden}.iad-inspector>.iad-media-load .iad-image-frame {width:auto;max-width:100%;height:100%}.iad-inspector>.iad-media-load .iad-image-frame img {width:auto;max-width:100%;height:100%;object-fit:contain;}
.iad-image-frame svg,.iad-finding-layer {position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
.iad-image-frame rect,.iad-image-frame polygon,.iad-finding-layer rect {fill:none;stroke:var(--iad-warning);stroke-width:calc(2px / var(--iad-view-scale,1));vector-effect:non-scaling-stroke;}
.iad-image-frame text {fill:var(--iad-on-viewer);stroke:var(--iad-viewer);stroke-width:calc(4px / var(--iad-view-scale,1));paint-order:stroke;stroke-linejoin:round;font-size:calc(14px / var(--iad-view-scale,1));}
.iad-image-frame .iad-annotation-mask {opacity:.28;}
.iad-image-frame .iad-annotation-mask rect {fill:var(--iad-warning);stroke:none;}
.iad-workbench dl {display:grid;grid-template-columns:105px minmax(0,1fr);gap:8px 10px;font-size:12px;}
.iad-workbench dt {color:var(--iad-muted);}.iad-workbench dd {margin:0;overflow-wrap:anywhere;}
.iad-workbench code {overflow-wrap:anywhere;}
.iad-workbench dd code {display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;}
.iad-annotation {display:flex;flex-direction:column;padding:7px 0;font-size:12px;}.iad-annotation span {color:var(--iad-muted);}
.iad-observation {white-space:pre-wrap;font-size:13px;}.iad-actions {display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}
.iad-field {display:flex;flex-direction:column;gap:7px;margin:16px 0;}.iad-field>.iad-row {flex-wrap:nowrap;}.iad-field input {flex:1;}
.iad-row>.iad-field {flex:1 1 280px;min-width:0;}
.iad-error {color:var(--iad-danger);background:var(--iad-danger-bg);padding:10px;border-radius:6px;overflow-wrap:anywhere;}
.iad-muted {color:var(--iad-muted);font-size:.75rem;}
.iad-empty {padding:40px;text-align:center;color:var(--iad-muted);}
.iad-review-records {min-width:0;padding:18px;background:var(--iad-surface);border-radius:var(--iad-radius);}
.iad-preview-table {width:100%;border-collapse:collapse;text-align:left;font-size:13px;}.iad-preview-table th,.iad-preview-table td {padding:10px 16px;height:56px;border-bottom:1px solid var(--iad-border);}.iad-preview-table th {height:44px;background:var(--iad-surface-muted);color:var(--iad-muted);font-weight:500}.iad-preview-table .iad-number {text-align:right;font-variant-numeric:tabular-nums}.iad-preview-table select {width:150px;max-width:100%;}
.iad-table-scroll {max-width:100%;overflow:auto;scroll-margin-block:24px;}.iad-review-records table {width:100%;min-width:620px;border-collapse:collapse;text-align:left;font-size:13px;}
.iad-review-records .iad-table-scroll {max-height:min(60dvh,480px);}
.iad-review-records caption {text-align:left;font-weight:600;margin:12px 0;}.iad-review-records th,.iad-review-records td {padding:12px;vertical-align:top;overflow-wrap:anywhere;max-width:240px;}
.iad-review-records thead,.iad-review-records tr[data-selected=true] {background:var(--iad-surface-muted);}.iad-review-records time {font-size:12px;color:var(--iad-muted);}
.iad-settings {display:grid;gap:28px;min-width:0;max-width:1160px;}
.iad-settings>section {min-width:0;}.iad-dataset-list>.iad-table-scroll,.iad-dataset-detail>.iad-tab-panel {background:var(--iad-surface);border-radius:var(--iad-radius)}.iad-dataset-detail>.iad-tab-panel{padding:24px}.iad-dataset-list .iad-section-header input{width:240px;max-width:65%}.iad-dataset-detail>h2{overflow-wrap:anywhere}.iad-dataset-detail .iad-rule{margin-top:20px}.iad-dataset-detail .iad-section-layout .iad-field{margin-bottom:20px;}
.iad-job-table {min-width:0;}.iad-job-table>.iad-field {max-width:240px;}.iad-identifier {display:block;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.iad-resource-table {width:100%;border-collapse:collapse;text-align:left;font-size:.875rem;}
.iad-resource-table th,.iad-resource-table td {padding:8px 16px;height:56px;border-bottom:1px solid var(--iad-border);vertical-align:middle;}
.iad-resource-table th {height:44px;background:var(--iad-surface-muted);font-weight:500;color:var(--iad-muted);white-space:nowrap;}
.iad-resource-table .iad-number {text-align:right;font-variant-numeric:tabular-nums;}
.iad-resource-table tr[data-selected=true] {background:var(--iad-hover);}
.iad-resource-table .iad-dataset-name {margin:0;min-width:140px;max-width:360px;}
.iad-row-menu summary {cursor:pointer;display:flex;align-items:center;gap:8px;min-height:40px;padding:8px;}
.iad-row-menu .iad-floating-menu-panel {min-width:64px;}
.iad-dataset-name {flex:1;}
.iad-dataset-name {min-width:0;margin-bottom:12px;}
.iad-workbench .iad-name-trigger {display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-width:0;padding:4px 6px;background:transparent;border-color:transparent;text-align:left;font-weight:600;min-height:44px;}
.iad-name-trigger span {min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.iad-name-trigger svg {flex-shrink:0;}
.iad-dataset-name input {width:100%;}
.iad-detail-dialog:has(.iad-dataset-import) {width:min(640px,calc(100vw - 32px));}
.iad-dataset-import {max-width:640px;margin:auto;}
.iad-directory {min-width:0;margin:0;border:0;background:var(--iad-surface-muted);padding:14px;border-radius:8px;}.iad-directory code {overflow-wrap:anywhere;}
.iad-directory-list {display:flex;flex-direction:column;max-height:230px;overflow:auto;gap:5px;margin-top:10px;}
.iad-rule {margin-top:20px;}.iad-reference-grid {display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}
.iad-reference-grid img {width:90px;height:68px;object-fit:contain;background:var(--iad-surface-muted);border-radius:5px;}
.iad-reference-grid small {display:block;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;}
`;
