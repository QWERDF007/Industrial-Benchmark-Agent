import React from "react";
import type { FolderPreview, FolderRule } from "../../shared/contracts.js";
export declare function FolderMapping({ preview, rules, pending, disabled, onChange }: {
    preview: FolderPreview | null;
    rules?: FolderRule[];
    pending: boolean;
    disabled: boolean;
    onChange(rules: FolderRule[]): void;
}): React.JSX.Element;
//# sourceMappingURL=FolderMapping.d.ts.map