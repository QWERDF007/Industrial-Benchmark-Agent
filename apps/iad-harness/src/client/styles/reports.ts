import {reportChartStyles} from '../../shared/report-chart-styles.generated.js';

export const reportStyles=reportChartStyles+`
.iad-report-body{padding:24px;display:grid;gap:22px;min-width:0}
.iad-report-prompt textarea{width:100%;min-height:260px;margin-top:12px}
.iad-report-section{min-width:0;display:grid;gap:12px}
.iad-report-section p{white-space:pre-wrap;line-height:1.85;overflow-wrap:anywhere}
.iad-report-data{margin:0;display:grid;gap:9px}
.iad-report-data>div{display:grid;grid-template-columns:minmax(100px,1fr) minmax(65px,.5fr) minmax(0,3fr);gap:14px}
.iad-report-data dt,.iad-report-data dd{margin:0;overflow-wrap:anywhere}
.iad-dataset-report .iad-thumbnail-grid>div{min-width:0;display:grid;justify-items:start;gap:8px}
@media(max-width:1000px){.iad-report-data>div{grid-template-columns:minmax(0,1fr) 70px}.iad-report-data dd:last-child{grid-column:1/-1}}
`;
