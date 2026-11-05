import React from 'react';
export declare const Select: React.ForwardRefExoticComponent<React.SelectHTMLAttributes<HTMLSelectElement> & React.RefAttributes<HTMLSelectElement>>;
export interface MultiSelectOption {
    value: string;
    label: string;
}
export declare function MultiSelect({ id, menuId, label, options, selected, onToggle, disabled, emptyText }: {
    id: string;
    menuId?: string;
    label: string;
    options: MultiSelectOption[];
    selected: readonly string[] | ReadonlySet<string>;
    onToggle(value: string): void;
    disabled?: boolean;
    emptyText?: string;
}): React.JSX.Element;
//# sourceMappingURL=Select.d.ts.map