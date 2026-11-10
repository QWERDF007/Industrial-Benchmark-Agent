import React from "react";
import { type EvidenceReference } from "../direction-evidence.js";
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
    versionId: string;
    datasetId: string;
    title: string;
    applies: string;
    brief: string;
    rationale: string;
    limitations: string[];
    evidences: DirectionEvidenceItem[];
    references: Map<string, EvidenceReference>;
}
export interface DirectionDetailDialogProps {
    direction: DirectionItem;
    onOpenFullscreen: (ref: string) => void;
    onClose: () => void;
}
/**
 * Reusable modal dialog for displaying exploration direction details,
 * comparative rationale with linked evidence chips, limitations, and visual evidence cards.
 */
export declare function DirectionDetailDialog({ direction: dir, onOpenFullscreen, onClose, }: DirectionDetailDialogProps): React.JSX.Element;
//# sourceMappingURL=DirectionDetailDialog.d.ts.map