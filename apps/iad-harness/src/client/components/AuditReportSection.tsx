import React from 'react';
import {auditReportSections,type AuditReportSectionKey} from '../audit-report.js';

export function AuditReportSection({section,children}:{section:AuditReportSectionKey;children:React.ReactNode}) {
  return <section className="iad-report-section" data-report-section={section}>
    <h2>{auditReportSections[section].title}</h2>{children}
  </section>;
}
