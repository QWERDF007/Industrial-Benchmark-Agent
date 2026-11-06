export const datasetsStyles = `
:root, [data-page="industrial-datasets"] {
  --drawer-width: min(560px, 100vw);
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
  position: relative;
  min-height: 100%;
}

.iad-dataset-page-wrap {
  width: 100%;
  min-width: 0;
  padding-right: 0 !important;
}

.iad-dataset-page-wrap.has-drawer {
  padding-right: 0 !important;
}

.iad-dataset-form{--iba-dialog-edit-width:740px}
.iad-manager-search-wrap{display:flex;align-items:center;gap:8px;margin-bottom:14px}
.iad-manager-search-wrap .search{width:220px;height:var(--iad-control-height)}

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

.name-area>button[data-icon=edit]{margin-left:auto}
.name-area.child { padding-left: 33px; }
.expand[data-expanded="false"] svg { transform: rotate(-90deg); }

.name-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
  flex: 1;
  min-width: 0;
  max-width: 100%;
}

.parent-row .name-text { font-weight: 400; }
.dataset-table tr[data-selected="true"] .name-text { color: #153b8e; }
[data-ds-dark-theme] .dataset-table tr[data-selected="true"] .name-text { color: var(--primary); }


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
  min-width: 0;
  flex: 1;
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
  min-width: 110px;
}

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
}

`;
