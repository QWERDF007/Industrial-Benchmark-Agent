import React from "react";
import type { Dataset, KnowledgeGroup, KnowledgeSnapshot, KnowledgeVersion } from "../../shared/contracts.js";
import { type DirectionProposal } from "./KnowledgeDirections.js";
export declare function KnowledgeSetup({ dataset, kind, versions, normalVersions, busy, onStart, onContinuous, directionProposal, onDirectionProposalUsed }: {
    dataset: Dataset;
    kind: KnowledgeSnapshot["kind"];
    versions: KnowledgeVersion[];
    normalVersions: KnowledgeVersion[];
    busy: boolean;
    onStart(input: KnowledgeGroup): void;
    onContinuous(): void;
    directionProposal?: DirectionProposal;
    onDirectionProposalUsed(): void;
}): React.JSX.Element;
//# sourceMappingURL=KnowledgeSetup.d.ts.map