import React from "react";
/**
 * Standard V51 Clear Filter SVG Icon (funnel with cross)
 */
export declare function ClearFilterIcon(): React.JSX.Element;
/**
 * Standard V51 Refresh SVG Icon (circular reload arrows)
 */
export declare function RefreshActionIcon(): React.JSX.Element;
export interface ClearFilterButtonProps {
    id?: string;
    dataAttr?: string;
    dataVal?: string;
    disabled?: boolean;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    title?: string;
    ariaLabel?: string;
    className?: string;
    [key: `data-${string}`]: string | undefined;
}
/**
 * Reusable Clear Filter Icon Button (38x38px)
 * Aligns with V51 specifications across Images, Exploration, Knowledge, Consistency, and DatasetManager.
 */
export declare function ClearFilterButton({ id, disabled, onClick, title, ariaLabel, className, ...restDataAttrs }: ClearFilterButtonProps): React.JSX.Element;
export interface RefreshIconButtonProps {
    id?: string;
    disabled?: boolean;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    title?: string;
    ariaLabel?: string;
    className?: string;
    [key: `data-${string}`]: string | undefined;
}
/**
 * Reusable Refresh Icon Button (38x38px)
 * Replaces ad-hoc unicode arrow symbols with standard SVG geometry.
 */
export declare function RefreshIconButton({ id, disabled, onClick, title, ariaLabel, className, ...restDataAttrs }: RefreshIconButtonProps): React.JSX.Element;
//# sourceMappingURL=CommonFilterControls.d.ts.map