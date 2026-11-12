/**
 * Shared dialog frames and type-specific layouts. Each content type owns its body structure.
 */
export const dialogsStyles = `
dialog.iad-detail-dialog {text-align:left;}
.iad-dialog-form-layout {display:flex;flex-direction:column;flex:1 1 auto;min-height:0;}
.iad-dialog-body {flex:1 1 auto;min-height:0;overflow:auto;padding:18px 24px;font-size:var(--iad-font-size);color:var(--iad-text);}
.iad-dialog-footer {display:flex;align-items:center;justify-content:flex-end;flex:none;gap:10px;min-height:58px;padding:10px 24px;border-top:1px solid var(--iad-border);background:var(--iad-surface);}
/* ==========================================================================
   Dialog Design Tokens (Single Source of Truth)
   ========================================================================== */
:root {
  --iba-detail-dialog-height: var(--iad-dialog-max-height);
  --iba-detail-dialog-width: var(--iad-dialog-max-width);
  --iba-dialog-detail-width: var(--iad-dialog-max-width);
  --iba-dialog-edit-width: var(--iad-dialog-medium-width);
  --iba-dialog-max-height: var(--iad-dialog-max-height);
  --iba-dialog-gap: var(--iad-dialog-gutter);
  --iba-dialog-ink: var(--iad-text);
  --iba-dialog-border: var(--iad-border);
  --iba-dialog-font: var(--iad-font-family);

  --iad-modal-backdrop: rgba(23, 34, 51, 0.68);
  --iad-dialog-gutter: clamp(12px, 2.5vw, 32px);
  --iad-dialog-vgutter: clamp(12px, 2.5vw, 32px);

  /* Dimensions */
  --iad-dialog-max-width: 1380px;
  --iad-dialog-max-height: 820px;
  --iad-dialog-medium-width: 960px;
  --iad-dialog-small-width: 530px;

  /* Surfaces & Borders */
  --iad-dialog-bg: var(--iad-surface);
  --iad-dialog-radius: 7px;
  --iad-dialog-border: 1px solid #d9e2ed;
  --iad-dialog-shadow: 0 20px 64px rgba(14, 26, 48, 0.27);
  --iad-dialog-divider: 1px solid #e3e9f2;

  /* Typography */
  --iad-dialog-title-font: 17px;
  --iad-dialog-title-weight: 650;
  --iad-dialog-title-color: var(--iad-text);
  --iad-dialog-text-font: var(--iad-font-size);
  --iad-dialog-text-color: var(--iad-text);
  --iad-dialog-muted-color: var(--iad-muted);
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


.overlay:not(.show),
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
}

/* ==========================================================================
   Tier 1: Large Detail Dialogs (1380px max-width, 820px max-height)
   Image Detail, Exploration Direction Detail, Consistency Conflict Compare, Knowledge Detail
   ========================================================================== */
.detail-dialog,
.exp-direction-dialog,
.dc-conflict-dialog,
#knowledge-page .kb-v45 .detail-modal,
#knowledge-page .detail-modal,
.detail-modal,
dialog.iad-detail-dialog:not(.iad-drawer):not(.iad-dialog-compact):not(.iad-dialog-form):not(.iad-inline-dialog):not(.iad-viewer-dialog) {
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
  flex: none !important;
  display: flex !important;
  flex-direction: column !important;
}

dialog.iad-detail-dialog:not(.iad-drawer):not(.iad-inline-dialog):not(.iad-viewer-dialog) {
  position:fixed;
  inset:0;
  margin: auto !important;
}

/* Detail dialog internal scrollable body - scrolls only when needed */
.exp-direction-dialog .exp-dialog-main,
#dc-compare-mask .dc-dialog-body,
.dc-conflict-dialog .dc-dialog-body,
#knowledge-page .kb-v45 .detail-modal .modalcontent,
#knowledge-page .detail-modal .modalcontent,
.detail-modal .modalcontent {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  overscroll-behavior: contain !important;
}

.detail-scroll{display:block;flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:22px 28px 28px!important}
.exp-direction-dialog .exp-dialog-main { display:flex;flex-direction:column;padding:15px 28px 24px!important;flex:1 1 0!important;overflow:hidden!important; }
#dc-compare-mask .dc-dialog-body,
.dc-conflict-dialog .dc-dialog-body { padding: 20px 26px 24px !important; }

.exp-direction-dialog .exp-direction-body {
  display:grid;
  grid-template-columns:minmax(0,1fr);
  grid-template-rows:repeat(3,minmax(0,1fr)) minmax(230px,1fr);
  gap:0;
  flex:1 1 0;
  min-height:0;
  min-width:0;
}
.exp-direction-dialog .exp-direction-body h3 {font-size:13px;margin:0 0 10px}
.exp-direction-dialog .exp-direction-body>section {
  min-width:0;
  min-height:0;
  overflow:auto;
  overflow-wrap:anywhere;
  line-height:1.85;
  box-sizing:border-box;
  padding:16px 0;
}
.exp-direction-dialog .exp-direction-body>section:first-child{padding-top:0}
.exp-direction-dialog .exp-direction-body>section+section{border-top:1px solid var(--iad-border,#dbe2eb)}
.exp-direction-dialog .exp-direction-body p {margin:0;line-height:1.85}
.exp-direction-dialog .exp-direction-body ul {margin:0;padding-left:18px}
.exp-direction-dialog .exp-direction-body li+li {margin-top:6px}
.exp-direction-dialog .exp-direction-evidence {
  grid-column:1/-1;
  min-height:0;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  padding-bottom:0;
}
.exp-direction-dialog .exp-direction-evidence-head {flex:none;margin-bottom:12px}
.exp-direction-dialog .exp-direction-evidence-head h3 {margin:0}
.exp-direction-dialog .exp-direction-evidence-groups {
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:24px;
  flex:1 1 0;
  min-height:0;
}
.exp-direction-dialog .exp-scroll-group {display:flex;min-height:0;min-width:0;overflow:hidden}
.exp-direction-dialog .exp-scroll-group+.exp-scroll-group{border-left:1px solid var(--iad-border,#dbe2eb);padding-left:24px;box-sizing:border-box}
.exp-direction-dialog .exp-evidence-viewport {
  display:flex;
  flex:1 1 0;
  box-sizing:border-box;
  min-height:0;
  min-width:0;
  padding:3px 2px 8px;
  align-items:stretch;
  gap:10px;
  overflow-x:auto;
  overflow-y:hidden;
  scrollbar-width:thin;
  scroll-snap-type:x proximity;
}
.exp-direction-dialog .exp-evidence-viewport:focus-visible {outline:2px solid #2458d5;outline-offset:-2px}

.detail-preview {
  height: clamp(310px, 46dvh, 500px) !important;
}

/* ==========================================================================
   Tier 2: Medium Form & Analytics Dialogs (960px max-width, auto-height)
   Stats Modal, Exploration Prompts, Add/Edit Dataset, Knowledge Create
   ========================================================================== */
#knowledge-page .kb-v45 #create-overlay > .modal,
dialog.iad-detail-dialog.iad-dialog-form {
  width: min(var(--iba-dialog-edit-width), calc(100vw - 2 * var(--iba-dialog-gap))) !important;
  max-width: var(--iba-dialog-edit-width) !important;
  height: fit-content !important;
  max-height: min(var(--iba-dialog-max-height), calc(100dvh - 2 * var(--iba-dialog-gap))) !important;
  min-height: 0 !important;
  border-radius: 7px !important;
}

#knowledge-page .kb-v45 #create-overlay > .modal {
  height: fit-content !important;
}

#knowledge-page .kb-v45 #create-overlay > .modal > .modalcontent,
.dc-stats-dialog .dc-stats-body {
  padding: 22px 26px 24px !important;
  overflow-y: auto !important;
  flex: 0 1 auto !important;
  min-height: 0 !important;
}

/* ==========================================================================
   Tier 3: Small Confirmation / Deletion Dialogs (530px max-width, auto-height)
   Consistency Delete Job, Exploration Delete Job, Dataset Delete, Confirmations
   ========================================================================== */
dialog.iad-detail-dialog.iad-dialog-compact {
  width: min(var(--iad-dialog-small-width), calc(100vw - 32px)) !important;
  max-width: var(--iad-dialog-small-width) !important;
  height: fit-content !important;
  max-height: calc(100dvh - 32px) !important;
  min-height: 0 !important;
}

/* ==========================================================================
   Unified Headers
   ========================================================================== */
.exp-dialog-head,
.dc-dialog-head,
.iad-dialog-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 12px !important;
  margin: 0 !important;
  min-height: 56px !important;
  height: 56px !important;
  flex: none !important;
  padding: 0 24px !important;
  border-bottom: var(--iad-dialog-divider) !important;
  background: var(--iad-dialog-bg) !important;
  box-sizing: border-box !important;
}

.exp-dialog-head strong,
.exp-dialog-head h2,
.dc-dialog-head h2,
.iad-dialog-header h2 {
  font-size: var(--iad-dialog-title-font) !important;
  font-weight: var(--iad-dialog-title-weight) !important;
  color: var(--iad-dialog-title-color) !important;
  line-height: 1.4 !important;
  margin: 0 !important;
  font-family: inherit !important;
}

/* Unified Close Button */

/* ==========================================================================
   Unified Footers & Actions
   ========================================================================== */
.exp-dialog-foot,
.dc-dialog-footer {
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
.exp-dialog-foot button,.dc-dialog-footer button,.iad-dialog-compact button {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* ==========================================================================
   Dialog Typography and Status
   ========================================================================== */
.detail-dialog, .exp-dialog, .dc-dialog, #knowledge-page .kb-v45 .modal {
  font-family: var(--iba-dialog-font) !important;
  font-size: 13px !important;
  color: var(--iba-dialog-ink) !important;
}

.detail-dialog :is(.detail-scroll, .detail-footer),
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


dialog.iad-drawer{--iad-dialog-radius:0px;--iad-dialog-border:0;--iad-dialog-shadow:-12px 0 28px rgba(17,28,45,.1)}
dialog.iad-drawer::backdrop{background:rgba(17,28,45,.49)}
dialog.iad-drawer>.iad-dialog-header{height:64px!important;min-height:64px!important}
`;
