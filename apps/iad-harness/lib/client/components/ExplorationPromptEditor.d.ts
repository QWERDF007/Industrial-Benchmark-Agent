import React from "react";
import type { ExplorationPromptPreset, FrozenExplorationPrompt } from "../../shared/domain.generated.js";
export declare function ExplorationPromptEditor({ presets, value, base, disabled, onChange, onCreated, }: {
    presets: ExplorationPromptPreset[];
    value: FrozenExplorationPrompt;
    base: string;
    disabled: boolean;
    onChange(value: FrozenExplorationPrompt, base: string): void;
    onCreated(value: ExplorationPromptPreset): void;
}): React.JSX.Element;
//# sourceMappingURL=ExplorationPromptEditor.d.ts.map