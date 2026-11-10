import type { ServerResponse } from 'node:http';
import type { PythonBridge } from '../python-bridge/index.js';
export declare class ConsistencyHttpQueries {
    private readonly bridge;
    constructor(bridge: PythonBridge);
    export(res: ServerResponse, runId: string): Promise<void>;
    session(res: ServerResponse, runId: string, anchorId: string): Promise<void>;
}
//# sourceMappingURL=http.d.ts.map