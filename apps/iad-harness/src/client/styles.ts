import { themeStyles } from "./theme.js";
import { controlStyles } from "./controls.js";
export const workbenchStyles = themeStyles + controlStyles + `
.iad-exploration-groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.iad-exploration-groups fieldset{border:0;padding:0;min-width:0}.iad-exploration-page{display:grid;gap:20px;min-width:0}.iad-exploration-page>.iad-info-group{min-width:0}.iad-exploration-page textarea{width:100%}@media(max-width:760px){.iad-exploration-groups{grid-template-columns:minmax(0,1fr)}}
.iad-workbench {height:100%;box-sizing:border-box;overflow:auto;min-width:0;overflow-wrap:anywhere;padding:24px;color:var(--iad-text);background:var(--iad-canvas);font:var(--dsh-content-font-size,14px)/1.55 system-ui,sans-serif;}
.iad-workbench * {box-sizing:border-box;}
.iad-field select {width:100%;}
.iad-workbench h1 {font-size:24px;margin:3px 0 0;font-weight:700;}
.iad-workbench h2 {font-size:17px;margin:0 0 16px;}
.iad-workbench h3 {font-size:14px;margin:20px 0 9px;overflow:hidden;text-overflow:ellipsis;}
.iad-header,.iad-row {display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.iad-action-end {margin-inline-start:auto;flex:none;}
.iad-header {justify-content:space-between;margin-bottom:16px;}
.iad-eyebrow {font-size:12px;letter-spacing:1.5px;color:var(--iad-primary);}
.iad-kpis {display:flex;flex-wrap:wrap;gap:8px 24px;margin-bottom:20px;color:var(--iad-muted);}
.iad-kpis>div {display:flex;align-items:baseline;gap:8px;}
.iad-kpis strong {color:var(--iad-text);}
.iad-kpis span,.iad-muted {color:var(--iad-muted);font-size:12px;}
.iad-kpis strong {font-size:16px;}.iad-kpis small {font-size:15px;color:var(--iad-muted);font-weight:400;}
.iad-tabs {display:flex;gap:8px;margin-bottom:16px;}
.iad-tabs button {border:none;background:transparent;padding:9px 14px;}
.iad-tabs button.active {background:var(--iad-hover);color:var(--iad-primary);}
.iad-main,.iad-settings {display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:26px;align-items:start;}
.iad-gallery {min-width:0;color:var(--iad-text);background:var(--iad-surface);border:0;border-radius:10px;padding:16px;}.iad-filters {display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin-bottom:10px;background:var(--iad-surface-muted);border-radius:8px;padding:12px;}
.iad-filter {font-size:12px;color:var(--iad-muted);display:flex;flex-direction:column;gap:4px;min-width:0;max-width:100%;}
.iad-filter select {font-size:14px;max-width:180px;color:var(--iad-text);}
.iad-pagination {display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:12px 0;font-size:12px;}
.iad-pagination button {font-size:12px;}
.iad-grid {display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:14px;}
.iad-sample-item {position:relative;min-width:0;}
.iad-workbench button.iad-sample {display:flex;flex-direction:column;justify-content:flex-start;align-items:stretch;width:100%;height:100%;padding:0;text-align:left;overflow:hidden;border:2px solid transparent;box-shadow:none;background:var(--iad-surface);}
.iad-workbench button.iad-sample:hover {background:var(--iad-hover);}
.iad-workbench button.iad-sample.is-selected {border-color:var(--iad-primary);}
.iad-sample>strong {display:block;margin:0;padding:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:20px;font-weight:500;}
.iad-thumb {position:relative;width:100%;aspect-ratio:4/3;flex:none;overflow:hidden;background:var(--iad-surface-muted);}.iad-thumb img {position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:contain;}
.iad-workbench .iad-sample-metrics {display:flex;flex-direction:row;flex-wrap:wrap;justify-content:space-between;gap:4px 8px;margin:0;padding:0 8px 8px;}
.iad-sample-metrics>div {display:flex;align-items:baseline;min-width:0;text-align:left;}.iad-sample-metrics dt {font-size:12px;line-height:1.5;white-space:nowrap;}.iad-sample-metrics dd {font-size:12px;line-height:1.5;margin:0;color:var(--iad-text);font-variant-numeric:tabular-nums;}
.iad-workbench .iad-status-trigger {position:absolute;left:4px;top:4px;z-index:1;display:flex;align-items:start;justify-content:start;min-height:44px;min-width:44px;padding:8px;border:0;background:transparent;}
.iad-workbench .iad-status-trigger:hover:not(:disabled) {background:transparent;}
.iad-status-trigger span {display:block;width:14px;height:14px;border:2px solid var(--iad-surface);border-radius:2px;background:var(--iad-muted);box-shadow:0 0 0 1px #0003;}
.iad-status-trigger.is-PASS span {background:var(--iad-success);}
.iad-status-trigger.is-FAIL span {background:var(--iad-danger);}
.iad-status-trigger.is-UNCERTAIN span {background:var(--iad-warning);}
.iad-reference {padding:2px 5px;color:var(--iad-on-viewer);border-radius:4px;font-size:12px;}
.iad-reference {position:absolute;left:6px;bottom:6px;background:var(--iad-success-badge);}
.iad-inspector {background:var(--iad-surface);border:0;border-radius:10px;padding:18px;min-width:0;}
.iad-image-button {display:block;width:100%;padding:0!important;border:0!important;background:var(--iad-surface-muted)!important;}
.iad-image-frame {position:relative;width:100%;line-height:0;}.iad-image-frame img {display:block;width:100%;height:auto;}
.iad-image-frame svg,.iad-finding-layer {position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
.iad-image-frame rect,.iad-image-frame polygon,.iad-finding-layer rect {fill:none;stroke:var(--iad-warning);stroke-width:calc(2px / var(--iad-view-scale,1));vector-effect:non-scaling-stroke;}
.iad-image-frame text {fill:var(--iad-on-viewer);stroke:var(--iad-viewer);stroke-width:calc(4px / var(--iad-view-scale,1));paint-order:stroke;stroke-linejoin:round;font-size:calc(14px / var(--iad-view-scale,1));}
.iad-image-frame .iad-annotation-mask {opacity:.28;}
.iad-image-frame .iad-annotation-mask rect {fill:var(--iad-warning);stroke:none;}
.iad-workbench dl {display:grid;grid-template-columns:105px minmax(0,1fr);gap:8px 10px;font-size:12px;}
.iad-workbench dt {color:var(--iad-muted);}.iad-workbench dd {margin:0;overflow-wrap:anywhere;}
.iad-workbench dd code {display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;}
.iad-annotation {display:flex;flex-direction:column;padding:7px 0;font-size:12px;}.iad-annotation span {color:var(--iad-muted);}
.iad-observation {white-space:pre-wrap;font-size:13px;}.iad-actions {display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}
.iad-field {display:flex;flex-direction:column;gap:7px;margin:16px 0;}.iad-field>.iad-row {flex-wrap:nowrap;}.iad-field input {flex:1;}
.iad-row>.iad-field {flex:1 1 280px;min-width:0;}
.iad-error {color:var(--iad-danger);background:var(--iad-danger-bg);padding:10px;border-radius:6px;overflow-wrap:anywhere;}
.iad-empty {padding:40px;text-align:center;color:var(--iad-muted);}
.iad-review-records {min-width:0;padding:18px;background:var(--iad-surface);border-radius:10px;}
.iad-preview-table {width:100%;border-collapse:collapse;text-align:left;font-size:13px;}.iad-preview-table th,.iad-preview-table td {padding:6px;}
.iad-table-scroll {max-width:100%;max-height:min(60dvh,480px);overflow:auto;scroll-margin-block:24px;}.iad-review-records table {width:100%;min-width:620px;border-collapse:collapse;text-align:left;font-size:13px;}
.iad-review-records caption {text-align:left;font-weight:600;margin:12px 0;}.iad-review-records th,.iad-review-records td {padding:12px;vertical-align:top;overflow-wrap:anywhere;max-width:240px;}
.iad-review-records thead,.iad-review-records tr[data-selected=true] {background:var(--iad-surface-muted);}.iad-review-records time {font-size:12px;color:var(--iad-muted);}
.iad-settings {gap:20px;}
.iad-settings>section {padding:20px;background:var(--iad-surface);border-radius:8px;min-width:0;}
.iad-dataset-list {display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr));gap:12px;align-items:start;}
.iad-dataset-card {position:relative;min-width:0;padding:10px;border:2px solid transparent;background:var(--iad-surface-muted);border-radius:var(--iad-radius);}
.iad-workbench .iad-dataset-select {display:block;width:100%;padding:0;background:transparent;border-color:transparent;text-align:left;}
.iad-dataset-card[data-selected=true] {border-color:var(--iad-primary);}
.iad-dataset-card-header {display:flex;align-items:start;padding-right:40px;}
.iad-workbench .iad-card-delete {position:absolute;top:10px;right:6px;border:0;background:transparent;}.iad-dataset-card-header>.iad-dataset-name {flex:1;}
.iad-dataset-name {min-width:0;margin-bottom:12px;}
.iad-workbench .iad-name-trigger {display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-width:0;padding:4px 6px;background:transparent;border-color:transparent;text-align:left;font-weight:600;min-height:44px;}
.iad-name-trigger span {min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.iad-name-trigger svg {flex-shrink:0;}
.iad-dataset-name input {width:100%;}
.iad-workbench .iad-dataset-counts {display:flex;flex-wrap:wrap;gap:12px 24px;margin:0;}
.iad-dataset-counts>div {min-width:0;}.iad-dataset-counts dd {font-size:18px;font-weight:600;}
.iad-dataset-counts>span {display:flex;flex-direction:column;}.iad-dataset-counts>span>span {font-size:12px;color:var(--iad-muted);}.iad-dataset-counts strong {font-size:18px;font-weight:600;}
.iad-detail-dialog:has(.iad-dataset-import) {width:min(640px,calc(100vw - 32px));}
.iad-dataset-import {max-width:640px;margin:auto;}
.iad-directory {min-width:0;margin:0;border:0;background:var(--iad-surface-muted);padding:14px;border-radius:8px;}.iad-directory code {overflow-wrap:anywhere;}
.iad-directory-list {display:flex;flex-direction:column;max-height:230px;overflow:auto;gap:5px;margin-top:10px;}
.iad-rule {margin-top:20px;}.iad-reference-grid {display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}
.iad-reference-grid img {width:90px;height:68px;object-fit:contain;background:var(--iad-surface-muted);border-radius:5px;}
.iad-reference-grid small {display:block;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;}
.iad-job-panel {min-width:0;}.iad-job-panel>h2 {margin-top:26px;}.iad-job {padding:16px;margin-bottom:12px;background:var(--iad-surface-muted);border-radius:8px;}
.iad-job {overflow-wrap:anywhere;}.iad-job[aria-current="true"] {outline:2px solid var(--iad-primary);outline-offset:2px;}
.iad-job-links {display:flex;flex-wrap:wrap;gap:8px;}.iad-job-errors {padding-left:20px;}.iad-job-errors p {margin-top:6px;}
.iad-retry-scope {margin-top:12px;display:grid;gap:10px;}.iad-retry-scope fieldset {min-width:0;border:0;padding:0;margin:0;}.iad-retry-scope legend {margin-bottom:8px;}
.iad-retry-samples {max-height:260px;overflow:auto;display:grid;gap:8px;}.iad-retry-samples label {display:flex;align-items:center;gap:8px;padding:8px;background:var(--iad-surface);border-radius:6px;}.iad-retry-samples input {flex:0 0 auto;}.iad-retry-samples span {flex:1;min-width:0;overflow-wrap:anywhere;}
.iad-job progress {width:100%;height:7px;accent-color:var(--iad-primary);}.iad-job small {overflow-wrap:anywhere;}
.iad-lightbox {position:fixed;inset:0;z-index:10000;background:var(--iad-viewer);display:flex;flex-direction:column;padding:20px;}
.iad-lightbox-toolbar {display:flex;flex-wrap:wrap;gap:16px;align-items:center;flex-shrink:0;color:var(--iad-on-viewer);}.iad-lightbox-toolbar strong {flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.iad-media-load {min-width:0;}.iad-media-error {display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:12px;background:var(--iad-surface);color:var(--iad-text);line-height:1.5;}
.iad-viewer-media {position:relative;display:flex;flex-direction:column;min-height:0;}
.iad-viewer-media>.iad-media-error {position:absolute;left:0;right:0;bottom:0;z-index:1;}
.iad-viewer-viewport {position:relative;flex:1;min-height:0;overflow:hidden;touch-action:none;cursor:grab;user-select:none;}
.iad-viewer-viewport:active {cursor:grabbing;}
.iad-roi-hint {position:absolute;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;max-width:min(280px,calc(100% - 24px));padding:8px 12px;border-radius:6px;background:var(--iad-surface);color:var(--iad-text);font-size:13px;line-height:1.5;overflow-wrap:anywhere;cursor:default;}
.iad-viewer-body {display:grid;grid-template-columns:minmax(0,1fr);flex:1;min-height:0;margin-top:18px;gap:16px;}
.iad-viewer-body.has-inspection {grid-template-columns:minmax(0,1fr) 340px;}
.iad-inspection-panel {padding:16px;min-width:0;overflow:auto;background:var(--iad-surface);color:var(--iad-text);border-radius:8px;}
.iad-inspection-panel img {display:block;width:100%;max-height:220px;object-fit:contain;background:var(--iad-surface-muted);}
.iad-roi-list {display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;}.iad-roi-list button[aria-pressed=true],.iad-actions button[aria-current=true] {border-color:var(--iad-primary);background:var(--iad-hover);}
.iad-roi-layer {position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;}
.iad-roi-layer rect {fill:none;stroke:var(--iad-on-viewer);stroke-width:calc(1px / var(--iad-view-scale,1));stroke-dasharray:calc(5px / var(--iad-view-scale,1)) calc(4px / var(--iad-view-scale,1));vector-effect:non-scaling-stroke;}
.iad-roi-layer [data-locked=true] rect,.iad-roi-layer .is-hovered rect {stroke:var(--iad-warning);stroke-width:calc(2px / var(--iad-view-scale,1));stroke-dasharray:none;}
@media(max-width:760px){.iad-viewer-body.has-inspection {grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(160px,1fr) minmax(160px,.8fr);}}

.iad-viewer-world {position:absolute;left:50%;top:50%;transform-origin:center;}
.iad-viewer-world .iad-image-frame,.iad-viewer-world img {width:100%;height:100%;}
.iad-floating-menu {position:relative;}
.iad-floating-menu-panel {z-index:20;min-width:180px;padding:12px;overflow:auto;background:var(--iad-surface);border:1px solid var(--iad-control-border);border-radius:8px;box-shadow:0 8px 24px var(--iad-border);}
.iad-floating-menu-panel label {display:flex;align-items:center;gap:9px;padding:8px 4px;color:var(--iad-text);white-space:normal;font-size:14px;}
.iad-floating-menu-panel label.iad-filter {align-items:stretch;}
.iad-floating-menu-panel select {width:100%;max-width:none;}
.iad-layer-menu {color:var(--iad-text);}
.iad-layer-menu summary {cursor:pointer;padding:8px 12px;border-radius:8px;background:var(--iad-surface);min-height:40px;}

.iad-info-group {background:var(--iad-surface-muted);padding:14px;border-radius:8px;margin:14px 0;}
.iad-info-group h3:first-child {margin-top:0;}
.iad-analysis {margin-top:14px;font-size:12px;overflow-wrap:anywhere;}
.iad-analysis summary {cursor:pointer;color:var(--iad-primary);}
.iad-multiselect {align-self:end;min-width:135px;}
.iad-multiselect summary {cursor:pointer;list-style:none;background:var(--iad-surface);color:var(--iad-text);border:1px solid var(--iad-control-border);border-radius:var(--iad-radius);padding:8px 12px;min-height:var(--iad-control-height);font-size:14px;}
.iad-floating-menu>summary {display:flex;align-items:center;justify-content:space-between;gap:12px;}
.iad-floating-menu summary::marker {content:"";}
.iad-floating-menu[open]>summary {border-color:var(--iad-primary);}
.iad-reference-grid button {padding:0;border:0;line-height:0;}
.iad-job-section {padding:20px;margin-bottom:18px;background:var(--iad-surface);border:0;border-radius:10px;}
.iad-job-section h2 {margin-top:0;}
.iad-evidence-preview {display:flex;align-items:center;gap:10px;width:100%;margin:10px 0;text-align:left;font-size:12px!important;}
.iad-evidence-preview img {width:90px;height:70px;object-fit:contain;background:var(--iad-surface-muted);}
.iad-quality-report dt {color:var(--iad-muted);}
.iad-profile {padding:14px;background:var(--iad-surface-muted);border-radius:8px;overflow-wrap:anywhere;}
.iad-filter-summary {display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:var(--iad-muted);font-size:13px;margin:8px 0;}
.iad-search {flex:1 1 180px;max-width:300px;}
.iad-search input {width:100%;}
.iad-source-controls {background:var(--iad-surface-muted);border-radius:var(--iad-radius);padding:12px;display:grid;gap:12px;margin-top:12px;}
.iad-source-check {position:absolute;right:8px;top:8px;z-index:2;display:flex;padding:5px;background:var(--iad-surface);border-radius:6px;cursor:pointer;}
.iad-source-check input {margin:0;}
.iad-dialog-header {display:flex;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:-16px;z-index:5;background:var(--iad-surface);padding:8px 0;margin-bottom:12px;}
.iad-dialog-header h2 {margin:0;}
.iad-review-options {display:flex;flex-wrap:wrap;gap:8px 16px;border:0;padding:0;margin:16px 0;}
.iad-review-options legend {margin-bottom:8px;}
.iad-review-options label {display:flex;align-items:center;gap:8px;min-height:40px;cursor:pointer;}
.iad-form-actions {display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:20px;}
.iad-section-header {display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;}
.iad-section-header h2 {margin:0;}
.iad-config-bar {display:flex;align-items:end;gap:12px;flex-wrap:wrap;}
.iad-config-bar>.iad-field {flex:1 1 220px;margin:0;min-width:0;}
.iad-config-bar select {width:100%;}
.iad-config-bar>.iad-primary {margin-left:auto;}
.iad-model-settings {margin-top:12px;}
.iad-model-settings>summary {cursor:pointer;color:var(--iad-muted);}
.iad-model-settings .iad-field {max-width:360px;}
.iad-mining-directions {margin:16px 0;}.iad-mining-directions>summary {cursor:pointer;padding:8px 0;min-height:44px;}
.iad-directions-form,.iad-direction-group {border:0;padding:0;margin:12px 0;min-width:0;}.iad-direction-group>legend {font-weight:600;margin:8px 0;}
.iad-direction-grid {display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:8px;align-items:start;}
.iad-direction {display:flex;align-items:start;flex-wrap:wrap;gap:8px;padding:8px 12px;background:var(--iad-surface-muted);border-radius:var(--iad-radius);min-width:0;}
.iad-direction-toggle {display:flex;align-items:center;flex:1;gap:8px;cursor:pointer;min-height:44px;}.iad-direction>details {min-width:0;}.iad-direction>details[open] {flex-basis:100%;}.iad-direction>details>summary {cursor:pointer;min-height:44px;display:flex;align-items:center;color:var(--iad-muted);}
.iad-direction-add {margin:12px 0;}.iad-direction-add>summary {cursor:pointer;min-height:44px;display:flex;align-items:center;}
.iad-mining-directions pre {overflow-wrap:anywhere;}.iad-discovery-area {margin:12px 0;}.iad-discovery-area h3 {margin:0 0 8px;}
.iad-field-group {padding:16px;margin:16px 0;background:var(--iad-surface-muted);border-radius:var(--iad-radius);}
@media(min-width:761px) {.iad-workbench[data-page=industrial-datasets] {display:flex;flex-direction:column;}.iad-settings {flex:1;align-items:stretch;}}
@media(max-width:1100px) {.iad-workbench {padding:20px;}.iad-main,.iad-settings {grid-template-columns:minmax(0,1fr) 300px;}.iad-grid {grid-template-columns:repeat(auto-fill,minmax(165px,1fr));}}
@media(max-width:760px) {.iad-main,.iad-settings {grid-template-columns:1fr;}.iad-kpis {gap:10px;}.iad-inspector {width:100%;}}

.iad-detail-dialog {width:min(1000px,calc(100% - 32px));max-height:calc(100% - 32px);overflow:auto;margin:auto;background:var(--iad-surface);color:var(--iad-text);border:0;border-radius:8px;padding:16px;}
.iad-detail-dialog.iad-confirm-dialog {width:min(440px,calc(100% - 32px));}
.iad-detail-dialog.iad-viewer-dialog {width:100vw;max-width:none;height:100dvh;max-height:none;margin:0;padding:0;background:var(--iad-viewer);overflow:hidden;}
.iad-detail-dialog::backdrop {background:var(--iad-scrim);}
.iad-detail-dialog>.iad-row {margin-bottom:16px;}
.iad-detail-dialog .iad-inspector {border:0;box-shadow:none;}
.iad-browse {min-width:0;}

@media(max-width:760px) {.iad-workbench {padding:16px;}.iad-header {align-items:start;}.iad-header>.iad-row {width:100%;}.iad-header select {flex:1;max-width:100%;}.iad-tabs {flex-wrap:wrap;}.iad-settings {width:100%;}.iad-pagination {flex-wrap:wrap;}.iad-lightbox {padding:12px;}.iad-lightbox-toolbar strong {flex-basis:100%;}.iad-workbench dl {grid-template-columns:80px minmax(0,1fr);}}
@media(prefers-reduced-motion:reduce) {.iad-workbench * {scroll-behavior:auto;transition:none;animation:none;}}

.iad-knowledge-split {display:grid;grid-template-columns:minmax(220px,1fr) minmax(0,2fr);gap:24px;align-items:start;}
.iad-check-list {display:grid;gap:8px;}.iad-check-list>button {display:grid;gap:4px;text-align:left;}.iad-check-list>button[aria-pressed=true] {background:var(--iad-hover);border-color:var(--iad-primary);}.iad-check-list span {color:var(--iad-muted);font-size:12px;}
@media(max-width:760px) {.iad-knowledge-split {grid-template-columns:minmax(0,1fr);}}

.iad-source-option{flex:0 1 160px;display:flex;flex-direction:column;gap:8px;min-width:0;padding:8px;background:var(--iad-surface-muted);border-radius:var(--iad-radius)}
.iad-source-option img{width:100%;height:100px;object-fit:contain}.iad-source-option span{overflow-wrap:anywhere}.iad-source-option input{margin-inline-end:8px}
`;
