import { jsx as _jsx } from "react/jsx-runtime";
import { businessModules } from '../../shared/business-modules.js';
import { WorkbenchProviders } from './WorkbenchProviders.js';
import { ModuleSettingsSection } from '../components/ModuleSettingsSection.js';
import { ConsistencySettingsSection } from '../components/ConsistencySettingsSection.js';
export function registerWorkbenchSettings(ctx, workspace) {
    ctx.slots.inject('settings.section', () => {
        const disposers = Object.entries(businessModules).map(([module, label], index) => ctx.slots.register({ name: 'settings.section', id: `industrial-${module}`, order: 50 + index, label }, () => _jsx(WorkbenchProviders, { workspace: workspace, children: module === 'consistency' ? _jsx(ConsistencySettingsSection, {}) : _jsx(ModuleSettingsSection, { module: module }) })));
        return () => disposers.forEach(dispose => dispose());
    });
}
