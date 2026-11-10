import type { JobView } from '../../shared/domain.generated.js';
import type { NativeProviders } from '../models/providers.js';
import type { BridgeDispatch, ModelRouting, PythonBridge } from '../python-bridge/index.js';
import type { JobSessionHost } from '../sessions/host.js';
export declare class AnalysisWorkflowScheduler implements ModelRouting {
    private readonly bridge;
    private readonly providers;
    private readonly hosts;
    private readonly dataRoot;
    private readonly onError;
    private readonly tasks;
    constructor(bridge: PythonBridge, providers: NativeProviders, hosts: Record<'exploration' | 'knowledge', JobSessionHost>, dataRoot: string, onError: (error: unknown) => void);
    execute(operation: string, args: Record<string, any>, signal: AbortSignal | undefined, dispatch: BridgeDispatch): Promise<any>;
    start(request: Record<string, unknown>): Promise<JobView>;
    private launch;
    private terminal;
    private exportVersion;
    cancel(runId: string): Promise<JobView>;
    resume(runId: string): Promise<JobView>;
    whenIdle(): Promise<void>;
    dispose(): Promise<void>;
}
//# sourceMappingURL=scheduler.d.ts.map