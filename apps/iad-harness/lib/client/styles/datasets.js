export const datasetsStyles = `
:root, [data-page="industrial-datasets"] {
  --drawer-width: clamp(480px, 34vw, 560px);
  --line: #dfe5ee;
  --line-dark: #cbd5e1;
  --header: #f0f3f8;
  --select: #eaf0ff;
  --sub: #5f6f86;
  --primary: #2458d5;
  --hover: #f1f5fa;
  --radius: 5px;
  --shadow: 0 12px 36px rgba(20,34,60,.13);
}

[data-page="industrial-datasets"], [data-page="industrial-datasets"] * {
  box-sizing: border-box;
}

[data-ds-dark-theme] [data-page="industrial-datasets"] {
  --line: #4C5B6E;
  --line-dark: #4C5B6E;
  --header: #202B3A;
  --select: #293648;
  --sub: #B4C0D0;
  --primary: #A7C5FF;
  --hover: #293E60;
}

:is(.iad-workbench[data-page="industrial-datasets"], .iad-workbench[data-page="industrial-images"]) {
  padding-top: 28px;
  position: relative;
  min-height: 100%;
}

:is([data-page="industrial-datasets"], [data-page="industrial-images"]) .iad-breadcrumb {
  display: none !important;
}

:is([data-page="industrial-datasets"], [data-page="industrial-images"]) .iad-header {
  align-items: center;
}

.iad-dataset-page-wrap {
  width: 100%;
  min-width: 0;
  padding-right: 0 !important;
}

.iad-dataset-page-wrap.has-drawer {
  padding-right: 0 !important;
}

.section-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.section-bar h2 {
  font-size: 17px;
  letter-spacing: -.2px;
  margin: 0;
  font-weight: 700;
}

.section-bar .count {
  font-size: 13px;
  color: var(--sub);
  font-weight: 400;
  margin-left: 7px;
}

.search {
  width: 220px;
  height: 38px;
  padding: 0 12px;
  background: var(--iad-surface, #fff);
  border: 1px solid #b9c7d9;
  border-radius: 5px;
  font-size: 13px;
  color: var(--iba-unified-ink, #172338);
}

.table-wrap {
  background: var(--iad-surface, #fff);
  border: 1px solid var(--line-dark);
  border-radius: 5px;
  overflow: hidden;
}

.dataset-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 13px;
}

.dataset-table col.name-col { width: 42%; }
.dataset-table col.format-col { width: 17%; }
.dataset-table col.metric-col { width: 13%; }
.dataset-table col.action-col { width: 100px; }

.dataset-table th {
  height: 43px;
  text-align: left;
  padding: 0 16px;
  background: var(--header);
  color: #62718a;
  font-weight: 500;
  font-size: 12px;
  border-bottom: 1px solid var(--line);
}

.dataset-table th.num { text-align: right; }
.dataset-table th:last-child { text-align: right; }

.dataset-table td {
  height: 55px;
  border-bottom: 1px solid #e6ebf1;
  padding: 6px 16px;
  font-size: 13px;
}

.dataset-table tr:last-child td { border-bottom: 0; }

.dataset-table tr.data-row { cursor: pointer; }
.dataset-table tr.data-row:hover { background: var(--hover); }
.dataset-table tr.data-row[data-selected="true"] { background: var(--select); }
.dataset-table tr.data-row[data-selected="true"] td:first-child { box-shadow: inset 3px 0 var(--primary); }
.dataset-table tr.parent-row { background: #f8faff; }
.dataset-table tr.parent-row:hover { background: #eef3ff; }
[data-ds-dark-theme] .dataset-table tr.parent-row { background: rgba(255,255,255,0.02); }
[data-ds-dark-theme] .dataset-table tr.parent-row:hover { background: rgba(255,255,255,0.05); }

.dataset-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.dataset-table .muted { color: #77879e; }

.name-area {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.name-area.child { padding-left: 33px; }
.expand[data-expanded="false"] svg { transform: rotate(-90deg); }

.name-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
  flex: 0 1 auto;
  min-width: 0;
  max-width: calc(100% - 40px);
}

.parent-row .name-text { font-weight: 400; }
.dataset-table tr[data-selected="true"] .name-text { color: #153b8e; }
[data-ds-dark-theme] .dataset-table tr[data-selected="true"] .name-text { color: var(--primary); }

.pencil {
  margin-left: auto;
}

.actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
}

.edit-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  flex: 1;
}

.edit-input {
  height: 33px;
  width: 100%;
  max-width: 100%;
  min-width: 100px;
  border: 1px solid #4f7be7;
  border-radius: 5px;
  padding: 0 8px;
  background: var(--iad-surface, #fff);
  color: inherit;
  outline: none;
}

.blank {
  padding: 30px;
  text-align: center;
  color: var(--sub);
}

/* Drawer styles - overlay without squeezing page */
.drawer-root {
  display: none;
  position: fixed;
  z-index: 50;
  inset: 0;
  pointer-events: none;
}

.drawer-root.open { display: block; }

.drawer-backdrop { display: none; }

.dataset-drawer {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: var(--drawer-width);
  height: 100vh;
  padding: 0;
  background: var(--iad-surface, #fff);
  border-left: 1px solid var(--line-dark);
  box-shadow: -10px 0 32px rgba(20, 34, 60, 0.16);
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  overflow: hidden;
  z-index: 51;
}

.drawer-top {
  padding: 27px 26px 17px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  justify-content: space-between;
  border-bottom: 1px solid var(--line);
}

.drawer-heading { min-width: 0; }

.drawer-heading h2 {
  font-size: 20px;
  line-height: 1.45;
  font-weight: 700;
  overflow-wrap: anywhere;
  margin: 0;
}

.drawer-heading .detail-sub {
  font-size: 12px;
  color: var(--sub);
  margin-top: 6px;
  overflow-wrap: anywhere;
}

.drawer-body {
  overflow-y: auto;
  min-height: 0;
  flex: 1;
  padding: 22px 25px 32px;
}

.dataset-drawer .detail-card {
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: 0;
}

.dataset-drawer .single-section > h3 {
  font-size: 15px;
  font-weight: 650;
  margin: 0 0 25px;
}

.dataset-drawer .fields { display: grid; gap: 20px; }
.dataset-drawer .field label { display: block; margin-bottom: 9px; font-size: 13px; font-weight: 550; }
.dataset-drawer .field .control { display: flex; gap: 10px; }

.dataset-drawer .field .control input {
  height: 38px;
  min-width: 0;
  flex: 1;
  border: 1px solid #a2b0c4;
  border-radius: 5px;
  padding: 0 11px;
  font-size: 12.5px;
  background: var(--iad-surface, #fff);
  color: inherit;
}

.dataset-drawer .field .control button { flex: none; }

.identifier-section {
  border-top: 1px solid var(--line);
  margin-top: 24px;
  padding-top: 20px;
}

.identifier-section h3 {
  font-size: 15px;
  line-height: 1.4;
  font-weight: 650;
  margin: 0 0 18px;
}

.identifier-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.identifier-value span {
  display: block;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 550;
  color: inherit;
}

.identifier-value .copy-id {
  margin-left: auto;
}

.group-identifier .identifier-section {
  border-top: 0;
  margin-top: 0;
  padding-top: 0;
}

.dataset-drawer .detail-footer {
  margin-top: 28px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 66px;
  gap: 13px;
}

.dataset-drawer .detail-footer .help {
  min-height: 15px;
  color: var(--sub);
  font-size: 12px;
  margin: 0;
}

.dataset-drawer .detail-footer .buttons {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  align-items: center;
}

/* Mapping area */
.mapping-area { margin-top: 0; }
.mapping-table { border: 1px solid var(--line); border-radius: 5px; overflow: hidden; }

.mapping-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  gap: 12px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}

.mapping-row:last-child { border-bottom: none; }
.mapping-row > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.mapping-row select {
  height: 33px;
  border: 1px solid #aebbd0;
  border-radius: 5px;
  min-width: 110px;
  background: var(--iad-surface, #fff);
  color: inherit;
  padding: 0 8px;
  font-size: 12px;
}

/* Modal dialogs */

.modal-field { margin-bottom: 17px; }

.modal-field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.modal-field input, .modal-field select {
  width: 100%;
  height: 40px;
  border: 1px solid #9caac0;
  border-radius: 5px;
  padding: 0 11px;
  background: var(--iad-surface, #fff);
  color: inherit;
}

.modal .radio-row { display: flex; gap: 10px; }

.modal .radio-row label {
  flex: 1;
  min-height: 46px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #d1dbe7;
  border-radius: 5px;
  padding: 10px 12px;
  font-weight: 400;
  cursor: pointer;
}

.modal .radio-row label:has(input:checked) {
  border-color: #4476e4;
  background: #eef3ff;
}

[data-ds-dark-theme] .modal .radio-row label:has(input:checked) {
  border-color: var(--primary);
  background: var(--select);
}

.modal .radio-row label:has(input:disabled) {
  opacity: .48;
  cursor: not-allowed;
}

.modal .radio-row input {
  width: 16px;
  height: 16px;
  flex: none;
  margin: 0;
}

.modal-field .dialog-path { display: flex; gap: 9px; }
.modal-field .dialog-path input { flex: 1; min-width: 0; }
.modal-field .dialog-path button { flex: none; }

.modal-hint { font-size: 12px; color: var(--sub); line-height: 1.6; margin: 2px 0 0; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }

/* Toast */
.toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  background: #273955;
  color: white;
  padding: 11px 17px;
  border-radius: 6px;
  font-size: 13px;
  z-index: 100;
  box-shadow: var(--shadow);
  max-width: 90%;
  text-align: center;
  transition: opacity .2s ease;
}

.toast.hidden { display: none; }

/* Buttons */

/* Responsive */
@media(max-width: 1200px) {
  .iad-dataset-page-wrap.has-drawer { padding-right: 0 !important; }
  .drawer-root.open { pointer-events: auto; }
  .drawer-root.open .drawer-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15,25,43,.22);
    pointer-events: auto;
    z-index: 50;
  }
  .dataset-drawer {
    width: min(540px, 95vw);
    box-shadow: -8px 0 30px rgba(0,0,0,.17);
    z-index: 51;
  }
}

@media(max-width: 760px) {
  .drawer-top { padding: 19px 15px; }
  .drawer-body { padding: 15px; }
  .modal { padding: 20px 16px; }
  .modal .radio-row { flex-wrap: wrap; }
  .modal .radio-row label { min-width: 150px; }
}

/* ==========================================================================
   Add Dataset Modal & Directory Picker Modal (Strictly Aligns with HTML Prototype)
   ========================================================================== */
.modal-scrim .modal.add-dataset-modal {
  width: min(720px, calc(100% - 32px)) !important;
  max-width: 720px !important;
  max-height: calc(100vh - 36px) !important;
  height: auto !important;
  min-height: 0 !important;
  background: #ffffff !important;
  border: 1px solid #c4cfdf !important;
  border-radius: 8px !important;
  padding: 25px 24px 24px !important;
  box-shadow: 0 16px 52px rgba(8, 19, 39, .24) !important;
  display: block !important;
  overflow-y: auto !important;
  box-sizing: border-box !important;
}

.modal-scrim .modal.add-dataset-modal .modal-top {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  height: auto !important;
  min-height: 0 !important;
  padding: 0 0 16px !important;
  border-bottom: 1px solid #dfe5ee !important;
  margin-bottom: 20px !important;
  background: transparent !important;
  box-sizing: border-box !important;
}

.modal-scrim .modal.add-dataset-modal .modal-top h2 {
  font-size: 18px !important;
  font-weight: 700 !important;
  color: #14243d !important;
  margin: 0 !important;
  line-height: 1.4 !important;
}

.modal-scrim .modal.add-dataset-modal .modal-field {
  margin-bottom: 17px !important;
}

.modal-scrim .modal.add-dataset-modal .modal-field > label {
  display: block !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  color: #14243d !important;
  margin-bottom: 8px !important;
}

.modal-scrim .modal.add-dataset-modal .modal-field input,
.modal-scrim .modal.add-dataset-modal .modal-field select {
  width: 100% !important;
  height: 40px !important;
  border: 1px solid #9caac0 !important;
  border-radius: 5px !important;
  padding: 0 11px !important;
  background: #ffffff !important;
  color: #14243d !important;
  font-size: 14px !important;
  box-sizing: border-box !important;
  outline: none !important;
}

.modal-scrim .modal.add-dataset-modal .modal-field input:focus,
.modal-scrim .modal.add-dataset-modal .modal-field select:focus {
  border-color: #4476e4 !important;
  outline: 2px solid rgba(68, 118, 228, 0.25) !important;
}

.modal-scrim .modal.add-dataset-modal .radio-row {
  display: flex !important;
  gap: 10px !important;
}

.modal-scrim .modal.add-dataset-modal .radio-row label {
  flex: 1 !important;
  border: 1px solid #d1dbe7 !important;
  border-radius: 5px !important;
  padding: 10px 12px !important;
  font-weight: 400 !important;
  cursor: pointer !important;
  min-height: 46px !important;
  display: flex !important;
  align-items: center !important;
  font-size: 13.5px !important;
  color: #14243d !important;
  background: #ffffff !important;
  box-sizing: border-box !important;
  transition: border-color .15s ease, background-color .15s ease !important;
}

.modal-scrim .modal.add-dataset-modal .radio-row label:has(input:checked) {
  border-color: #4476e4 !important;
  background: #eef3ff !important;
  color: #14243d !important;
}

.modal-scrim .modal.add-dataset-modal .radio-row label input[type="radio"] {
  width: 16px !important;
  height: 16px !important;
  flex: none !important;
  margin: 0 8px 0 0 !important;
  cursor: pointer !important;
  accent-color: #2458d5 !important;
}

.modal-scrim .modal.add-dataset-modal .radio-row label:has(input:disabled) {
  opacity: .48 !important;
  cursor: not-allowed !important;
}

.modal-scrim .modal.add-dataset-modal .dialog-path {
  display: flex !important;
  gap: 9px !important;
  align-items: center !important;
}

.modal-scrim .modal.add-dataset-modal .dialog-path input {
  flex: 1 !important;
  min-width: 0 !important;
}

.modal-scrim .modal.add-dataset-modal .dialog-path button.iad-button {
  flex: none !important;
}

.modal-scrim .modal.add-dataset-modal .modal-hint {
  font-size: 12px !important;
  color: #5f6f86 !important;
  margin: -4px 0 18px !important;
  line-height: 1.5 !important;
}

.modal-scrim .modal.add-dataset-modal .modal-actions {
  display: flex !important;
  justify-content: flex-end !important;
  align-items: center !important;
  gap: 10px !important;
  margin-top: 24px !important;
  padding: 0 !important;
  border-top: none !important;
  background: transparent !important;
  height: auto !important;
  min-height: 0 !important;
}

[data-ds-dark-theme] .modal-scrim .modal.add-dataset-modal {
  background: #1e293b !important;
  border-color: #334155 !important;
  color: #f1f5f9 !important;
}
[data-ds-dark-theme] .modal-scrim .modal.add-dataset-modal .modal-top {
  border-bottom-color: #334155 !important;
}
[data-ds-dark-theme] .modal-scrim .modal.add-dataset-modal .modal-top h2,
[data-ds-dark-theme] .modal-scrim .modal.add-dataset-modal .modal-field > label {
  color: #f1f5f9 !important;
}
[data-ds-dark-theme] .modal-scrim .modal.add-dataset-modal .modal-field input,
[data-ds-dark-theme] .modal-scrim .modal.add-dataset-modal .modal-field select {
  background: #0f172a !important;
  border-color: #475569 !important;
  color: #f1f5f9 !important;
}
[data-ds-dark-theme] .modal-scrim .modal.add-dataset-modal .radio-row label {
  background: #0f172a !important;
  border-color: #334155 !important;
  color: #cbd5e1 !important;
}
[data-ds-dark-theme] .modal-scrim .modal.add-dataset-modal .radio-row label:has(input:checked) {
  background: #1e3a5f !important;
  border-color: #3b82f6 !important;
  color: #ffffff !important;
}
[data-ds-dark-theme] .modal-scrim .modal.add-dataset-modal .modal-hint {
  color: #94a3b8 !important;
}
`;
