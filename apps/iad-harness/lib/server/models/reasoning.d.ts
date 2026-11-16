import type { ModelProfile, ReasoningEffort } from '../../shared/domain.generated.js';
type Json = Record<string, unknown>;
/** Freeze the provider's wire spelling once for the Python visual transport. */
export declare function reasoningParameters(api: ModelProfile['api'], effort: NonNullable<ReasoningEffort>, declared: Json, compat: Json): Json;
export {};
//# sourceMappingURL=reasoning.d.ts.map