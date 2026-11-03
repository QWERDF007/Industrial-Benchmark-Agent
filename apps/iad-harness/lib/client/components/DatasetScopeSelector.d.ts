import React from "react";
import type { Dataset, DatasetGroup } from "../../shared/contracts.js";
export interface DatasetScopeSelectorProps {
    groups: DatasetGroup[];
    selectedGroupId: string;
    onGroupChange: (groupId: string) => void;
    childDatasets: Dataset[];
    selectedChildIds: string[] | Set<string>;
    onChildToggle: (childId: string) => void;
    disabled?: boolean;
    className?: string;
    groupId?: string;
    childId?: string;
    childLabelId?: string;
    childMenuId?: string;
    groupLabel?: string;
    childLabel?: string;
    emptyChildText?: string;
    children?: React.ReactNode;
}
/**
 * Reusable two-tier dataset hierarchy selector.
 * Provides parent dataset group selection and child dataset multi-select dropdown.
 * Shared across ImagesPage, ExplorationPage, and future workbench surfaces.
 */
export declare function DatasetScopeSelector({ groups, selectedGroupId, onGroupChange, childDatasets, selectedChildIds, onChildToggle, disabled, className, groupId, childId, childLabelId, childMenuId, groupLabel, childLabel, emptyChildText, children, }: DatasetScopeSelectorProps): React.JSX.Element;
//# sourceMappingURL=DatasetScopeSelector.d.ts.map