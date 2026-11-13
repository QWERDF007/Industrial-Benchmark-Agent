import type { EChartsOption } from 'echarts';
import type { ChartFormat, ChartSpec, ChartTheme } from './types.js';
export declare function chartNumber(value: number, format?: ChartFormat): string;
export declare function chartReadings(spec: ChartSpec): string[];
export declare function chartOptions(spec: ChartSpec, theme: ChartTheme): EChartsOption;
//# sourceMappingURL=options.d.ts.map