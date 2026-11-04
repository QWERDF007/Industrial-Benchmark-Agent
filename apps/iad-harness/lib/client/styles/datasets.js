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

:is(.iad-workbench, [data-page="industrial-datasets"], [data-page="industrial-images"]) :is(
  button.expand,
  button.pencil,
  button.icon-button,
  button.copy-id,
  button.drawer-close,
  button.modal-x,
  button.iad-icon-button,
  button.iad-subtle-icon,
  #refresh,
  #reset
) {
  border: 0 !important;
  border-color: transparent !important;
  min-height: 0 !important;
  padding: 0 !important;
  box-shadow: none !important;
  outline: none !important;
  transition: background-color 140ms ease, color 140ms ease !important;
}

:is(.iad-workbench, [data-page="industrial-datasets"], [data-page="industrial-images"]) :is(
  button.expand,
  button.pencil,
  button.icon-button,
  button.copy-id,
  button.drawer-close,
  button.modal-x,
  button.iad-icon-button,
  button.iad-subtle-icon,
  #refresh,
  #reset
):not(:hover) {
  background: transparent !important;
  background-color: transparent !important;
}

:is(.iad-workbench, [data-page="industrial-datasets"]) :is(
  button.expand,
  button.pencil,
  button.icon-button,
  button.copy-id,
  button.drawer-close,
  button.modal-x,
  button.iad-icon-button
):hover {
  background: var(--hover, #eaf0fe) !important;
  background-color: var(--hover, #eaf0fe) !important;
  cursor: pointer !important;
}

:is(.iad-workbench, [data-page="industrial-datasets"]) button.expand:hover {
  background: #dfe8fc !important;
  background-color: #dfe8fc !important;
  color: #1e4bb8 !important;
}

:is(.iad-workbench, [data-page="industrial-datasets"]) button.pencil:hover {
  background: #e4eafb !important;
  background-color: #e4eafb !important;
  color: #2458d5 !important;
}

:is(.iad-workbench, [data-page="industrial-datasets"]) button.plus-action:hover {
  background: #dde9ff !important;
  background-color: #dde9ff !important;
  color: #194bad !important;
}

:is(.iad-workbench, [data-page="industrial-datasets"]) button[data-delete]:hover {
  background: #fee4e2 !important;
  background-color: #fee4e2 !important;
  color: #d92d20 !important;
}

:is(.iad-workbench, [data-page="industrial-datasets"]) button.copy-id:hover {
  background: #eaf0ff !important;
  background-color: #eaf0ff !important;
  color: var(--primary, #2458d5) !important;
}

:is(.iad-workbench, [data-page="industrial-datasets"]) :is(button.drawer-close, button.modal-x):hover {
  background: var(--hover, #eaf0fe) !important;
  background-color: var(--hover, #eaf0fe) !important;
  color: #182230 !important;
}

[data-ds-dark-theme] :is(.iad-workbench, [data-page="industrial-datasets"]) :is(
  button.expand,
  button.pencil,
  button.icon-button,
  button.copy-id,
  button.drawer-close,
  button.modal-x,
  button.iad-icon-button
):hover {
  background: rgba(255, 255, 255, 0.12) !important;
  background-color: rgba(255, 255, 255, 0.12) !important;
}

[data-ds-dark-theme] :is(.iad-workbench, [data-page="industrial-datasets"]) button.expand:hover,
[data-ds-dark-theme] :is(.iad-workbench, [data-page="industrial-datasets"]) button.pencil:hover,
[data-ds-dark-theme] :is(.iad-workbench, [data-page="industrial-datasets"]) button.plus-action:hover,
[data-ds-dark-theme] :is(.iad-workbench, [data-page="industrial-datasets"]) button.copy-id:hover {
  color: var(--primary, #a7c5ff) !important;
}

[data-ds-dark-theme] :is(.iad-workbench, [data-page="industrial-datasets"]) button[data-delete]:hover {
  background: rgba(239, 68, 68, 0.22) !important;
  background-color: rgba(239, 68, 68, 0.22) !important;
  color: #fca5a5 !important;
}

[data-ds-dark-theme] :is(.iad-workbench, [data-page="industrial-datasets"]) :is(button.drawer-close, button.modal-x):hover {
  color: #fff !important;
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

.expand {
  height: 25px !important;
  width: 25px !important;
  padding: 4px !important;
  border: 0 !important;
  border-color: transparent !important;
  background: transparent !important;
  color: #5d6d84;
  border-radius: 4px;
  flex: none;
  display: grid;
  place-items: center;
  cursor: pointer;
  min-height: 0 !important;
}

.expand:hover { background: #dfe8fc !important; }
.expand svg { width: 16px; height: 16px; transition: transform .15s; }
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
  display: grid;
  flex: 0 0 29px;
  height: 29px !important;
  width: 29px !important;
  min-height: 0 !important;
  border: 0 !important;
  border-color: transparent !important;
  background: transparent !important;
  color: #7888a0;
  place-items: center;
  border-radius: 5px;
  cursor: pointer;
  padding: 0 !important;
}

.parent-row .pencil { color: #8291a7; }
.pencil:hover, .icon-button:hover { background: #e4eafb !important; color: #2458d5; }
.pencil svg, .icon-button svg { height: 16px; width: 16px; }

.actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
}

.icon-button {
  height: 31px !important;
  width: 31px !important;
  min-height: 0 !important;
  border: 0 !important;
  border-color: transparent !important;
  background: transparent !important;
  display: grid;
  place-items: center;
  border-radius: 5px;
  color: #7a8ba3;
  cursor: pointer;
  padding: 0 !important;
}

.plus-action { color: #3565bc; }
.plus-action:hover { background: #dde9ff !important; color: #194bad; }

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

.drawer-close {
  width: 34px !important;
  height: 34px !important;
  flex: none;
  background: transparent !important;
  color: var(--sub) !important;
  border: 0 !important;
  border-color: transparent !important;
  border-radius: 5px !important;
  font-size: 25px !important;
  line-height: 30px !important;
  cursor: pointer;
  padding: 0 !important;
  min-height: 0 !important;
  display: grid;
  place-items: center;
}

.drawer-close:hover { background: var(--hover) !important; }

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

.dataset-drawer .field .control button { padding-left: 12px; padding-right: 12px; flex: none; }

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
  flex: none;
  background: transparent !important;
  color: var(--sub) !important;
  border: 0 !important;
  border-color: transparent !important;
  border-radius: 5px !important;
  display: grid;
  place-items: center;
  width: 30px !important;
  height: 30px !important;
  min-height: 0 !important;
  padding: 0 !important;
  cursor: pointer;
}

.identifier-value .copy-id:hover {
  background: #eaf0ff !important;
  color: var(--primary) !important;
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
.modal-x {
  border: 0 !important;
  border-color: transparent !important;
  background: transparent !important;
  color: var(--sub) !important;
  font-size: 24px !important;
  line-height: 1 !important;
  cursor: pointer;
  padding: 0 !important;
  min-height: 0 !important;
  width: 32px !important;
  height: 32px !important;
  border-radius: 5px !important;
  display: grid;
  place-items: center;
}

.modal-x:hover {
  background: var(--hover) !important;
}

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
:is(.iad-workbench, .iad-detail-dialog, .iad-floating-menu-panel, [data-page="industrial-datasets"]) button:is(.primary, .iad-primary) {
  background: var(--iad-primary-fill, var(--primary, #275bcc));
  border: 1px solid var(--iad-primary-fill, var(--primary, #275bcc));
  color: var(--iad-on-primary, #fff);
  padding: 8px 12px;
  border-radius: var(--iad-radius, 6px);
  font-weight: 500;
  font-size: 14px;
  min-height: var(--iad-control-height, 40px);
  cursor: pointer;
}
:is(.iad-workbench, .iad-detail-dialog, .iad-floating-menu-panel, [data-page="industrial-datasets"]) button:is(.primary, .iad-primary):hover:not(:disabled) {
  background: color-mix(in srgb, var(--iad-primary-fill, #275bcc) 88%, #000) !important;
  border-color: color-mix(in srgb, var(--iad-primary-fill, #275bcc) 88%, #000) !important;
  color: var(--iad-on-primary, #fff) !important;
}
:is(.iad-workbench, .iad-detail-dialog, .iad-floating-menu-panel, [data-page="industrial-datasets"]) button:is(.primary, .iad-primary):disabled {
  opacity: .5;
  cursor: not-allowed;
}

button.secondary {
  min-height: 35px;
  background: var(--iad-surface, #fff);
  border: 1px solid #aab9cd;
  border-radius: 5px;
  padding: 8px 12px;
  font-size: 13px;
  color: inherit;
  cursor: pointer;
}
button.secondary:hover { background: var(--hover); }
button.secondary:disabled { opacity: .5; cursor: not-allowed; }

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
`;
