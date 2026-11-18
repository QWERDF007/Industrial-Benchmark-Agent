import React,{useState} from 'react';
import {useGalleryPagination} from '../useGalleryPagination.js';
import {Pagination} from './Pagination.js';
import type {AuditEvidencePair,AuditReportImage} from '../../shared/domain.generated.js';
import {ThumbnailCard} from './ThumbnailCard.js';
import {datasetImageAnnotations} from '../dataset-image-annotations.js';
import {ImageViewer,type ImageSource} from './ImageViewer.js';
import {AuditReportHeading,type AuditReportHeadingSpec} from './AuditReportHeading.js';

export function AuditEvidencePairs({pairs,imageUrl,title='图像证据',heading={level:4}}:{pairs:readonly AuditEvidencePair[];
  imageUrl(item:AuditReportImage):string;title?:string;heading?:AuditReportHeadingSpec}) {
  const [current,setCurrent]=useState<ImageSource|null>(null);
  const {grid,page,size,setPage}=useGalleryPagination(pairs.length,2);
  if(!pairs.length)return null;
  return <section className="iad-audit-gallery" data-audit-evidence-pairs>
    <AuditReportHeading {...heading}>{title}</AuditReportHeading>
    <div ref={grid} className="iad-thumbnail-grid">{pairs.slice((page-1)*size,page*size).map((pair,index)=><section className="iad-audit-evidence-pair"
      key={pair.pair_id} aria-label={`第${(page-1)*size+index+1}对图像证据`}>
        {([['主图',pair.main],['对比图',pair.candidate]] as const).map(([label,item])=>{
          const image:ImageSource={src:imageUrl(item),title:item.caption,width:item.image.original_size[0],height:item.image.original_size[1],
            sampleId:item.sample_id,evidence:item.image,...datasetImageAnnotations(item.source.dataset_format,item.source.sample,item.source.annotations)};
          return <ThumbnailCard key={label} image={image} label="" title={item.caption} aria-label={`放大第${(page-1)*size+index+1}对${label}`} onClick={()=>setCurrent(image)}/>;
        })}
    </section>)}</div>
    <Pagination total={pairs.length*2} page={page} size={size*2} unit="张" label={title} hideSinglePage onPage={setPage}/>
    {current&&<ImageViewer image={current} onClose={()=>setCurrent(null)}/>}
  </section>;
}
