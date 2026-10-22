import type { Context } from '@deepseek-ai/cordis';
import type { BridgeDispatch, ModelRouting } from '../python-bridge/index.js';
export declare class WorkbenchModelRouting implements ModelRouting {
    private readonly providers;
    private initialization?;
    constructor(ctx: Context);
    private settings;
    private view;
    execute(operation: string, args: Record<string, any>, signal: AbortSignal | undefined, dispatch: BridgeDispatch): Promise<any>;
}
//# sourceMappingURL=index.d.ts.map