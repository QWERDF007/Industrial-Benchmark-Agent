import React from "react";
import type { Annotation, AuditAnalysis, SampleIdentity } from "../../shared/contracts.js";
export type ImageBoxAnnotation = Pick<Annotation, 'raw_label'> & Partial<Pick<Annotation, 'annotation_id' | 'bbox' | 'polygon' | 'annotation_type' | 'geometry_status' | 'mask_sha256'>>;
export type AnnotationLayerSource = {
    kind: "sample";
    annotations: Annotation[];
    sample: Pick<SampleIdentity, "task_id" | "sample_id" | "width" | "height">;
    maskUrls?: Record<string, string>;
} | {
    kind: "audit";
    analysis: AuditAnalysis;
    suggestionId: string;
} | {
    kind: 'boxes';
    annotations: ImageBoxAnnotation[];
    width: number;
    height: number;
};
export declare function AnnotationLayer({ source, viewport }: {
    source: AnnotationLayerSource;
    viewport?: readonly number[];
}): React.JSX.Element;
//# sourceMappingURL=AnnotationLayer.d.ts.map