import React from "react";
import type { Dataset, KnowledgeSourcePage } from "../../shared/contracts.js";
/** Presentation only: each caller owns candidate qualification, scope and selection. */
export declare function SourcePicker({ dataset, label, sources, selected, target, disabled, page, onPage, onChange, search, onSearch, onChoose, choosing, canChoose }: {
    dataset: Dataset;
    label: string;
    sources: KnowledgeSourcePage | null;
    selected: string[];
    target: number | string;
    disabled: boolean;
    page: number;
    onPage(page: number): void;
    onChange(ids: string[]): void;
    search: string;
    onSearch(value: string): void;
    onChoose?(): void;
    choosing?: boolean;
    canChoose?: boolean;
}): React.JSX.Element;
//# sourceMappingURL=SourcePicker.d.ts.map