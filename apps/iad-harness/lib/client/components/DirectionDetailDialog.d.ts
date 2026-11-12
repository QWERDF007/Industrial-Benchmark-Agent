import type { AnalysisReadSource } from '../analysis-results.js';
import React from "react";
export interface DirectionEvidenceItem {
    evidenceId: string;
    sampleId: string;
    ref: string;
    label: string;
    kind: "normal" | "defect" | "unknown";
    url: string;
    fullUrl: string;
    filename: string;
}
export interface DirectionItem {
    id: string;
    source: AnalysisReadSource;
    datasetId: string;
    title: string;
    applies: string;
    brief: string;
    rationale: string;
    limitations: string[];
    evidences: DirectionEvidenceItem[];
}
export interface DirectionDetailDialogProps {
    direction: DirectionItem;
    onOpenFullscreen: (ref: string) => void;
    onClose: () => void;
}
export declare function DirectionDetailDialog({ direction: dir, onOpenFullscreen, onClose, }: DirectionDetailDialogProps): React.JSX.Element;
//# sourceMappingURL=DirectionDetailDialog.d.ts.map