import React from 'react';
import type { AnalysisDirection, AnalysisPublicationView } from '../shared/domain.generated.js';
export interface EvidenceReference {
    id: string;
    label: string;
}
export declare function directionEvidence(snapshot: AnalysisPublicationView, direction: AnalysisDirection): {
    entries: ({
        id: string;
        evidence: null;
        label: string;
        ref: string;
        kind: 'unknown';
        title: string;
        filename: string;
    } | {
        id: string;
        evidence: import("../shared/domain.generated.js").AnalysisEvidenceView;
        title: string;
        filename: string;
        kind: "defect" | "normal" | "unknown";
        ref: string;
        label: string;
    })[];
    references: Map<string, EvidenceReference>;
    counters: {
        normal: number;
        defect: number;
        unknown: number;
    };
};
export declare function ReferencedText({ text, references, onReference, onPreview, className, highlightedId }: {
    text: string;
    references: Map<string, EvidenceReference>;
    onReference(id: string): void;
    onPreview(id: string, active: boolean): void;
    className?: string;
    highlightedId?: string | null;
}): React.JSX.Element;
//# sourceMappingURL=direction-evidence.d.ts.map