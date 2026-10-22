import React from "react";
import type { Dataset, Filters, Sample } from "../../shared/contracts.js";
export declare function SampleGrid({ dataset, filters, onFilters, items, total, page, onPage, selected, onSelect, loading, sourceManagement, layout, showFilters }: {
    layout?: "grid" | "queue";
    showFilters?: boolean;
    dataset: Dataset;
    filters: Filters;
    onFilters(filters: Filters): void;
    items: Sample[];
    total: number;
    page: number;
    onPage(page: number): void;
    selected: string;
    onSelect(id: string): void;
    loading: boolean;
    sourceManagement?: {
        active: boolean;
        onChanged(): void;
    };
}): React.JSX.Element;
//# sourceMappingURL=SampleGrid.d.ts.map