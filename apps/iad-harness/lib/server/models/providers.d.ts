import type { Context } from '@deepseek-ai/cordis';
import type { ModelExecution, ModelProfile, ProviderEdit, ProviderDiscovery, ProviderReference, ProviderModel, WorkbenchModelSettings, WorkbenchProvider } from '../../shared/domain.generated.js';
export declare class ModelConfigurationError extends Error {
    readonly statusCode = 422;
}
type Selection = NonNullable<WorkbenchModelSettings['selection']>;
export declare class NativeProviders {
    private readonly ctx;
    private readonly editing;
    constructor(ctx: Context);
    private namespace;
    revision(): number;
    private source;
    catalog(): Promise<WorkbenchProvider[]>;
    resolve(selection: Selection, purpose: 'inspect' | 'start' | 'probe', signal?: AbortSignal): Promise<ModelExecution>;
    save(edit: ProviderEdit, apiKey?: string | null): Promise<void>;
    remove(reference: ProviderReference): Promise<void>;
    discover(request: ProviderDiscovery, apiKey?: string | null, signal?: AbortSignal): Promise<ProviderModel[]>;
    credentialsFor(profile: ModelProfile): Promise<ModelExecution>;
}
export {};
//# sourceMappingURL=providers.d.ts.map