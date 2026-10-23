import React, {useState} from 'react';
import {v4 as uuid} from 'uuid';
import type {ProviderEdit, ProviderModel, WorkbenchProvider} from '../../shared/domain.generated.js';
import {message, request} from '../api.js';
import {useWorkbenchModel} from '../models.js';
import {Modal} from './Modal.js';
import {DeleteAction} from './DeleteAction.js';

export function ProviderManager() {
  const {view, refresh} = useWorkbenchModel();
  const [editing, setEditing] = useState<{provider?: WorkbenchProvider; revision: number} | null>(null);
  const [notice, setNotice] = useState('');
  return <>
    <header className="iad-section-header"><h2>提供商</h2><button className="iad-primary" disabled={view?.provider_revision == null}
      onClick={() => setEditing({revision: view!.provider_revision!})}>添加提供商</button></header>
    <p className="iad-muted">与 DSH 设置共用提供商资料和凭据。</p>
    <div className="iad-table-scroll"><table className="iad-resource-table" aria-label="提供商列表"><thead><tr><th>提供商名称</th><th>服务地址</th><th className="iad-number">模型数</th><th>操作</th></tr></thead><tbody>{view?.providers.map(provider => <tr key={provider.provider_id}>
      <td><strong>{provider.name}</strong>{provider.error && <p className="iad-error">{provider.error}</p>}</td>
      <td className="iad-provider-endpoint">{provider.endpoint || provider.api || '尚未配置'}</td><td className="iad-number">{provider.models.length}</td>
      <td><div className="iad-row"><button disabled={!provider.editable} onClick={() => setEditing({provider, revision: view!.provider_revision!})}>编辑</button>
        {provider.removable && <DeleteAction title="删除提供商" name={provider.name} description="保留历史作业及其凭据引用。正在运行的作业不受影响。"
          onDelete={async () => {await request(`/models/providers/${encodeURIComponent(provider.provider_id)}?expected_revision=${view!.provider_revision}`, undefined, 'DELETE'); await refresh(); setNotice('已删除提供商');}} />}</div></td>
    </tr>)}</tbody></table></div>
    {notice && <p role="status">{notice}</p>}
    {editing && <ProviderEditor provider={editing.provider} revision={editing.revision} onClose={() => setEditing(null)}
      onSaved={async () => {await refresh(); setEditing(null); setNotice('提供商已保存');}} />}
  </>;
}

function ProviderEditor({provider, revision, onClose, onSaved}: {provider?: WorkbenchProvider; revision: number; onClose(): void; onSaved(): Promise<void>}) {
  const [id] = useState(provider?.provider_id || `vision-${uuid()}`);
  const [name, setName] = useState(provider?.name || ''), [endpoint, setEndpoint] = useState(provider?.endpoint || ''), [key, setKey] = useState('');
  const [models, setModels] = useState<ProviderModel[]>(provider?.models || []);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function discover() {
    setBusy(true); setError('');
    try {
      const result = await request<{models: ProviderModel[]}>('/models/providers/discover', {endpoint, provider_id: provider?.provider_id, api_key: key || null});
      setModels(result.models);
      if (!result.models.length) setError('服务未返回模型，可以手动添加');
    } catch (failure) {setError(message(failure));} finally {setBusy(false);}
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const [first, ...remaining] = models;
      if (!first) throw new Error('请添加至少一个模型');
      const body: ProviderEdit = {expected_revision: revision, provider_id: id, name, endpoint, models: [first, ...remaining], api_key: key || null};
      await request('/models/providers', body); setKey(''); await onSaved();
    } catch (failure) {setError(message(failure));} finally {setBusy(false);}
  }
  return <Modal title={provider ? '编辑提供商' : '添加提供商'} className="iad-provider-dialog" onClose={() => {if (!busy) onClose();}}>
    <form onSubmit={save}><fieldset disabled={busy}>
      <div className="iad-model-fields">
        <label className="iad-field">提供商名称<input autoFocus required aria-label="提供商名称" value={name} onChange={event => setName(event.target.value)} /></label>
        <label className="iad-field">服务地址<input required type="url" aria-label="服务地址" placeholder="https://…/v1" value={endpoint} onChange={event => setEndpoint(event.target.value)} /></label>
      </div>
      <label className="iad-field">API 密钥<input type="password" autoComplete="new-password" aria-label="API 密钥" value={key}
        disabled={provider?.credential_writable === false} placeholder={provider?.credential_configured ? '已配置，留空保留' : '可选'} onChange={event => setKey(event.target.value)} /></label>
      <header className="iad-section-header"><h3>模型</h3><div className="iad-row"><button type="button" disabled={!endpoint} onClick={() => void discover()}>读取模型</button>
        <button type="button" onClick={() => setModels([...models, {model_id: '', name: '', input_modalities: ['text'], context_tokens: null, max_output_tokens: null}])}>添加模型</button></div></header>
      {models.map((model, index) => <div className="iad-provider-model" key={index}>
        <div className="iad-model-fields"><label className="iad-field">模型 ID<input aria-label={`模型 ID ${index + 1}`} required value={model.model_id} onChange={event => setModels(models.map((row, position) => position === index ? {...row, model_id: event.target.value} : row))} /></label>
          <label className="iad-field">显示名称<input aria-label={`模型名称 ${index + 1}`} value={model.name} onChange={event => setModels(models.map((row, position) => position === index ? {...row, name: event.target.value} : row))} /></label>
          <label className="iad-field">上下文上限<input type="number" min="1" placeholder="未声明" value={model.context_tokens ?? ''} onChange={event => setModels(models.map((row, position) => position === index ? {...row, context_tokens: event.target.value ? Number(event.target.value) : null} : row))} /></label>
          <label className="iad-field">输出上限<input type="number" min="1" placeholder="未声明" value={model.max_output_tokens ?? ''} onChange={event => setModels(models.map((row, position) => position === index ? {...row, max_output_tokens: event.target.value ? Number(event.target.value) : null} : row))} /></label></div>
        <div className="iad-row"><label><input type="checkbox" checked={model.input_modalities?.includes('image') || false} onChange={event => setModels(models.map((row, position) => position === index ? {...row, input_modalities: event.target.checked ? ['text', 'image'] : ['text']} : row))} /> 支持图像输入</label>
          <button type="button" onClick={() => setModels(models.filter((_, position) => position !== index))}>移除模型</button></div>
      </div>)}
      {error && <p role="alert" className="iad-error">{error}</p>}
      <div className="iad-form-actions"><button type="button" onClick={onClose}>取消</button><button className="iad-primary" disabled={!name.trim() || !endpoint || !models.length} type="submit">{busy ? '处理中…' : '保存提供商'}</button></div>
    </fieldset></form>
  </Modal>;
}
