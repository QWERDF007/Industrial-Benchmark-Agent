import React from 'react';
export interface SettingControlProps {
    id: string;
    'aria-label': string;
    'aria-describedby': string | undefined;
    'aria-invalid': true | undefined;
}
export declare function ModuleSettingRow({ label, controlLabel, hint, error, children }: {
    label: string;
    controlLabel?: string;
    hint?: string;
    error?: string;
    children: (props: SettingControlProps) => React.ReactNode;
}): React.JSX.Element;
//# sourceMappingURL=ModuleSettingRow.d.ts.map