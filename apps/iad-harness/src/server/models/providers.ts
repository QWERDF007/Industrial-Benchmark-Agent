import type { Context } from '@deepseek-ai/cordis';
import { credentialRef } from '@deepseek-ai/dsh-credentials';
import type {} from '@deepseek-ai/dsh-settings';
import {assertUsableApiKey} from '@deepseek-ai/dsh-llm';
import type { ModelExecution, ModelProfile, ProviderEdit, ProviderDiscovery, ProviderReference, ProviderModel, WorkbenchModelSettings, WorkbenchProvider } from '../../shared/domain.generated.js';

export class ModelConfigurationError extends Error {readonly statusCode = 422;}

type Selection = NonNullable<WorkbenchModelSettings['selection']>;
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value)
  ? value as Record<string, unknown> : {};
const apiEndpoint = (value: string) => {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash)
    throw new ModelConfigurationError('服务地址必须是无内嵌凭据、查询参数或片段的 HTTP(S) API 地址');
  return url.href.replace(/\/$/, '').replace(/\/chat\/completions$/, '');
};

export class NativeProviders {
  private readonly editing = new Set<string>();
  constructor(private readonly ctx: Context) {}

  private namespace() {
    const namespace = this.ctx.settings.describe({redactSecrets: true}).find(row => row.ns === 'llm-pi-ai');
    if (!namespace) throw new ModelConfigurationError('原生通用模型适配器尚未加载');
    return namespace;
  }

  revision() {return this.namespace().revision;}

  private source(providerId: string) {
    const entry = this.ctx.llm.listConfigurableProviders().find(row => row.provider === providerId);
    if (!entry) throw new ModelConfigurationError('该提供商未暴露可用的视觉服务配置，请在提供商设置中配置');
    if (this.editing.has(providerId)) throw new ModelConfigurationError('提供商正在更新，请等待保存完成');
    const namespace = this.ctx.settings.describe({redactSecrets: true}).find(row => row.ns === entry.settingsNs);
    if (!namespace) throw new ModelConfigurationError('提供商配置不存在或已移除');
    let value = namespace.value;
    for (const key of entry.settingsPath) value = object(value)[key];
    const profile = structuredClone(object(value));
    if (!Object.keys(profile).length) throw new ModelConfigurationError('提供商尚未配置');
    const api = typeof profile.api === 'string' ? profile.api : null;
    const endpoint = typeof profile.baseURL === 'string' ? profile.baseURL : null;
    const error = api !== 'openai-completions' ? '当前视觉作业仅支持 OpenAI Chat Completions 协议'
      : !endpoint ? '请在提供商设置中填写服务地址'
      : Object.keys(object(profile.headers)).length ? '当前视觉作业尚不支持提供商自定义请求头' : null;
    return {entry, namespace, profile, api, endpoint, error};
  }

  async catalog(): Promise<WorkbenchProvider[]> {
    return Promise.all(this.ctx.llm.listProviders().map(async provider => {
      const row: WorkbenchProvider = {provider_id: provider.id, name: provider.name, endpoint: null, api: null, models: [], error: null,
        editable: false, removable: false, credential_configured: false, credential_writable: false};
      try {
        const source = this.source(provider.id);
        row.endpoint = source.endpoint; row.api = source.api; row.error = source.error;
        row.editable = this.ctx.settings.writable && source.entry.declared === true;
        row.removable = row.editable && !!object(source.namespace.user).providers &&
          Object.hasOwn(object(object(source.namespace.user).providers), provider.id) && !Object.hasOwn(object(object(source.namespace.base).providers), provider.id);
        const ref = typeof source.profile.apiKeyEnv === 'string' && source.profile.apiKeyEnv ? credentialRef(source.profile.apiKeyEnv) : null;
        const credential = ref ? await this.ctx.credentials.describe(ref) : null;
        row.credential_configured = credential?.configured ?? false; row.credential_writable = credential?.writable ?? true;
        row.models = (await this.ctx.llm.listModels(provider.id)).map(model => {
          const configured = Array.isArray(source.profile.models) ? object(source.profile.models.find(item => object(item).id === model.id)) : {};
          return {model_id: model.id, name: model.name, input_modalities: model.inputModalities ? [...model.inputModalities] : null,
            context_tokens: typeof configured.contextWindow === 'number' ? configured.contextWindow : null,
            max_output_tokens: typeof configured.maxTokens === 'number' ? configured.maxTokens : null};
        });
      } catch (error) {row.error = error instanceof Error ? error.message : String(error);}
      return row;
    }));
  }

  async resolve(selection: Selection, purpose: 'inspect' | 'start' | 'probe', signal?: AbortSignal): Promise<ModelExecution> {
    signal?.throwIfAborted();
    const source = this.source(selection.provider_id);
    if (source.error) throw new ModelConfigurationError(source.error);
    const base = apiEndpoint(source.endpoint!);
    const models = await this.ctx.llm.listModels(selection.provider_id);
    const listed = models.find(model => model.id === selection.model_id);
    if (!listed) throw new ModelConfigurationError('所选模型已移除，请重新选择');
    const metadata = await this.ctx.llm.resolveModelInfo(selection.provider_id, selection.model_id, signal);
    if (!metadata.inputModalities?.includes('image')) throw new ModelConfigurationError('所选模型未声明图像输入能力，请核实提供商的模型配置');
    if (purpose !== 'probe' && selection.limits.capacity_mode !== 'vllm_tokenize') throw new ModelConfigurationError('请在高级设置中选择已确认的容量预检协议');
    const endpoint = base + '/chat/completions';
    const cap = (configured: number | null, declared?: number) => declared && declared > 0
      ? Math.min(configured ?? declared, declared) : configured;
    const declared = Array.isArray(source.profile.models)
      ? object(source.profile.models.find(item => object(item).id === selection.model_id)) : {};
    const profile: ModelProfile = {...selection.limits, endpoint, api: 'openai-completions',
      provider_id: selection.provider_id, provider_name: source.entry.displayName, model_id: selection.model_id,
      credential_ref: typeof source.profile.apiKeyEnv === 'string' && source.profile.apiKeyEnv ? source.profile.apiKeyEnv : null,
      context_tokens: cap(selection.limits.context_tokens, typeof declared.contextWindow === 'number' ? declared.contextWindow : undefined),
      max_output_tokens: cap(selection.limits.max_output_tokens, typeof declared.maxTokens === 'number' ? declared.maxTokens : undefined)};
    let key: string | null = null;
    if (profile.credential_ref) {
      const ref = credentialRef(profile.credential_ref);
      if (purpose !== 'inspect') {
        const credential = await this.ctx.credentials.resolve(ref);
        if (!credential) throw new ModelConfigurationError('所选提供商缺少凭据，请在提供商设置中配置');
        key = credential.value;
      } else if (!(await this.ctx.credentials.describe(ref)).configured) throw new ModelConfigurationError('所选提供商缺少凭据，请在提供商设置中配置');
    }
    if (JSON.stringify(this.source(selection.provider_id).profile) !== JSON.stringify(source.profile))
      throw new ModelConfigurationError('提供商配置在读取期间发生变化，请刷新后再操作');
    signal?.throwIfAborted();
    return {profile, api_key: key};
  }

  async save(edit: ProviderEdit, apiKey?: string | null): Promise<void> {
    const namespace = this.namespace(), id = edit.provider_id;
    const current = object(object(namespace.value).providers)[id];
    if (current && !this.ctx.llm.listConfigurableProviders().some(row => row.provider === id && row.declared === true))
      throw new ModelConfigurationError('内置提供商请通过DSH设置管理');
    const endpoint = apiEndpoint(edit.endpoint), previous = object(current);
    const reference = typeof previous.apiKeyEnv === 'string' ? previous.apiKeyEnv : `IAD_MODEL_${id.replace(/-/g, '_').toUpperCase()}`;
    const key = apiKey ? assertUsableApiKey(apiKey, 'iad-harness', reference) : undefined;
    if (key && !(await this.ctx.credentials.describe(credentialRef(reference))).writable)
      throw new ModelConfigurationError('该凭据由只读来源提供，不能在页面覆盖');
    const profile = {displayName: edit.name, api: 'openai-completions', baseURL: endpoint,
      models: edit.models.map(model => ({id: model.model_id, name: model.name || model.model_id, input: model.input_modalities || [],
        ...(model.context_tokens ? {contextWindow: model.context_tokens} : {}), ...(model.max_output_tokens ? {maxTokens: model.max_output_tokens} : {})})),
      ...(key && !previous.apiKeyEnv ? {apiKeyEnv: reference} : {})};
    if (this.editing.has(id)) throw new ModelConfigurationError('提供商正在更新，请等待保存完成');
    this.editing.add(id);
    try {
      await this.ctx.settings.mutate(namespace.ns, Object.entries(profile).map(([field, value]) =>
        ({op: 'set' as const, path: ['providers', id, field], value})), edit.expected_revision);
      if (key) {
        try {await this.ctx.credentials.set(credentialRef(reference), key);}
        catch {throw new ModelConfigurationError('提供商配置已保存，但凭据未能写入；请刷新并重新配置凭据');}
      }
    } finally {this.editing.delete(id);}
  }

  async remove(reference: ProviderReference): Promise<void> {
    const source = this.source(reference.provider_id);
    const current = (await this.catalog()).find(row => row.provider_id === reference.provider_id);
    if (!current?.removable) throw new ModelConfigurationError('该提供商不属于可删除的用户配置');
    await this.ctx.settings.mutate(source.namespace.ns, [{op: 'unset', path: [...source.entry.settingsPath]}], reference.expected_revision);
  }

  async discover(request: ProviderDiscovery, apiKey?: string | null, signal?: AbortSignal): Promise<ProviderModel[]> {
    const namespace = this.namespace(); let key = apiKey ? assertUsableApiKey(apiKey, 'iad-harness', 'provider') : undefined;
    if (!key && request.provider_id) {
      const source = this.source(request.provider_id);
      if (typeof source.profile.apiKeyEnv === 'string') {
        const credential = await this.ctx.credentials.resolve(credentialRef(source.profile.apiKeyEnv));
        if (!credential) throw new ModelConfigurationError('提供商凭据缺失');
        key = credential.value;
      }
    }
    const models = await this.ctx.llm.discoverModels(namespace.ns, {baseURL: apiEndpoint(request.endpoint), api: 'openai-completions', ...(key ? {apiKey: key} : {})}, signal);
    return models.map(model => ({model_id: model.id, name: model.name || model.id,
      input_modalities: model.inputModalities ? [...model.inputModalities] : null,
      context_tokens: model.contextWindow ?? null, max_output_tokens: model.maxTokens ?? null}));
  }

  async credentialsFor(profile: ModelProfile): Promise<ModelExecution> {
    if (!profile.provider_id || !profile.model_id) throw new ModelConfigurationError('历史作业没有冻结提供商信息，请按当前模型设置重新启动');
    let key: string | null = null;
    if (profile.credential_ref) {
      const credential = await this.ctx.credentials.resolve(credentialRef(profile.credential_ref));
      if (!credential) throw new ModelConfigurationError('原作业提供商凭据缺失，请恢复该凭据或重新启动作业');
      key = credential.value;
    }
    return {profile, api_key: key};
  }
}
