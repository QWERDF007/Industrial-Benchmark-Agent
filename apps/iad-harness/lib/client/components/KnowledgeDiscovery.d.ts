import React from "react";
import type { KnowledgeSnapshot } from "../../shared/contracts.js";
import type { DirectionProposal } from "./KnowledgeDirections.js";
export declare function KnowledgeDiscovery({ knowledge, evidence, onPropose }: {
    knowledge: KnowledgeSnapshot;
    evidence(ids: string[]): React.ReactNode;
    onPropose(proposal: DirectionProposal): void;
}): React.JSX.Element;
//# sourceMappingURL=KnowledgeDiscovery.d.ts.map