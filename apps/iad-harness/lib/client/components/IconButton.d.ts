import React from 'react';
import { CloseIcon, DeleteIcon, RefreshIcon, ClearFilterIcon, EditIcon, CopyIcon, PlusIcon, ChevronIcon, DocumentIcon, DocumentSearchIcon, MineIcon, StatsIcon, EyeIcon, EyeOffIcon, ZoomInIcon, ZoomOutIcon, FitIcon, ExpandIcon } from '../AuditIcon.js';
declare const icons: {
    close: typeof CloseIcon;
    delete: typeof DeleteIcon;
    refresh: typeof RefreshIcon;
    clear: typeof ClearFilterIcon;
    edit: typeof EditIcon;
    copy: typeof CopyIcon;
    add: typeof PlusIcon;
    chevron: typeof ChevronIcon;
    prompt: typeof DocumentIcon;
    details: typeof DocumentSearchIcon;
    mine: typeof MineIcon;
    stats: typeof StatsIcon;
    annotations: typeof EyeIcon;
    annotationsOff: typeof EyeOffIcon;
    zoomIn: typeof ZoomInIcon;
    zoomOut: typeof ZoomOutIcon;
    fit: typeof FitIcon;
    expand: typeof ExpandIcon;
};
export type IconName = keyof typeof icons;
export type IconButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> & {
    label: string;
    icon: IconName;
};
export declare const IconButton: React.ForwardRefExoticComponent<Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> & {
    label: string;
    icon: IconName;
} & React.RefAttributes<HTMLButtonElement>>;
export {};
//# sourceMappingURL=IconButton.d.ts.map