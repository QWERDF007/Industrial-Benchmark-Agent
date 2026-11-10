import React from 'react';
export declare function ConfirmationDialog({ title, children, confirmLabel, danger, confirmDisabled, cancelAriaLabel, onConfirm, onClose, restoreFocus }: {
    title: string;
    children: React.ReactNode;
    confirmLabel?: string;
    danger?: boolean;
    confirmDisabled?: boolean;
    cancelAriaLabel?: string;
    onConfirm(): void | Promise<void>;
    onClose(): void;
    restoreFocus?(): HTMLElement | null;
}): React.JSX.Element;
//# sourceMappingURL=ConfirmationDialog.d.ts.map