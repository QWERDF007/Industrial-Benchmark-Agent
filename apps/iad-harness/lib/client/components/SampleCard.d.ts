import React from "react";
import type { Sample } from "../../shared/contracts.js";
export declare function SampleCard({ sample, selected, onSelect, reference, selection }: {
    sample: Sample;
    selected: boolean;
    onSelect(): void;
    reference: boolean;
    selection?: {
        checked: boolean;
        disabled: boolean;
        onChange(checked: boolean): void;
    };
}): React.JSX.Element;
//# sourceMappingURL=SampleCard.d.ts.map