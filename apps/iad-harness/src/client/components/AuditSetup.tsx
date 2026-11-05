import {Select} from './Select.js';
import {Button} from './Button.js';
import React, {useEffect, useRef, useState} from 'react';
import type {AuditStartRequest, Dataset, Filters, JobSnapshot, SamplePage} from '../../shared/contracts.js';
import type {KnowledgeVersionCatalog} from '../../shared/domain.generated.js';
import {message, request, sampleQuery} from '../api.js';
import {useWorkbenchModel} from '../models.js';
import {useWorkspace} from '../workspace.js';
import {promptDefaults} from '../../shared/prompt-defaults.generated.js';

interface AuditSource {dataset:Dataset;catalog:KnowledgeVersionCatalog;total:number}

export function AuditSetup({datasets, filters, jobs, revision, onStarted, onCancel, onBusyChange}: {
  datasets:Dataset[];filters:Filters;jobs:JobSnapshot[];revision:number;
  onStarted(jobs:JobSnapshot[]):void;onCancel():void;onBusyChange(busy:boolean):void;
}) {
  const {workspace}=useWorkspace(), model=useWorkbenchModel();
  const view=workspace.view('industrial-audit');
  const identity=JSON.stringify([datasets.map(dataset=>dataset.dataset_id).sort(),filters,revision]);
  const [result,setResult]=useState<{identity:string;rows:AuditSource[];error:string}>();
  const rows=result?.identity===identity?result.rows:null;
  const [busy,setBusy]=useState(false), [error,setError]=useState('');
  const [instruction,setInstruction]=useState<string>(promptDefaults.audit);
  const requests=useRef(new Map<string,AuditStartRequest>()), started=useRef(new Map<string,JobSnapshot>());
  useEffect(()=>{
    const controller=new AbortController();
    Promise.all(datasets.map(async dataset=>{
      const [catalog,samples]=await Promise.all([
        request<KnowledgeVersionCatalog>(`/knowledge/versions?${new URLSearchParams({dataset_id:dataset.dataset_id})}`,undefined,undefined,controller.signal),
        request<SamplePage>(`/samples/${encodeURIComponent(dataset.task_id)}?${sampleQuery(dataset.dataset_id,filters,1,1)}`,undefined,undefined,controller.signal),
      ]);
      return {dataset,catalog,total:samples.total};
    })).then(rows=>{if(!controller.signal.aborted)setResult({identity,rows,error:''});})
      .catch(error=>{if(!controller.signal.aborted)setResult({identity,rows:[],error:message(error)});});
    return ()=>controller.abort();
  },[identity]);
  const unavailable=rows?.find(({catalog,total})=>!total || !catalog.versions.some(version=>version.version_id===catalog.current_version_id));
  const reason=!model.ready?model.error || model.view?.error || '请先配置工作台模型'
    : !instruction.trim()?'请填写审计提示词'
    : result?.identity===identity && result.error?result.error
    : !rows?'正在读取范围和已发布知识'
    : !rows.length?'请选择子数据集'
    : unavailable?`${unavailable.dataset.name}：${unavailable.total?'请先生成统一知识':'当前范围没有图像'}`
    : !started.current.size && jobs.some(job=>['PENDING','RUNNING'].includes(job.status))?'当前范围仍有审计作业执行中':'';
  const cancel=()=>{if(!busy){if(started.current.size)onStarted(Array.from(started.current.values()));else onCancel();}};
  const provider=model.view?.providers.find(provider=>provider.provider_id===model.view?.selection?.provider_id);
  const selectedModel=provider?.models.find(item=>item.model_id===model.view?.selection?.model_id);
  async function start(){
    if(reason || !rows?.length || busy)return;
    const corpus_scope:NonNullable<AuditStartRequest['corpus_scope']>={kind:'datasets',
      dataset_ids:[rows[0].dataset.dataset_id,...rows.slice(1).map(row=>row.dataset.dataset_id)]};
    setBusy(true);onBusyChange(true);setError('');
    try{
      for(const {dataset,catalog} of rows){
        if(started.current.has(dataset.dataset_id))continue;
        if(!requests.current.has(dataset.dataset_id)){
          const knowledge=catalog.current_version_id;
          requests.current.set(dataset.dataset_id,{submission_id:crypto.randomUUID(),dataset_id:dataset.dataset_id,
            knowledge_version_id:knowledge,filters,consistency_mode:view.auditConsistencyMode,instruction,
            corpus_scope});
        }
        const job=await request<JobSnapshot>('/audit/start',requests.current.get(dataset.dataset_id));
        started.current.set(dataset.dataset_id,job);
      }
      onStarted(Array.from(started.current.values()));
    }catch(error){setError(`${started.current.size?`已启动 ${started.current.size} 个子数据集。`:''}${message(error)}`);}
    finally{setBusy(false);onBusyChange(false);}
  }
  return <>
    <div className="audit-create-grid">
      <label className="audit-field"><span>模型</span><Select id="audit-create-model" aria-label="审计模型" disabled>
        <option>{selectedModel?.name || model.view?.selection?.model_id || '未配置'}</option></Select></label>
      <label className="audit-field"><span>一致性检查</span><Select id="audit-create-mode" aria-label="审计一致性模式" value={view.auditConsistencyMode}
        disabled={busy || requests.current.size>0} onChange={event=>workspace.updateView('industrial-audit',{auditConsistencyMode:event.target.value as NonNullable<AuditStartRequest['consistency_mode']>})}>
        <option value="exact">精确检查</option><option value="combined">精确与视觉检查</option></Select></label>
      <label className="audit-field"><span>完整提示词</span><textarea id="audit-create-prompt" aria-label="审计完整提示词"
        disabled={busy || requests.current.size>0} value={instruction} onChange={event=>setInstruction(event.target.value)} /></label>
    </div>
    <div className="audit-confirm"><div><h3>确认并启动</h3><p id="audit-create-summary">
      {datasets.length} 个子数据集，{rows?rows.reduce((total,row)=>total+row.total,0):'…'} 张图像，{selectedModel?.name || model.view?.selection?.model_id || '未配置模型'}，当前已发布知识
    </p></div><div className="audit-create-actions"><Button type="button"  id="audit-create-cancel" disabled={busy} onClick={cancel}>取消</Button>
      <Button type="button" variant="primary" id="audit-create-submit" disabled={busy || !!reason} onClick={()=>void start()}>{busy?'启动中…':started.current.size?'继续启动剩余审计':'开始审计'}</Button></div></div>
    {reason && <p role="status">{reason}</p>}{error && <p role="alert">{error}</p>}
    {!!rows?.length && <details className="audit-create-versions"><summary>查看冻结知识依据</summary><ul>{rows.map(({dataset,catalog})=><li key={dataset.dataset_id}>
      {dataset.name}：{catalog.current_version_id || '暂无知识'}
    </li>)}</ul></details>}
  </>;
}
