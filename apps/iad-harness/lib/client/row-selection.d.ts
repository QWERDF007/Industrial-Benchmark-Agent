export interface RowSelection {
    name: string;
    label: string;
    selectedIds: ReadonlySet<string>;
    onChange(ids: Set<string>): void;
    disabled?: boolean;
}
//# sourceMappingURL=row-selection.d.ts.map