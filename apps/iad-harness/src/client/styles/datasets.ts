export const datasetsStyles = `
.iad-workbench[data-page="industrial-datasets"]{padding-top:28px}
.iad-workbench[data-page="industrial-datasets"]>.iad-header{max-width:1160px}
.iad-settings{display:grid;gap:28px;min-width:0;max-width:1160px}
.iad-settings>section{min-width:0}
.iad-dataset-list>.iad-table-scroll,.iad-dataset-detail>.iad-tab-panel{background:var(--iad-surface);border:1px solid var(--iad-panel-border);border-radius:var(--iad-radius)}
.iad-dataset-list .iad-section-header input{width:240px;max-width:100%}
.iad-dataset-list h2>.iad-muted{margin-left:4px;font-size:.8125rem;font-weight:400}
.iad-dataset-list .iad-resource-table{min-width:700px;table-layout:fixed;font-size:.8125rem}
.iad-dataset-list th,.iad-dataset-list td{padding:10px 16px}
.iad-dataset-list th{height:44px;font-size:.75rem}
.iad-dataset-list td{height:60px}
.iad-dataset-list tbody tr:last-child td{border-bottom:0}
.iad-dataset-list tbody tr:not([data-selected=true]):hover{background:var(--iad-surface-muted)}
.iad-dataset-list td:last-child>.iad-row{flex-wrap:nowrap;gap:4px}
.iad-dataset-list .iad-name-trigger{font-size:inherit}
.iad-dataset-detail>.iad-section-header{margin-bottom:12px}
.iad-dataset-detail h2{overflow-wrap:anywhere}
.iad-dataset-detail>.iad-tab-panel{padding:24px}
.iad-dataset-detail .iad-section-layout{grid-template-columns:180px minmax(0,1fr);gap:32px;padding:0;border:0}
.iad-dataset-detail .iad-section-layout .iad-field{margin:0 0 16px}
.iad-dataset-detail .iad-section-layout h3{margin:0}
.iad-dataset-detail .iad-section-layout h3+.iad-muted{margin-top:8px}
.iad-dataset-detail .iad-rule{margin-top:20px}
.iad-dataset-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:20px}
.iad-dataset-footer .iad-form-actions{margin:0;flex:none}
.iad-dataset-footer [data-dirty=true]{color:var(--iad-warning)}
.iad-dataset-basic h3{margin:0 0 24px}
.iad-workbench .iad-dataset-basic dl{grid-template-columns:150px minmax(0,1fr);gap:14px 28px;align-items:center;font-size:.8125rem;margin:0}
.iad-dataset-basic dd{min-height:40px;display:flex;align-items:center;gap:12px}
.iad-dataset-basic dd:last-child{flex-wrap:wrap}
.iad-workbench .iad-dataset-basic dd>button{background:transparent;border-color:transparent;color:var(--iad-primary)}
.iad-dataset-basic dd code{overflow-wrap:anywhere;white-space:normal;overflow:visible;background:var(--iad-surface-muted);color:var(--iad-muted);padding:8px 10px;border-radius:var(--iad-radius)}
.iad-dataset-name{min-width:0;flex:1;margin:0}
.iad-workbench .iad-name-trigger{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-width:0;padding:4px 0;background:transparent;border-color:transparent;text-align:left;font-weight:600;min-height:40px}
.iad-name-trigger span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.iad-name-trigger svg{flex-shrink:0;color:var(--iad-muted)}
.iad-dataset-name input{width:100%}
.iad-row-menu summary{cursor:pointer;display:flex;align-items:center;gap:8px;min-height:40px;padding:8px}
.iad-row-menu .iad-floating-menu-panel{min-width:64px}
.iad-preview-table{width:100%;min-width:480px;border-collapse:collapse;table-layout:fixed;text-align:left;font-size:.8125rem}
.iad-preview-table th,.iad-preview-table td{padding:10px 16px;height:60px;border-bottom:1px solid var(--iad-border)}
.iad-preview-table th{height:44px;background:var(--iad-surface-muted);color:var(--iad-muted);font-weight:500;font-size:.75rem}
.iad-preview-table th:nth-child(1){width:44%}
.iad-preview-table th:nth-child(2){width:18%}
.iad-preview-table th:nth-child(3){width:38%}
.iad-preview-table tbody tr:last-child td{border-bottom:0}
.iad-preview-table td:first-child{overflow-wrap:anywhere}
.iad-preview-table .iad-number{text-align:right;font-variant-numeric:tabular-nums}
.iad-preview-table select{width:150px;max-width:100%;min-height:40px}
.iad-folder-rules>.iad-muted{margin:12px 0}
.iad-folder-rules>.iad-muted strong{font-weight:600;color:var(--iad-text)}
.iad-directory{min-width:0;margin:0;border:1px solid var(--iad-border);background:var(--iad-surface-muted);padding:14px;border-radius:var(--iad-radius)}
.iad-directory code{overflow-wrap:anywhere}
.iad-directory-list{display:flex;flex-direction:column;max-height:230px;overflow:auto;gap:5px;margin-top:10px}
.iad-detail-dialog.iad-dataset-dialog{width:min(740px,calc(100% - 32px));padding:24px;border-color:var(--iad-border);border-radius:8px;box-shadow:0 20px 60px var(--iad-dialog-shadow)}
.iad-dataset-dialog>.iad-dialog-header{padding:0 0 16px;top:-24px;border-bottom:1px solid var(--iad-border);margin-bottom:20px}
.iad-dataset-import{margin:auto}
.iad-dataset-import>.iad-field:first-child{margin-top:0}
.iad-dataset-import [role=radiogroup]{flex-wrap:nowrap;gap:8px}
.iad-dataset-import [role=radiogroup]>label{display:flex;align-items:center;gap:8px;flex:1;padding:12px 16px;border:1px solid var(--iad-border);border-radius:var(--iad-radius);cursor:pointer}
.iad-dataset-import [role=radiogroup] input{flex:none}
.iad-dataset-import [role=radiogroup]>label:has(:checked){border-color:var(--iad-primary);background:var(--iad-hover);color:var(--iad-primary)}
@container workbench (max-width:980px){.iad-dataset-detail .iad-section-layout{grid-template-columns:150px minmax(0,1fr);gap:20px}}


`;
