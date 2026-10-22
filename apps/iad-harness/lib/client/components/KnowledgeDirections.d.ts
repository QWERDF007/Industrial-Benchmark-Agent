import React from "react";
export interface DirectionProposal {
    id: string;
    datasetId: string;
    kind: "normal" | "defect";
    title: string;
    instruction: string;
}
export declare function KnowledgeDirections({ datasetId, kind, proposal, onPending, onProposalUsed }: {
    datasetId: string;
    kind: "normal" | "defect";
    proposal?: DirectionProposal;
    onPending(value: boolean): void;
    onProposalUsed(): void;
}): React.JSX.Element;
//# sourceMappingURL=KnowledgeDirections.d.ts.map