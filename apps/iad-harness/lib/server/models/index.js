import { ModelConfigurationError, NativeProviders } from './providers.js';
const normalized = (endpoint) => endpoint.replace(/\/$/, '').replace(/\/chat\/completions$/, '');
export class WorkbenchModelRouting {
    providers;
    initialization;
    constructor(ctx) { this.providers = new NativeProviders(() => ctx); }
    async settings(dispatch) {
        const current = await dispatch('model_settings_get');
        if (current.selection)
            return current;
        if (this.initialization)
            return this.initialization;
        this.initialization = (async () => {
            const legacy = await dispatch('model_environment_get');
            const catalog = await this.providers.catalog();
            const matches = catalog.filter(provider => !provider.error && provider.endpoint && normalized(provider.endpoint) === normalized(legacy.endpoint))
                .flatMap(provider => provider.models.filter(model => (!legacy.model_id || model.model_id === legacy.model_id) && model.input_modalities?.includes('image'))
                .map(model => ({ provider_id: provider.provider_id, model_id: model.model_id, limits: legacy.limits })));
            if (matches.length !== 1 || !legacy.limits.capacity_mode)
                return current;
            await this.providers.resolve(matches[0], 'inspect');
            return dispatch('model_settings_save', { expected_revision: current.revision, selection: matches[0] });
        })();
        try {
            return await this.initialization;
        }
        finally {
            this.initialization = undefined;
        }
    }
    async view(dispatch) {
        const settings = await this.settings(dispatch);
        const providers = await this.providers.catalog();
        let error = settings.selection ? null : '请先选择工作台提供商和模型';
        if (settings.selection) {
            try {
                await this.providers.resolve(settings.selection, 'inspect');
            }
            catch (failure) {
                error = failure instanceof Error ? failure.message : String(failure);
            }
        }
        return { ...settings, providers, ready: !error, error, provider_revision: this.providers.revision() };
    }
    async execute(operation, args, signal, dispatch) {
        if (operation === 'model_settings_get' || operation === 'model_settings_view')
            return this.view(dispatch);
        if (['model_provider_save', 'model_provider_delete', 'model_provider_models'].includes(operation)) {
            const action = operation.replace('model_provider_', '');
            const edit = await dispatch('model_provider_validate', { action, request: args }, signal);
            if (action === 'models')
                return { models: await this.providers.discover(edit, args.api_key, signal) };
            if (action === 'save')
                await this.providers.save(edit, args.api_key);
            else
                await this.providers.remove(edit);
            return this.view(dispatch);
        }
        if (operation === 'model_settings_save' || operation === 'model_connection_check') {
            const selection = await dispatch('model_settings_validate', operation === 'model_settings_save' ? args.selection : args);
            const execution = await this.providers.resolve(selection, operation === 'model_connection_check' ? 'probe' : 'inspect', signal);
            if (operation === 'model_connection_check')
                return dispatch(operation, { _model_execution: execution }, signal);
            await dispatch('model_settings_save', { expected_revision: args.expected_revision, selection }, signal);
            return this.view(dispatch);
        }
        if (operation === 'module_settings_save') {
            const edit = await dispatch('module_settings_validate', args, signal);
            if (edit.settings.model) {
                const base = await this.settings(dispatch);
                if (!base.selection)
                    throw new ModelConfigurationError('请先配置工作台模型及容量预检协议');
                await this.providers.resolve({ ...base.selection, ...edit.settings.model }, 'inspect', signal);
            }
            return dispatch(operation, edit, signal);
        }
        return dispatch(operation, args, signal);
    }
}
