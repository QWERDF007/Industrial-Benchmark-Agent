import React from "react";
import type { Dataset } from "../../shared/contracts.js";
export declare function ExplorationSources({ dataset, kind, count, images, disabled, onCount, onImages, onSelecting }: {
    dataset: Dataset;
    kind: "normal" | "defect";
    count: string;
    images: string[];
    disabled: boolean;
    onCount(value: string): void;
    onImages(value: string[]): void;
    onSelecting(value: boolean): void;
}): React.JSX.Element;
//# sourceMappingURL=ExplorationSources.d.ts.map