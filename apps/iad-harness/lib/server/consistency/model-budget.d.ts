import type { PiAiProviderProfile } from '@deepseek-ai/dsh-llm-pi-ai';
import type { TokenBudget } from '../../shared/domain.generated.js';
export declare class ConsistencyModelBudget {
    readonly profile: PiAiProviderProfile;
    private readonly server;
    private constructor();
    static open(profile: PiAiProviderProfile, measure: (body: Record<string, unknown>, signal: AbortSignal) => Promise<TokenBudget>): Promise<ConsistencyModelBudget>;
    close(): Promise<void>;
}
//# sourceMappingURL=model-budget.d.ts.map