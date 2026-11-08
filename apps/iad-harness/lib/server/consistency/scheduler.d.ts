import type { AnchorCandidates, ConsistencyCheckSnapshot, JobView } from '../../shared/domain.generated.js';
import type { BridgeDispatch, ModelRouting, PythonBridge } from '../python-bridge/index.js';
import { ConsistencySessionHost } from './session-host.js';
import type { NativeProviders } from '../models/providers.js';
export interface AnchorReviewTask {
    runId: string;
    anchorId: string;
    sessionId: string;
    snapshot: ConsistencyCheckSnapshot;
    candidates: AnchorCandidates;
    attempt: number;
    signal: AbortSignal;
}
export declare class ConsistencyCheckScheduler implements ModelRouting {
    private readonly bridge;
    private readonly host;
    private readonly providers;
    private readonly review;
    private readonly onError;
    private readonly tasks;
    constructor(bridge: PythonBridge, host: ConsistencySessionHost, providers: NativeProviders, review: (task: AnchorReviewTask) => Promise<void>, onError: (error: unknown) => void);
    execute(operation: string, args: Record<string, any>, signal: AbortSignal | undefined, dispatch: BridgeDispatch): Promise<any>;
    start(request: Record<string, unknown>): Promise<JobView>;
    private launch;
    private run;
    private failure;
    private closeTrace;
    private pendingTrace;
    reconcile(runId: string): Promise<void>;
    cancel(runId: string): Promise<JobView>;
    resume(runId: string): Promise<JobView>;
    whenIdle(): Promise<void>;
    dispose(): Promise<void>;
}
//# sourceMappingURL=scheduler.d.ts.map