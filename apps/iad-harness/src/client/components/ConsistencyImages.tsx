import React, {useEffect,useRef,useState} from 'react';
import type {ConsistencyFilterValues,ConsistencyComparisonItem} from '../consistency-view.js';
import type {ConsistencyImageCollection} from '../useConsistencyImages.js';
import {ConsistencyConflictDialog} from './ConsistencyConflictDialog.js';
import {ConsistencyResultCard} from './ConsistencyResultCard.js';
import {Pagination} from './Pagination.js';

export function ConsistencyImages({jobId,images,filters,group,onReviewed,page,onPage}:{
  jobId:string;images:ConsistencyImageCollection;filters:ConsistencyFilterValues;group:string;onReviewed():void;
  page:number;onPage(page:number):void;
}) {
  const [selected,setSelected]=useState<ConsistencyComparisonItem|null>(null);
  const pendingMove=useRef<-1|1|null>(null);
  useEffect(()=>{
    if(!images.pending&&page>Math.max(1,Math.ceil(images.total/18)))onPage(Math.max(1,Math.ceil(images.total/18)));
  },[images.pending,images.total,page,onPage]);
  useEffect(()=>{setSelected(null);pendingMove.current=null;},[group,filters.search,filters.model,filters.agreement,filters.review]);
  useEffect(()=>{
    if(!images.pending&&pendingMove.current){
      if(!images.error)setSelected(pendingMove.current===1?images.items[0]||null:images.items.at(-1)||null);
      pendingMove.current=null;
    }
  },[images.items,images.pending,images.error]);
  function move(offset:-1|1) {
    if(!selected||images.pending)return;
    const index=images.items.findIndex(item=>item.id===selected.id)+offset;
    const next=images.items[index];
    if(next)setSelected(next);
    else if((offset===-1&&page>1)||(offset===1&&page*18<images.total)){
      pendingMove.current=offset;onPage(page+offset);
    }
  }
  const action=group==='images'||['NO_CANDIDATES','NO_ELIGIBLE_CANDIDATES','PROGRAM_CONSISTENT'].includes(group)?'job-image':'open-conflict';
  return <>
    {images.error?<p className="iad-error" role="alert">{images.error}</p>:!images.items.length&&images.pending?
      <p className="iad-result-empty" role="status">正在读取图像…</p>:<>
        <div className="iad-thumbnail-grid dc-conflict-grid" data-job-id={jobId} aria-busy={images.pending}>
          {images.items.map(item=><ConsistencyResultCard key={item.id} item={item} action={action} onOpen={()=>{if(!images.pending)setSelected(item);}}/>)}
        </div>
        {!images.items.length&&<p className="iad-result-empty">当前筛选条件下没有匹配的图像。</p>}
        <Pagination total={images.total} page={page} size={18} unit="张" onPage={onPage}/>
      </>}
    {selected&&<ConsistencyConflictDialog key={`${jobId}:${selected.id}`} conflict={selected} items={images.items}
      onSelect={id=>setSelected(images.items.find(item=>item.id===id)||null)} onMove={move}
      onClose={()=>{pendingMove.current=null;setSelected(null);}} onReviewed={onReviewed}/>}
  </>;
}
