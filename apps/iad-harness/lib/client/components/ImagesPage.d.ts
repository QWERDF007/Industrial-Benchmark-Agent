import React from "react";
import type { Dataset, DatasetGroup } from "../../shared/contracts.js";
export interface ImagesPageProps {
    datasets: Dataset[];
    groups: DatasetGroup[];
    onDatasetsChanged?: () => void;
}
export declare function ImagesPage({ datasets, groups, onDatasetsChanged }: ImagesPageProps): React.JSX.Element;
//# sourceMappingURL=ImagesPage.d.ts.map