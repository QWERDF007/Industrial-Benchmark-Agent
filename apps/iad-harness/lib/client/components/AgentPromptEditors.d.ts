import React from 'react';
export declare function PromptTextEditor({ id, label, value, onChange, disabled }: {
    id: string;
    label: string;
    value: string;
    onChange(text: string): void;
    disabled?: boolean;
}): React.JSX.Element;
export declare function AgentPromptEditors({ id, system, user, onSystemChange, onUserChange, disabled, children }: {
    id: string;
    system: string;
    user: string;
    onSystemChange(text: string): void;
    onUserChange(text: string): void;
    disabled?: boolean;
    children?: React.ReactNode;
}): React.JSX.Element;
//# sourceMappingURL=AgentPromptEditors.d.ts.map