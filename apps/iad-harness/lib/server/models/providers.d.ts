import type { Context } from '@deepseek-ai/cordis';
import type { FrozenModelRole, GenerationLimits, ModelExecution, ModelLimits, ModelProfile, ModuleModelReference, ProviderEdit, ProviderDiscovery, ProviderReference, ProviderModel, WorkbenchProvider } from '../../shared/domain.generated.js';
export declare class ModelConfigurationError extends Error {
    readonly statusCode = 422;
}
export declare class NativeProviders {
    private readonly context;
    private readonly editing;
    constructor(context: () => Context);
    private get ctx();
    get credentials(): import("@deepseek-ai/dsh-credentials").CredentialProvider;
    private namespace;
    revision(): number;
    validateReference(reference: ModuleModelReference): Promise<void>;
    private source;
    catalog(): Promise<WorkbenchProvider[]>;
    private configuration;
    freeze(reference: ModuleModelReference | null, limits: GenerationLimits | ModelLimits, role: 'agent' | 'vision', reasoningEffort?: ModelProfile['reasoning_effort']): Promise<FrozenModelRole>;
    save(edit: ProviderEdit, apiKey?: string | null): Promise<void>;
    remove(reference: ProviderReference): Promise<void>;
    discover(request: ProviderDiscovery, apiKey?: string | null, signal?: AbortSignal): Promise<ProviderModel[]>;
    credentialsFor(profile: ModelProfile): Promise<ModelExecution>;
}
//# sourceMappingURL=providers.d.ts.map