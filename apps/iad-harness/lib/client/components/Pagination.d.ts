import React from "react";
export declare const pageSize = 24;
export declare function Pagination({ total, page, unit, onPage, size }: {
    total: number;
    page: number;
    unit: string;
    onPage(page: number): void;
    size?: number;
}): React.JSX.Element | null;
//# sourceMappingURL=Pagination.d.ts.map