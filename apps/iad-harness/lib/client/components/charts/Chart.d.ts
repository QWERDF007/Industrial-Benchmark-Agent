import React from 'react';
import type { ChartSpec } from './types.js';
export interface ChartPanel {
    label: string;
    spec: ChartSpec;
}
export declare function Chart({ id, title, spec, panels, onSelect, description, controls }: {
    id?: string;
    title: string;
    spec: ChartSpec | null;
    panels?: readonly ChartPanel[];
    onSelect?(id: string): void;
    description?: string;
    controls?: React.ReactNode;
}): React.JSX.Element;
//# sourceMappingURL=Chart.d.ts.map