import React from 'react';
export declare function DeleteAction({ title, name, description, confirmation, confirmLabel, confirmDisabled, onDelete, disabled, className, restoreFocus }: {
    title: string;
    name: string;
    description?: string;
    confirmation?: React.ReactNode;
    confirmLabel?: string;
    confirmDisabled?: boolean;
    onDelete(submissionId: string): Promise<void>;
    disabled?: boolean;
    className?: string;
    restoreFocus?(): HTMLElement | null;
}): React.JSX.Element;
//# sourceMappingURL=DeleteAction.d.ts.map