import React from "react";

export const pageSize = 24;
export const IBA_JOBS_PAGE_SIZE = 8;

export function Pagination({total, page, unit = '条', onPage, size = pageSize, label = '', id, availablePages}: {
  total:number;page:number;unit?:string;onPage(page:number):void;size?:number;label?:string;id?:string;availablePages?:number;
}) {
  if (!total) return null;
  const pages=Math.max(1,Math.ceil(total/size));
  const current=Math.max(1,Math.min(page,pages));
  const start=Math.max(1,Math.min(current-2,pages-4));
  return <nav id={id} className="iad-pagination" aria-label={`${label}分页`}>
    <button type="button" disabled={current<=1} onClick={()=>onPage(current-1)}>上一页</button>
    {Array.from({length:Math.min(pages,5)},(_,index)=>start+index).map(number=><button type="button" key={number}
      aria-label={`第 ${number} 页`} aria-current={number===current?'page':undefined} data-page={number}
      disabled={availablePages!==undefined && number>availablePages}
      onClick={()=>onPage(number)}>{number}</button>)}
    <button type="button" disabled={current>=pages || availablePages!==undefined && current>=availablePages} onClick={()=>onPage(current+1)}>下一页</button>
    <span>{current} / {pages} 页</span><span>共 {total} {unit}</span>
  </nav>;
}
