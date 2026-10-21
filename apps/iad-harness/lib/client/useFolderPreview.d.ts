import type { FolderPreview, FolderRule } from "../shared/contracts.js";
export declare function useFolderPreview(root: string, rules: FolderRule[] | undefined, enabled: boolean): {
    preview: FolderPreview | null;
    pending: boolean;
    error: string;
    ready: boolean;
};
//# sourceMappingURL=useFolderPreview.d.ts.map