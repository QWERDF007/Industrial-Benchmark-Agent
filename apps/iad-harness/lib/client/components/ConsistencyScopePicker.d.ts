import React from 'react';
import type { Dataset } from '../../shared/contracts.js';
import type { ConsistencyLocation } from '../../shared/navigation.js';
type CorpusScope = NonNullable<ConsistencyLocation['scope']>;
export declare function ConsistencyScopePicker({ datasets, value, onChange }: {
    datasets: Dataset[];
    value: CorpusScope;
    onChange(value: CorpusScope): void;
}): React.JSX.Element;
export {};
//# sourceMappingURL=ConsistencyScopePicker.d.ts.map