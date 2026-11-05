import React from 'react';
export interface TabItem<T extends string> {
    id: T;
    label: React.ReactNode;
    buttonProps?: Pick<React.ButtonHTMLAttributes<HTMLButtonElement>, 'id' | 'aria-controls'> & {
        [key: `data-${string}`]: string | undefined;
    };
}
export declare function TabBar<T extends string>({ label, items, value, onChange, className }: {
    label: string;
    items: readonly TabItem<T>[];
    value: T;
    onChange(value: T): void;
    className?: string;
}): React.JSX.Element;
//# sourceMappingURL=TabBar.d.ts.map