import React from "react";
export interface DirectionEvidenceItem {
    evidenceId: string;
    sampleId: string;
    ref: string;
    label: string;
    kind: "normal" | "defect";
    url: string;
    fullUrl: string;
    filename: string;
}
export interface DirectionItem {
    id: string;
    title: string;
    applies: string;
    brief: string;
    rationale?: string;
    evidenceIds?: string[];
    limit: string;
    limitations?: string[];
    evidences?: DirectionEvidenceItem[];
}
export interface DirectionDetailDialogProps {
    direction: DirectionItem;
    evidence: {
        normals: DirectionEvidenceItem[];
        defects: DirectionEvidenceItem[];
        all: DirectionEvidenceItem[];
    };
    highlightRef: string | null;
    onHighlightRef: (ref: string | null) => void;
    onChipFocus: (ref: string) => void;
    onOpenFullscreen: (ref: string) => void;
    onClose: () => void;
}
/**
 * Reusable modal dialog for displaying exploration direction details,
 * comparative rationale with linked evidence chips, limitations, and visual evidence cards.
 */
export declare function DirectionDetailDialog({ direction: dir, evidence, highlightRef, onHighlightRef, onChipFocus, onOpenFullscreen, onClose, }: DirectionDetailDialogProps): React.JSX.Element;
//# sourceMappingURL=DirectionDetailDialog.d.ts.map