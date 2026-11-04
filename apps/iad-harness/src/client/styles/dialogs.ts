/**
 * Single Source of Truth (SSOT) for all modals, dialogs, backdrops, and actions across the workbench.
 * Standardizes sizes, typography, borders, headers, and buttons across Image Browser, Exploration,
 * Consistency Check, and Dataset Management.
 */

export const dialogsStyles = `
/* ==========================================================================
   Dialog Design Tokens (Single Source of Truth)
   ========================================================================== */
:root {
  --iad-modal-backdrop: rgba(23, 34, 51, 0.68);
  --iad-dialog-gutter: 56px;
  --iad-dialog-vgutter: 40px;

  /* Dimensions */
  --iad-dialog-max-width: 1380px;
  --iad-dialog-max-height: 820px;
  --iad-dialog-medium-width: 760px;
  --iad-dialog-small-width: 530px;

  /* Surfaces & Borders */
  --iad-dialog-bg: #ffffff;
  --iad-dialog-radius: 8px;
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
    --iad-dialog-gutter: 24px;
    --iad-dialog-vgutter: 22px;
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
.detail-overlay,
.exp-modal,
.dc-modal-mask,
.modal-scrim,
dialog.iad-detail-dialog::backdrop {
  position: fixed !important;
  inset: 0 !important;
  z-index: 500 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: var(--iad-modal-backdrop) !important;
  padding: var(--iad-dialog-vgutter) var(--iad-dialog-gutter) !important;
  box-sizing: border-box !important;
}

.detail-overlay.hidden,
.exp-modal[hidden],
.dc-modal-mask[hidden],
.modal-scrim[hidden] {
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
.modal-scrim .modal,
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
   Image Detail, Exploration Direction Detail, Consistency Conflict Compare
   ========================================================================== */
.detail-dialog,
.exp-direction-dialog,
.dc-conflict-dialog,
#dc-compare-mask.dc-modal-mask .dc-dialog[role=dialog],
dialog.iad-detail-dialog:not(.iad-drawer):not(.iad-confirm-dialog):not(.iad-inline-dialog):not(.iad-viewer-dialog) {
  width: min(var(--iad-dialog-max-width), calc(100vw - 2 * var(--iad-dialog-gutter))) !important;
  max-width: var(--iad-dialog-max-width) !important;
  height: min(var(--iad-dialog-max-height), calc(100dvh - 2 * var(--iad-dialog-vgutter))) !important;
  max-height: calc(100dvh - 2 * var(--iad-dialog-vgutter)) !important;
  min-height: 0 !important;
}

/* Detail dialog internal scrollable body */
.detail-scroll,
.exp-direction-dialog .exp-dialog-main,
#dc-compare-mask .dc-dialog-body,
.dc-conflict-dialog .dc-dialog-body {
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

/* Large detail dialog internal flex hierarchy */
.exp-direction-dialog .exp-direction-body {
  display: flex !important;
  flex-direction: column !important;
  flex: 1 1 auto !important;
  min-height: 0 !important;
}
.exp-direction-dialog .exp-direction-evidence {
  flex: 1 1 auto !important;
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
  padding-bottom: 0 !important;
}
.exp-direction-dialog .exp-direction-evidence-groups {
  flex: 1 1 auto !important;
  align-items: stretch !important;
  min-height: 0 !important;
}
.exp-direction-dialog .exp-scroll-group {
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
}
.exp-direction-dialog .exp-evidence-viewport {
  flex: 1 1 auto !important;
  align-items: stretch !important;
  min-height: 0 !important;
  background: #f6f8fb !important;
  border: 1px solid #e3e9f1 !important;
  border-radius: 5px !important;
  padding: 7px 7px 10px !important;
}
.exp-direction-dialog .exp-evidence-viewport .exp-direction-evidence-card {
  height: 100% !important;
  box-sizing: border-box !important;
  width: clamp(200px, 47%, 300px) !important;
  min-width: clamp(200px, 47%, 300px) !important;
}
.exp-direction-dialog .exp-evidence-viewport .exp-direction-evidence-card img {
  height: clamp(175px, 23dvh, 250px) !important;
}
#dc-compare-mask .dc-compare-photo,
.dc-conflict-dialog .dc-compare-photo {
  height: clamp(240px, 39dvh, 400px) !important;
}
.detail-preview {
  height: clamp(310px, 46dvh, 500px) !important;
}

/* ==========================================================================
   Tier 2: Medium Form & Analytics Dialogs (760px max-width, auto-height)
   New Consistency Check, Stats Modal, Exploration Prompts, Add/Edit Dataset
   ========================================================================== */
#dc-new-mask .dc-new-dialog,
.dc-stats-modal .dc-stats-dialog,
.exp-prompt-modal .exp-prompt-dialog,
.exp-dialog:not(.small):not(.exp-direction-dialog),
.modal-scrim .modal:not(.delete-modal) {
  width: min(var(--iad-dialog-medium-width), calc(100vw - 2 * var(--iad-dialog-gutter))) !important;
  max-width: var(--iad-dialog-medium-width) !important;
  height: auto !important;
  max-height: calc(100dvh - 2 * var(--iad-dialog-vgutter)) !important;
  min-height: 0 !important;
}

#dc-new-mask .dc-new-body,
.dc-stats-dialog .dc-stats-body,
.modal-scrim .modal:not(.delete-modal) .modal-body,
.exp-dialog:not(.small):not(.exp-direction-dialog) .exp-dialog-main {
  padding: 22px 26px 24px !important;
  overflow-y: auto !important;
  flex: 1 1 auto !important;
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
.modal-scrim .modal-top,
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
.modal-scrim .modal-top h2,
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
.modal-scrim .modal-actions {
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
.modal-scrim .modal-actions button,
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
.modal-scrim .modal-actions button.btn-secondary {
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
.modal-scrim .modal-actions button.btn-secondary:hover {
  background: #f1f5fa !important;
  background-color: #f1f5fa !important;
  border-color: #b5c3d4 !important;
  color: #1e293b !important;
}

/* Primary Form Submit Buttons */
.dc-dialog-footer button.dc-btn,
.modal-scrim .modal-actions button.btn-primary {
  background: var(--iad-btn-primary-bg) !important;
  background-color: var(--iad-btn-primary-bg) !important;
  color: #ffffff !important;
  border: 1px solid var(--iad-btn-primary-bg) !important;
  border-color: var(--iad-btn-primary-bg) !important;
  font-weight: 550 !important;
}

.dc-dialog-footer button.dc-btn:hover:not(:disabled),
.modal-scrim .modal-actions button.btn-primary:hover:not(:disabled) {
  background: var(--iad-btn-primary-hover) !important;
  background-color: var(--iad-btn-primary-hover) !important;
  border-color: var(--iad-btn-primary-hover) !important;
}
`;
