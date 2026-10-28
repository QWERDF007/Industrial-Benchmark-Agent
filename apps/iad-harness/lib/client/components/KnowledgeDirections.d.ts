import React from "react";
export interface DirectionProposal {
    id: string;
    datasetId: string;
    kind: "normal" | "defect";
    title: string;
    instruction: string;
}
export interface MiningConfigurationState {
    reason: string;
    count: number;
    revision: string;
}
export declare function KnowledgeDirections({ datasetId, kind, proposal, onPending, onProposalUsed, onState, }: {
    datasetId: string;
    kind: "normal" | "defect";
    proposal?: DirectionProposal;
    onPending(value: boolean): void;
    onProposalUsed(): void;
    onState?(state: MiningConfigurationState): void;
}): React.JSX.Element;
//# sourceMappingURL=KnowledgeDirections.d.ts.map