import type {AuditBoxSummary,AuditHistogram,DistributionHeatmap} from '../../../shared/domain.generated.js';

export type ChartFormat='count'|'decimal'|'percent'|'score';
export type ChartTone='primary'|'success'|'warning'|'danger'|'muted';
export interface ChartDatum {id:string;label:string;value:number;tone?:ChartTone;details?:string}
export interface ChartSeries {label:string;unit:string;tone?:ChartTone}
export interface HistogramSeries {id:string;label:string;data:Pick<AuditHistogram,'edges'|'counts'>}
export interface BoxplotSeries {id:string;label:string;rows:readonly {id:string;label:string;statistics:AuditBoxSummary}[]}

export type ChartSpec=
  | {type:'bar';rows:readonly {id:string;label:string;values:readonly (number|null)[];details?:string;tooltip?:string}[];series:readonly ChartSeries[];maximum?:number;legendSelectable?:boolean;format?:ChartFormat;labelRotation?:number}
  | {type:'donut';rows:readonly ChartDatum[];unit:string;format?:ChartFormat;center?:{label:string;value:number|null}}
  | {type:'distribution';series:readonly HistogramSeries[];xLabel:string;unit:string;format?:ChartFormat}
  | {type:'heatmap';data:DistributionHeatmap;xLabel:string;yLabel:string;format?:ChartFormat;reverseY?:boolean}
  | {type:'boxplot';series:readonly BoxplotSeries[];format?:ChartFormat};

export interface ChartTheme {
  ink:string;muted:string;grid:string;surface:string;font:string;palette:string[];
  tones:Record<ChartTone,string>;reducedMotion:boolean;
}
