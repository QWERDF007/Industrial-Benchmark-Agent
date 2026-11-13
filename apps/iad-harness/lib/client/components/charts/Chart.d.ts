import React from 'react';
import type { ChartSpec } from './types.js';
export declare function Chart({ id, title, spec, onSelect, description, controls }: {
    id?: string;
    title: string;
    spec: ChartSpec | null;
    onSelect?(id: string): void;
    description?: string;
    controls?: React.ReactNode;
}): React.JSX.Element;
//# sourceMappingURL=Chart.d.ts.map