import React from "react";
import type { KnowledgeCheck } from "../../shared/contracts.js";
export declare function KnowledgeRevision({ versionId, check, busy, error, onSubmit, onClose }: {
    versionId: string;
    check: KnowledgeCheck;
    busy: boolean;
    error: string;
    onSubmit(instruction: string): void;
    onClose(): void;
}): React.JSX.Element;
//# sourceMappingURL=KnowledgeRevision.d.ts.map