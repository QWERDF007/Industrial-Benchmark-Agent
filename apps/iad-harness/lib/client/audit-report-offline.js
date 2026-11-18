import { jsx as _jsx } from "react/jsx-runtime";
import { createRoot } from 'react-dom/client';
import { AuditReportContent } from './components/AuditReportContent.js';
import { workbenchStyles } from './styles.js';
void (async () => {
    const input = document.getElementById('audit-report-data');
    const { report, images } = JSON.parse(input.textContent);
    input.textContent = '';
    input.remove();
    for (const key of Object.keys(images)) {
        const bytes = await fetch(images[key]);
        images[key] = URL.createObjectURL(await bytes.blob());
    }
    const style = document.createElement('style');
    style.textContent = workbenchStyles + '\nbody{margin:0;background:#fff}.iad-offline-report{width:100%;margin:24px auto;padding:0 20px}';
    document.head.append(style);
    createRoot(document.getElementById('audit-offline-root')).render(_jsx("main", { className: "iad-workbench iad-offline-report", id: "audit-page", children: _jsx("section", { className: "iad-dataset-report", id: "audit-report", children: _jsx("div", { className: "iad-report-body", children: _jsx(AuditReportContent, { report: report, imageUrl: item => images[item.image.sha256] }) }) }) }));
})().catch(error => { document.getElementById('audit-offline-root').textContent = '报告读取失败：' + String(error); });
