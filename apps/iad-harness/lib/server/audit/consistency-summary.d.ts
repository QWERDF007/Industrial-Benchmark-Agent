import type { AuditWorkflowSnapshot } from '../../shared/domain.generated.js';
import type { PythonBridge } from '../python-bridge/index.js';
import type { NativeProviders } from '../models/providers.js';
import type { JobSessionHost } from '../sessions/host.js';
export declare class ConsistencySummary {
    private readonly bridge;
    private readonly host;
    private readonly providers;
    constructor(bridge: PythonBridge, host: JobSessionHost, providers: NativeProviders);
    run(runId: string, snapshot: AuditWorkflowSnapshot, signal: AbortSignal): Promise<void>;
}
//# sourceMappingURL=consistency-summary.d.ts.map