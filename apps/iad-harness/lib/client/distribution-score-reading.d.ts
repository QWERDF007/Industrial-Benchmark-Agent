import type { AuditRunReport, QualityScoreItem } from '../shared/domain.generated.js';
export declare function consistencyScoreReading(item: QualityScoreItem): string;
export declare function distributionScoreReading(item: QualityScoreItem): string;
export declare function distributionScoreDetails(item: QualityScoreItem, report: Pick<AuditRunReport, 'dataset_names' | 'data_distribution'>): string[];
//# sourceMappingURL=distribution-score-reading.d.ts.map