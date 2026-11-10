import type {Context} from '@deepseek-ai/cordis';
import type {ModelCatalog} from '../../shared/domain.generated.js';
import type {BridgeDispatch,ModelRouting} from '../python-bridge/index.js';
import {NativeProviders} from './providers.js';

export class ModelCatalogRouting implements ModelRouting {
  private readonly providers: NativeProviders;
  constructor(ctx: Context) {this.providers = new NativeProviders(() => ctx);}

  async catalog(): Promise<ModelCatalog> {
    return {providers: await this.providers.catalog(), provider_revision: this.providers.revision()};
  }

  async execute(operation: string, args: Record<string, any>, signal: AbortSignal | undefined, dispatch: BridgeDispatch): Promise<any> {
    if (operation === 'model_provider_list') return this.catalog();
    if (['model_provider_save', 'model_provider_delete', 'model_provider_models'].includes(operation)) {
      const action = operation.replace('model_provider_', '');
      const edit = await dispatch('model_provider_validate', {action, request: args}, signal);
      if (action === 'models') return {models: await this.providers.discover(edit, args.api_key, signal)};
      if (action === 'save') await this.providers.save(edit, args.api_key);
      else await this.providers.remove(edit);
      return this.catalog();
    }
    if (operation === 'module_settings_save') {
      const edit = await dispatch('module_settings_validate', args, signal);
      if (edit.settings.model) await this.providers.validateReference(edit.settings.model);
      return dispatch(operation, edit, signal);
    }
    return dispatch(operation, args, signal);
  }
}
