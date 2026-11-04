/**
 * Single Source of Truth (SSOT) for all modals, dialogs, backdrops, and actions across the workbench.
 * Standardizes sizes, typography, borders, headers, and buttons across Image Browser, Exploration,
 * Consistency Check, and Dataset Management.
 */

export const dialogsStyles = `
/* ==========================================================================
   Dialog Design Tokens (Single Source of Truth)
   V56 Dialog Visual Contract
   ========================================================================== */
:root {
  --iba-detail-dialog-height: 820px;
  --iba-detail-dialog-width: 1380px;
  --iba-dialog-detail-width: 1380px;
  --iba-dialog-edit-width: 960px;
  --iba-dialog-max-height: 820px;
  --iba-dialog-gap: clamp(12px, 2.5vw, 32px);
  --iba-dialog-ink: #172338;
  --iba-dialog-border: #d9e2ed;
  --iba-dialog-font: system-ui, -apple-system, "Microsoft YaHei", sans-serif;

  --iad-modal-backdrop: rgba(23, 34, 51, 0.68);
  --iad-dialog-gutter: clamp(12px, 2.5vw, 32px);
  --iad-dialog-vgutter: clamp(12px, 2.5vw, 32px);

  /* Dimensions */
  --iad-dialog-max-width: 1380px;
  --iad-dialog-max-height: 820px;
  --iad-dialog-medium-width: 960px;
  --iad-dialog-small-width: 530px;

  /* Surfaces & Borders */
  --iad-dialog-bg: #ffffff;
  --iad-dialog-radius: 7px;
  --iad-dialog-border: 1px solid #d9e2ed;
  --iad-dialog-shadow: 0 20px 64px rgba(14, 26, 48, 0.27);
  --iad-dialog-divider: 1px solid #e3e9f2;

  /* Typography */
  --iad-dialog-title-font: 17px;
  --iad-dialog-title-weight: 650;
  --iad-dialog-title-color: #172338;
  --iad-dialog-text-font: 13px;
  --iad-dialog-text-color: #172338;
  --iad-dialog-muted-color: #64758d;

  /* Action Buttons */
  --iad-btn-danger-bg: #bf384a;
  --iad-btn-danger-hover: #a82e3f;
  --iad-btn-primary-bg: #2458d5;
  --iad-btn-primary-hover: #1b49be;
  --iad-btn-cancel-border: #c9d4e2;
  --iad-btn-cancel-color: #37475d;
}

@media (max-width: 850px) {
  :root {
    --iad-dialog-gutter: 18px;
    --iad-dialog-vgutter: 18px;
  }
}

@media (max-width: 560px) {
  :root {
    --iad-dialog-gutter: 12px;
    --iad-dialog-vgutter: 12px;
  }
}

/* ==========================================================================
   Unified Backdrops / Overlay Masks
   ========================================================================== */
.detail-overlay.show,
.exp-modal:not(.exp-prompt-overlay),
.dc-modal-mask,
#dc-compare-mask.dc-modal-mask,
#knowledge-page .kb-v45 .detail-overlay.show,
.modal-scrim,
dialog.iad-detail-dialog::backdrop {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  inset: 0 !important;
  z-index: 500 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: var(--iad-modal-backdrop) !important;
  padding: var(--iba-dialog-gap) !important;
  box-sizing: border-box !important;
}

.detail-overlay.hidden,
.detail-overlay:not(.show),
.overlay:not(.show),
#knowledge-page .kb-v45 .detail-overlay:not(.show),
#knowledge-page .detail-overlay:not(.show),
.exp-modal[hidden],
.dc-modal-mask[hidden],
.modal-scrim[hidden],
[hidden] {
  display: none !important;
}

/* ==========================================================================
   Base Dialog Container
   ========================================================================== */
.detail-dialog,
.exp-dialog,
.exp-direction-dialog,
.dc-dialog,
.dc-conflict-dialog,
.modal-scrim .modal:not(.add-dataset-modal),
dialog.iad-detail-dialog {
  box-sizing: border-box !important;
  background: var(--iad-dialog-bg) !important;
  border: var(--iad-dialog-border) !important;
  border-radius: var(--iad-dialog-radius) !important;
  box-shadow: var(--iad-dialog-shadow) !important;
  color: var(--iad-dialog-text-color) !important;
  font-family: inherit !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  flex-shrink: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* ==========================================================================
   Tier 1: Large Detail Dialogs (1380px max-width, 820px max-height)
   Image Detail, Exploration Direction Detail, Consistency Conflict Compare, Knowledge Detail
   ========================================================================== */
.detail-overlay .detail-dialog,
.detail-dialog,
.exp-modal .exp-direction-dialog,
.exp-direction-dialog,
.dc-conflict-dialog,
#dc-compare-mask .dc-dialog[role="dialog"],
#dc-compare-mask.dc-modal-mask .dc-dialog[role=dialog],
#knowledge-page .kb-v45 .detail-modal,
#knowledge-page .detail-modal,
.detail-modal,
dialog.iad-detail-dialog:not(.iad-drawer):not(.iad-confirm-dialog):not(.iad-inline-dialog):not(.iad-viewer-dialog) {
  box-sizing: border-box !important;
  width: min(var(--iba-detail-dialog-width), calc(100vw - 2 * var(--iba-dialog-gap))) !important;
  max-width: var(--iba-detail-dialog-width) !important;
  height: min(var(--iba-detail-dialog-height), calc(100dvh - 2 * var(--iba-dialog-gap))) !important;
  max-height: min(var(--iba-detail-dialog-height), calc(100dvh - 2 * var(--iba-dialog-gap))) !important;
  min-height: 0 !important;
  border: 1px solid var(--iba-dialog-border) !important;
  border-radius: 7px !important;
  background: #fff !important;
  box-shadow: 0 20px 64px rgba(14, 26, 48, 0.27) !important;
  overflow: hidden !important;
  margin: 0 auto !important;
  flex: none !important;
  display: flex !important;
  flex-direction: column !important;
}

/* Detail dialog internal scrollable body - scrolls only when needed */
.detail-overlay .detail-scroll,
.detail-scroll,
.exp-modal .exp-direction-dialog .exp-dialog-main,
.exp-direction-dialog .exp-dialog-main,
#dc-compare-mask .dc-dialog-body,
.dc-conflict-dialog .dc-dialog-body,
#knowledge-page .kb-v45 .detail-modal .modalcontent,
#knowledge-page .detail-modal .modalcontent,
.detail-modal .modalcontent {
  display: flex !important;
  flex-direction: column !important;
  flex: 1 1 auto !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  overscroll-behavior: contain !important;
}

.detail-scroll { padding: 22px 28px 28px !important; }
.exp-direction-dialog .exp-dialog-main { padding: 15px 28px 24px !important; }
#dc-compare-mask .dc-dialog-body,
.dc-conflict-dialog .dc-dialog-body { padding: 20px 26px 24px !important; }

/* Large detail dialog internal flex hierarchy - direction evidence UI-56-02 */
.exp-modal .exp-direction-dialog .exp-direction-evidence-groups,
.exp-direction-dialog .exp-direction-evidence-groups {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 18px !important;
  align-items: start !important;
}

.exp-modal .exp-direction-dialog .exp-evidence-viewport,
.exp-direction-dialog .exp-evidence-viewport {
  box-sizing: border-box !important;
  height: 144px !important;
  max-height: 144px !important;
  min-height: 0 !important;
  padding: 2px 1px 5px !important;
  align-items: flex-start !important;
  gap: 8px !important;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
}

.exp-modal .exp-direction-dialog .exp-evidence-viewport .exp-direction-evidence-card,
.exp-direction-dialog .exp-evidence-viewport .exp-direction-evidence-card,
.exp-modal .exp-direction-dialog .exp-direction-evidence-card,
.exp-direction-dialog .exp-direction-evidence-card {
  width: 180px !important;
  min-width: 180px !important;
  height: 124px !important;
  padding: 4px !important;
  flex: 0 0 180px !important;
  box-sizing: border-box !important;
  border: 2px solid #dce4ef !important;
  border-radius: 6px !important;
  background: #fff !important;
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease !important;
}

.exp-modal .exp-direction-dialog .exp-evidence-viewport .exp-direction-evidence-card:hover,
.exp-direction-dialog .exp-evidence-viewport .exp-direction-evidence-card:hover,
.exp-modal .exp-direction-dialog .exp-direction-evidence-card:hover,
.exp-direction-dialog .exp-direction-evidence-card:hover,
.exp-modal .exp-direction-dialog .exp-evidence-viewport .exp-direction-evidence-card.is-related,
.exp-direction-dialog .exp-evidence-viewport .exp-direction-evidence-card.is-related,
.exp-modal .exp-direction-dialog .exp-direction-evidence-card.is-related,
.exp-direction-dialog .exp-direction-evidence-card.is-related {
  border: 2px solid #2458d5 !important;
  border-color: #2458d5 !important;
  background: #f0f5ff !important;
  box-shadow: 0 0 0 1px #2458d5, 0 2px 8px rgba(36, 88, 213, 0.18) !important;
}

.exp-modal .exp-direction-dialog .exp-evidence-viewport .exp-direction-evidence-card img,
.exp-direction-dialog .exp-evidence-viewport .exp-direction-evidence-card img,
.exp-modal .exp-direction-dialog .exp-direction-evidence-card img,
.exp-direction-dialog .exp-direction-evidence-card img {
  width: 100% !important;
  height: 114px !important;
  max-height: 114px !important;
  object-fit: cover !important;
  object-position: center !important;
  background: #fff !important;
}

.exp-modal .exp-direction-dialog .exp-direction-evidence,
.exp-direction-dialog .exp-direction-evidence {
  padding: 17px 0 0 !important;
  flex: 0 0 auto !important;
}

.exp-modal .exp-direction-dialog .exp-direction-body,
.exp-direction-dialog .exp-direction-body {
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  min-height: 100% !important;
}

.exp-modal .exp-direction-dialog .exp-direction-goal,
.exp-direction-dialog .exp-direction-goal {
  min-height: 0 !important;
  line-height: 1.8 !important;
  flex: none !important;
}

.exp-modal .exp-direction-dialog .exp-direction-reasoning,
.exp-direction-dialog .exp-direction-reasoning {
  flex: 0 0 auto !important;
  min-height: 0 !important;
  line-height: 1.8 !important;
  align-content: start !important;
}

@media (max-width: 840px) {
  .exp-modal .exp-direction-dialog .exp-direction-evidence-groups,
  .exp-direction-dialog .exp-direction-evidence-groups {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }
  .exp-modal .exp-direction-dialog .exp-evidence-viewport,
  .exp-direction-dialog .exp-evidence-viewport {
    height: 136px !important;
    max-height: 136px !important;
  }
  .exp-modal .exp-direction-dialog .exp-evidence-viewport .exp-direction-evidence-card,
  .exp-direction-dialog .exp-evidence-viewport .exp-direction-evidence-card {
    width: 170px !important;
    min-width: 170px !important;
    flex-basis: 170px !important;
    height: 118px !important;
  }
  .exp-modal .exp-direction-dialog .exp-evidence-viewport .exp-direction-evidence-card img,
  .exp-direction-dialog .exp-evidence-viewport .exp-direction-evidence-card img {
    height: 108px !important;
    max-height: 108px !important;
  }
}

/* Evidence reference tokens */
:is(.iad-workbench, [data-page="industrial-exploration"], .exp-direction-dialog, body) .exp-evidence-ref,
.exp-direction-dialog .exp-evidence-ref {
  color: var(--iba-dialog-ink, #172338) !important;
  font-family: var(--iba-dialog-font) !important;
  font-size: 13px !important;
  font-weight: 400 !important;
  border-color: #d9e2ed !important;
  background: #fff !important;
}
:is(.iad-workbench, [data-page="industrial-exploration"], .exp-direction-dialog, body) .exp-evidence-ref:hover,
:is(.iad-workbench, [data-page="industrial-exploration"], .exp-direction-dialog, body) .exp-evidence-ref.is-related,
.exp-direction-dialog .exp-evidence-ref:hover,
.exp-direction-dialog .exp-evidence-ref.is-related {
  background: #dce9ff !important;
  border-color: #2458d5 !important;
  color: #1742a0 !important;
  box-shadow: 0 0 0 1px #2458d5 !important;
}

#dc-compare-mask .dc-compare-photo,
.dc-conflict-dialog .dc-compare-photo {
  height: clamp(210px, 28dvh, 270px) !important;
}
.detail-preview {
  height: clamp(310px, 46dvh, 500px) !important;
}

/* ==========================================================================
   Tier 2: Medium Form & Analytics Dialogs (960px max-width, auto-height)
   New Consistency Check, Stats Modal, Exploration Prompts, Add/Edit Dataset, Knowledge Create
   ========================================================================== */
#knowledge-page .kb-v45 #create-overlay > .modal,
#dc-new-mask .dc-new-dialog,
.dc-stats-modal .dc-stats-dialog,
.exp-modal .exp-source-dialog,
.exp-dialog:not(.small):not(.exp-direction-dialog),
.modal-scrim .modal:not(.delete-modal):not(.add-dataset-modal) {
  width: min(var(--iba-dialog-edit-width), calc(100vw - 2 * var(--iba-dialog-gap))) !important;
  max-width: var(--iba-dialog-edit-width) !important;
  height: auto !important;
  max-height: min(var(--iba-dialog-max-height), calc(100dvh - 2 * var(--iba-dialog-gap))) !important;
  min-height: 0 !important;
  border-radius: 7px !important;
}

#knowledge-page .kb-v45 #create-overlay > .modal {
  height: auto !important;
}

#knowledge-page .kb-v45 #create-overlay > .modal > .modalcontent,
#dc-new-mask .dc-new-body,
.dc-stats-dialog .dc-stats-body,
.modal-scrim .modal:not(.delete-modal):not(.add-dataset-modal) .modal-body,
.exp-dialog:not(.small):not(.exp-direction-dialog) .exp-dialog-main {
  padding: 22px 26px 24px !important;
  overflow-y: auto !important;
  flex: 0 1 auto !important;
  min-height: 0 !important;
}

/* ==========================================================================
   Tier 3: Small Confirmation / Deletion Dialogs (530px max-width, auto-height)
   Consistency Delete Job, Exploration Delete Job, Dataset Delete, Confirmations
   ========================================================================== */
.exp-dialog.small,
.exp-delete-dialog,
.dc-delete-dialog,
#dc-delete-mask .dc-dialog,
.modal-scrim .modal.delete-modal,
dialog.iad-detail-dialog.iad-confirm-dialog {
  width: min(var(--iad-dialog-small-width), calc(100vw - 32px)) !important;
  max-width: var(--iad-dialog-small-width) !important;
  height: auto !important;
  max-height: calc(100dvh - 32px) !important;
  min-height: 0 !important;
}

.exp-dialog.small .exp-dialog-main,
.dc-delete-dialog .exp-dialog-main,
.modal-scrim .modal.delete-modal .modal-body {
  padding: 18px 22px 20px !important;
  font-size: 13.5px !important;
  line-height: 1.65 !important;
  color: #41516b !important;
  flex: none !important;
}

/* ==========================================================================
   Unified Headers
   ========================================================================== */
.detail-header,
.exp-dialog-head,
.dc-dialog-head,
.modal-scrim .modal:not(.add-dataset-modal) .modal-top,
.iad-dialog-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 12px !important;
  min-height: 56px !important;
  height: 56px !important;
  flex: none !important;
  padding: 0 24px !important;
  border-bottom: var(--iad-dialog-divider) !important;
  background: var(--iad-dialog-bg) !important;
  box-sizing: border-box !important;
}

.detail-title,
.exp-dialog-head strong,
.exp-dialog-head h2,
.dc-dialog-head h2,
.modal-scrim .modal:not(.add-dataset-modal) .modal-top h2,
.iad-dialog-header h2 {
  font-size: var(--iad-dialog-title-font) !important;
  font-weight: var(--iad-dialog-title-weight) !important;
  color: var(--iad-dialog-title-color) !important;
  line-height: 1.4 !important;
  margin: 0 !important;
  font-family: inherit !important;
}

/* Unified Close Button */
.detail-close,
.modal-x,
.dc-icn,
.exp-direction-icon,
.exp-ghost.modal-x,
button.iad-icon-button[aria-label*="关闭"],
button.modal-x {
  display: grid !important;
  place-items: center !important;
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  min-height: 32px !important;
  border-radius: 5px !important;
  border: 0 !important;
  background: transparent !important;
  color: var(--iad-dialog-muted-color) !important;
  font-size: 20px !important;
  cursor: pointer !important;
  padding: 0 !important;
  line-height: 1 !important;
  transition: background-color .15s ease, color .15s ease !important;
}

.detail-close:hover,
.modal-x:hover,
.dc-icn:hover,
.exp-direction-icon:hover,
button.iad-icon-button[aria-label*="关闭"]:hover,
button.modal-x:hover {
  background: #eef2f7 !important;
  color: #1e293b !important;
}

/* ==========================================================================
   Unified Footers & Actions
   ========================================================================== */
.exp-dialog-foot,
.dc-dialog-footer,
.modal-scrim .modal:not(.add-dataset-modal) .modal-actions {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: 10px !important;
  min-height: 58px !important;
  height: 58px !important;
  flex: none !important;
  padding: 0 24px !important;
  border-top: var(--iad-dialog-divider) !important;
  background: var(--iad-dialog-bg) !important;
  box-sizing: border-box !important;
  margin: 0 !important;
}

/* Unified Footer Buttons */
.exp-dialog-foot button,
.dc-dialog-footer button,
.modal-scrim .modal:not(.add-dataset-modal) .modal-actions button,
.iad-confirm-dialog button {
  min-height: 34px !important;
  height: 34px !important;
  font-size: 13px !important;
  border-radius: 5px !important;
  box-sizing: border-box !important;
  padding: 0 16px !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* Danger Action Buttons */
.exp-delete-confirm,
.delete-confirm,
.dc-delete-confirm,
.exp-dialog-foot button.danger,
.modal-scrim .modal-actions button.btn-danger {
  background: var(--iad-btn-danger-bg) !important;
  background-color: var(--iad-btn-danger-bg) !important;
  color: #ffffff !important;
  border: 1px solid var(--iad-btn-danger-bg) !important;
  border-color: var(--iad-btn-danger-bg) !important;
  font-weight: 550 !important;
}

.exp-delete-confirm:hover,
.delete-confirm:hover,
.dc-delete-confirm:hover,
.exp-dialog-foot button.danger:hover,
.modal-scrim .modal-actions button.btn-danger:hover {
  background: var(--iad-btn-danger-hover) !important;
  background-color: var(--iad-btn-danger-hover) !important;
  border-color: var(--iad-btn-danger-hover) !important;
  color: #ffffff !important;
}

/* Cancel / Ghost Buttons */
.cancel,
button.exp-ghost,
.dc-dialog-footer button.dc-minor,
.modal-scrim .modal:not(.add-dataset-modal) .modal-actions button.btn-secondary {
  background: #ffffff !important;
  background-color: #ffffff !important;
  color: var(--iad-btn-cancel-color) !important;
  border: 1px solid var(--iad-btn-cancel-border) !important;
  border-color: var(--iad-btn-cancel-border) !important;
  font-weight: 500 !important;
}

.cancel:hover,
button.exp-ghost:hover,
.dc-dialog-footer button.dc-minor:hover,
.modal-scrim .modal:not(.add-dataset-modal) .modal-actions button.btn-secondary:hover {
  background: #f1f5fa !important;
  background-color: #f1f5fa !important;
  border-color: #b5c3d4 !important;
  color: #1e293b !important;
}

/* Primary Form Submit Buttons */
.dc-dialog-footer button.dc-btn,
.modal-scrim .modal:not(.add-dataset-modal) .modal-actions button.btn-primary {
  background: var(--iad-btn-primary-bg) !important;
  background-color: var(--iad-btn-primary-bg) !important;
  color: #ffffff !important;
  border: 1px solid var(--iad-btn-primary-bg) !important;
  border-color: var(--iad-btn-primary-bg) !important;
  font-weight: 550 !important;
}

.dc-dialog-footer button.dc-btn:hover:not(:disabled),
.modal-scrim .modal:not(.add-dataset-modal) .modal-actions button.btn-primary:hover:not(:disabled) {
  background: var(--iad-btn-primary-hover) !important;
  background-color: var(--iad-btn-primary-hover) !important;
  border-color: var(--iad-btn-primary-hover) !important;
}

/* ==========================================================================
   V52/V53 Dialog Typography Contract & Status Preservation
   ========================================================================== */
.detail-dialog, .exp-dialog, .dc-dialog, #knowledge-page .kb-v45 .modal {
  font-family: var(--iba-dialog-font) !important;
  font-size: 13px !important;
  color: var(--iba-dialog-ink) !important;
}

.detail-dialog :is(.detail-header, .detail-scroll, .detail-footer),
.exp-dialog :is(.exp-dialog-head, .exp-dialog-main, .exp-dialog-foot),
.dc-dialog :is(.dc-dialog-head, .dc-dialog-body, .dc-dialog-footer),
#knowledge-page .kb-v45 .modal :is(.modalheader, .modalcontent, .modalfooter) {
  color: var(--iba-dialog-ink) !important;
}

/* Ordinary explanations/IDs/field labels: one ink, one size and regular weight.
   Exclude actual status badges and button contents from this normalization. */
:is(.detail-dialog, .exp-dialog, .dc-dialog, #knowledge-page .kb-v45 .modal)
:is(p, span, small, label, dt, dd, li, figcaption, pre)
:not(:is(button, button *, a, a *, .exp-pill, .exp-pill *, .status, .status *, .dc-state, .dc-state *, .badge, .badge *, .dc-tag, .dc-tag *)) {
  color: var(--iba-dialog-ink) !important;
  font-family: var(--iba-dialog-font) !important;
  font-size: 13px !important;
  font-weight: 400 !important;
}

/* Unify ordinary inline metadata found in each detail implementation. */
.exp-direction-dialog :is(.exp-direction-meta, .exp-direction-meta *, .exp-direction-note),
.detail-dialog :is(.detail-meta, .detail-info, .detail-summary),
.dc-dialog :is(.dc-dialog-caption, .dc-dialog-note, .dc-verdict-description),
#knowledge-page .kb-v45 .detail-modal :is(.muted, .row-desc, .detail-muted, .detail-evidence-empty) {
  color: var(--iba-dialog-ink) !important;
  font-size: 13px !important;
  font-weight: 400 !important;
}

/* Titles are the only deliberately bold non-state text. */
:is(.detail-dialog, .exp-dialog, .dc-dialog, #knowledge-page .kb-v45 .modal)
:is(h1, h2, h3, h4),
.exp-dialog .exp-dialog-head > strong,
.dc-dialog .dc-dialog-title {
  font-family: var(--iba-dialog-font) !important;
  color: var(--iba-dialog-ink) !important;
  font-weight: 650 !important;
}

/* Preserve semantic status colors; primary/selected controls keep their function-based color. */
.exp-dialog :is(.exp-pill.ok, .exp-pill.completed) { color: #177b53 !important; }
.exp-dialog :is(.exp-pill.fail, .exp-pill.failed) { color: #b23c43 !important; }
.exp-dialog :is(.exp-pill.pending, .exp-pill.running) { color: #285ed6 !important; }
#knowledge-page .kb-v45 .modal .status.green { color: #177b53 !important; }
#knowledge-page .kb-v45 .modal .status.red { color: #b23c43 !important; }
#knowledge-page .kb-v45 .modal .status.amber { color: #976013 !important; }
#knowledge-page .kb-v45 .modal .status.blue { color: #285ed6 !important; }

/* ==========================================================================
   Prompt Drawers (560px right-hand drawers, 100dvh full height)
   Direction Exploration Prompt Drawer, Knowledge Prompt Drawer
   ========================================================================== */
.exp-prompt-overlay,
.knowledge-prompt-overlay {
  position: fixed !important;
  inset: 0 !important;
  z-index: 500 !important;
  display: flex !important;
  align-items: stretch !important;
  justify-content: flex-end !important;
  padding: 0 !important;
  background: var(--iad-modal-backdrop, rgba(22, 33, 51, 0.36)) !important;
}

.exp-prompt-drawer,
.knowledge-prompt-drawer {
  box-sizing: border-box !important;
  flex: none !important;
  position: fixed !important;
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: min(560px, 100vw) !important;
  max-width: 560px !important;
  height: 100dvh !important;
  max-height: 100dvh !important;
  margin: 0 !important;
  border-radius: 0 !important;
  border-left: 1px solid #d6deeb !important;
  border-top: 0 !important;
  border-right: 0 !important;
  border-bottom: 0 !important;
  box-shadow: -15px 0 45px rgba(21, 34, 56, 0.2) !important;
  background: #ffffff !important;
  display: flex !important;
  flex-direction: column !important;
  min-width: 0 !important;
  animation: exp-drawer-enter 0.15s ease-out !important;
}

@keyframes exp-drawer-enter {
  from {
    transform: translateX(24px);
    opacity: 0.7;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 760px) {
  .detail-overlay,
  .exp-modal,
  #dc-compare-mask.dc-modal-mask,
  #knowledge-page .kb-v45 .detail-overlay {
    padding: 12px !important;
  }
  .exp-modal .exp-direction-dialog .exp-evidence-viewport,
  .exp-direction-dialog .exp-evidence-viewport {
    height: 156px !important;
    max-height: 156px !important;
  }
  .exp-modal .exp-direction-dialog .exp-direction-evidence-card img,
  .exp-direction-dialog .exp-evidence-viewport .exp-direction-evidence-card img {
    height: 96px !important;
    max-height: 96px !important;
  }
}

`;
