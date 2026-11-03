import React from "react";
import type { Dataset, DatasetGroup } from "../../shared/contracts.js";
export declare function DatasetManager({ datasets: propDatasets, groups: propGroups, selected, onChanged, }: {
    datasets: Dataset[];
    groups?: DatasetGroup[];
    selected?: Dataset;
    onChanged(id?: string): void;
}): React.JSX.Element;
//# sourceMappingURL=DatasetManager.d.ts.map