export const knowledgeEntryStyles = `
.iad-knowledge-filters{display:flex;align-items:center;gap:10px}
.iad-knowledge-filters input{width:200px}.iad-knowledge-filters select{width:155px}
.iad-knowledge-entries{min-width:0}
.iad-knowledge-entries .knowledge-list{width:100%;overflow-x:auto}
.iad-knowledge-entries :is(.knowledge-head,.knowledge-row){display:grid;grid-template-columns:minmax(200px,28%) minmax(290px,1fr) 112px 90px;align-items:center;gap:14px;min-width:770px;padding:11px 20px}
.iad-knowledge-entries [data-selectable=true] :is(.knowledge-head,.knowledge-row){grid-template-columns:44px minmax(200px,28%) minmax(290px,1fr) 112px 90px;min-width:828px}
.iad-knowledge-entries .knowledge-head{min-height:46px;background:var(--iad-surface-muted);border-bottom:1px solid var(--iad-border);font-weight:600}
.iad-knowledge-entries .knowledge-head>span:last-child{text-align:right}
.iad-knowledge-entries .knowledge-row{min-height:74px;border-bottom:1px solid var(--iad-border);background:var(--iad-surface);color:var(--iad-text);cursor:pointer;font-size:var(--iad-font-size);line-height:1.55}
.iad-knowledge-entries .knowledge-row:hover{background:var(--iad-hover)}
.iad-knowledge-entries .knowledge-row[aria-selected=true]{background:var(--iad-surface-muted)}
.iad-knowledge-entries .knowledge-row:focus-visible{outline:2px solid var(--iad-primary);outline-offset:-2px}
.iad-knowledge-entries :is(.knowledge-entry-name,.knowledge-entry-description){min-width:0;overflow-wrap:anywhere;white-space:normal}
.iad-knowledge-entries .knowledge-entry-name{font-weight:600}
.iad-knowledge-entries .col-evidence-count{font-variant-numeric:tabular-nums}
.iad-knowledge-entries .col-action{display:flex;align-items:center;justify-content:flex-end;gap:7px}
.iad-knowledge-entries input[type=checkbox]{width:16px;height:16px;accent-color:var(--iad-primary);cursor:pointer}
.iad-knowledge-entries>.iad-pagination{padding:12px 20px;margin:0}
.iad-knowledge-version{display:flex;align-items:center;gap:10px;padding:12px 20px}
`;
