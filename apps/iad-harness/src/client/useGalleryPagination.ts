import {useLayoutEffect,useRef,useState} from 'react';

export function useGalleryPagination(total:number,imagesPerItem=1) {
  const grid=useRef<HTMLDivElement>(null);
  const [paging,setPaging]=useState({page:1,size:8/imagesPerItem});
  const page=Math.min(paging.page,Math.max(1,Math.ceil(total/paging.size)));
  useLayoutEffect(()=>{
    if(!total)return;
    const element=grid.current!;
    const observer=new ResizeObserver(()=>{
      if(!element.getBoundingClientRect().width)return;
      const columns=getComputedStyle(element).gridTemplateColumns.split(' ').length;
      const size=Math.max(1,Math.floor(columns*2/imagesPerItem));
      setPaging(previous=>previous.size===size?previous:{page:1,size});
    });
    observer.observe(element);
    return()=>observer.disconnect();
  },[total,imagesPerItem]);
  return {grid,page,size:paging.size,setPage:(page:number)=>setPaging(previous=>({...previous,page}))};
}
