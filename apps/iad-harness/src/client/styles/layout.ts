export const layoutStyles = `
:root{
 --iad-layout-inset:32px;
 --iad-layout-top:25px;
 --iad-layout-bottom:20px;
 --iad-layout-gap:20px;
 --iad-layout-inline-gap:16px;
 --iad-layout-title-height:42px;
 --iad-layout-label-height:19px;
 --iad-layout-label-gap:6px;
 --iad-layout-section-height:70px;
 --iad-layout-section-inset:20px;
 --iad-job-head-height:46px;
 --iad-job-row-height:60px;
 --iad-job-scroll-height:346px;
 --iad-job-search-width:200px;
 --iad-job-status-width:155px;
}
.iad-job-table-scroll{min-width:0;min-height:0;max-height:var(--iad-job-scroll-height);overflow:auto;scrollbar-gutter:stable}
.iad-job-table-grid thead tr,.iad-job-table-grid thead th{height:var(--iad-job-head-height)}
.iad-job-table-grid tbody tr,.iad-job-table-grid tbody td{height:var(--iad-job-row-height)}
.iad-job-table-grid thead th{padding:10px 18px;vertical-align:middle;position:sticky;top:0;z-index:2;background:var(--iad-surface-muted)}
.iad-job-table-grid tbody td{padding:8px 18px;vertical-align:middle}
.iad-section-heading .iad-section-actions input{width:var(--iad-job-search-width);height:var(--iad-control-height)}
.iad-section-heading .iad-section-actions select{width:var(--iad-job-status-width);height:var(--iad-control-height)}
@media(max-width:780px){:root{--iad-layout-inset:20px}}
@media(max-width:580px){:root{--iad-layout-inset:16px;--iad-layout-section-inset:16px}}
`;
