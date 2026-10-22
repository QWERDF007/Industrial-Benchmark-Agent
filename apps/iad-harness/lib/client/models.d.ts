import React from 'react';
import type { WorkbenchModelView } from '../shared/domain.generated.js';
export declare function WorkbenchModelProvider({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export declare function useWorkbenchModel(): {
    view: WorkbenchModelView | null;
    loading: boolean;
    error: string;
    refresh(): Promise<void>;
    ready: boolean;
};
export declare function WorkbenchModelStatus(): React.JSX.Element;
//# sourceMappingURL=models.d.ts.map