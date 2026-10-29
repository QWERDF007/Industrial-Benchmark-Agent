import type { AnnotationComparison, AnnotationDifference } from './domain.generated.js';
import type { RetrievalMember } from './contracts.js';
export declare const imageRelations: Record<RetrievalMember['relation'], string>;
export declare const differenceLabels: Record<AnnotationDifference['type'], string>;
export declare function annotationSummary(annotation: AnnotationComparison): string;
//# sourceMappingURL=consistency-presentation.d.ts.map