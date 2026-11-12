import React from 'react';
import type {AuditRunReport,AuditReportImage} from '../../shared/domain.generated.js';
import {AuditEvidenceGallery} from './AuditEvidenceGallery.js';
import type {AuditReportHeadingSpec} from './AuditReportHeading.js';

export function auditCaseImages(report:AuditRunReport,ids:readonly string[]):AuditReportImage[] {
  const images=new Map<string,AuditReportImage>();
  for(const id of ids)for(const item of report.evidence_groups['case:'+id]||[])
    if(!images.has(item.image.evidence_id))images.set(item.image.evidence_id,item);
  return [...images.values()].slice(0,8);
}

export function AuditCaseGallery({ids,report,imageUrl,heading}:{ids:readonly string[];report:AuditRunReport;
  imageUrl(item:AuditReportImage):string;heading?:AuditReportHeadingSpec}) {
  return <AuditEvidenceGallery items={auditCaseImages(report,ids)} imageUrl={imageUrl} heading={heading}/>;
}
