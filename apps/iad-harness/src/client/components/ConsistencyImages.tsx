import React, {useEffect,useMemo,useState} from 'react';
import {ConsistencyView,type ConsistencyFilterValues,type ConsistencyImageGroup} from '../consistency-view.js';
import type {ConsistencyImageCollection} from '../useConsistencyImages.js';
import {ConsistencyConflictDialog} from './ConsistencyConflictDialog.js';
import {ConsistencyResultCard} from './ConsistencyResultCard.js';
import {Pagination} from './Pagination.js';

export function ConsistencyImages({jobId,images,filters,group,onReviewed}:{
  jobId:string;images:ConsistencyImageCollection;filters:ConsistencyFilterValues;group:ConsistencyImageGroup;onReviewed():void;
}) {
  const [page,setPage]=useState(1);
  const [selectedId,setSelectedId]=useState('');
  useEffect(()=>{setPage(1);setSelectedId('');},[group,filters.search,filters.model,filters.agreement,filters.review]);
  const cards=useMemo(()=>ConsistencyView.filter(images.items,filters,group==='images'?undefined:group),
    [images.items,group,filters.search,filters.model,filters.agreement,filters.review]);
  const currentPage=Math.min(page,Math.max(1,Math.ceil(cards.length/18)));
  const selected=cards.find(item=>item.id===selectedId);
  return <>
    {images.pending ? <p className="iad-result-empty" role="status">正在读取图像…</p> : images.error ?
      <p className="iad-error" role="alert">{images.error}</p> : <>
        <div className="iad-thumbnail-grid dc-conflict-grid">
          {cards.slice((currentPage-1)*18,currentPage*18).map(item=><ConsistencyResultCard key={item.id} item={item} action="job-image" onOpen={()=>setSelectedId(item.id)}/>)}
        </div>
        <Pagination total={cards.length} page={currentPage} size={18} unit="张" onPage={setPage}/>
      </>}
    {selected&&<ConsistencyConflictDialog key={`${jobId}:${selected.id}`} conflict={selected} items={cards}
      onSelect={setSelectedId} onClose={()=>setSelectedId('')} onReviewed={onReviewed}/>}
  </>;
}
