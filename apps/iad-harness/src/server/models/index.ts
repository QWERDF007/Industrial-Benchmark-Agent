import type { Context } from '@deepseek-ai/cordis';
import type { JobSnapshot, ModelLimits, ModelProfile, WorkbenchModelSettings, WorkbenchModelView } from '../../shared/domain.generated.js';
import type { BridgeDispatch, ModelRouting } from '../python-bridge/index.js';
import { NativeProviders } from './providers.js';

const starts = new Set(['direction_exploration_start', 'knowledge_start', 'audit_start']);
const retries: Record<string, string> = {direction_exploration_retry: 'direction_exploration_status', knowledge_retry: 'knowledge_status', audit_retry: 'audit_status'};
const normalized = (endpoint: string) => endpoint.replace(/\/$/, '').replace(/\/chat\/completions$/, '');

export class WorkbenchModelRouting implements ModelRouting {
  private readonly providers: NativeProviders;
  private initialization?: Promise<WorkbenchModelSettings>;
  constructor(ctx: Context) {this.providers = new NativeProviders(ctx);}

  private async settings(dispatch: BridgeDispatch): Promise<WorkbenchModelSettings> {
    const current: WorkbenchModelSettings = await dispatch('model_settings_get');
    if (current.selection) return current;
    if (this.initialization) return this.initialization;
    this.initialization = (async () => {
      const legacy: {endpoint: string; model_id: string | null; limits: ModelLimits} = await dispatch('model_environment_get');
      const catalog = await this.providers.catalog();
      const matches = catalog.filter(provider => !provider.error && provider.endpoint && normalized(provider.endpoint) === normalized(legacy.endpoint))
        .flatMap(provider => provider.models.filter(model => (!legacy.model_id || model.model_id === legacy.model_id) && model.input_modalities?.includes('image'))
          .map(model => ({provider_id: provider.provider_id, model_id: model.model_id, limits: legacy.limits})));
      if (matches.length !== 1 || !legacy.limits.capacity_mode) return current;
      await this.providers.resolve(matches[0], 'inspect');
      return dispatch('model_settings_save', {expected_revision: current.revision, selection: matches[0]});
    })();
    try {return await this.initialization;} finally {this.initialization = undefined;}
  }

  private async view(dispatch: BridgeDispatch): Promise<WorkbenchModelView> {
    const settings = await this.settings(dispatch);
    const providers = await this.providers.catalog();
    let error: string | null = settings.selection ? null : '请先选择工作台提供商和模型';
    if (settings.selection) {
      try {await this.providers.resolve(settings.selection, 'inspect');}
      catch (failure) {error = failure instanceof Error ? failure.message : String(failure);}
    }
    return {...settings, providers, ready: !error, error, provider_revision: this.providers.revision()};
  }

  async execute(operation: string, args: Record<string, any>, signal: AbortSignal | undefined, dispatch: BridgeDispatch): Promise<any> {
    if (operation === 'model_settings_get' || operation === 'model_settings_view') return this.view(dispatch);
    if (['model_provider_save', 'model_provider_delete', 'model_provider_models'].includes(operation)) {
      const action = operation.replace('model_provider_', '');
      const edit = await dispatch('model_provider_validate', {action, request: args}, signal);
      if (action === 'models') return {models: await this.providers.discover(edit, args.api_key, signal)};
      if (action === 'save') await this.providers.save(edit, args.api_key);
      else await this.providers.remove(edit);
      return this.view(dispatch);
    }
    if (operation === 'model_settings_save' || operation === 'model_connection_check') {
      const selection = await dispatch('model_settings_validate', operation === 'model_settings_save' ? args.selection : args);
      const execution = await this.providers.resolve(selection, operation === 'model_connection_check' ? 'probe' : 'inspect', signal);
      if (operation === 'model_connection_check') return dispatch(operation, {_model_execution: execution}, signal);
      await dispatch('model_settings_save', {expected_revision: args.expected_revision, selection}, signal);
      return this.view(dispatch);
    }
    if (starts.has(operation)) {
      const settings = await this.settings(dispatch);
      if (!settings.selection) throw Object.assign(new Error('请先在模型设置中选择工作台提供商和模型'), {statusCode: 422});
      const execution = await this.providers.resolve(settings.selection, 'start', signal);
      return dispatch(operation, {...args, model_name: settings.selection.model_id, _model_execution: execution}, signal);
    }
    if (retries[operation]) {
      const job: JobSnapshot & {request: {model_profile: ModelProfile}} = await dispatch(retries[operation], {run_id: args.run_id}, signal);
      const execution = await this.providers.credentialsFor(job.request.model_profile);
      return dispatch(operation, {...args, _model_execution: execution}, signal);
    }
    return dispatch(operation, args, signal);
  }
}
