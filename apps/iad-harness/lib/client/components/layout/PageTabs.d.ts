import React from 'react';
import { type TabItem } from './TabBar.js';
export declare function PageTabs<T extends string>({ label, items, value, onChange, children, className }: {
    label: string;
    items: readonly TabItem<T>[];
    value: T;
    onChange(value: T): void;
    children: React.ReactNode;
    className?: string;
}): React.JSX.Element | null;
//# sourceMappingURL=PageTabs.d.ts.map