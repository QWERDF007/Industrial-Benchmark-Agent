import React from "react";
import type { ExplorationCatalog, MiningPromptConfiguration } from "../../shared/domain.generated.js";
export declare function MiningDirectionList({ configuration, catalog, opening, focusId, savedRevision, onChange, onSource, }: {
    configuration: MiningPromptConfiguration;
    catalog: ExplorationCatalog | null;
    opening: string;
    focusId: string;
    savedRevision: string;
    onChange(configuration: MiningPromptConfiguration): void;
    onSource(id: string): void;
}): React.JSX.Element;
//# sourceMappingURL=MiningDirectionList.d.ts.map