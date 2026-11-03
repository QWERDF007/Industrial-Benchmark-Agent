import React from 'react';
export declare const IBA_JOBS_PAGE_SIZE = 8;
export interface IbaJobPagerProps {
    total: number;
    page: number;
    onPage: (page: number) => void;
    label: string;
    pageSize?: number;
    dataActionAttr?: string;
    dataActionName?: string;
}
export declare function IbaJobPager({ total, page, onPage, label, pageSize, dataActionAttr, dataActionName }: IbaJobPagerProps): React.JSX.Element | null;
//# sourceMappingURL=IbaJobPager.d.ts.map