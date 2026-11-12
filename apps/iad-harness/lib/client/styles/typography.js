/** Typography and form layout; theme.ts owns visual tokens. */
export const typographyStyles = `
/* ==========================================================================
   V51 Unified Design Tokens (Single Source of Truth)
   ========================================================================== */
:root {
  --iba-field-width: var(--iad-field-width);
  --iba-field-height: var(--iad-control-height);
  --iba-parent-dataset-width: var(--iad-dataset-width);
  --iba-child-dataset-width: var(--iad-subset-width);
  --iba-filter-gap: var(--iad-space-3);
  --iba-unified-font: var(--iad-font-family);
  --iba-unified-ink: var(--iad-text);
  --iba-unified-body-size: var(--iad-font-size);
  --iba-control-font: var(--iad-font-size);
  --iba-border: var(--iad-control-border);
  --iba-radius: var(--iad-radius);
  --iba-primary: var(--iad-primary-fill);
  --iba-primary-hover: var(--iad-primary-hover);
}

/* Global font family application */
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell),
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) *:not(svg):not(path):not(circle):not(rect):not(line):not(polyline):not(polygon) {
  font-family: var(--iba-unified-font) !important;
}

/* Unified body font size (13px), ink color (#172338), and normal weight (400) */
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  p, li, td, th, label, legend, small, summary, dt, dd, figcaption, time, pre, blockquote, textarea, select, input,
  .nav-label, .eyebrow, .row-desc, .page-total, .pagination-page, .pagination-total,
  .exp-row-info, .exp-lead, .exp-input, .exp-prompt-note, .exp-brief, .exp-summary, .exp-row-title,
  .exp-job-time, .exp-job-duration, .exp-job-dataset, .exp-job-dataset-name,
  .dc-muted, .dc-note, .dc-mono, .dc-time, .dc-elapsed, .detail-model-text, .detail-model-result,
  .hint, .subtitle, .muted, .smallhint, .note, .sidecaption, .context-info, .row-count, .jobtitle, .job-meta, .job-desc
),
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) span:not(:where(
  .status, .exp-pill, .dc-state, .badge, .tag, [class*="status"], [class*="state"], [class*="pill"], [class*="badge"], [class*="tag"],
  .brand-symbol, .nav-icon, .exp-step b, .exp-phase b, .exp-state,
  [class*="status"] *, [class*="state"] *, [class*="pill"] *, [class*="badge"] *, button *, [role="button"] *
)),
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) div:not(:has(*)):not(:where(
  .brand-symbol, .nav-icon, .status, [class*="state"], [class*="status"], [class*="pill"], [class*="badge"]
)) {
  font-size: var(--iba-unified-body-size, 13px) !important;
  color: var(--iba-unified-ink) !important;
}

/* Form controls default font size */
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(button, input, select, textarea) {
  font-size: 13px !important;
}

/* ==========================================================================
   V51 Primary Buttons (Height 38px, font 13px, white text)
   ========================================================================== */

/* ==========================================================================
   V51 Unified Filter Bars & Controls (220x38px, 12px gap, left aligned)
   ========================================================================== */
:is(#images-page .filter-bar, .filter-bar, .kb-v45 .filterset, .exp-job-list-actions, .dc-refined-filterbar, .iad-manager-search-wrap) {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: var(--iba-filter-gap) !important;
  align-items: flex-end !important;
  justify-content: flex-start !important;
  min-width: 0 !important;
}

/* Search and select field containers: 220px fixed width */
:is(.filter-bar .filter-item, .dc-refined-filterbar .dc-filter-field, .dc-refined-filterbar .dc-search-field, .iad-manager-search-wrap #search, #search.search, .iad-dataset-page-wrap #search) {
  flex: 0 0 var(--iba-field-width) !important;
  width: var(--iba-field-width) !important;
  min-width: 0 !important;
  max-width: var(--iba-field-width) !important;
  box-sizing: border-box !important;
}

/* Controls inside fixed-width fields fill their owner; direct flex controls retain their declared width. */
:is(.filter-bar .filter-item input, .filter-bar .filter-item select,
    .dc-results-section .dc-refined-filterbar input, .dc-results-section .dc-refined-filterbar select,
    .iad-dataset-page-wrap #search) {width:100% !important;}

/* All search inputs & select elements */
:is(.filter-bar .filter-item input, .filter-bar .filter-item select,
    .dc-results-section .dc-refined-filterbar input, .dc-results-section .dc-refined-filterbar select,
    .iad-dataset-page-wrap #search) {
  display: block !important;
  height: var(--iba-field-height) !important;
  min-height: var(--iba-field-height) !important;
  max-height: var(--iba-field-height) !important;
  box-sizing: border-box !important;
  border: 1px solid var(--iba-border) !important;
  border-radius: var(--iba-radius) !important;
  background: #fff !important;
  font-family: var(--iba-unified-font) !important;
  font-size: var(--iba-control-font) !important;
  font-weight: 400 !important;
  color: var(--iba-unified-ink) !important;
  line-height: normal !important;
  box-shadow: none !important;
  padding: 0 11px !important;
}

/* Field labels */
:is(.filter-bar .filter-item label, .dc-refined-filterbar .dc-filter-field, .exp-job-list-actions .exp-filter-control, .kb-v45 .filterset label) {
  font-family: var(--iba-unified-font) !important;
  font-size: var(--iba-control-font) !important;
  font-weight: 400 !important;
  color: var(--iba-unified-ink) !important;
}

/* Focus states */
:is(.filter-bar .filter-item input:focus, .filter-bar .filter-item select:focus,
    .dc-refined-filterbar input:focus, .dc-refined-filterbar select:focus,
    .exp-job-list-actions input:focus, .exp-job-list-actions select:focus,
    .kb-v45 .filterset > .f:focus,
    .iad-dataset-page-wrap #search:focus) {
  border-color: var(--iba-primary) !important;
  outline: 2px solid #b4c8ff !important;
  outline-offset: 0 !important;
}

/* ==========================================================================
   V51 Clear Filter & Refresh Icon Buttons (38x38px)
   ========================================================================== */
.iba-filter-clear, .iba-refresh-icon {
  align-self: flex-end !important;
  margin: 0 !important;
  box-sizing: border-box !important;
}
#images-page #reset, #images-page #refresh {
  align-self: flex-end !important;
}

.kb-v45 .filterset > .f {
  margin: 0 !important;
}
.exp-job-list-actions {
  align-items: center !important;
}
.exp-job-list-actions .exp-filter-control {
  display: flex;
  justify-content: flex-end;
  margin: 0 !important;
}
.exp-job-list-actions .iba-filter-clear {
  align-self: center !important;
}
.dc-results-section .dc-refined-filterbar {
  justify-content: flex-start !important;
}
.dc-results-section .dc-refined-filterbar .dc-filter-field,
.dc-results-section .dc-refined-filterbar .dc-search-field {
  order: 0 !important;
  flex: 0 0 var(--iba-field-width) !important;
  width: var(--iba-field-width) !important;
  max-width: var(--iba-field-width) !important;
  min-width: 0 !important;
}
.dc-results-section .dc-refined-filterbar .iba-filter-clear {
  order: 5 !important;
}

/* ==========================================================================
   V51 Dataset Scope Selector (Parent: 250px, Child: 390px, height: 38px)
   ========================================================================== */
:is(#images-page .dataset-panel .parent, .dc-scope .dc-parent, .exp-scope .exp-parent-controls, .kb-v45 .context .control:first-child) {
  flex: 0 1 var(--iba-parent-dataset-width) !important;
  width: var(--iba-parent-dataset-width) !important;
  min-width: 210px !important;
  max-width: var(--iba-parent-dataset-width) !important;
}
:is(#images-page .dataset-panel .child, .dc-scope .dc-children, .exp-scope .exp-child-wrap, .kb-v45 .context .control:nth-child(2)) {
  flex: 0 1 var(--iba-child-dataset-width) !important;
  width: var(--iba-child-dataset-width) !important;
  min-width: 230px !important;
  max-width: var(--iba-child-dataset-width) !important;
}
:is(.kb-v45 .context .control select, .dc-scope .dc-parent select, .exp-scope .exp-select, .exp-scope .exp-child-button, .dc-scope .dc-multi-trigger, #images-page .dataset-panel select, #images-page .dataset-panel .dataset-multi-trigger) {
  height: 38px !important;
  min-height: 38px !important;
  font: 400 13px var(--iba-unified-font) !important;
  color: var(--iba-unified-ink) !important;
  border-color: var(--iba-border) !important;
  border-radius: 5px !important;
  box-sizing: border-box !important;
}
:is(.kb-v45 .context .control label, .exp-scope .exp-input, .dc-scope .dc-parent label, .dc-scope .dc-children label, #images-page .dataset-panel label) {
  font: 400 13px var(--iba-unified-font) !important;
  color: var(--iba-unified-ink) !important;
}
.exp-scope-refresh, .dc-scope .dc-child-controls .dc-icn {
  align-self: flex-end !important;
}
.kb-v45 .context .kb-context-actions {
  align-self: flex-end !important;
}

/* ==========================================================================
   V51 Ordinary Data Text & Status Semantic Colors
   ========================================================================== */
:is(.exp-job-table .exp-row-title, .exp-job-dataset, .exp-job-dataset *,
    .kb-v45 .jobtitle, .kb-v45 .knowledge-entry-name, .kb-v45 .knowledge-entry-description,
    .dc-table .dc-mono, .dc-table .dc-job-datasets,
    #images-page .card-name, .exp-job-table td:not(:has(.exp-pill)), .dc-table td:not(:has(.exp-pill)):not(:has(.dc-state)),
    .kb-v45 .jobs-table td, .kb-v45 .knowledge-row, .name-text) {
  font-family: var(--iba-unified-font) !important;
  font-weight: 400 !important;
  color: var(--iba-unified-ink) !important;
  font-size: 13px !important;
}

/* Status pills retain their established semantic status colors and subtle backgrounds */
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .exp-pill, .dc-state.exp-pill
) {
  display: inline-block !important;
  border-radius: 4px !important;
  padding: 3px 8px !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  line-height: 1.4 !important;
}
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .exp-pill.ok, .exp-pill.completed, .dc-state.ok, .dc-state.completed, .kb-v45 .status.green, .status.ok, .status.green
) {
  color: #177b53 !important;
  background-color: #e8f5ee !important;
}
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .exp-pill.fail, .exp-pill.failed, .dc-state.fail, .dc-state.failed, .kb-v45 .status.red, .status.fail, .status.red
) {
  color: #b23c43 !important;
  background-color: #ffedf0 !important;
}
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .exp-pill.running, .dc-state.running, .kb-v45 .status.blue, .status.running
) {
  color: #285ed6 !important;
  background-color: #e9f0ff !important;
}
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .exp-pill.pending, .dc-state.pending, .kb-v45 .status.amber, .status.pending
) {
  color: #8e6d24 !important;
  background-color: #fff5df !important;
}
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .status.gray, .exp-pill.draft, .kb-v45 .status.gray
) {
  color: #526174 !important;
  background-color: #eef2f7 !important;
}

/* Table headers & structural labels: bold and dark (#172338) */
:is(.iad-workbench, .iad-detail-dialog, .overlay, .modal, .iad-drawer, .app, .shell) :is(th, .knowledge-head > span, .nav-label) {
  font-weight: 600 !important;
  color: var(--iba-unified-ink) !important;
}

/* Secondary auxiliary texts: normal weight 400 */
:is(.iad-workbench, .iad-detail-dialog, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .exp-job-dataset-children, .exp-row-info, .exp-lead, .row-desc, .exp-prompt-note,
  .pagination-total, .pagination-page, .page-total, .eyebrow
) {
  font-weight: 400 !important;
}

/* Secondary action buttons & links use body ink */

/* Placeholders */
:is(.iad-workbench, .iad-detail-dialog, .overlay, .modal, .iad-drawer, .app, .shell) :is(input, textarea)::placeholder {
  color: var(--iba-unified-ink) !important;
  opacity: 0.65 !important;
}

/* ==========================================================================
   V51 Responsive Layout for Narrow Viewports
   ========================================================================== */
@media (max-width: 820px) {
  :is(.filter-bar .filter-item, .dc-results-section .dc-refined-filterbar .dc-filter-field, .exp-job-list-actions .exp-filter-control, .kb-v45 .filterset > .f) {
    flex: 1 1 180px !important;
    width: auto !important;
    max-width: none !important;
  }
  :is(.kb-v45 .context .control:first-child, .kb-v45 .context .control:nth-child(2)) {
    flex: 1 1 240px !important;
    width: auto !important;
    max-width: none !important;
  }
}
`;
