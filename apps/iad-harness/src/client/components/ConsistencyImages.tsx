import React, {useMemo,useState} from 'react';
import type {AnchorImagePage} from '../../shared/domain.generated.js';
import {ConsistencyView} from '../consistency-view.js';
import {useResource} from '../useResource.js';
import {ConsistencyConflictDialog} from './ConsistencyConflictDialog.js';
import {ConsistencyResultCard} from './ConsistencyResultCard.js';
import {Pagination} from './Pagination.js';

export function ConsistencyImages({jobId,revision,onReviewed}:{jobId:string;revision:string;onReviewed():void}) {
  const [page,setPage]=useState(1);
  const [selectedId,setSelectedId]=useState('');
  const result=useResource<AnchorImagePage>(`/consistency/checks/${encodeURIComponent(jobId)}/images?page=${page}&page_size=18`,revision);
  const cards=useMemo(()=>ConsistencyView.imageCards(jobId,result.data?.items || []),[jobId,result.data]);
  const selected=cards.find(item=>item.id===selectedId);
  return <>
    {result.loading ? <p className="iad-result-empty" role="status">正在读取图像…</p> : result.error ?
      <p className="iad-error" role="alert">{result.error}</p> : result.data && <>
        <div className="iad-thumbnail-grid dc-conflict-grid">
          {cards.map(item=><ConsistencyResultCard key={item.id} item={item} action="job-image" onOpen={()=>setSelectedId(item.id)}/>)}
        </div>
        <Pagination total={result.data.total} page={page} size={18} unit="张" onPage={setPage}/>
      </>}
    {selected&&<ConsistencyConflictDialog key={`${jobId}:${selected.id}`} conflict={selected} items={cards}
      onSelect={setSelectedId} onClose={()=>setSelectedId('')} onReviewed={onReviewed}/>}
  </>;
}
