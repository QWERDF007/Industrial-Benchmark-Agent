import type { AnalysisDirection, AnalysisResultView } from '../shared/domain.generated.js';
export declare function directionEvidence(snapshot: AnalysisResultView, direction: AnalysisDirection): {
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
    counters: {
        normal: number;
        defect: number;
        unknown: number;
    };
};
//# sourceMappingURL=direction-evidence.d.ts.map