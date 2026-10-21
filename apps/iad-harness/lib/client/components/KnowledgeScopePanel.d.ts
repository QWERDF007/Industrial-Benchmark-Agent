import React from "react";
import type { KnowledgeScopeSnapshot } from "../../shared/domain.generated.js";
export declare function KnowledgeScopePanel({ scopeRunId, datasetId, kind, revision, onScope }: {
    scopeRunId: string;
    datasetId: string;
    kind: "normal" | "defect";
    revision: number;
    onScope(scope: KnowledgeScopeSnapshot): void;
}): React.JSX.Element;
//# sourceMappingURL=KnowledgeScopePanel.d.ts.map