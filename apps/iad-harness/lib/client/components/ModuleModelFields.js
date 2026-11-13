import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { reasoningEffortLabels } from '../../shared/model-settings.generated.js';
import { useModelProviders } from '../models.js';
import { ModuleModelSelect } from './ModuleModelSelect.js';
import { ModuleSettingRow } from './ModuleSettingRow.js';
import { ModuleSelectSetting } from './ModuleSelectSetting.js';
export function ModuleModelFields({ settings, save }) {
    const { providers, loading, error } = useModelProviders();
    const efforts = providers.find(provider => provider.provider_id === settings.model?.provider_id)?.models
        .find(model => model.model_id === settings.model?.model_id)?.reasoning_efforts ?? [];
    return _jsxs(_Fragment, { children: [_jsx(ModuleSettingRow, { label: "\u5206\u6790\u6A21\u578B", children: props => _jsx(ModuleModelSelect, { ...props, providers: providers, model: settings.model, loading: loading, onChange: model => save({ model, reasoning_effort: null }) }) }), _jsx(ModuleSelectSetting, { label: "\u63A8\u7406\u5F3A\u5EA6", disabled: loading || !efforts.length, value: settings.reasoning_effort ?? '', onChange: value => save({ reasoning_effort: value || null }), options: [
                    { value: '', label: 'Default' },
                    ...(settings.reasoning_effort && !efforts.includes(settings.reasoning_effort) ? [{ value: settings.reasoning_effort, label: '所选强度不可用', disabled: true }] : []),
                    ...efforts.map(value => ({ value, label: reasoningEffortLabels[value] })),
                ] }), error && _jsx("p", { role: "alert", children: error })] });
}
