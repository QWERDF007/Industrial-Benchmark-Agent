import React from "react";
import type { Annotation, AuditAnalysis, SampleIdentity } from "../../shared/contracts.js";
export type AnnotationLayerSource = {
    kind: "sample";
    annotations: Annotation[];
    sample: Pick<SampleIdentity, "task_id" | "sample_id" | "width" | "height">;
} | {
    kind: "audit";
    analysis: AuditAnalysis;
    suggestionId: string;
};
export declare function AnnotationLayer({ source }: {
    source: AnnotationLayerSource;
}): React.JSX.Element;
//# sourceMappingURL=AnnotationLayer.d.ts.map