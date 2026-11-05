import React from 'react';
export interface KnowledgeConfirmationState {
    title: string;
    message: string;
    danger?: boolean;
    onConfirm(): void | Promise<void>;
}
export declare function KnowledgeConfirmation({ state, onClose }: {
    state: KnowledgeConfirmationState | null;
    onClose(): void;
}): React.JSX.Element | null;
//# sourceMappingURL=KnowledgeConfirmation.d.ts.map