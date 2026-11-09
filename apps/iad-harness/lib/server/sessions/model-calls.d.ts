import type { Context } from '@deepseek-ai/cordis';
import type { NativeModelCallEnd, NativeModelCallStart } from '../../shared/domain.generated.js';
export declare class NativeModelCalls {
    attach(scope: Context, sink: {
        start(request: NativeModelCallStart): Promise<void>;
        end(result: NativeModelCallEnd): Promise<void>;
    }): void;
}
//# sourceMappingURL=model-calls.d.ts.map