import React from 'react';
import type {AuditReportImage} from '../../shared/domain.generated.js';
import {AuditEvidenceGallery} from './AuditEvidenceGallery.js';
import {AuditReportHeading} from './AuditReportHeading.js';

export function AuditEvidenceSection({content,imageUrl}:{
  content:{number:string;title:string;description:string;facts?:readonly {label:string;text:string}[];
    galleries:readonly {title:string;images:readonly AuditReportImage[]}[];analysis:readonly {title:string;text:string}[]};
  imageUrl(item:AuditReportImage):string;
}) {
  const galleries=content.galleries.filter(group=>group.images.length);
  return <><AuditReportHeading level={3} number={content.number}>{content.title}</AuditReportHeading>{content.description&&<p>{content.description}</p>}
    {content.facts?.map(item=><p key={item.label}><strong>{item.label}：</strong>{item.text}</p>)}
    {galleries.map((group,index)=><AuditEvidenceGallery key={group.title} title={group.title} items={group.images} imageUrl={imageUrl}
      heading={{level:4,number:content.number+'.'+(index+1)}}/>)}
    {content.analysis.filter(item=>item.text).map((item,index)=><section key={item.title}>
      <AuditReportHeading level={4} number={content.number+'.'+(galleries.length+index+1)}>{item.title}</AuditReportHeading><p>{item.text}</p>
    </section>)}
  </>;
}
