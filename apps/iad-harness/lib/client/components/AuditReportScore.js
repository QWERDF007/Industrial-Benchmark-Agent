import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Chart } from './charts/Chart.js';
import { chartNumber } from './charts/options.js';
import { AuditReportSection } from './AuditReportSection.js';
import { AuditReportHeading } from './AuditReportHeading.js';
import { AuditEvidenceGallery } from './AuditEvidenceGallery.js';
import { useAuditReportSections } from '../audit-report.js';
export function AuditScoreSummary({ score }) {
    return _jsxs(_Fragment, { children: [_jsx("p", { children: _jsxs("strong", { children: ["\u7EFC\u5408\u5F97\u5206 ", score.total === null ? '证据不足' : chartNumber(score.total, 'score') + ' 分'] }) }), _jsx(Chart, { id: "quality-score-summary", title: "\u6570\u636E\u96C6\u8D28\u91CF\u5F97\u5206", spec: { type: 'bar', maximum: 100, format: 'score',
                    series: [{ label: '得分', unit: '分' }], rows: [{ id: 'total', label: '综合得分', values: [score.total] },
                        ...Object.entries(score.dimensions).map(([id, dimension]) => ({ id, label: dimension.label, values: [dimension.score] }))] } }), !!score.limitations.length && _jsx("p", { children: score.limitations.join('；') })] });
}
export function AuditReportScore({ report, imageUrl }) {
    const [dataset, setDataset] = useState('');
    const sections = useAuditReportSections(), overall = report.quality_score;
    const heading = sections.score;
    if (!overall || !heading)
        return null;
    const score = overall.dataset_scores.find(item => item.dataset_id === dataset) ?? overall;
    const directions = [...new Set(score.items.map(item => item.direction))];
    return _jsxs(AuditReportSection, { section: "score", children: [overall.dataset_scores.length > 1 && _jsxs("label", { children: ["\u8BC4\u5206\u8303\u56F4 ", _jsxs("select", { "aria-label": "\u8BC4\u5206\u8303\u56F4", value: dataset, onChange: event => setDataset(event.target.value), children: [_jsx("option", { value: "", children: "\u6574\u4F53" }), overall.dataset_scores.map(item => _jsx("option", { value: item.dataset_id ?? '', children: report.dataset_names[item.dataset_id ?? ''] ?? item.dataset_id }, item.dataset_id))] })] }), dataset && _jsx(AuditScoreSummary, { score: score }), _jsxs("p", { children: ["\u8BC4\u5206\u8986\u76D6 ", score.completed_images, " / ", score.total_images, " \u5F20\uFF0C\u573A\u666F\u5F52\u7C7B ", score.observed_images, " \u5F20\u3002 \u7EFC\u5408\u5F97\u5206\u7CFB\u6570\uFF1A", Object.entries(score.weights).map(([key, weight]) => `${score.dimensions[key].label} ${chartNumber(weight, 'percent')}`).join('，'), "\u3002"] }), directions.map((direction, index) => {
                const items = score.items.filter(item => item.direction === direction);
                const dimension = score.dimensions[items[0].dimension];
                return _jsxs("section", { children: [_jsx(AuditReportHeading, { level: 3, number: heading.prefix + (index + 1), children: direction }), _jsx(Chart, { id: `score-${index}`, title: `${direction}扣分`, spec: { type: 'bar', format: 'score',
                                series: [{ label: '扣分', unit: '分', tone: 'warning' }], rows: items.map(item => ({ id: item.code,
                                    label: `${item.dimension === 'consistency' ? '' : item.code + ' '}${item.label}`, values: [item.deduction], details: [
                                        item.scenario, `${item.count} / ${item.denominator}，占比 ${item.ratio === null ? '不适用' : chartNumber(item.ratio, 'percent')}`,
                                        `扣分上限 ${chartNumber(item.maximum, 'score')} 分`,
                                        item.deduction === null ? '证据不足' : item.suppressed_by ? `同一原因已计入 ${item.suppressed_by}` :
                                            item.count === 0 ? '未出现，不扣分' : '',
                                    ].filter(Boolean).join('\n') })) } }), score.items.findIndex(item => item.dimension === items[0].dimension) === score.items.indexOf(items[0])
                            ? _jsxs("p", { children: [dimension.label, "\u5F97\u5206 ", dimension.score === null ? '证据不足' : chartNumber(dimension.score, 'score') + ' 分', "\u3002"] }) : null, items.filter(item => (item.deduction ?? 0) > 0).map(item => _jsx(AuditEvidenceGallery, { items: report.evidence_groups['score:' + (score.dataset_id ? score.dataset_id + ':' : '') + item.code] ?? [], imageUrl: imageUrl, title: `${item.dimension === 'consistency' ? '' : item.code + ' '}${item.scenario || item.label}` }, item.code))] }, direction);
            })] });
}
