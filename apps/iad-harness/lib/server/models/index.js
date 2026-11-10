import { NativeProviders } from './providers.js';
export class ModelCatalogRouting {
    providers;
    constructor(ctx) { this.providers = new NativeProviders(() => ctx); }
    async catalog() {
        return { providers: await this.providers.catalog(), provider_revision: this.providers.revision() };
    }
    async execute(operation, args, signal, dispatch) {
        if (operation === 'model_provider_list')
            return this.catalog();
        if (['model_provider_save', 'model_provider_delete', 'model_provider_models'].includes(operation)) {
            const action = operation.replace('model_provider_', '');
            const edit = await dispatch('model_provider_validate', { action, request: args }, signal);
            if (action === 'models')
                return { models: await this.providers.discover(edit, args.api_key, signal) };
            if (action === 'save')
                await this.providers.save(edit, args.api_key);
            else
                await this.providers.remove(edit);
            return this.catalog();
        }
        if (operation === 'module_settings_save') {
            const edit = await dispatch('module_settings_validate', args, signal);
            if (edit.settings.model)
                await this.providers.validateReference(edit.settings.model);
            return dispatch(operation, edit, signal);
        }
        return dispatch(operation, args, signal);
    }
}
