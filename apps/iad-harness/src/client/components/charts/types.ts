import type {AuditBoxSummary,AuditHeatmap,AuditHistogram} from '../../../shared/domain.generated.js';

export type ChartFormat='count'|'decimal'|'percent';
export type ChartTone='primary'|'success'|'warning'|'danger'|'muted';
export interface ChartDatum {id:string;label:string;value:number;tone?:ChartTone}
export interface ChartSeries {label:string;unit:string;tone?:ChartTone}
export interface HistogramSeries {id:string;label:string;data:Pick<AuditHistogram,'edges'|'counts'>}

export type ChartSpec=
  | {type:'bar';rows:readonly {id:string;label:string;values:readonly number[]}[];series:readonly ChartSeries[];maximum?:number}
  | {type:'donut';rows:readonly ChartDatum[];unit:string}
  | {type:'distribution';series:readonly HistogramSeries[];xLabel:string;unit:string;format?:ChartFormat}
  | {type:'heatmap';data:AuditHeatmap;xLabel:string;yLabel:string;format?:ChartFormat;reverseY?:boolean}
  | {type:'boxplot';rows:readonly {id:string;label:string;statistics:AuditBoxSummary}[];format?:ChartFormat};

export interface ChartTheme {
  ink:string;muted:string;grid:string;surface:string;font:string;palette:string[];
  tones:Record<ChartTone,string>;reducedMotion:boolean;
}
