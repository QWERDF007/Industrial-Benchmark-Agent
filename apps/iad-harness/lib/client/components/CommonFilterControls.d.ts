import React from 'react';
import { type IconButtonProps } from './IconButton.js';
type FilterButtonProps = Omit<IconButtonProps, 'icon' | 'label'> & {
    ariaLabel?: string;
    [key: `data-${string}`]: string | undefined;
};
export declare function ClearFilterButton({ ariaLabel, title, className, ...props }: FilterButtonProps): React.JSX.Element;
export declare function RefreshIconButton({ ariaLabel, title, className, ...props }: FilterButtonProps): React.JSX.Element;
export {};
//# sourceMappingURL=CommonFilterControls.d.ts.map