import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState } from 'react';
import { Chart } from './charts/Chart.js';
import { chartNumber } from './charts/options.js';
import { AuditReportSection } from './AuditReportSection.js';
import { AuditReportHeading } from './AuditReportHeading.js';
import { AuditEvidenceGallery } from './AuditEvidenceGallery.js';
import { AuditEvidenceSection } from './AuditEvidenceSection.js';
import { auditScoreItemDetails } from '../audit-score-item.js';
import { useAuditReportSections } from '../audit-report.js';
import { consistencyScoreReading, distributionScoreReading, distributionScoreDetails } from '../distribution-score-reading.js';
import { MultiSelect } from './Select.js';
function scoreDonut(score) {
    const contributions = Object.entries(score.dimensions).map(([id, dimension]) => {
        const weight = score.weights[id], value = dimension.score === null ? null : dimension.score * weight;
        return { id, label: dimension.label, value, details: dimension.label + '：' + (dimension.score === null
                ? `证据不足（系数 ${chartNumber(weight, 'decimal')}）`
                : `${chartNumber(dimension.score, 'score')} × ${chartNumber(weight, 'decimal')} = ${chartNumber(value, 'score')} 分`) };
    });
    return { type: 'donut', unit: '分', format: 'score', center: { label: '综合得分', value: score.total }, rows: score.total === null ? [] : [
            ...contributions.flatMap(row => row.value === null ? [] : [{ ...row, value: row.value }]),
            { id: 'unearned', label: '未得分', value: 100 - score.total, tone: 'muted' },
        ] };
}
export function AuditScoreSummary({ score, panels, controls }) {
    return _jsxs("div", { className: "iad-score-summary", children: [_jsx(Chart, { id: "quality-score-summary", title: "\u7EFC\u5408\u5F97\u5206", controls: controls, spec: score ? scoreDonut(score) : null, panels: panels }), !!score?.limitations.length && _jsx("p", { children: score.limitations.join('；') })] });
}
function useScoreScope(overall, names) {
    const id = useId();
    const options = overall.dataset_scores.flatMap(item => item.dataset_id ? [{ value: item.dataset_id, label: names[item.dataset_id] ?? item.dataset_id }] : []);
    const [selected, setSelected] = useState(() => options.map(item => item.value));
    const scores = selected.length === options.length ? [{ label: '', score: overall }] : overall.dataset_scores
        .filter(item => item.dataset_id && selected.includes(item.dataset_id)).map(score => ({ label: names[score.dataset_id] ?? score.dataset_id, score }));
    const controls = _jsx(MultiSelect, { id: id, label: "\u5B50\u6570\u636E\u96C6", options: options, selected: selected, onToggle: value => setSelected(current => current.includes(value) ? current.filter(id => id !== value) : [...current, value]) });
    return { scores, controls };
}
export function AuditReportScore({ report, imageUrl }) {
    const sections = useAuditReportSections(), overall = report.quality_score;
    const heading = sections.score;
    if (!overall || !heading)
        return null;
    return _jsxs(AuditReportSection, { section: "score", children: [_jsx(ScoreSummaryScope, { report: report, overall: overall }), [...new Set(overall.items.map(item => item.direction))].map((direction, index) => _jsx(ScoreDirection, { report: report, overall: overall, direction: direction, number: heading.prefix + (index + 1), imageUrl: imageUrl }, direction))] });
}
function ScoreSummaryScope({ report, overall }) {
    const { scores, controls } = useScoreScope(overall, report.dataset_names);
    const score = scores.length === 1 ? scores[0].score : null;
    return _jsxs(_Fragment, { children: [_jsx(AuditScoreSummary, { score: score, controls: controls, panels: scores.length > 1 ? scores.map(({ label, score }) => ({ label, spec: scoreDonut(score) })) : undefined }), score && _jsxs("p", { children: ["\u8BC4\u5206\u8986\u76D6 ", score.completed_images, " / ", score.total_images, " \u5F20", report.audit_scope !== 'consistency' && _jsxs(_Fragment, { children: ["\uFF0C\u573A\u666F\u5F52\u7C7B ", score.observed_images, " \u5F20"] }), "\u3002 \u7EFC\u5408\u5F97\u5206\u7CFB\u6570\uFF1A", Object.entries(score.weights).map(([key, weight]) => `${score.dimensions[key].label} ${chartNumber(weight, 'decimal')}`).join('，'), "\u3002"] })] });
}
function ScoreDirection({ report, overall, direction, number, imageUrl }) {
    const { scores, controls } = useScoreScope(overall, report.dataset_names);
    const statistical = direction === '分布多样性';
    const views = scores.map(({ label, score }) => {
        const items = score.items.filter(item => item.direction === direction);
        const spec = { type: 'bar', format: 'score', series: [{ label: '扣分', unit: '分', tone: 'warning' }], rows: items.map(item => {
                const row = { id: item.code, label: item.label, values: [item.deduction] };
                if (statistical)
                    return { ...row, tooltip: distributionScoreReading(item) };
                return { ...row, tooltip: consistencyScoreReading(item) };
            }) };
        return { label, score, items, spec };
    });
    const details = views.flatMap(view => view.items.filter(item => statistical
        ? (item.deduction ?? 0) > 0 && Boolean(item.analysis || item.distribution_evidence?.length)
        : item.dimension !== 'consistency' && (item.dimension !== 'diversity' || item.deduction !== 0 || item.suppressed_by))
        .map(item => ({ item, view })));
    return _jsxs("section", { children: [_jsx(AuditReportHeading, { level: 3, number: number, children: direction }), !statistical && views.some(view => view.items.some(item => item.dimension !== 'consistency')) && _jsx("p", { children: details.length ? '下图展示各评分项的扣分，具体统计与说明见下方分项。' : '本组未发现需要扣分的覆盖问题。' }), _jsx(Chart, { id: `score-${direction}`, title: `${direction}扣分`, controls: controls, spec: views.length === 1 ? views[0].spec : null, panels: views.length > 1 ? views : undefined }), views.map(({ label, score, items }) => {
                const dimension = items.length ? score.dimensions[items[0].dimension] : null;
                return dimension && score.items.findIndex(item => item.dimension === items[0].dimension) === score.items.indexOf(items[0])
                    ? _jsxs("p", { children: [views.length > 1 ? label + '，' : '', dimension.label, "\u5F97\u5206 ", dimension.score === null ? '证据不足' : chartNumber(dimension.score, 'score') + ' 分', "\u3002"] }, score.dataset_id ?? '') : null;
            }), details.map(({ item, view }, itemIndex) => {
                const itemNumber = number + '.' + (itemIndex + 1);
                if (statistical) {
                    const statistics = distributionScoreDetails(item, report);
                    return _jsxs("article", { className: "iad-audit-discovery", "data-score-rule": item.code, children: [_jsxs(AuditReportHeading, { level: 4, number: itemNumber, children: [views.length > 1 ? view.label + ' / ' : '', item.label] }), item.analysis && _jsx("p", { children: item.analysis }), !!statistics.length && _jsx("ul", { children: statistics.map((reading, index) => _jsx("li", { children: reading }, index)) })] }, `${view.score.dataset_id}:${item.code}`);
                }
                const details = auditScoreItemDetails(item, view.score.items);
                const images = report.evidence_groups['score:' + (view.score.dataset_id ? view.score.dataset_id + ':' : '') + item.code] ?? [];
                return _jsxs("article", { className: "iad-audit-discovery", "data-score-rule": item.code, children: [_jsxs(AuditReportHeading, { level: 4, number: itemNumber, children: [views.length > 1 ? view.label + ' / ' : '', item.label] }), _jsx("p", { children: details.description }), details.scenarioTitle ? _jsx(AuditEvidenceSection, { level: 5, content: { number: itemNumber + '.1', title: details.scenarioTitle,
                                description: details.analysis, galleries: [{ title: '图像证据', images }], analysis: [] }, imageUrl: imageUrl })
                            : _jsxs(_Fragment, { children: [_jsx("p", { children: details.analysis }), _jsx(AuditEvidenceGallery, { items: images, imageUrl: imageUrl, heading: { level: 5, number: itemNumber + '.1' } })] })] }, `${view.score.dataset_id}:${item.code}`);
            })] });
}
