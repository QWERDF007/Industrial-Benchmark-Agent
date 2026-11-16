import React from 'react';
import {useAuditReportSections,type AuditReportSectionKey} from '../audit-report.js';

export function AuditReportSection({section,children}:{section:AuditReportSectionKey;children:React.ReactNode}) {
  const heading=useAuditReportSections()[section];
  if(!heading)return null;
  return <section className="iad-report-section" data-report-section={section}>
    <h2>{heading.title}</h2>{children}
  </section>;
}
