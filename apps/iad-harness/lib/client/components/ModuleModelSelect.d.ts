import React from 'react';
import type { ModuleModelReference, WorkbenchProvider } from '../../shared/domain.generated.js';
export declare function ModuleModelSelect({ providers, model, loading, onChange }: {
    providers: WorkbenchProvider[];
    model: ModuleModelReference | null;
    loading: boolean;
    onChange(model: ModuleModelReference): void;
}): React.JSX.Element;
//# sourceMappingURL=ModuleModelSelect.d.ts.map