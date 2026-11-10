import type { ModuleSettingsEdit, ModuleSettingsSnapshot } from '../shared/domain.generated.js';
import type { BusinessModule } from '../shared/business-modules.js';
type Values = ModuleSettingsSnapshot['settings'];
type Patch = ModuleSettingsEdit['settings'];
interface ModuleSettingsState {
    settings: Values | undefined;
    save(patch: Patch): void;
    saveAsync(patch: Patch): Promise<ModuleSettingsSnapshot>;
    retry(): void;
    loading: boolean;
    saving: boolean;
    saved: boolean;
    error: string;
}
export declare function useModuleSettings(module: BusinessModule): ModuleSettingsState;
export {};
//# sourceMappingURL=useModuleSettings.d.ts.map