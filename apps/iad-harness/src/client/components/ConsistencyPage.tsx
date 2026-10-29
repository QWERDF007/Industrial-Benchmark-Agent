import React, {useEffect, useRef, useState} from 'react';
import type {Dataset, ImageRetrieve, RetrievalPage, SampleDetail, SamplePage, TemporaryImageRef} from '../../shared/contracts.js';
import {consistencyTabs} from '../../shared/navigation.js';
import {temporaryImageLimits} from '../../shared/consistency.parameters.generated.js';
import {initialFilters, message, request, sampleQuery} from '../api.js';
import {useWorkspace} from '../workspace.js';
import {workbenchStyles} from '../styles.js';
import {WorkbenchHeader} from './layout/WorkbenchHeader.js';
import {PageTabs} from './layout/PageTabs.js';
import {Pagination} from './Pagination.js';
import {ConsistencyComparison} from './ConsistencyComparison.js';
import {ConsistencyEvidencePage} from './ConsistencyEvidencePage.js';
import {ConsistencyJobsPanel} from './ConsistencyJobsPanel.js';
import {ConsistencyScopePicker} from './ConsistencyScopePicker.js';
import {ConsistencyScopeResults} from './ConsistencyScopeResults.js';
import {ConsistencyEmpty} from './ConsistencyEmpty.js';
import {ConsistencyCandidates} from './ConsistencyCandidates.js';

type TemporaryQuery = TemporaryImageRef & {preview:string; name:string};

export function ConsistencyPage() {
  const {state}=useWorkspace();
  const evidenceId=state.consistency.evidenceId;
  const [visited,setVisited]=useState(!evidenceId);
  useEffect(()=>{if(!evidenceId)setVisited(true);},[evidenceId]);
  return <>{visited && <div hidden={!!evidenceId} style={{height:"100%"}}><RetrievalWorkspace /></div>}{evidenceId && <ConsistencyEvidencePage evidenceId={evidenceId} />}</>;
}

function RetrievalWorkspace() {
  const {workspace,state}=useWorkspace(), location=state.consistency;
  const tab=location.tab || 'conflicts', scope=location.scope || {kind:'all_registered'};
  const [datasets,setDatasets]=useState<Dataset[]>([]), [sourceDataset,setSourceDataset]=useState(state.datasetId);
  const [samples,setSamples]=useState<SamplePage|null>(null),[search,setSearch]=useState(''),[page,setPage]=useState(1);
  const [temporary,setTemporary]=useState<TemporaryQuery|null>(null);
  const [mode,setMode]=useState<NonNullable<ImageRetrieve['mode']>>('exact'),[topK,setTopK]=useState(50);
  const [result,setResult]=useState<RetrievalPage|null>(null),[submitted,setSubmitted]=useState<ImageRetrieve|null>(null);
  const [queryDetail,setQueryDetail]=useState<SampleDetail|null>(null);
  const [comparing,setComparing]=useState(false);
  const comparison=useRef<HTMLDivElement>(null),comparisonTrigger=useRef<HTMLButtonElement|null>(null);
  useEffect(()=>{if(comparing){comparison.current?.focus({preventScroll:true});comparison.current?.scrollIntoView({block:'start'});}},[comparing]);
  const [busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState('');
  const mounted=useRef(true), operation=useRef(0);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;operation.current++;};},[]);
  useEffect(()=>{
    const controller=new AbortController();
    request<{datasets:Dataset[]}>('/datasets',undefined,undefined,controller.signal).then(data=>{
      if(controller.signal.aborted)return;setDatasets(data.datasets);
      setSourceDataset(current=>data.datasets.find(row=>location.query?.sample_id.startsWith(row.dataset_id+':'))?.dataset_id || current || data.datasets[0]?.dataset_id || '');
    }).catch(failure=>{if(!controller.signal.aborted)setError(message(failure));});
    return()=>controller.abort();
  },[]);
  const dataset=datasets.find(row=>row.dataset_id===sourceDataset);
  useEffect(()=>{
    if(tab!=='search')return;
    setSamples(null);if(!dataset)return;
    const controller=new AbortController();
    request<SamplePage>(`/samples/${encodeURIComponent(dataset.task_id)}?${sampleQuery(dataset.dataset_id,{...initialFilters,search},page,24)}`,undefined,undefined,controller.signal)
      .then(data=>{if(!controller.signal.aborted)setSamples(data);}).catch(failure=>{if(!controller.signal.aborted)setError(message(failure));});
    return()=>controller.abort();
  },[tab,dataset,search,page]);
  const sampleId=location.query?.sample_id;
  useEffect(()=>{operation.current++;setBusy(false);setResult(null);setSubmitted(null);setComparing(false);},[sampleId,temporary?.image_ref]);
  useEffect(()=>{
    if(tab!=='search')return;
    setQueryDetail(null);if(!sampleId)return;
    const controller=new AbortController();
    request<SampleDetail>(`/sample/${encodeURIComponent(sampleId)}`,undefined,undefined,controller.signal).then(data=>{if(!controller.signal.aborted)setQueryDetail(data);})
      .catch(failure=>{if(!controller.signal.aborted)setError(message(failure));});
    return()=>controller.abort();
  },[tab,sampleId]);
  useEffect(()=>()=>{
    if(!temporary)return;URL.revokeObjectURL(temporary.preview);
    void fetch(`/api/iad/images/temporary/${encodeURIComponent(temporary.image_ref)}`,{method:'DELETE',keepalive:true}).catch(console.error);
  },[temporary]);
  const query: ImageRetrieve['query']|null=temporary ? {kind:'temporary',image_ref:temporary.image_ref} : sampleId ? {kind:'sample',sample_id:sampleId} : null;
  async function upload(file:File) {
    setError('');if(file.size>temporaryImageLimits.max_source_bytes){setError('图像超过上传大小限制');return;}
    setUploading(true);operation.current++;setResult(null);setSubmitted(null);
    const form=new FormData();form.append('image',file);
    try {
      const accepted=await request<TemporaryImageRef>('/images/temporary',form);
      if(!mounted.current){await request(`/images/temporary/${encodeURIComponent(accepted.image_ref)}`,undefined,'DELETE');return;}
      setTemporary({...accepted,preview:URL.createObjectURL(file),name:file.name});workspace.updateConsistency({query:undefined,groupId:undefined,differenceId:undefined},true);
    } catch(failure){if(mounted.current)setError(message(failure));} finally {if(mounted.current){setUploading(false);setBusy(false);}}
  }
  async function retrieve(cursor?:string) {
    if(!query)return;
    const current=++operation.current, input:ImageRetrieve=cursor && submitted ? {...submitted,cursor} : {query,corpus_scope:scope,mode,top_k:topK};
    setBusy(true);setError('');
    try {
      const data=await request<RetrievalPage>('/images/retrieve',input);
      if(!mounted.current || current!==operation.current)return;
      setResult(data);setSubmitted({...input,cursor:undefined});
    } catch(failure){if(mounted.current && current===operation.current)setError(message(failure));}
    finally {if(mounted.current && current===operation.current)setBusy(false);}
  }
  const allGroups=result ? [...result.exact.groups,...result.visual.groups] : [];
  const groups=allGroups;
  const group=groups.find(row=>row.content_group_id===location.groupId) || groups[0];
  const member=group?.members.find(row=>row.sample_id===location.memberId) || group?.members[0];
  const draftChanged=submitted && JSON.stringify({...submitted,cursor:undefined})!==JSON.stringify({query,corpus_scope:scope,mode,top_k:topK});
  return <div className="iad-workbench iad-consistency" data-page="industrial-consistency"><style>{workbenchStyles}</style>
    <WorkbenchHeader pageId="industrial-consistency">{queryDetail && <button onClick={()=>{
      const page=location.returnPage || 'industrial-images';workspace.openLocation({pageId:page,datasetId:queryDetail.sample.dataset_id,...workspace.view(page,undefined,queryDetail.sample.dataset_id),selected:queryDetail.sample.sample_id});
    }}>返回图像</button>}<button onClick={()=>workspace.navigate('industrial-model-settings')}>图像检索设置</button></WorkbenchHeader>
    <PageTabs label="数据一致性分区" items={consistencyTabs} value={tab} onChange={value=>workspace.updateConsistency({tab:value,differenceFilter:undefined,queryId:undefined,groupId:undefined,memberId:undefined,memberPage:1,galleryPage:1,detailTab:undefined,differenceId:undefined})}>
      {error && <p role="alert" className="iad-error">{error}</p>}
      {tab==='search' && <form className="iad-consistency-query" onSubmit={event=>{event.preventDefault();void retrieve();}}>
        <fieldset disabled={busy || uploading}><legend className="iad-visually-hidden">查询图像与检索范围</legend>
          <div className="iad-row"><label className="iad-filter">查询图像所在集<select aria-label="查询图像所在集" value={sourceDataset} onChange={event=>{setSourceDataset(event.target.value);setPage(1);setSearch('');setTemporary(null);workspace.updateConsistency({query:undefined,groupId:undefined,differenceId:undefined},true);}}>
            {!datasets.length && <option value="">无已注册数据集</option>}{datasets.map(row=><option key={row.dataset_id} value={row.dataset_id}>{row.name}</option>)}</select></label>
            <label className="iad-filter iad-query-search">搜索图像<input type="search" aria-label="搜索查询图像" value={search} onChange={event=>{setSearch(event.target.value);setPage(1);}} /></label>
            <label className="iad-filter iad-query-sample">查询图像<select aria-label="查询图像" value={temporary ? '' : sampleId || ''} onChange={event=>{
              setTemporary(null);workspace.updateConsistency({query:event.target.value ? {kind:'sample',sample_id:event.target.value} : undefined,groupId:undefined,differenceId:undefined},true);
            }}><option value="">选择图像</option>{sampleId && !samples?.items.some(row=>row.sample_id===sampleId) && <option value={sampleId}>{queryDetail?.sample.relative_path || sampleId}</option>}
              {samples?.items.map(row=><option key={row.sample_id} value={row.sample_id}>{row.relative_path}</option>)}</select></label>
            <label className="iad-filter">或上传临时图<input type="file" aria-label="上传查询图像" accept="image/*,.tif,.tiff" onChange={event=>{const file=event.target.files?.[0];if(file)void upload(file);event.target.value='';}} /></label>
            <ConsistencyScopePicker datasets={datasets} value={scope} onChange={value=>workspace.updateConsistency({scope:value},true)} />
          </div>
          <div className="iad-row iad-consistency-query-actions">
            <details className="iad-consistency-advanced"><summary>高级参数</summary><div className="iad-row"><label className="iad-filter">检索方式<select aria-label="检索方式" value={mode} onChange={event=>setMode(event.target.value as NonNullable<ImageRetrieve['mode']>)}>
              <option value="exact">严格同图</option><option value="combined">严格同图与视觉候选</option><option value="visual">视觉候选</option></select></label>
              <label className="iad-filter">视觉候选组数<input aria-label="视觉候选组数" type="number" min={1} max={200} value={topK} onChange={event=>setTopK(event.target.valueAsNumber)} /></label></div></details>
            <button className="iad-primary" type="submit" disabled={!query || !Number.isInteger(topK) || topK<1 || topK>200}>{busy ? '正在检索…' : '查找同图'}</button>
            {uploading && <span role="status">正在接收图像…</span>}{temporary && <span>{temporary.name} · 临时查询</span>}
            <Pagination total={samples?.total || 0} page={page} size={24} unit="张查询图像" onPage={setPage} />
          </div>
        </fieldset>
      </form>}
      {tab==='jobs' ? <ConsistencyJobsPanel datasets={datasets} /> : tab==='conflicts' || tab==='groups' ? <ConsistencyScopeResults datasets={datasets} tab={tab} /> : !result ? <ConsistencyEmpty title={busy ? '正在检索图像' : query ? '准备开始图像检索' : '选择查询图像'} description="选择数据集中的图像，或上传一张临时查询图；检索不会将临时图导入数据集。"><button disabled={!query||busy||uploading} onClick={()=>void retrieve()}>开始检索</button></ConsistencyEmpty>
        : <>
          {draftChanged && <p role="status" className="iad-muted">查询条件已改变，以下保留上次检索结果。</p>}
          <section className="iad-consistency-results" aria-label="检索结果" aria-busy={busy}>
            <div className="iad-consistency-status"><strong>{busy ? '正在检索' : '检索完成'} · {result.group_count} 组 · {result.member_count} 成员</strong><span>{result.retrieval_completeness==='PARTIAL' ? '索引或比较不完整' : result.retrieval_completeness==='TOP_K' ? '视觉 Top-K 候选' : '严格同图范围'}</span><span className="iad-muted">本次检索</span></div>
            <p className="iad-muted">原图核验 {result.coverage.verification.completed}/{result.coverage.verification.total} · 失败 {result.coverage.verification.failed} · 标注比较 {result.coverage.annotation.completed}/{result.coverage.annotation.total} · 失败 {result.coverage.annotation.failed} · 待定 {result.coverage.annotation.pending}</p>
            {[result.exact,result.visual].map((branch,index)=>branch.reason && <p className="iad-muted" key={index}>{index ? '视觉检索' : '严格同图'}：{branch.reason}</p>)}
            {!groups.length ? <ConsistencyEmpty title="当前返回页没有候选图组" description="结果仅代表本次实际检索范围和已返回的覆盖；可调整查询条件后重新检索。" /> : <>
              <ConsistencyCandidates groups={groups} selected={member} datasets={datasets} onCompare={trigger=>{comparisonTrigger.current=trigger;setComparing(true);comparison.current?.scrollIntoView({block:'start'});}} onSelect={(groupId,memberId)=>workspace.updateConsistency({groupId,memberId,differenceId:undefined},true)} />
              <div className="iad-row iad-consistency-result-pagination">{group?.next_member_cursor && <button disabled={busy} onClick={()=>void retrieve(group.next_member_cursor!)}>下一页成员</button>}
                {(['exact','visual'] as const).map(branch=>result[branch].next_cursor && <button key={branch} disabled={busy} onClick={()=>void retrieve(result[branch].next_cursor!)}>下一页{branch==='exact' ? '同图' : '视觉'}组</button>)}</div>
              {comparing && <div className="iad-consistency-expanded" ref={comparison} tabIndex={-1} aria-label="原图对比"><header className="iad-consistency-panel-header"><strong>原图对比</strong><button onClick={()=>{setComparing(false);comparisonTrigger.current?.focus();}}>收起对比</button></header><div className="iad-consistency-layout iad-frozen-comparison">
                {member && <ConsistencyComparison key={member.sample_id+JSON.stringify(submitted?.query)} member={member} query={submitted?.query.kind==='sample' ? queryDetail : null} temporary={temporary} differenceId={location.differenceId} onDifference={differenceId=>workspace.updateConsistency({groupId:group.content_group_id,memberId:member.sample_id,differenceId},true)} />}
              </div></div>}</>}
          </section>
        </>}
    </PageTabs>
  </div>;
}
