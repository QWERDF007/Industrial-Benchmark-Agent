import React from "react";
export declare function ReviewRecords({ datasetId, page, search, selected, revision, onPage, onSearch, onSelect, onQueue, detail }: {
    datasetId: string;
    page: number;
    search: string;
    selected: string;
    revision: number;
    onPage(page: number): void;
    onSearch(search: string): void;
    onSelect(sampleId: string): void;
    onQueue(): void;
    detail: React.ReactNode;
}): React.JSX.Element;
//# sourceMappingURL=ReviewRecords.d.ts.map