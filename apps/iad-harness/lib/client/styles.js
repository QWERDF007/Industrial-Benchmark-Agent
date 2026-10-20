import { themeStyles } from "./theme.js";
export const workbenchStyles = themeStyles + `
.iad-workbench {height:100%;box-sizing:border-box;overflow:auto;min-width:0;padding:24px;color:var(--iad-text);background:var(--iad-canvas);font:var(--dsh-content-font-size,14px)/1.55 system-ui,sans-serif;}
.iad-workbench * {box-sizing:border-box;}
.iad-workbench code {overflow-wrap:anywhere;}
.iad-field select {width:100%;}
.iad-workbench h1 {font-size:24px;margin:3px 0 0;font-weight:700;}
.iad-workbench h2 {font-size:17px;margin:0 0 16px;}
.iad-workbench h3 {font-size:14px;margin:20px 0 9px;overflow:hidden;text-overflow:ellipsis;}
.iad-workbench button,.iad-workbench input,.iad-workbench select,.iad-workbench textarea {font:inherit;}
.iad-workbench button {cursor:pointer;background:var(--iad-surface);color:var(--iad-text);border:1px solid var(--iad-border);border-radius:8px;min-height:40px;padding:8px 12px;}
.iad-workbench button:hover {background:var(--iad-hover);}
.iad-workbench button:disabled {cursor:default;opacity:.45;}
.iad-workbench button.iad-primary {background:var(--iad-primary);border-color:var(--iad-primary);color:var(--iad-on-primary);}
.iad-workbench button.iad-danger {color:var(--iad-danger);}
.iad-workbench input,.iad-workbench select,.iad-workbench textarea {min-width:0;color:var(--iad-text);background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:6px;padding:8px 9px;min-height:40px;}
.iad-workbench input[type=checkbox] {width:auto;}
.iad-workbench textarea {min-height:80px;resize:vertical;}
.iad-header,.iad-row {display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.iad-header {justify-content:space-between;margin-bottom:25px;}
.iad-eyebrow {font-size:12px;letter-spacing:1.5px;color:var(--iad-primary);}
.iad-kpis {display:grid;grid-template-columns:repeat(4,1fr);gap:28px;margin-bottom:24px;}
.iad-kpis>div {padding:16px 20px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:10px;box-shadow:0 2px 5px var(--iad-surface-muted);}
.iad-kpis span,.iad-kpis strong {display:block;}
.iad-kpis span,.iad-muted {color:var(--iad-muted);font-size:12px;}
.iad-kpis strong {font-size:25px;}.iad-kpis small {font-size:15px;color:var(--iad-muted);font-weight:400;}
.iad-tabs {display:flex;gap:12px;margin-bottom:23px;}
.iad-tabs button {border:none;background:transparent;padding:9px 14px;}
.iad-tabs button.active {background:var(--iad-hover);color:var(--iad-primary);}
.iad-main {display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:26px;align-items:start;}
.iad-gallery {min-width:0;color:var(--iad-text);background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:10px;padding:16px;}.iad-filters {display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin-bottom:10px;background:var(--iad-surface-muted);border-radius:8px;padding:12px;}
.iad-filter {font-size:12px;color:var(--iad-muted);display:flex;flex-direction:column;gap:4px;}
.iad-filter select {font-size:12px;max-width:160px;color:var(--iad-text);}
.iad-pagination {display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:12px 0;font-size:12px;}
.iad-pagination button {font-size:12px;}
.iad-grid {display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:14px;}
.iad-workbench button.iad-sample {padding:0;text-align:left;overflow:hidden;border:2px solid transparent;box-shadow:0 2px 8px var(--iad-surface-muted);}
.iad-workbench button.iad-sample.is-selected {border-color:var(--iad-primary);}
.iad-sample>strong,.iad-sample>span {display:block;margin:6px 9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;}
.iad-thumb {position:relative;aspect-ratio:1.35;background:var(--iad-surface-muted);}.iad-thumb img {width:100%;height:100%;object-fit:contain;}
.iad-badge,.iad-reference {position:absolute;top:6px;left:6px;padding:2px 5px;background:var(--iad-viewer);color:var(--iad-on-viewer);border-radius:4px;font-size:12px;}
.iad-badge.is-risk {background:var(--iad-danger-badge);}.iad-reference {top:auto;bottom:6px;background:var(--iad-success-badge);}
.iad-inspector {background:var(--iad-surface);border:1px solid var(--iad-border);box-shadow:0 3px 12px var(--iad-surface-muted);border-radius:10px;padding:18px;min-width:0;}
.iad-image-button {display:block;width:100%;padding:0!important;border:0!important;background:var(--iad-surface-muted)!important;}
.iad-image-frame {position:relative;width:100%;line-height:0;}.iad-image-frame img {display:block;width:100%;height:auto;}
.iad-image-frame svg {position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
.iad-image-frame rect,.iad-image-frame polygon {fill:var(--iad-surface-muted);stroke:var(--iad-warning);stroke-width:calc(2px / var(--iad-view-scale,1));vector-effect:non-scaling-stroke;}
.iad-image-frame text {fill:var(--iad-warning);font-size:14px;}
.iad-workbench dl {display:grid;grid-template-columns:105px minmax(0,1fr);gap:8px 10px;font-size:12px;}
.iad-workbench dt {color:var(--iad-muted);}.iad-workbench dd {margin:0;overflow-wrap:anywhere;}
.iad-workbench dd code {display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;}
.iad-annotation {display:flex;flex-direction:column;padding:7px 0;font-size:12px;}.iad-annotation span {color:var(--iad-muted);}
.iad-observation {white-space:pre-wrap;font-size:13px;}.iad-actions {display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}
.iad-field {display:flex;flex-direction:column;gap:7px;margin:16px 0;}.iad-field>.iad-row {flex-wrap:nowrap;}.iad-field input {flex:1;}
.iad-error {color:var(--iad-danger);background:var(--iad-danger-bg);padding:10px;border-radius:6px;overflow-wrap:anywhere;}
.iad-empty {padding:40px;text-align:center;color:var(--iad-muted);}
.iad-settings {display:grid;grid-template-columns:minmax(240px,1fr) minmax(0,2fr);gap:24px;}
.iad-settings>section {padding:20px;background:var(--iad-surface);border-radius:8px;min-width:0;}
.iad-dataset-list {display:flex;flex-direction:column;gap:8px;}
.iad-dataset-list button {display:flex;flex-direction:column;align-items:start;gap:6px;text-align:start;padding:14px;background:var(--iad-surface-muted);border-color:transparent;overflow-wrap:anywhere;}
.iad-dataset-list button[aria-pressed=true] {background:color-mix(in srgb,var(--iad-primary) 10%,var(--iad-surface));border-color:var(--iad-primary);}
.iad-dataset-list span {font-size:13px;color:var(--iad-muted);}
.iad-detail-dialog:has(.iad-dataset-import) {width:min(640px,calc(100vw - 32px));}
.iad-dataset-import {max-width:640px;margin:auto;}
.iad-directory {background:var(--iad-surface-muted);padding:14px;border-radius:8px;}.iad-directory code {overflow-wrap:anywhere;}
.iad-directory-list {display:flex;flex-direction:column;max-height:230px;overflow:auto;gap:5px;margin-top:10px;}
.iad-rule {margin-top:20px;}.iad-reference-grid {display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}
.iad-reference-grid img {width:90px;height:68px;object-fit:contain;background:var(--iad-surface-muted);border-radius:5px;}
.iad-reference-grid small {display:block;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;}
.iad-job-panel {max-width:1000px;}.iad-job-panel>h2 {margin-top:26px;}.iad-job {padding:16px;margin-bottom:12px;background:var(--iad-surface-muted);border-radius:8px;}
.iad-job progress {width:100%;height:7px;accent-color:var(--iad-primary);}.iad-job small {overflow-wrap:anywhere;}
.iad-lightbox {position:fixed;inset:0;z-index:10000;background:var(--iad-viewer);display:flex;flex-direction:column;padding:20px;}
.iad-lightbox-toolbar {display:flex;flex-wrap:wrap;gap:16px;align-items:center;flex-shrink:0;color:var(--iad-on-viewer);}.iad-lightbox-toolbar strong {flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.iad-viewer-viewport {position:relative;flex:1;min-height:0;overflow:hidden;margin-top:18px;touch-action:none;cursor:grab;user-select:none;}
.iad-viewer-viewport:active {cursor:grabbing;}
.iad-viewer-world {position:absolute;left:50%;top:50%;transform-origin:center;}
.iad-viewer-world .iad-image-frame,.iad-viewer-world img {width:100%;height:100%;}
.iad-eye {display:flex;align-items:center;justify-content:center;}
.iad-info-group {background:var(--iad-surface-muted);padding:14px;border-radius:8px;margin:14px 0;}
.iad-info-group h3:first-child {margin-top:0;}
.iad-analysis {margin-top:14px;font-size:12px;overflow-wrap:anywhere;}
.iad-analysis summary {cursor:pointer;color:var(--iad-primary);}
.iad-multiselect {position:relative;align-self:end;min-width:135px;}
.iad-multiselect summary {cursor:pointer;list-style:none;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:6px;padding:8px 9px;min-height:40px;font-size:12px;}
.iad-multiselect-menu {position:absolute;z-index:20;top:100%;left:0;min-width:190px;max-height:300px;overflow:auto;padding:12px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:8px;box-shadow:0 8px 24px var(--iad-border);}
.iad-multiselect-menu label {display:flex;gap:9px;align-items:center;padding:6px 0;color:var(--iad-text);white-space:normal;font-size:12px;}
.iad-multiselect-menu input {accent-color:var(--iad-primary);}
.iad-reference-grid button {padding:0;border:0;line-height:0;}
.iad-job-section {padding:20px;margin-bottom:18px;background:var(--iad-surface);border:1px solid var(--iad-border);border-radius:10px;}
.iad-job-section h2 {margin-top:0;}
.iad-evidence-preview {display:flex;align-items:center;gap:10px;width:100%;margin:10px 0;text-align:left;font-size:12px!important;}
.iad-evidence-preview img {width:90px;height:70px;object-fit:contain;background:var(--iad-surface-muted);}
.iad-quality-report dt {color:var(--iad-muted);}
.iad-profile {padding:14px;background:var(--iad-surface-muted);border-radius:8px;}
@media(max-width:1100px) {.iad-workbench {padding:20px;}.iad-main {grid-template-columns:minmax(0,1fr) 300px;}.iad-grid {grid-template-columns:repeat(auto-fill,minmax(125px,1fr));}}
@media(max-width:760px) {.iad-main,.iad-settings {grid-template-columns:1fr;}.iad-kpis {grid-template-columns:repeat(2,1fr);gap:10px;}.iad-inspector {width:100%;}}

.iad-workbench :is(button,input,select,textarea,summary):focus-visible {outline:2px solid var(--iad-primary);outline-offset:3px;}
.iad-workbench :is(input[type=checkbox]) {min-height:20px;width:20px;accent-color:var(--iad-primary);}
.iad-detail-dialog {width:min(1000px,calc(100% - 32px));max-height:calc(100% - 32px);overflow:auto;margin:auto;background:var(--iad-surface);color:var(--iad-text);border:0;border-radius:8px;padding:16px;}
.iad-detail-dialog::backdrop {background:var(--iad-scrim);}
.iad-detail-dialog>.iad-row {margin-bottom:16px;}
.iad-detail-dialog .iad-inspector {border:0;box-shadow:none;}
.iad-browse {min-width:0;}
.iad-reference-manager {margin-top:24px;}.iad-reference-manager>summary {cursor:pointer;padding:16px;background:var(--iad-surface);border-radius:8px;}
.iad-workbench .iad-eye {min-width:44px;min-height:44px;}
@media(max-width:760px) {.iad-workbench {padding:16px;}.iad-header {align-items:start;}.iad-header>.iad-row {width:100%;}.iad-header select {flex:1;max-width:100%;}.iad-tabs {flex-wrap:wrap;}.iad-settings {width:100%;}.iad-pagination {flex-wrap:wrap;}.iad-detail-overlay {padding:8px;}.iad-lightbox {padding:12px;}.iad-lightbox-toolbar strong {flex-basis:100%;}.iad-workbench dl {grid-template-columns:80px minmax(0,1fr);}.iad-kpis>div {padding:12px;}}
@media(prefers-reduced-motion:reduce) {.iad-workbench * {scroll-behavior:auto;transition:none;animation:none;}}

.iad-knowledge-split {display:grid;grid-template-columns:minmax(220px,1fr) minmax(0,2fr);gap:24px;align-items:start;}
.iad-check-list {display:grid;gap:8px;}.iad-check-list>button {display:grid;gap:4px;text-align:left;}.iad-check-list>button[aria-pressed=true] {background:var(--iad-hover);border-color:var(--iad-primary);}.iad-check-list span {color:var(--iad-muted);font-size:12px;}
@media(max-width:760px) {.iad-knowledge-split {grid-template-columns:minmax(0,1fr);}.iad-knowledge-page .iad-row>label {width:100%;}}
`;
