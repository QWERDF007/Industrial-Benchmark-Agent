import React,{useLayoutEffect,useRef,useState} from 'react';
import type {AuditReportImage} from '../../shared/domain.generated.js';
import {ThumbnailCard} from './ThumbnailCard.js';
import {Pagination} from './Pagination.js';
import {datasetImageAnnotations} from '../dataset-image-annotations.js';
import {ImageViewer,type ImageSource} from './ImageViewer.js';

export function AuditEvidenceGallery({items,imageUrl}:{items:readonly AuditReportImage[];imageUrl(item:AuditReportImage):string}) {
  const grid=useRef<HTMLDivElement>(null);
  const [paging,setPaging]=useState({page:1,size:8});
  const [current,setCurrent]=useState<number|null>(null);
  useLayoutEffect(()=>{
    if(!items.length)return;
    const element=grid.current!;
    const observer=new ResizeObserver(()=>{
      if(!element.getBoundingClientRect().width)return;
      const size=getComputedStyle(element).gridTemplateColumns.split(' ').length*2;
      setPaging(previous=>previous.size===size?previous:{page:1,size});
    });
    observer.observe(element);return()=>observer.disconnect();
  },[items.length]);
  if(!items.length)return null;
  const images:ImageSource[]=items.map(item=>({src:imageUrl(item),title:item.source.sample.relative_path.split('/').pop()!,
    width:item.image.original_size[0],height:item.image.original_size[1],sampleId:item.sample_id,evidence:item.image,
    ...datasetImageAnnotations(item.source.dataset_format,item.source.sample,item.source.annotations)}));
  return <section className="iad-audit-gallery" aria-label="图像证据">
    <h4>图像证据</h4>
    <div ref={grid} className="iad-thumbnail-grid">{images.slice((paging.page-1)*paging.size,paging.page*paging.size).map((image,index)=>{
      const position=(paging.page-1)*paging.size+index;
      return <ThumbnailCard key={items[position].image.evidence_id} image={image} label="" title={image.title} data-audit-evidence-role={items[position].role}
        aria-label={`放大${image.title}`} onClick={()=>setCurrent(position)}/>;
    })}</div>
    <Pagination total={items.length} page={paging.page} size={paging.size} unit="张" label="图像证据" hideSinglePage
      onPage={page=>setPaging(previous=>({...previous,page}))}/>
    {current!==null&&<ImageViewer image={images[current]} onClose={()=>setCurrent(null)}
      navigation={items.length>1?{previous:current>0,next:current<items.length-1,busy:false,error:'',move:offset=>setCurrent(current+offset)}:undefined}/>}
  </section>;
}
