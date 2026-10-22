import React from "react";
import type { KnowledgeEvidence } from "../../shared/domain.generated.js";
import type { ImageSource } from "./ImageViewer.js";
export declare function KnowledgeEvidenceGallery({ versionId, items, onOpen }: {
    versionId: string;
    items: readonly KnowledgeEvidence[];
    onOpen(image: ImageSource): void;
}): React.JSX.Element;
//# sourceMappingURL=KnowledgeEvidenceGallery.d.ts.map