import React,{useMemo,useRef,useState} from 'react';
import type {ExplorationCandidate} from '../exploration-view.js';
import {Button} from './Button.js';
import {Modal} from './Modal.js';
import {Pagination} from './Pagination.js';
import {ThumbnailCard} from './ThumbnailCard.js';

export function ExplorationSourceDialog({kind,candidates,selected,loading,onChange,onClose}:{
  kind:ExplorationCandidate['kind'];candidates:ExplorationCandidate[];selected:string[];loading:boolean;
  onChange(ids:string[]):void;onClose():void;
}) {
  const [search,setSearch]=useState(''),[selectedOnly,setSelectedOnly]=useState(false),[page,setPage]=useState(1);
  const input=useRef<HTMLInputElement>(null),label=kind==='normal'?'良品':'异常';
  const chosen=useMemo(()=>new Set(selected),[selected]);
  const filtered=useMemo(()=>{
    const query=search.trim().toLocaleLowerCase();
    return candidates.filter(item=>item.kind===kind&&(!selectedOnly||chosen.has(item.id))
      &&(!query||item.filename.toLocaleLowerCase().includes(query)));
  },[candidates,kind,chosen,selectedOnly,search]);
  const current=Math.min(page,Math.max(1,Math.ceil(filtered.length/24)));
  return <Modal title={`选择${label}图像`} size="form" initialFocus={input} onClose={onClose}>
    <div className="iad-dialog-body">
      <div className="iad-filters"><label className="iad-field">搜索图像
        <input ref={input} id="exp-source-search" type="search" placeholder="文件名" value={search}
          onChange={event=>{setSearch(event.target.value);setPage(1);}} />
      </label><label className="iad-row"><input type="checkbox" id="exp-only-selected" checked={selectedOnly}
        onChange={event=>{setSelectedOnly(event.target.checked);setPage(1);}} />仅看已选</label></div>
      <div className="iad-thumbnail-grid">{filtered.slice((current-1)*24,current*24).map(item=>{
        const checked=chosen.has(item.id);
        const toggle=()=>onChange(checked?selected.filter(id=>id!==item.id):[...selected,item.id]);
        return <div key={item.id} className="iad-thumbnail-option">
          <ThumbnailCard src={item.url} label={item.filename} aria-pressed={checked} onClick={toggle} />
          <label className="iad-row"><input type="checkbox" aria-label={`选择${label} ${item.filename}`} checked={checked} onChange={toggle} />选择</label>
        </div>;
      })}</div>
      {loading?<p role="status">正在读取图像…</p>:!filtered.length&&<p>没有符合条件的图像。</p>}
      <Pagination total={filtered.length} page={current} size={24} unit="张图像" onPage={setPage} />
    </div>
    <footer className="iad-dialog-footer"><Button variant="primary" onClick={onClose}>完成选择</Button></footer>
  </Modal>;
}
