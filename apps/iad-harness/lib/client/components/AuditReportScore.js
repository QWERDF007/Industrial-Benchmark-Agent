import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Chart } from './charts/Chart.js';
import { chartNumber } from './charts/options.js';
import { AuditReportSection } from './AuditReportSection.js';
import { AuditReportHeading } from './AuditReportHeading.js';
import { AuditEvidenceGallery } from './AuditEvidenceGallery.js';
import { AuditEvidenceSection } from './AuditEvidenceSection.js';
import { auditScoreItemDetails } from '../audit-score-item.js';
import { useAuditReportSections } from '../audit-report.js';
export function AuditScoreSummary({ score }) {
    const contributions = Object.entries(score.dimensions).map(([id, dimension]) => {
        const weight = score.weights[id], value = dimension.score === null ? null : dimension.score * weight;
        return { id, label: dimension.label, value, details: dimension.label + '：' + (dimension.score === null
                ? `证据不足（系数 ${chartNumber(weight, 'decimal')}）`
                : `${chartNumber(dimension.score, 'score')} × ${chartNumber(weight, 'decimal')} = ${chartNumber(value, 'score')} 分`) };
    });
    return _jsxs("div", { className: "iad-score-summary", children: [_jsx(Chart, { id: "quality-score-summary", title: "\u7EFC\u5408\u5F97\u5206", spec: { type: 'donut', unit: '分', format: 'score',
                    center: { label: '综合得分', value: score.total }, rows: score.total === null ? [] : [
                        ...contributions.flatMap(row => row.value === null ? [] : [{ ...row, value: row.value }]),
                        { id: 'unearned', label: '未得分', value: 100 - score.total, tone: 'muted' },
                    ] } }), !!score.limitations.length && _jsx("p", { children: score.limitations.join('；') })] });
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
                const detailItems = items.filter(item => item.dimension !== 'diversity' || item.deduction !== 0 || item.suppressed_by);
                return _jsxs("section", { children: [_jsx(AuditReportHeading, { level: 3, number: heading.prefix + (index + 1), children: direction }), _jsx("p", { children: detailItems.length ? '下图展示各评分项的扣分；具体场景、分析与图像证据见下方分项。' : '本组未发现需要扣分的覆盖问题。' }), _jsx(Chart, { id: `score-${index}`, title: `${direction}扣分`, spec: { type: 'bar', format: 'score',
                                series: [{ label: '扣分', unit: '分', tone: 'warning' }], rows: items.map(item => {
                                    const details = auditScoreItemDetails(item, score.items);
                                    return { id: item.code, label: item.label, values: [item.deduction], details: [details.scenarioTitle, details.analysis,
                                            `扣分上限 ${chartNumber(item.maximum, 'score')} 分`].filter(Boolean).join('\n') };
                                }) } }), score.items.findIndex(item => item.dimension === items[0].dimension) === score.items.indexOf(items[0])
                            ? _jsxs("p", { children: [dimension.label, "\u5F97\u5206 ", dimension.score === null ? '证据不足' : chartNumber(dimension.score, 'score') + ' 分', "\u3002"] }) : null, detailItems.map((item, itemIndex) => {
                            const details = auditScoreItemDetails(item, score.items), number = heading.prefix + (index + 1) + '.' + (itemIndex + 1);
                            const images = report.evidence_groups['score:' + (score.dataset_id ? score.dataset_id + ':' : '') + item.code] ?? [];
                            return _jsxs("article", { className: "iad-audit-discovery", "data-score-rule": item.code, children: [_jsx(AuditReportHeading, { level: 4, number: number, children: item.label }), _jsx("p", { children: details.description }), details.scenarioTitle ? _jsx(AuditEvidenceSection, { level: 5, content: { number: number + '.1', title: details.scenarioTitle,
                                            description: details.analysis, galleries: [{ title: '图像证据', images }], analysis: [] }, imageUrl: imageUrl })
                                        : _jsxs(_Fragment, { children: [_jsx("p", { children: details.analysis }), _jsx(AuditEvidenceGallery, { items: images, imageUrl: imageUrl, heading: { level: 5, number: number + '.1' } })] })] }, item.code);
                        })] }, direction);
            })] });
}
