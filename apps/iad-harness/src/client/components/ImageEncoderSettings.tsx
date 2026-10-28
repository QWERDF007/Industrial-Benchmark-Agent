import React, {useEffect, useState} from 'react';
import type {EmbeddingProfile, ImageEncoderConfig, ImageEncoderSettings as Settings, ImageProfileCreate} from '../../shared/domain.generated.js';
import {imageBackbones} from '../../shared/image-encoder.parameters.generated.js';
import {message, request} from '../api.js';
import {useUnsavedChanges} from '../useUnsavedChanges.js';

type Draft = Omit<ImageEncoderConfig, 'profile'> & {model_id: ImageProfileCreate['model_id'] | ''; weights_ref: string; source_ref: string;
  storage_dtype: 'float32' | 'float16'};

function editable(view: Settings): Draft {
  const selection=view.selection, resources=view.resources;
  return {model_id:selection?.profile.model_id || '', weights_ref:selection?.profile.weights_ref || '',
    source_ref:selection?.profile.source_ref || '', device:resources.device, batch_size:resources.batch_size,
    gpu_memory_mb:resources.gpu_memory_mb, compute_dtype:resources.compute_dtype,
    decode_workers:resources.decode_workers, decode_memory_mb:resources.decode_memory_mb,
    storage_dtype:selection?.profile.storage_dtype || 'float32'};
}

export function ImageEncoderSettings({refreshVersion, onStateChange}: {
  refreshVersion: number; onStateChange(state: {dirty: boolean; busy: boolean}): void;
}) {
  const [view,setView]=useState<Settings | null>(null), [draft,setDraft]=useState<Draft | null>(null);
  const [revision,setRevision]=useState(0), [loading,setLoading]=useState(true), [busy,setBusy]=useState(false);
  const [error,setError]=useState(''), [notice,setNotice]=useState('');
  const changed=!!draft && !!view && JSON.stringify(draft)!==JSON.stringify(editable(view));
  useUnsavedChanges(changed && !busy);
  useEffect(()=>{onStateChange({dirty:changed,busy});},[changed,busy,onStateChange]);
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setError('');
    void request<Settings>('/images/settings',undefined,undefined,controller.signal).then(settings=>{
      setView(settings);
      if (!changed) {setDraft(editable(settings));setRevision(settings.revision);}
    }).catch(failure=>{if(!controller.signal.aborted)setError(message(failure));})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[refreshVersion]);
  const backbone=draft?.model_id ? imageBackbones[draft.model_id] : null;
  const validResources=!!draft && /^(cpu|cuda:[0-9]+)$/.test(draft.device) && Number.isInteger(draft.batch_size) && draft.batch_size>=1 && draft.batch_size<=256 &&
    Number.isInteger(draft.gpu_memory_mb) && draft.gpu_memory_mb>=256 && draft.gpu_memory_mb<=12288 && Number.isInteger(draft.decode_workers) && draft.decode_workers>=1 && draft.decode_workers<=8 &&
    Number.isInteger(draft.decode_memory_mb) && draft.decode_memory_mb>=1 && draft.decode_memory_mb<=1024 && !(draft.device==='cpu' && draft.compute_dtype==='float16');
  const valid=validResources && (!draft?.model_id || (!!draft.weights_ref.trim() && (backbone?.backend==='torchscript' || backbone?.local_snapshot || !!draft.source_ref.trim())));
  async function input(): Promise<ImageEncoderConfig | null> {
    if (!draft || !valid) throw new Error('请填写有效的模型、路径和资源配置');
    if (!draft.model_id) return null;
    const profile=await request<EmbeddingProfile>('/images/profiles',{model_id:draft.model_id,weights_ref:draft.weights_ref.trim(),
      source_ref:backbone?.backend==='torchscript' ? null : draft.source_ref.trim() || null,storage_dtype:draft.storage_dtype});
    return {profile,device:draft.device,batch_size:draft.batch_size,gpu_memory_mb:draft.gpu_memory_mb,compute_dtype:draft.compute_dtype,
      decode_workers:draft.decode_workers,decode_memory_mb:draft.decode_memory_mb};
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();setBusy(true);setError('');setNotice('');
    try {
      if (!draft) return;
      const {model_id,weights_ref,source_ref,storage_dtype,...resources}=draft;
      const result=await request<Settings>('/images/settings',{expected_revision:revision,selection:await input(),resources});
      setView(result);setDraft(editable(result));setRevision(result.revision);setNotice('已保存图像检索配置');
    } catch(failure) {setError(message(failure));} finally {setBusy(false);}
  }
  async function check() {
    setBusy(true);setError('');setNotice('');
    try {
      const result=await request<{model_id:string;dim:number;device:string;norm:number}>('/images/settings/check',{selection:await input()});
      setNotice(`加载正常 · ${result.model_id} · ${result.dim} 维 · ${result.device}`);
    } catch(failure) {setError(message(failure));} finally {setBusy(false);}
  }
  return <section className="iad-model-configuration" aria-label="图像检索设置" aria-busy={busy || loading}>
    <h2>图像检索</h2>
    {error && <p role="alert" className="iad-error">{error}</p>}
    {!draft ? <p role="status">正在读取配置…</p> : <form aria-label="图像检索配置" className="iad-model-form" onSubmit={save}>
      <fieldset disabled={busy || loading}>
        <section className="iad-section-layout"><div><h3>图像编码器</h3></div><div className="iad-model-fields">
          <label className="iad-field">模型<select aria-label="图像编码器" value={draft.model_id} onChange={event=>{
            setDraft({...draft,model_id:event.target.value as Draft['model_id'],weights_ref:'',source_ref:''});setError('');setNotice('');
          }}><option value="">仅严格同图</option>{Object.keys(imageBackbones).map(id=><option key={id} value={id}>{id}</option>)}</select></label>
          {draft.model_id && <><label className="iad-field">权重路径<input aria-label="图像编码权重路径" required value={draft.weights_ref} onChange={event=>setDraft({...draft,weights_ref:event.target.value})} /></label>
          {backbone?.backend==='torch_hub' && <label className="iad-field">官方源码目录{backbone.local_snapshot ? '（.pth 必填）' : ''}<input aria-label="图像编码源码目录" required={!backbone.local_snapshot} value={draft.source_ref} onChange={event=>setDraft({...draft,source_ref:event.target.value})} /></label>}
          {backbone && <p className="iad-muted">{backbone.dim} 维 · {backbone.local_snapshot ? '本地模型目录或 .pth 权重' : `${backbone.input_size} px · ${backbone.processor}`}</p>}
          </>}
        </div></section>
        <section className="iad-section-layout"><div><h3>运行资源</h3></div><div className="iad-model-fields">
          {draft.model_id && <><label className="iad-field">设备<input aria-label="图像编码设备" required pattern="cpu|cuda:[0-9]+" value={draft.device} onChange={event=>setDraft({...draft,device:event.target.value})} /></label>
          <label className="iad-field">批量<input aria-label="图像编码批量" type="number" min={1} max={256} value={draft.batch_size} onChange={event=>setDraft({...draft,batch_size:Number(event.target.value)})} /></label>
          <label className="iad-field">显存预算（MiB）<input aria-label="图像编码显存预算" type="number" min={256} max={12288} value={draft.gpu_memory_mb} onChange={event=>setDraft({...draft,gpu_memory_mb:Number(event.target.value)})} /></label>
          </>}
          <label className="iad-field">解码线程<input aria-label="图像解码线程" type="number" min={1} max={8} value={draft.decode_workers} onChange={event=>setDraft({...draft,decode_workers:Number(event.target.value)})} /></label>
          <label className="iad-field">解码内存（MiB）<input aria-label="图像解码内存预算" type="number" min={1} max={1024} value={draft.decode_memory_mb} onChange={event=>setDraft({...draft,decode_memory_mb:Number(event.target.value)})} /></label>
          {draft.model_id && <><label className="iad-field">计算精度<select aria-label="图像编码计算精度" value={draft.compute_dtype} onChange={event=>setDraft({...draft,compute_dtype:event.target.value as Draft['compute_dtype']})}><option value="float32">FP32</option><option value="float16" disabled={draft.device==='cpu'}>FP16</option></select></label>
          <label className="iad-field">向量存储<select aria-label="图像向量存储精度" value={draft.storage_dtype} onChange={event=>setDraft({...draft,storage_dtype:event.target.value as Draft['storage_dtype']})}><option value="float32">FP32</option><option value="float16">FP16</option></select></label>
          </>}
        </div></section>
        {view?.selection && <details className="iad-model-advanced"><summary>已保存配置</summary><code>{view.selection.profile.profile_id}</code><p className="iad-muted">{view.selection.profile.input_size} px · {view.selection.profile.pooling} · {view.selection.profile.color_conversion}</p></details>}
        <div className="iad-form-footer">{changed && <span className="iad-muted">有未保存的更改</span>}
          <button type="button" disabled={!valid || !draft.model_id} onClick={()=>void check()}>{busy ? '处理中…' : '检查加载'}</button>
          <button className="iad-primary" type="submit" disabled={!changed || !valid}>保存图像配置</button>
          <button type="button" disabled={!changed} onClick={()=>{if(view)setDraft(editable(view));setRevision(view?.revision || 0);setError('');setNotice('');}}>重置图像配置</button>
        </div>
      </fieldset>
    </form>}
    {notice && <p role="status">{notice}</p>}
  </section>;
}
