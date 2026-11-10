import React,{useLayoutEffect,useRef,useState} from 'react';
import type {AuditReportImage} from '../../shared/domain.generated.js';
import {PageTabs} from './layout/PageTabs.js';
import {ThumbnailCard} from './ThumbnailCard.js';
import {Pagination} from './Pagination.js';
import {datasetImageAnnotations} from '../dataset-image-annotations.js';
import type {ImageSource} from './ImageViewer.js';

export function auditEvidenceImage(item:AuditReportImage,src:string):ImageSource {
  return {src,title:item.source.sample.relative_path,width:item.image.original_size[0],height:item.image.original_size[1],
    sampleId:item.sample_id,evidence:item.image,...datasetImageAnnotations(item.source.dataset_format,item.source.sample,item.source.annotations)};
}

export function AuditEvidenceGallery({items,imageUrl,onOpen}:{items:readonly AuditReportImage[];imageUrl(item:AuditReportImage):string;onOpen(image:ImageSource):void}) {
  const [role,setRole]=useState<'representative'|'counter'>('representative');
  const [page,setPage]=useState(1),[size,setSize]=useState(8);
  const grid=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>{
    const observer=new ResizeObserver(()=>{
      const element=grid.current!;
      if(!element.getBoundingClientRect().width)return;
      const next=Math.max(1,getComputedStyle(element).gridTemplateColumns.split(' ').length)*2;
      if(size!==next){setSize(next);setPage(1);}
    });
    observer.observe(grid.current!);return ()=>observer.disconnect();
  },[size]);
  const selected=items.filter(item=>item.role===role);
  return <PageTabs label="审计图像证据" items={[{id:'representative',label:'典型证据'},{id:'counter',label:'对照证据'}]}
    value={role} onChange={next=>{setRole(next);setPage(1);}}>
    <div data-audit-evidence-role={role}><div ref={grid} className="iad-thumbnail-grid">
      {selected.slice((page-1)*size,page*size).map(item=><div key={item.image.evidence_id} className="iad-audit-evidence-item">
        <ThumbnailCard image={auditEvidenceImage(item,imageUrl(item))} label={item.caption} title={item.source.sample.relative_path}
          aria-label={`放大${item.caption}`} onClick={()=>onOpen(auditEvidenceImage(item,imageUrl(item)))}/>
        {item.reason&&<p>{item.reason}</p>}
      </div>)}
    </div><Pagination total={selected.length} page={page} size={size} unit="张" label="审计证据" onPage={setPage}/></div>
  </PageTabs>;
}
