import type { Context } from '@deepseek-ai/cordis';
import type { PythonBridge } from './python-bridge/index.js';
export declare const name = "iad-workbench-runtime";
export declare function apply(ctx: Context, { bridge }: {
    bridge: PythonBridge;
}): Promise<void>;
//# sourceMappingURL=workbench-runtime.d.ts.map