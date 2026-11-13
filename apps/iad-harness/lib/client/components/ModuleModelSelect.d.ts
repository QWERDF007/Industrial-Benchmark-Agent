import React from 'react';
import type { ModuleModelReference, WorkbenchProvider } from '../../shared/domain.generated.js';
import type { SettingControlProps } from './ModuleSettingRow.js';
export declare function ModuleModelSelect({ providers, model, loading, onChange, ...control }: {
    providers: WorkbenchProvider[];
    model: ModuleModelReference | null;
    loading: boolean;
    onChange(model: ModuleModelReference): void;
} & SettingControlProps): React.JSX.Element;
//# sourceMappingURL=ModuleModelSelect.d.ts.map