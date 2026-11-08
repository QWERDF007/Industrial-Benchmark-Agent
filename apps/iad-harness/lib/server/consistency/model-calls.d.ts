import type { Context } from '@deepseek-ai/cordis';
import type { PythonBridge } from '../python-bridge/index.js';
export declare class ConsistencyAgentCalls {
    private readonly bridge;
    constructor(bridge: PythonBridge);
    attach(scope: Context, identity: {
        run_id: string;
        anchor_id: string;
        attempt: number;
    }): void;
}
//# sourceMappingURL=model-calls.d.ts.map