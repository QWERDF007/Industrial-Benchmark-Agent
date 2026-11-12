import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AuditEvidenceGallery } from './AuditEvidenceGallery.js';
import { AuditReportHeading } from './AuditReportHeading.js';
export function AuditEvidenceSection({ content, imageUrl }) {
    const galleries = content.galleries.filter(group => group.images.length);
    return _jsxs(_Fragment, { children: [_jsx(AuditReportHeading, { level: 3, number: content.number, children: content.title }), content.description && _jsx("p", { children: content.description }), content.facts?.map(item => _jsxs("p", { children: [_jsxs("strong", { children: [item.label, "\uFF1A"] }), item.text] }, item.label)), galleries.map((group, index) => _jsx(AuditEvidenceGallery, { title: group.title, items: group.images, imageUrl: imageUrl, heading: { level: 4, number: content.number + '.' + (index + 1) } }, group.title)), content.analysis.filter(item => item.text).map((item, index) => _jsxs("section", { children: [_jsx(AuditReportHeading, { level: 4, number: content.number + '.' + (galleries.length + index + 1), children: item.title }), _jsx("p", { children: item.text })] }, item.title))] });
}
