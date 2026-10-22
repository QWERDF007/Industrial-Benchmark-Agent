import React from "react";
import type { Dataset, Filters } from "../../shared/contracts.js";
export declare function SampleFilters({ dataset, filters, onFilters, busy, defaults }: {
    dataset: Dataset;
    filters: Filters;
    onFilters(filters: Filters): void;
    busy?: boolean;
    defaults?: Filters;
}): React.JSX.Element;
//# sourceMappingURL=SampleFilters.d.ts.map