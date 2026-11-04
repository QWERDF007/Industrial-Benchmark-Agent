/**
 * Single Source of Truth (SSOT) for V51 UI Visual Contract & Typography
 * across all workbench pages, dialogs, drawers, and host views.
 *
 * Aligns with IBA V51 specification:
 * - Font Stack: system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif
 * - Body Ink Color: #172338 (rgb(23, 35, 56))
 * - Body Font Size: 13px, Normal Weight: 400
 * - Field Inputs & Dropdowns: 220px width, 38px height, 1px solid #b9c7d9, border-radius 5px
 * - Refresh & Clear Filter Icons: 38x38px, SVG 18x18px, hover #edf3ff, color #285ed6
 * - Dataset Selectors: Parent 250px, Child 390px, height 38px
 * - Primary Action Buttons: height 38px, font 13px, background #285ed6, hover #1e51c2, white text
 * - Consistency Conflict Cards: Single main image with object-fit: contain
 * - Table Headers & Section Titles: font-weight: 600, color: #172338
 * - Semantic Statuses: ok/completed (#177b53), fail/failed (#b23c43), running/pending (#285ed6), gray (#526174)
 */
export const typographyStyles = `
/* ==========================================================================
   V51 Unified Design Tokens (Single Source of Truth)
   ========================================================================== */
:root {
  --iba-field-width: 220px;
  --iba-field-height: 38px;
  --iba-parent-dataset-width: 250px;
  --iba-child-dataset-width: 390px;
  --iba-filter-gap: 12px;
  --iba-unified-font: system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
  --iba-unified-ink: #172338;
  --iba-unified-body-size: 13px;
  --iba-control-font: 13px;
  --iba-border: #b9c7d9;
  --iba-radius: 5px;
  --iba-primary: #285ed6;
  --iba-primary-hover: #1e51c2;
  --iad-text: #172338;
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
  .exp-job-time, .exp-job-duration, .exp-job-dataset, .exp-job-dataset-name, .exp-delete-note,
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
  font-size: 13px !important;
  color: var(--iba-unified-ink) !important;
}

/* Form controls default font size */
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(button, input, select, textarea) {
  font-size: 13px !important;
}

/* ==========================================================================
   V51 Primary Buttons (Height 38px, font 13px, white text)
   ========================================================================== */
:is(.iad-workbench, .overlay, .modal, .app, .shell) :is(
  .btn.primary, .exp-primary, button.primary, .iad-primary, #create-btn, #submit-job, #save-review, #confirm-accept
) {
  height: 38px !important;
  min-height: 38px !important;
  max-height: 38px !important;
  padding: 0 15px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  background: var(--iba-primary) !important;
  border-color: var(--iba-primary) !important;
  color: #fff !important;
  border-radius: var(--iba-radius) !important;
  box-sizing: border-box !important;
}
:is(.iad-workbench, .overlay, .modal, .app, .shell) :is(
  .btn.primary, .exp-primary, button.primary, .iad-primary, #create-btn, #submit-job, #save-review, #confirm-accept
):hover:not(:disabled) {
  background: var(--iba-primary-hover) !important;
  border-color: var(--iba-primary-hover) !important;
}
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .btn.primary, .exp-primary, .primary, .exp-delete-confirm, .danger-confirm, .btn.danger, .iad-primary,
  .pagebtn[aria-current="page"], .iba-job-pager button[aria-current="page"], .dc-counter-pager button.current
),
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .btn.primary, .exp-primary, .primary, .exp-delete-confirm, .danger-confirm, .btn.danger, .iad-primary,
  .pagebtn[aria-current="page"], .iba-job-pager button[aria-current="page"], .dc-counter-pager button.current
) * {
  color: #fff !important;
}

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
:is(.filter-bar .filter-item, .dc-refined-filterbar .dc-filter-field, .dc-refined-filterbar .dc-search-field, .exp-job-list-actions .exp-filter-control, .kb-v45 .filterset > .f, .iad-manager-search-wrap #search, #search.search, .iad-dataset-page-wrap #search) {
  flex: 0 0 var(--iba-field-width) !important;
  width: var(--iba-field-width) !important;
  min-width: 0 !important;
  max-width: var(--iba-field-width) !important;
  box-sizing: border-box !important;
}

/* All search inputs & select elements */
:is(.filter-bar .filter-item input, .filter-bar .filter-item select,
    .dc-results-section .dc-refined-filterbar input, .dc-results-section .dc-refined-filterbar select,
    .exp-job-list-actions .exp-filter-control input, .exp-job-list-actions .exp-filter-control select,
    .exp-job-list-actions input, .exp-job-list-actions select,
    .kb-v45 .filterset > .f,
    .iad-dataset-page-wrap #search) {
  display: block !important;
  width: 100% !important;
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
  display: inline-grid !important;
  place-items: center !important;
  flex: 0 0 var(--iba-field-height) !important;
  align-self: flex-end !important;
  width: var(--iba-field-height) !important;
  height: var(--iba-field-height) !important;
  min-width: var(--iba-field-height) !important;
  max-width: var(--iba-field-height) !important;
  padding: 0 !important;
  margin: 0 !important;
  border: 1px solid transparent !important;
  border-radius: var(--iba-radius) !important;
  color: #536680 !important;
  background: transparent !important;
  cursor: pointer !important;
  box-sizing: border-box !important;
}
.iba-filter-clear svg, .iba-refresh-icon svg {
  width: 18px !important;
  height: 18px !important;
  fill: none !important;
  stroke: currentColor !important;
  stroke-width: 1.7 !important;
  stroke-linecap: round !important;
  stroke-linejoin: round !important;
}
.iba-filter-clear:hover:not(:disabled), .iba-refresh-icon:hover:not(:disabled) {
  background: #edf3ff !important;
  color: var(--iba-primary) !important;
}
.iba-filter-clear:disabled {
  opacity: 0.35 !important;
  cursor: default !important;
}
#images-page #reset, #images-page #refresh {
  width: 38px !important;
  height: 38px !important;
  min-width: 38px !important;
  align-self: flex-end !important;
  border: 1px solid transparent !important;
  background: transparent !important;
  color: #536680 !important;
}
#images-page #reset:hover, #images-page #refresh:hover {
  background: #edf3ff !important;
  color: var(--iba-primary) !important;
}
#images-page #reset svg, #images-page #refresh svg {
  width: 18px !important;
  height: 18px !important;
}

/* Panel bars alignment */
.kb-v45 .panelbar {
  align-items: center;
  gap: 16px;
}
.kb-v45 .panelbar .filterset {
  margin-left: auto !important;
  width: auto !important;
  margin: 0 !important;
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
  width: 38px !important;
  height: 38px !important;
  min-width: 38px !important;
  align-self: flex-end !important;
  background: transparent !important;
  border: 0 !important;
  color: #536680 !important;
}
.exp-scope-refresh:hover, .dc-scope .dc-child-controls .dc-icn:hover {
  background: #edf3ff !important;
  color: var(--iba-primary) !important;
}
.kb-v45 .context .kb-context-actions {
  align-self: flex-end !important;
}

/* ==========================================================================
   V51 Consistency Main Image Card (One single image, object-fit: contain)
   ========================================================================== */
.dc-grid .dc-card-img {
  background: #eef2f7 !important;
  height: 140px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  overflow: hidden !important;
  position: relative !important;
}
.dc-grid .dc-card-img > img.dc-main-image {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
  object-position: center !important;
}

/* Conflict card caption bottom judgments text: ordinary text color and regular weight */
.dc-grid .dc-card-judgments > .dc-judgment-value,
.dc-grid .dc-card-judgments > .dc-raw-value,
.dc-grid .dc-card-judgments > .dc-model-value,
.dc-grid .dc-card-judgments > .dc-judgment-clear {
  color: var(--iba-font-color-base, #172338) !important;
  font-weight: 400 !important;
}

/* ==========================================================================
   V51 Ordinary Data Text & Status Semantic Colors
   ========================================================================== */
:is(.exp-job-table .exp-row-title, .exp-job-dataset, .exp-job-dataset *,
    .kb-v45 .jobtitle, .kb-v45 .knowledge-entry-name, .kb-v45 .knowledge-entry-description,
    .dc-table .dc-mono, .dc-table .dc-job-datasets, .dc-card-caption strong,
    #images-page .card-name, .exp-job-table td, .dc-table td, .dc-grid .dc-card-caption,
    .kb-v45 .jobs-table td, .kb-v45 .knowledge-row, .name-text) {
  font-family: var(--iba-unified-font) !important;
  font-weight: 400 !important;
  color: var(--iba-unified-ink) !important;
  font-size: 13px !important;
}

/* Status pills retain their established semantic status colors */
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .exp-pill.ok, .exp-pill.completed, .dc-state.completed, .kb-v45 .status.green, .status.ok, .status.green
) {
  color: #177b53 !important;
}
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .exp-pill.fail, .exp-pill.failed, .dc-state.failed, .kb-v45 .status.red, .status.fail, .status.red
) {
  color: #b23c43 !important;
}
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .exp-pill.running, .exp-pill.pending, .dc-state.running, .kb-v45 .status.amber, .status.running, .status.pending
) {
  color: #285ed6 !important;
}
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .status.gray, .exp-pill.draft, .kb-v45 .status.gray
) {
  color: #526174 !important;
}

/* Table headers & structural labels: bold and dark (#172338) */
:is(.iad-workbench, .iad-detail-dialog, .overlay, .modal, .iad-drawer, .app, .shell) :is(th, .knowledge-head > span, .nav-label) {
  font-weight: 600 !important;
  color: var(--iba-unified-ink) !important;
}

/* Secondary auxiliary texts: normal weight 400 */
:is(.iad-workbench, .iad-detail-dialog, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .exp-job-dataset-children, .exp-row-info, .exp-lead, .row-desc, .exp-prompt-note,
  .pagination-total, .pagination-page, .page-total, .eyebrow, .exp-delete-note
) {
  font-weight: 400 !important;
}

/* Secondary action buttons & links use body ink */
:is(.iad-workbench, .iad-detail-dialog, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .exp-btn:not(.exp-primary):not(.danger), .exp-btn-text, .exp-prompt-link,
  button.btn:not(.primary):not(.danger):not(.is-danger):not(.cancel)
) {
  color: var(--iba-unified-ink) !important;
}

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
  .kb-v45 .panelbar .filterset {
    margin-left: 0 !important;
  }
  :is(.kb-v45 .context .control:first-child, .kb-v45 .context .control:nth-child(2)) {
    flex: 1 1 240px !important;
    width: auto !important;
    max-width: none !important;
  }
}
`;
