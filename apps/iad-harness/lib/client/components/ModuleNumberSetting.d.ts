import React from 'react';
export declare function ModuleNumberSetting({ label, value, min, max, step, validationMessage, onSave, hint, disabled, validate }: {
    label: string;
    value: number;
    min: number;
    max?: number;
    step: number;
    validationMessage: string;
    onSave(value: number): void;
    hint?: string;
    disabled?: boolean;
    validate?(value: number): boolean;
}): React.JSX.Element;
//# sourceMappingURL=ModuleNumberSetting.d.ts.map