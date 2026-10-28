import React,{useEffect,useRef,useState} from 'react';
import type {ConsistencyBatch,ConsistencyBatchList,Dataset,ImageRetrieve,ResultPage} from '../../shared/contracts.js';
import type {ImageEncoderSettings} from '../../shared/domain.generated.js';
import {jobPhases,jobStatuses} from '../../shared/job-display.js';
import {imageRelations} from '../../shared/consistency-presentation.js';
import {message,request} from '../api.js';
import {useWorkspace} from '../workspace.js';
import {ConsistencyScopePicker} from './ConsistencyScopePicker.js';
import {JobSync} from './JobSync.js';
import {useConsistencyStart} from '../useConsistencyStart.js';
import {ConsistencyEmpty} from './ConsistencyEmpty.js';

export function ConsistencyJobsPanel({datasets}:{datasets:Dataset[]}) {
  const {state,workspace}=useWorkspace(),location=state.consistency;
  const [subject,setSubject]=useState('all'),[mode,setMode]=useState<NonNullable<ImageRetrieve['mode']>>('exact');
  const [batches,setBatches]=useState<ConsistencyBatch[]>([]),[revision,setRevision]=useState(0);
  const [cancelling,setCancelling]=useState(false),[error,setError]=useState('');
  const actions=useConsistencyStart(batchId=>{workspace.updateConsistency({batchId},true);setRevision(value=>value+1);});
  const busy=actions.busy||cancelling;
  const [sync,setSync]=useState<{state:'syncing'|'current'|'stale';error:string;at:number|null}>({state:'syncing',error:'',at:null});
  const [results,setResults]=useState<ResultPage|null>(null),[cursor,setCursor]=useState<string|undefined>();
  const [encoder,setEncoder]=useState<ImageEncoderSettings|null>(null);
  const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{const controller=new AbortController();request<ImageEncoderSettings>('/images/settings',undefined,undefined,controller.signal)
    .then(value=>{if(!controller.signal.aborted)setEncoder(value);}).catch(failure=>{if(!controller.signal.aborted)setError(message(failure));});return()=>controller.abort();},[]);
  useEffect(()=>{
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
    async function poll(){
      let active=false;
      const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(10000)]);
      setSync(previous=>({...previous,state:previous.error ? 'stale' : 'syncing'}));
      try{
        const catalog=await request<ConsistencyBatchList>('/consistency/runs',undefined,undefined,signal);
        if(location.batchId && !catalog.items.some(item=>item.batch_id===location.batchId))catalog.items.push(await request<ConsistencyBatch>(`/consistency/runs/${encodeURIComponent(location.batchId)}`,undefined,undefined,signal));
        if(controller.signal.aborted)return;
        setBatches(catalog.items);setSync({state:'current',error:'',at:Date.now()});
        active=catalog.items.some(item=>['RUNNING','PENDING'].includes(item.status));
      }catch(failure){if(!controller.signal.aborted)setSync(previous=>({...previous,state:'stale',error:message(failure)}));}
      finally{if(!controller.signal.aborted)timer=setTimeout(poll,active ? 1200 : 5000);}
    }
    void poll();return()=>{controller.abort();clearTimeout(timer);};
  },[location.batchId,revision]);
  const selected=batches.find(item=>item.batch_id===location.batchId) || (!location.batchId ? batches[0] : undefined);
  useEffect(()=>{setCursor(undefined);},[selected?.batch_id]);
  useEffect(()=>{
    const controller=new AbortController();setResults(null);
    if(selected)request<ResultPage>('/consistency/query',{selection:{kind:'batch',batch_id:selected.batch_id},cursor,page_size:20},undefined,controller.signal)
      .then(value=>{if(!controller.signal.aborted)setResults(value);}).catch(failure=>{if(!controller.signal.aborted)setError(message(failure));});
    return()=>controller.abort();
  },[selected?.batch_id,selected?.pair_count,cursor]);
  async function cancel(){
    if(!selected)return;setCancelling(true);setError('');
    try{await request(`/consistency/runs/${encodeURIComponent(selected.batch_id)}/cancel`,{});if(mounted.current)setRevision(value=>value+1);}
    catch(failure){if(mounted.current)setError(message(failure));}
    finally{if(mounted.current)setCancelling(false);}
  }
  const scope=location.scope || {kind:'all_registered' as const};
  const latestIndex=batches.filter(batch=>batch.kind==='index').sort((left,right)=>right.created_at.localeCompare(left.created_at))[0];
  const latestCheck=batches.filter(batch=>batch.kind==='consistency').sort((left,right)=>right.created_at.localeCompare(left.created_at))[0];
  return <section aria-label="一致性批次">
    {(error||actions.error) && <p role="alert" className="iad-error">{error||actions.error}</p>}{actions.notice && <p role="status">{actions.notice}</p>}
    <form className="iad-consistency-query" onSubmit={event=>{event.preventDefault();void actions.start('/consistency/start',{subjects:subject==='all' ? {kind:'all_registered'} : {kind:'datasets',dataset_ids:[subject]},corpus_scope:scope,mode});}}>
      <fieldset disabled={busy}><legend className="iad-visually-hidden">批量检查范围与检索库</legend><div className="iad-row">
        <label className="iad-filter">检查范围<select aria-label="检查范围" value={subject} onChange={event=>setSubject(event.target.value)}><option value="all">全部已注册数据集</option>{datasets.map(dataset=><option key={dataset.dataset_id} value={dataset.dataset_id}>{dataset.name}</option>)}</select></label>
        <ConsistencyScopePicker datasets={datasets} value={scope} onChange={value=>workspace.updateConsistency({scope:value},true)} />
        <label className="iad-filter">检查方式<select aria-label="检查方式" value={mode} onChange={event=>setMode(event.target.value as NonNullable<ImageRetrieve['mode']>)}><option value="exact">严格同图</option><option value="combined">严格同图与视觉候选</option><option value="visual">视觉候选</option></select></label>
        <button className="iad-primary" type="submit" disabled={!datasets.length}>开始批量检查</button>
        <button type="button" disabled={!datasets.length} onClick={()=>void actions.start('/images/index/prepare',{corpus_scope:scope})}>准备检索索引</button>
      </div></fieldset>
    </form>
    <section className="iad-consistency-job-summary" aria-label="作业概览">
      <JobSync label="批次状态同步" syncState={sync.state} lastSyncedAt={sync.at} error={sync.error} refresh={()=>setRevision(value=>value+1)} />
      <div><span>作业总数</span><strong>{batches.length}</strong></div>
      <div><span>最近索引作业</span><strong>{latestIndex ? `${latestIndex.completed} / ${latestIndex.total}` : '尚无记录'}</strong><small>{latestIndex ? jobStatuses[latestIndex.status] : !encoder ? '正在读取配置' : !encoder.selection ? '图像编码器未配置' : '尚未准备索引'}</small></div>
      <div><span>最近一致性检查</span><strong>{latestCheck ? `${latestCheck.completed} / ${latestCheck.total}` : '尚无记录'}</strong><small>{latestCheck ? `${jobStatuses[latestCheck.status]} · 比较 ${latestCheck.pair_count} 对` : '尚未执行检查'}</small></div>
    </section>
    {!batches.length ? <ConsistencyEmpty title="尚无检查作业" description="严格同图检查可直接执行；视觉检索需要先在图像检索设置中配置编码器并准备对应索引。" /> : <div className="iad-consistency-jobs">
      <div className="iad-consistency-list iad-table-scroll"><table className="iad-resource-table" aria-label="作业记录"><thead><tr><th>作业</th><th>类型</th><th>检查范围 / 检索库</th><th>进度</th><th>状态</th><th>操作</th></tr></thead><tbody>{batches.map(batch=><tr key={batch.batch_id} aria-selected={batch.batch_id===selected?.batch_id}>
        <td><time dateTime={batch.created_at}>{new Date(batch.created_at).toLocaleString()}</time><small title={batch.batch_id}>{batch.batch_id}</small></td>
        <td>{batch.kind==='index' ? '索引准备' : '一致性检查'}</td><td>{batch.scopes.subjects.sample_count} / {batch.scopes.corpus.sample_count} 张</td>
        <td>{batch.completed} / {batch.total}{!!batch.failed && <span className="iad-error"> · 失败 {batch.failed}</span>}</td><td>{jobStatuses[batch.status]}</td>
        <td><button aria-pressed={batch.batch_id===selected?.batch_id} onClick={()=>workspace.updateConsistency({batchId:batch.batch_id},true)}>查看结果</button></td>
      </tr>)}</tbody></table></div>
      {selected && <section data-batch-id={selected.batch_id} aria-label="批次详情">
        <header className="iad-consistency-job-detail-heading"><h2>批次详情 · {selected.kind==='index' ? '索引准备' : '一致性检查'}</h2><strong role="status">{selected.cancel_requested && ['PENDING','RUNNING'].includes(selected.status) ? '正在停止' : jobStatuses[selected.status]}</strong></header>
        <div className="iad-row iad-consistency-job-progress"><span>完成 {selected.completed} · 失败 {selected.failed} · 未处理 {selected.unprocessed} · 共 {selected.total} 张</span>
          <span>比较 {selected.pair_count} 对</span>
          {['PENDING','RUNNING'].includes(selected.status) ? <button disabled={busy || selected.cancel_requested} onClick={()=>void cancel()}>停止批次</button>
            : selected.failed+selected.unprocessed>0 && <button disabled={busy} onClick={()=>void actions.start(`/consistency/runs/${encodeURIComponent(selected.batch_id)}/retry`,{})}>重试失败与未处理</button>}
        </div>
        <progress aria-label="批次样本进度" max={selected.total || 1} value={selected.completed+selected.failed} />
        <p className="iad-muted">冻结检查范围 {selected.scopes.subjects.sample_count} 张 · 检索库 {selected.scopes.corpus.sample_count} 张</p>
        {selected.error && <p role="alert">{selected.error.code} · {selected.error.message}</p>}
        <details className="iad-consistency-child-jobs" open={selected.failed>0}><summary>子作业与失败明细 · {selected.children.length} 项</summary><div className="iad-table-scroll"><table className="iad-resource-table" aria-label="批次子作业"><thead><tr><th>数据集</th><th>任务</th><th>状态</th><th>完成 / 失败 / 未处理</th></tr></thead><tbody>{selected.children.map(child=><tr key={child.run_id}>
          <td>{datasets.find(dataset=>dataset.dataset_id===child.dataset_id)?.name || child.dataset_id}</td><td>{child.job_type==='IMAGE_INDEX' ? '图像索引' : '一致性比较'}</td>
          <td>{jobStatuses[child.status]}{child.phase && ['PENDING','RUNNING'].includes(child.status) ? ` · ${jobPhases[child.phase] || child.phase}` : ''}</td><td>{child.completed} / {child.failed} / {child.unprocessed}</td></tr>)}</tbody></table></div>
        {selected.children.flatMap(child=>child.errors.map((failure,index)=><p className="iad-error" key={child.run_id+index}>{failure.relative_path || failure.sample_id}：{failure.code ? `${failure.code} · ` : ''}{failure.message}</p>))}</details>
        <section aria-label="批次比较结果"><h3>比较结果{results ? ` · ${results.total} 对` : ''}</h3>
          {results?.items.map(item=><div className="iad-row" key={item.result.result_id}><span>{imageRelations[item.result.verification.relation]} · {item.result.annotation.confirmed_conflict ? '已确认差异' : item.result.annotation.differences.length ? '存在待核对差异' : '未发现差异'}</span>
            <span>{item.sample_a.split(':').slice(1).join(':')} ↔ {item.sample_b.split(':').slice(1).join(':')}</span>
            <button onClick={()=>workspace.updateConsistency({batchId:selected.batch_id,evidenceId:item.result.evidence_id,resultId:item.result.result_id},true)}>打开比较证据</button></div>)}
          {results?.next_cursor && <button onClick={()=>setCursor(results.next_cursor!)}>下一页结果</button>}{cursor && <button onClick={()=>setCursor(undefined)}>返回首批结果</button>}
          {results && !results.total && <p className="iad-muted">当前批次尚无成对比较结果。</p>}
        </section>
      </section>}
    </div>}
  </section>;
}
