import type { JobView } from '../../shared/domain.generated.js';
import type { BridgeDispatch, ModelRouting, PythonBridge } from '../python-bridge/index.js';
import type { NativeProviders } from '../models/providers.js';
import type { JobSessionHost } from '../sessions/host.js';
export declare class AuditWorkflowScheduler implements ModelRouting {
    private readonly bridge;
    private readonly providers;
    private readonly host;
    private readonly dataRoot;
    private readonly onError;
    private readonly tasks;
    constructor(bridge: PythonBridge, providers: NativeProviders, host: JobSessionHost, dataRoot: string, onError: (error: unknown) => void);
    execute(operation: string, args: Record<string, any>, signal: AbortSignal | undefined, dispatch: BridgeDispatch): Promise<any>;
    start(request: Record<string, unknown>): Promise<JobView>;
    private launch;
    private run;
    private writeReport;
    cancel(runId: string): Promise<JobView>;
    resume(runId: string): Promise<JobView>;
    whenIdle(): Promise<void>;
    dispose(): Promise<void>;
}
//# sourceMappingURL=scheduler.d.ts.map