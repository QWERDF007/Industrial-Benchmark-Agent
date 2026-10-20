import type { SamplePage } from "../shared/contracts.js";
import type { ImageNavigation } from "./components/ImageViewer.js";
import { type PageId } from "./workspace.js";
export type SampleWindow = SamplePage & {
    query: string;
};
export interface SampleNavigation extends ImageNavigation {
    open: boolean;
    opened(): void;
    cancel(): void;
}
/** Uses the gallery's actual query and pagination; no second ordering or sample index. */
export declare function useSampleNavigation(pageId: PageId, taskId: string | undefined, query: string, result: SampleWindow, enabled: boolean): SampleNavigation;
//# sourceMappingURL=useSampleNavigation.d.ts.map