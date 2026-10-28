import {IconButton} from "./IconButton.js";
import {RefreshIcon} from "../AuditIcon.js";
import React, {useEffect, useId, useState} from 'react';
import type {ModelConnection, ModelLimits, WorkbenchModelSettings} from '../../shared/domain.generated.js';
import {defaultModelLimits} from '../../shared/model-settings.generated.js';
import {message, request} from '../api.js';
import {useWorkbenchModel} from '../models.js';
import {workbenchStyles} from '../styles.js';
import {ProviderManager} from './ProviderManager.js';
import {ImageEncoderSettings} from './ImageEncoderSettings.js';
import {WorkbenchHeader} from './layout/WorkbenchHeader.js';
import {PageTabs} from './layout/PageTabs.js';
import {useUnsavedChanges} from '../useUnsavedChanges.js';

type Selection = NonNullable<WorkbenchModelSettings['selection']>;
const numbers = [
  ['context_tokens', '上下文上限'], ['max_output_tokens', '单次输出上限'], ['max_visual_inputs', '视觉输入上限'],
  ['max_request_bytes', '请求体上限（字节）'], ['generation_timeout_seconds', '生成超时（秒）'],
  ['connect_timeout_seconds', '连接超时（秒）'], ['write_timeout_seconds', '发送超时（秒）'], ['pool_timeout_seconds', '连接池等待（秒）'],
] as const satisfies readonly (readonly [keyof ModelLimits, string])[];

export function ModelSettingsPage() {
  const {view, loading, error: loadError, refresh} = useWorkbenchModel();
  const savedSelection = view?.selection || {provider_id: '', model_id: '', limits: {...defaultModelLimits}};
  const parametersId = useId();
  const [tab, setTab] = useState<'model' | 'providers' | 'images'>('model');
  const [imageRefresh,setImageRefresh]=useState(0), [imageState,setImageState]=useState({dirty:false,busy:false});
  const [draft, setDraft] = useState<Selection | null>(null), [expectedRevision, setExpectedRevision] = useState(0);
  const [parameters, setParameters] = useState('{}'), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const reset = () => {
    if (!view) return;
    setDraft(structuredClone(savedSelection)); setExpectedRevision(view.revision);
    setParameters(JSON.stringify(savedSelection.limits.request_parameters, null, 2)); setError(''); setNotice('');
  };
  useEffect(() => {if (view && !draft) reset();}, [view, draft]);
  const provider = view?.providers.find(row => row.provider_id === draft?.provider_id);
  const changed = !!draft && (JSON.stringify(draft) !== JSON.stringify(savedSelection) || parameters !== JSON.stringify(savedSelection.limits.request_parameters, null, 2));
  useUnsavedChanges(changed && !busy);
  let parsedParameters: Record<string, unknown> = {}, parametersError = '';
  try {
    const parsed: unknown = JSON.parse(parameters);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) parametersError = '服务扩展参数必须是 JSON 对象';
    else parsedParameters = parsed as Record<string, unknown>;
  } catch {parametersError = '请输入有效的 JSON 对象';}
  const input = (): Selection => {
    if (!draft?.provider_id || !draft.model_id) throw new Error('请选择提供商和模型');
    if (parametersError) throw new Error(parametersError);
    return {...draft, limits: {...draft.limits, request_parameters: parsedParameters}};
  };
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const result = await request<WorkbenchModelSettings>('/models', {expected_revision: expectedRevision, selection: input()});
      setDraft(result.selection); setExpectedRevision(result.revision); setParameters(JSON.stringify(result.selection!.limits.request_parameters, null, 2));
      await refresh(); setNotice('已保存，新作业使用此模型');
    } catch (failure) {setError(message(failure));} finally {setBusy(false);}
  }
  async function check() {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await request<ModelConnection>('/models/check', input());
      setDraft(previous => previous ? {...previous, limits: {...previous.limits, capacity_mode: result.capacity_mode}} : previous);
      setNotice(`连接正常 · 服务上下文 ${result.context_tokens.toLocaleString()} token；尚未发送图像`);
    } catch (failure) {setError(message(failure));} finally {setBusy(false);}
  }
  return <div className="iad-workbench" data-page="industrial-model-settings"><style>{workbenchStyles}</style>
    <WorkbenchHeader pageId="industrial-model-settings"><IconButton label="刷新" disabled={busy || loading || imageState.busy} onClick={() => tab==='images' ? setImageRefresh(value=>value+1) : void refresh()}><RefreshIcon /></IconButton></WorkbenchHeader>
    <PageTabs label="模型设置分区" items={[{id: 'model', label: '工作台模型'}, {id: 'providers', label: '提供商'}, {id:'images',label:'图像检索'}]} value={tab} onChange={value => {
      if (tab==='images' && (imageState.busy || (imageState.dirty && !window.confirm('有未保存的图像配置，确认放弃修改？')))) return;
      setTab(value);setImageState({dirty:false,busy:false});if (value === 'model') void refresh();
    }}>
    {(loadError || error) && <p role="alert" className="iad-error">{error || loadError}</p>}
    {tab === 'images' ? <ImageEncoderSettings refreshVersion={imageRefresh} onStateChange={setImageState} /> : tab === 'providers' ? <section className="iad-provider-manager" aria-label="提供商管理"><ProviderManager /></section> : <section className="iad-model-configuration">
      <h2>工作台模型</h2><p className="iad-muted">探索、挖掘和审计共用此配置；会话模型独立选择。</p>
      {view?.error && <p role="status" className="iad-muted">已保存配置：{view.error}</p>}
      {!draft ? <p role="status">正在读取配置…</p> : <form className="iad-model-form" onSubmit={save}>
        <fieldset disabled={busy || loading}><section className="iad-section-layout"><div><h3>模型选择</h3></div><div><div className="iad-model-fields">
          <label className="iad-field">提供商<select aria-label="工作台提供商" value={draft.provider_id} onChange={event => {
            setDraft({provider_id: event.target.value, model_id: '', limits: {...defaultModelLimits}}); setParameters('{}'); setError(''); setNotice('');
          }}><option value="">选择提供商</option>{draft.provider_id && !provider && <option value={draft.provider_id}>已失效 · {draft.provider_id}</option>}
            {view?.providers.map(row => <option key={row.provider_id} value={row.provider_id} disabled={!!row.error}>{row.name}{row.error ? ' · 暂不可用' : ''}</option>)}</select></label>
          <label className="iad-field">模型<select aria-label="工作台模型" value={draft.model_id} disabled={!provider || !!provider.error} onChange={event => {setDraft({...draft, model_id: event.target.value}); setError(''); setNotice('');}}>
            <option value="">选择模型</option>{draft.model_id && !provider?.models.some(row => row.model_id === draft.model_id) && <option value={draft.model_id}>已失效 · {draft.model_id}</option>}
            {provider?.models.map(row => <option key={row.model_id} value={row.model_id} disabled={!row.input_modalities?.includes('image')}>{row.name}{row.input_modalities?.includes('image') ? '' : ' · 未声明图像能力'}</option>)}</select></label>
        </div>
        {provider && <div className="iad-model-endpoint"><span className="iad-muted">服务地址</span><p>{provider.endpoint || provider.error}</p></div>}
        </div></section>
        <section className="iad-section-layout"><div><h3>高级设置</h3><p className="iad-muted">未填写时使用服务声明值</p></div>
        <details className="iad-model-advanced"><summary>容量与超时</summary><div className="iad-model-fields">
          <label className="iad-field">容量预检<select aria-label="容量预检协议" value={draft.limits.capacity_mode || ''} onChange={event => setDraft({...draft, limits: {...draft.limits, capacity_mode: event.target.value === 'vllm_tokenize' ? 'vllm_tokenize' : null}})}>
            <option value="">尚未确认</option><option value="vllm_tokenize">vLLM /tokenize</option></select></label>
          {numbers.map(([key, label]) => <label key={key} className="iad-field">{label}<input type="number" aria-label={label} min={key.endsWith('_seconds') ? 0 : 1} step={key.endsWith('_seconds') ? 'any' : '1'}
            value={draft.limits[key] ?? ''} placeholder="使用服务声明值" onChange={event => setDraft({...draft, limits: {...draft.limits, [key]: event.target.value === '' ? null : Number(event.target.value)}})} /></label>)}
        </div><label className="iad-field">服务扩展参数（JSON）<textarea aria-label="服务扩展参数" aria-invalid={parametersError ? true : undefined} aria-describedby={parametersError ? parametersId : undefined} rows={4} value={parameters} onChange={event => setParameters(event.target.value)} /></label>{parametersError && <p id={parametersId} role="alert" className="iad-error">{parametersError}</p>}</details></section>
        <div className="iad-form-footer">{changed && <span className="iad-muted">有未保存的更改</span>}<button type="button" disabled={!draft.provider_id || !draft.model_id || !!parametersError} onClick={() => void check()}>检查连接</button>
          <button className="iad-primary" type="submit" disabled={!changed || !draft.provider_id || !draft.model_id || !!parametersError}>{busy ? '处理中…' : '保存配置'}</button>
          <button type="button" disabled={!changed} onClick={reset}>重置</button></div>
        </fieldset>
      </form>}
      {notice && <p role="status">{notice}</p>}
    </section>}
    </PageTabs>
  </div>;
}
