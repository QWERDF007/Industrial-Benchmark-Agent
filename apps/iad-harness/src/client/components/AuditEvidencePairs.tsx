import React,{useState} from 'react';
import {useGalleryPagination} from '../useGalleryPagination.js';
import {Pagination} from './Pagination.js';
import type {AuditEvidencePair,AuditReportImage} from '../../shared/domain.generated.js';
import {ThumbnailCard} from './ThumbnailCard.js';
import {datasetImageAnnotations} from '../dataset-image-annotations.js';
import type {ImageSource} from './ImageViewer.js';
import {ImageGalleryViewer} from './ImageGalleryViewer.js';
import {AuditReportHeading,type AuditReportHeadingSpec} from './AuditReportHeading.js';

export function AuditEvidencePairs({pairs,imageUrl,title='图像证据',heading={level:4}}:{pairs:readonly AuditEvidencePair[];
  imageUrl(item:AuditReportImage):string;title?:string;heading?:AuditReportHeadingSpec}) {
  const [current,setCurrent]=useState<number|null>(null);
  const {grid,page,size,setPage}=useGalleryPagination(pairs.length,2);
  const images:ImageSource[]=pairs.flatMap(pair=>[pair.main,pair.candidate]).map(item=>({
    src:imageUrl(item),title:item.caption,width:item.image.original_size[0],height:item.image.original_size[1],
    sampleId:item.sample_id,evidence:item.image,...datasetImageAnnotations(item.source.dataset_format,item.source.sample,item.source.annotations)}));
  if(!pairs.length)return null;
  return <section className="iad-audit-gallery" data-audit-evidence-pairs>
    <AuditReportHeading {...heading}>{title}</AuditReportHeading>
    <div ref={grid} className="iad-thumbnail-grid">{pairs.slice((page-1)*size,page*size).map((pair,index)=><section className="iad-audit-evidence-pair"
      key={pair.pair_id} aria-label={`第${(page-1)*size+index+1}对图像证据`}>
        {(['主图','对比图'] as const).map((label,side)=>{
          const position=((page-1)*size+index)*2+side,image=images[position];
          return <ThumbnailCard key={label} image={image} label="" title={image.title} aria-label={`放大第${(page-1)*size+index+1}对${label}`} onClick={()=>setCurrent(position)}/>;
        })}
    </section>)}</div>
    <Pagination total={pairs.length*2} page={page} size={size*2} unit="张" label={title} hideSinglePage onPage={setPage}/>
    <ImageGalleryViewer images={images} current={current} onChange={setCurrent}/>
  </section>;
}
