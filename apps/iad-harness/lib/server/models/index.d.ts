import type { Context } from '@deepseek-ai/cordis';
import type { ModelCatalog } from '../../shared/domain.generated.js';
import type { BridgeDispatch, ModelRouting } from '../python-bridge/index.js';
export declare class ModelCatalogRouting implements ModelRouting {
    private readonly providers;
    constructor(ctx: Context);
    catalog(): Promise<ModelCatalog>;
    execute(operation: string, args: Record<string, any>, signal: AbortSignal | undefined, dispatch: BridgeDispatch): Promise<any>;
}
//# sourceMappingURL=index.d.ts.map