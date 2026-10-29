import React,{useEffect,useRef,useState} from 'react';
import type {GalleryItem,GalleryPage,GalleryQuery} from '../../shared/domain.generated.js';
import {differenceLabels} from '../../shared/consistency-presentation.js';
import {galleryImageUrl} from '../consistency-images.js';
import {message,request} from '../api.js';
import {useWorkspace} from '../workspace.js';
import {MediaImage,MediaLoad} from './MediaLoad.js';
import {Pagination} from './Pagination.js';
import {ConsistencyGroupDialog} from './ConsistencyGroupDialog.js';

export function ConsistencyGallery({queryId,kind}:{queryId:string;kind:'conflicts'|'groups'}) {
  const {state,workspace}=useWorkspace(),location=state.consistency;
  const [page,setPage]=useState<GalleryPage|null>(null),[error,setError]=useState('');
  const pendingMove=useRef<-1|1|null>(null);
  const cards=useRef(new Map<string,HTMLButtonElement>()),focus=useRef<HTMLButtonElement|null>(null);
  const search=location.gallerySearch||'',order=location.galleryOrder||'recent',number=location.galleryPage||1,differenceFilter=location.differenceFilter||'all';
  useEffect(()=>{
    const controller=new AbortController();setPage(null);setError('');
    const query:GalleryQuery={query_id:queryId,kind,page:number,page_size:15,search,order,difference_filter:differenceFilter};
    request<GalleryPage>('/consistency/gallery',query,undefined,controller.signal).then(value=>{if(!controller.signal.aborted){setPage(value);if(pendingMove.current){const item=pendingMove.current===1 ? value.items[0] : value.items.at(-1);pendingMove.current=null;if(item)open(item);}}})
      .catch(failure=>{if(!controller.signal.aborted)setError(message(failure));});
    return()=>controller.abort();
  },[queryId,kind,number,search,order,differenceFilter]);
  const selected=page?.items.find(item=>item.group_id===location.groupId && item.facts_state===(location.facts||'CURRENT'));
  function open(item:GalleryItem) {
    focus.current=cards.current.get(item.group_id)||null;
    workspace.updateConsistency({queryId,groupId:item.group_id,facts:item.facts_state,memberId:undefined,memberPage:1,detailTab:'summary',differenceId:undefined},true);
  }
  function move(offset:-1|1) {
    if(!selected||!page)return;
    const index=page.items.indexOf(selected)+offset;
    if(index>=0&&index<page.items.length)open(page.items[index]);
    else {pendingMove.current=offset;workspace.updateConsistency({galleryPage:number+offset,memberId:undefined,memberPage:1},true);}
  }
  return <section className="iad-consistency-gallery-panel" aria-label={kind==='conflicts' ? '冲突图像' : '重复图组'}>
    <header className="iad-consistency-panel-header"><strong>{kind==='conflicts' ? '同图标注差异' : '重复图组 · 代表图像'} <span className="iad-muted">{page?.total ?? '—'} {kind==='conflicts' ? '张' : '组'}</span></strong>
      <div className="iad-row"><input type="search" aria-label="搜索图像" placeholder="搜索文件名" value={search} onChange={event=>workspace.updateConsistency({gallerySearch:event.target.value,galleryPage:1,groupId:undefined},true)} />
        <select aria-label="排序方式" value={order} onChange={event=>workspace.updateConsistency({galleryOrder:event.target.value as NonNullable<typeof location.galleryOrder>,galleryPage:1,groupId:undefined},true)}><option value="recent">最近比较</option><option value="members">{kind==='conflicts' ? '候选数量从多到少' : '成员数量从多到少'}</option></select></div>
    </header>
    {error && <p role="alert" className="iad-error">{error}</p>}
    {!page&&!error && <p role="status" className="iad-empty">正在读取图像…</p>}
    {page && !page.total && <p className="iad-empty">没有匹配的图像，请调整筛选条件。</p>}
    {kind==='conflicts' && page && <div className="iad-consistency-filter-chips" role="group" aria-label="差异类型筛选">{page.filters.map(filter=><button key={filter.value} aria-pressed={differenceFilter===filter.value} onClick={()=>workspace.updateConsistency({differenceFilter:filter.value,galleryPage:1,groupId:undefined},true)}>{filter.label} {filter.count}</button>)}</div>}
    <MediaLoad><div className="iad-consistency-gallery">{page?.items.map(item=><button key={item.group_id+item.facts_state} ref={element=>{if(element)cards.current.set(item.group_id,element);else cards.current.delete(item.group_id);}}
      className="iad-consistency-image-card" data-group-id={item.group_id} data-facts-state={item.facts_state} onClick={()=>open(item)}>
      <div className="iad-consistency-card-image">{item.anchor.available ? <MediaImage src={galleryImageUrl(item.anchor)} alt={item.anchor.sample.relative_path} loading="lazy" /> : <span>原图不可恢复</span>}
        <span className="iad-consistency-card-count">{kind==='groups' ? `${item.member_count} 张成员` : `${item.candidate_count} 张候选`}</span></div>
      <div className="iad-consistency-card-caption"><strong title={item.anchor.sample.relative_path}>{item.anchor.sample.relative_path.split('/').pop()}</strong>
        <div><span className="iad-consistency-badge">{kind==='groups' ? '严格同图' : item.difference_types.map(type=>differenceLabels[type]).join('、')||'未发现标注差异'}</span><span>{kind==='groups' ? `${item.dataset_count} 个数据集` : ''}</span></div></div>
    </button>)}</div></MediaLoad>
    <Pagination total={page?.total||0} page={number} size={15} unit={kind==='groups' ? '组' : '张'} onPage={galleryPage=>workspace.updateConsistency({galleryPage,groupId:undefined},true)} />
    {selected && !location.evidenceId && <ConsistencyGroupDialog key={selected.group_id+selected.facts_state} queryId={queryId} kind={kind} item={selected} position={(number-1)*15+(page?.items.indexOf(selected)||0)+1} total={page?.total||0}
      onMove={move} onClose={()=>workspace.updateConsistency({groupId:undefined,memberId:undefined,differenceId:undefined,detailTab:undefined},true)} restoreFocus={()=>focus.current||cards.current.get(selected.group_id)||null} />}
  </section>;
}
