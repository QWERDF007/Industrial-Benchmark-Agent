import React from 'react';
export declare function ModuleSelectSetting<T extends string>({ label, controlLabel, value, options, onChange, disabled, hint }: {
    label: string;
    controlLabel?: string;
    value: T;
    options: readonly {
        value: T;
        label: string;
        disabled?: boolean;
    }[];
    onChange: (value: T) => void;
    disabled?: boolean;
    hint?: string;
}): React.JSX.Element;
//# sourceMappingURL=ModuleSelectSetting.d.ts.map