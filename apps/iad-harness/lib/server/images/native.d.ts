import type { Context } from '@deepseek-ai/cordis';
import { type ToolExecution, type InferArgs } from '@deepseek-ai/dsh-tools';
import type { Session } from '@deepseek-ai/dsh-session';
import { imageRetrieveParameters } from '../../shared/consistency.parameters.generated.js';
import type { PythonBridge } from '../python-bridge/index.js';
type RetrievalArguments = InferArgs<typeof imageRetrieveParameters>;
export declare class NativeImageQueries {
    private readonly bridge;
    private readonly ctx;
    private readonly active;
    private readonly disposed;
    constructor(bridge: PythonBridge, ctx: Context);
    retrieve(request: RetrievalArguments, exec: ToolExecution): Promise<any>;
    private query;
    dispose(session: Session): Promise<void>;
}
export declare function createImageTools(queries: NativeImageQueries): import("@deepseek-ai/dsh-tools").ToolDefinition[];
export {};
//# sourceMappingURL=native.d.ts.map