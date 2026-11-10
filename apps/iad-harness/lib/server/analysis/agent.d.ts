import type { AnalysisSessionLocation } from '../../shared/domain.generated.js';
import type { NativeProviders } from '../models/providers.js';
import type { PythonBridge } from '../python-bridge/index.js';
import { JobSessionHost } from '../sessions/host.js';
export declare function analysisSessionPath(root: string, location: AnalysisSessionLocation): string;
export declare class AnalysisWorkflowAgent {
    private readonly bridge;
    private readonly host;
    private readonly providers;
    private readonly dataRoot;
    constructor(bridge: PythonBridge, host: JobSessionHost, providers: Pick<NativeProviders, 'credentialsFor' | 'credentials'>, dataRoot: string);
    run(runId: string, signal: AbortSignal): Promise<void>;
}
//# sourceMappingURL=agent.d.ts.map