import React from "react";
export declare const pageSize = 24;
export declare const IBA_JOBS_PAGE_SIZE = 8;
export declare function Pagination({ total, page, unit, onPage, size, label, id, availablePages, hideSinglePage }: {
    total: number;
    page: number;
    unit?: string;
    onPage(page: number): void;
    size?: number;
    label?: string;
    id?: string;
    availablePages?: number;
    hideSinglePage?: boolean;
}): React.JSX.Element | null;
//# sourceMappingURL=Pagination.d.ts.map