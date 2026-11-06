import type { Annotation, Sample } from '../shared/domain.generated.js';
import type { Dataset } from '../shared/contracts.js';
import type { AnnotationLayerSource } from './components/AnnotationLayer.js';
export type ImageQualityLabel = 'OK' | 'NG';
export interface DatasetImageAnnotations {
    annotationLayer?: AnnotationLayerSource | null;
    qualityLabel?: ImageQualityLabel;
}
export declare function datasetImageAnnotations(format: Dataset['format'] | undefined, sample: Pick<Sample, 'width' | 'height' | 'quality_status'>, annotations: Annotation[]): DatasetImageAnnotations;
//# sourceMappingURL=dataset-image-annotations.d.ts.map