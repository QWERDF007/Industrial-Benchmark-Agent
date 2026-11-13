import type { NativeProviders } from '../models/providers.js';
import type { PythonBridge } from '../python-bridge/index.js';
import type { AnchorReviewTask } from './scheduler.js';
import { JobSessionHost } from '../sessions/host.js';
export declare class ConsistencyAnchorReviewer {
    private readonly bridge;
    private readonly host;
    private readonly providers;
    constructor(bridge: PythonBridge, host: JobSessionHost, providers: Pick<NativeProviders, 'credentialsFor'>);
    review(task: AnchorReviewTask): Promise<void>;
}
//# sourceMappingURL=anchor-reviewer.d.ts.map