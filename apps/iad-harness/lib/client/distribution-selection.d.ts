import type { AuditDataDistribution, AuditDistributionSlice } from '../shared/domain.generated.js';
import type { BoxplotSeries, HistogramSeries } from './components/charts/types.js';
export type DistributionSelection = Omit<AuditDistributionSlice, 'dataset_id' | 'category' | 'datasets' | 'histograms' | 'summaries' | 'area_by_category'> & {
    distributions: Record<string, HistogramSeries[]>;
    area_by_category: BoxplotSeries[];
};
export declare function selectDistribution(data: AuditDataDistribution, selected: readonly string[], names: Record<string, string>): DistributionSelection | null;
//# sourceMappingURL=distribution-selection.d.ts.map