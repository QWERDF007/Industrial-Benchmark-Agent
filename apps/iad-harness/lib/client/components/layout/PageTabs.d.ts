import React from 'react';
export declare function PageTabs<T extends string>({ label, items, value, onChange, children }: {
    label: string;
    items: readonly {
        id: T;
        label: string;
    }[];
    value: T;
    onChange(value: T): void;
    children: React.ReactNode;
}): React.JSX.Element;
//# sourceMappingURL=PageTabs.d.ts.map