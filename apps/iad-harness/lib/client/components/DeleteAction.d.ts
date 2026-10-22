import React from "react";
export declare function DeleteAction({ title, name, description, onDelete, disabled, className, restoreFocus }: {
    title: string;
    name: string;
    description: string;
    onDelete(submissionId: string): Promise<void>;
    disabled?: boolean;
    className?: string;
    restoreFocus?(): HTMLElement | null;
}): React.JSX.Element;
//# sourceMappingURL=DeleteAction.d.ts.map