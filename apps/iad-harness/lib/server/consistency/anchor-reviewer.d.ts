import type { PythonBridge } from '../python-bridge/index.js';
import type { AnchorReviewTask } from './scheduler.js';
import { JobSessionHost } from '../sessions/host.js';
export declare class ConsistencyAnchorReviewer {
    private readonly bridge;
    private readonly host;
    constructor(bridge: PythonBridge, host: JobSessionHost);
    review(task: AnchorReviewTask): Promise<boolean>;
}
//# sourceMappingURL=anchor-reviewer.d.ts.map