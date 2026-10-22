export const knowledgeStyles = `.iad-knowledge-split {display:grid;grid-template-columns:280px minmax(0,1fr);gap:24px;align-items:start;}
.iad-check-list {display:grid;gap:8px;}.iad-check-list>button {display:grid;gap:4px;text-align:left;}.iad-check-list>button[aria-pressed=true] {background:var(--iad-hover);border-color:var(--iad-primary);}.iad-check-list span {color:var(--iad-muted);font-size:12px;}
.iad-check-detail {min-width:0;}.iad-back-to-checks {display:none;}.iad-freshness {margin:16px 0;}.iad-freshness>summary {cursor:pointer;min-height:40px;padding:8px 0;}
@container workbench (min-width:960px) and (max-width:1199px) {.iad-knowledge-split {grid-template-columns:240px minmax(0,1fr);}}
@container workbench (max-width:959px) {.iad-knowledge-split {grid-template-columns:minmax(0,1fr);}.iad-knowledge-split[data-detail=true]>.iad-check-list,.iad-knowledge-split[data-detail=false]>.iad-check-detail {display:none;}.iad-back-to-checks {display:block;margin-bottom:16px;}}

`;
