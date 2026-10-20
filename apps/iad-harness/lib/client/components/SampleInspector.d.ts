import React from "react";
import type { Dataset } from "../../shared/contracts.js";
export declare function SampleInspector({ dataset, sampleId, mode, revision, onChanged }: {
    dataset: Dataset;
    sampleId: string;
    mode: "model" | "review";
    revision: number;
    onChanged(): void;
}): React.JSX.Element;
//# sourceMappingURL=SampleInspector.d.ts.map