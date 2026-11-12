import React from 'react';
import {createRoot} from 'react-dom/client';
import type {AuditRunReport} from '../shared/domain.generated.js';
import {AuditReportContent} from './components/AuditReportContent.js';
import {workbenchStyles} from './styles.js';

const input=document.getElementById('audit-report-data')!;
const {report,images}=JSON.parse(input.textContent!) as {report:AuditRunReport;images:Record<string,string>};
const style=document.createElement('style');
style.textContent=workbenchStyles+'\nbody{margin:0;background:#fff}.iad-offline-report{width:100%;margin:24px auto;padding:0 20px}';
document.head.append(style);
createRoot(document.getElementById('audit-offline-root')!).render(<main className="iad-workbench iad-offline-report" id="audit-page">
  <section className="iad-dataset-report" id="audit-report"><div className="iad-report-body">
    <AuditReportContent report={report} imageUrl={item=>images[item.image.evidence_id]}/>
  </div></section>
</main>);
