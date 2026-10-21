import React from "react";
import type { Dataset, KnowledgeGroup, KnowledgeSnapshot, KnowledgeVersion } from "../../shared/contracts.js";
export declare function KnowledgeSetup({ dataset, kind, versions, normalVersions, busy, onStart, onContinuous }: {
    dataset: Dataset;
    kind: KnowledgeSnapshot["kind"];
    versions: KnowledgeVersion[];
    normalVersions: KnowledgeVersion[];
    busy: boolean;
    onStart(input: KnowledgeGroup): void;
    onContinuous(): void;
}): React.JSX.Element;
//# sourceMappingURL=KnowledgeSetup.d.ts.map