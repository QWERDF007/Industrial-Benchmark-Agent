/**
 * Single Source of Truth (SSOT) for typography across all workbench pages,
 * dialogs, drawers, and host views.
 *
 * Aligns with IBA V49 specification:
 * - Font Stack: system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif
 * - Body Ink Color: #172338 (rgb(23, 35, 56))
 * - Body Font Size: 13px
 * - Body Font Weight: 400
 * - Table Headers & Section Titles: font-weight: 600, color: #172338
 * - Semantic Statuses: ok/completed (#177b53), fail/failed (#b23c43), running/pending (#285ed6), gray (#526174)
 * - Controls: Primary buttons, danger buttons, active pagination keep readable white text (#fff)
 */
export const typographyStyles = `
/* ==========================================================================
   V49 Unified Typography Design Tokens (Single Source of Truth)
   ========================================================================== */
:root {
  --iba-unified-font: system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
  --iba-unified-ink: #172338;
  --iba-unified-body-size: 13px;
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
  .exp-job-time, .exp-job-duration, .exp-job-dataset-parent, .exp-job-dataset-children, .exp-delete-note,
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

/* Primary, danger, and active pagination buttons keep readable white text */
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .btn.primary, .exp-primary, .primary, .exp-delete-confirm, .danger-confirm, .btn.danger, .iad-primary,
  .pagebtn[aria-current="page"], .iba-job-pager button[aria-current="page"]
),
:is(.iad-workbench, .iad-detail-dialog, .iad-sidebar-content, .overlay, .modal, .iad-drawer, .app, .shell) :is(
  .btn.primary, .exp-primary, .primary, .exp-delete-confirm, .danger-confirm, .btn.danger, .iad-primary,
  .pagebtn[aria-current="page"], .iba-job-pager button[aria-current="page"]
) * {
  color: #fff !important;
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

/* Placeholders: readable body ink with opacity */
:is(.iad-workbench, .iad-detail-dialog, .overlay, .modal, .iad-drawer, .app, .shell) :is(input, textarea)::placeholder {
  color: var(--iba-unified-ink) !important;
  opacity: 0.65 !important;
}
`;
