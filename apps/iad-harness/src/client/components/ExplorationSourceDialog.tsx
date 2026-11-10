import React,{useEffect,useMemo,useRef,useState} from 'react';
import type {Dataset} from '../../shared/contracts.js';
import type {ExplorationCandidate, ExplorationRole} from '../exploration-view.js';
import {Button} from './Button.js';
import {Modal} from './Modal.js';
import {Pagination} from './Pagination.js';
import {ThumbnailCard} from './ThumbnailCard.js';
import {MultiSelect,Select} from './Select.js';
import {ClearFilterButton} from './CommonFilterControls.js';

export function ExplorationSourceDialog({kind,datasets,candidates,selected,loading,onChange,onClose}:{
  kind:ExplorationRole;datasets:Dataset[];candidates:ExplorationCandidate[];selected:string[];loading:boolean;
  onChange(ids:string[]):void;onClose():void;
}) {
  const [search,setSearch]=useState(''),[selectedOnly,setSelectedOnly]=useState(false),[page,setPage]=useState(1);
  const [subsetIds,setSubsetIds]=useState(()=>datasets.map(item=>item.dataset_id)),[category,setCategory]=useState('');
  const input=useRef<HTMLInputElement>(null),label=kind==='normal'?'良品':'异常';
  const scroll=useRef<HTMLDivElement>(null);
  const chosen=useMemo(()=>new Set(selected),[selected]);
  const pool=useMemo(()=>candidates.filter(item=>item.candidate_role===kind&&subsetIds.includes(item.datasetId)),[candidates,kind,subsetIds]);
  const showCategory=kind==='defect'&&datasets.some(item=>subsetIds.includes(item.dataset_id)&&item.format==='labelme');
  const categories=useMemo(()=>[...new Set(pool.flatMap(item=>item.annotation_categories))]
    .sort((left,right)=>left.localeCompare(right,'zh-CN',{numeric:true})),[pool]);
  const activeCategory=showCategory&&categories.includes(category)?category:'';
  useEffect(()=>{if(category!==activeCategory)setCategory(activeCategory);},[category,activeCategory]);
  const filtered=useMemo(()=>{
    const query=search.trim().toLocaleLowerCase();
    return pool.filter(item=>(!selectedOnly||chosen.has(item.id))
      &&(!activeCategory||item.annotation_categories.includes(activeCategory))
      &&(!query||item.filename.toLocaleLowerCase().includes(query)));
  },[pool,chosen,selectedOnly,search,activeCategory]);
  const current=Math.min(page,Math.max(1,Math.ceil(filtered.length/24)));
  useEffect(()=>{scroll.current?.scrollTo({top:0});},[current,search,subsetIds,activeCategory,selectedOnly]);
  const filtersActive=!!search||selectedOnly||!!activeCategory||subsetIds.length!==datasets.length;
  return <Modal title={`选择${label}图像`} size="form" className="exp-source-dialog" initialFocus={input} onClose={onClose}>
    <div className="iad-dialog-body exp-source-body">
      <div className="exp-source-filters" role="group" aria-label="图像筛选">
      <label className="iad-field exp-source-search-field">文件名搜索
        <input ref={input} id="exp-source-search" type="search" placeholder="搜索文件名" value={search}
          onChange={event=>{setSearch(event.target.value);setPage(1);}} />
      </label>
      <div className="iad-field exp-source-child-field"><label htmlFor="exp-source-children">子数据集</label>
        <MultiSelect id="exp-source-children" menuId="exp-source-children-options" label="子数据集"
          options={datasets.map(item=>({value:item.dataset_id,label:item.name}))} selected={subsetIds}
          onToggle={id=>{setSubsetIds(previous=>previous.includes(id)?previous.filter(value=>value!==id):[...previous,id]);setPage(1);}} />
      </div>
      <div className="exp-source-category-field">{showCategory&&<label className="iad-field">类别
        <Select id="exp-source-category" value={activeCategory} onChange={event=>{setCategory(event.target.value);setPage(1);}}>
          <option value="">全部类别</option>{categories.map(value=><option key={value} value={value}>{value}</option>)}
        </Select>
      </label>}</div>
      <label className="iad-row exp-source-only"><input type="checkbox" id="exp-only-selected" checked={selectedOnly}
        onChange={event=>{setSelectedOnly(event.target.checked);setPage(1);}} />仅看已选</label>
      <ClearFilterButton ariaLabel="清除图像筛选" title="清除图像筛选" disabled={!filtersActive}
        onClick={()=>{setSearch('');setSubsetIds(datasets.map(item=>item.dataset_id));setCategory('');setSelectedOnly(false);setPage(1);}} />
      </div>
      <div className="exp-source-scroll" ref={scroll} aria-busy={loading}>
      <div className="iad-thumbnail-grid" aria-label={`${label}图像`}>{filtered.slice((current-1)*24,current*24).map(item=>{
        const checked=chosen.has(item.id);
        const toggle=()=>onChange(checked?selected.filter(id=>id!==item.id):[...selected,item.id]);
        return <div key={item.id} className="iad-thumbnail-option">
          <ThumbnailCard src={item.url} label={item.filename} aria-pressed={checked} onClick={toggle} />
          <label className="iad-row"><input type="checkbox" aria-label={`选择${label} ${item.filename}`} checked={checked} onChange={toggle} />选择</label>
        </div>;
      })}</div>
      {loading&&<p role="status">正在读取图像…</p>}
      </div>
      <div className="exp-source-pagination"><Pagination total={filtered.length} page={current} size={24} unit="张图像" onPage={setPage} /></div>
    </div>
    <footer className="iad-dialog-footer"><Button variant="primary" onClick={onClose}>完成选择</Button></footer>
  </Modal>;
}
