import type { AuditWorkflowSnapshot } from '../../shared/domain.generated.js';
import type { PythonBridge } from '../python-bridge/index.js';
import type { NativeProviders } from '../models/providers.js';
import { JobSessionHost } from '../sessions/host.js';
export declare class AuditMasterAgent {
    private readonly bridge;
    private readonly host;
    private readonly providers;
    private readonly dataRoot;
    constructor(bridge: PythonBridge, host: JobSessionHost, providers: NativeProviders, dataRoot: string);
    run(runId: string, snapshot: AuditWorkflowSnapshot, signal: AbortSignal): Promise<void>;
}
//# sourceMappingURL=agent.d.ts.map