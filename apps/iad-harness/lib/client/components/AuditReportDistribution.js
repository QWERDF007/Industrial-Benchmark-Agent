import { createElement as _createElement } from "react";
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useMemo, useState } from 'react';
import { auditMetadataLabels, auditMetadataValue } from '../audit-report.js';
import { selectDistribution } from '../distribution-selection.js';
import { Chart } from './charts/Chart.js';
import { AuditReportSection } from './AuditReportSection.js';
import { MultiSelect } from './Select.js';
const qualityNames = { PASS: '良品', FAIL: '异常', UNCERTAIN: '未确定' };
function DistributionPlot({ id, title, data, names, spec }) {
    const selectorId = useId();
    const [selected, setSelected] = useState(data.datasets);
    const view = useMemo(() => selectDistribution(data, selected, names), [data, selected, names]);
    return _jsx(Chart, { id: id, title: title, spec: view ? spec(view) : null, controls: _jsx(MultiSelect, { id: selectorId, label: "\u5B50\u6570\u636E\u96C6", options: data.datasets.map(value => ({ value, label: names[value] || value })), selected: selected, onToggle: value => setSelected(current => current.includes(value) ? current.filter(id => id !== value) : [...current, value]) }) });
}
export function AuditReportDistribution({ report }) {
    const data = report.data_distribution;
    const overall = data?.slices.find(item => item.dataset_id === null && item.category === null);
    const className = (name) => data?.dataset_format === 'folder_classification' ? qualityNames[name] || name : name || '空标签';
    const sources = Object.entries(overall?.metadata || {}).filter(([, values]) => Object.keys(values).some(value => value && value !== 'UNKNOWN'));
    const unregistered = Object.entries(overall?.metadata || {}).filter(([, values]) => !Object.keys(values).some(value => value && value !== 'UNKNOWN')).map(([key]) => auditMetadataLabels[key] || key);
    const scope = data ? { data, names: report.dataset_names } : null;
    return _jsx(AuditReportSection, { section: "distribution", children: !data || !overall || !scope ? _jsx("p", { children: "\u672C\u4F5C\u4E1A\u5C1A\u65E0\u6570\u636E\u5206\u5E03\u7EDF\u8BA1\u3002" }) : _jsxs(_Fragment, { children: [_jsxs("div", { className: "iad-distribution-summary", children: [_jsxs("span", { children: ["\u56FE\u50CF ", overall.image_count.toLocaleString('zh-CN'), " \u5F20"] }), overall.box_count !== null && _jsxs(_Fragment, { children: [_jsxs("span", { children: ["\u539F\u59CB\u6807\u6CE8\u6846 ", overall.box_count.toLocaleString('zh-CN'), " \u4E2A"] }), _jsxs("span", { children: ["\u65E0\u6846\u56FE\u50CF ", overall.unannotated_images.toLocaleString('zh-CN'), " \u5F20"] }), !!overall.invalid_box_count && _jsxs("span", { children: ["\u65E0\u6548\u51E0\u4F55 ", overall.invalid_box_count, " \u4E2A"] })] })] }), !!unregistered.length && _jsxs("p", { children: ["\u672A\u767B\u8BB0\uFF1A", unregistered.join('、'), "\u3002"] }), _jsxs("div", { className: "iad-chart-grid", children: [_jsx(DistributionPlot, { ...scope, id: "class-distribution", title: "\u7C7B\u522B\u5206\u5E03", spec: view => view.box_count === null && view.classes.length <= 5 ? {
                                type: 'donut', unit: '张', rows: view.classes.map(row => ({ id: row.category, label: className(row.category), value: row.image_count })),
                            } : { type: 'bar', series: [{ label: '图像', unit: '张' }, ...(view.box_count === null ? [] : [{ label: '标注框', unit: '个' }])],
                                rows: view.classes.map(row => ({ id: row.category, label: className(row.category), values: row.box_count === null ? [row.image_count] : [row.image_count, row.box_count] })) } }), _jsx(DistributionPlot, { ...scope, id: "image-dimensions", title: "\u56FE\u50CF\u5BBD\u9AD8\u5206\u5E03", spec: view => ({ type: 'heatmap',
                                data: view.heatmaps.image_dimensions, xLabel: '图像宽度（像素）', yLabel: '图像高度（像素）' }) }), overall.box_count !== null && _jsx(DistributionPlot, { ...scope, id: "box-dimensions", title: "\u6846\u5BBD\u9AD8\u5206\u5E03", spec: view => ({
                                type: 'heatmap', data: view.heatmaps.box_dimensions, xLabel: '框宽（像素）', yLabel: '框高（像素）'
                            }) }), ['image_aspect_ratio', 'box_aspect_ratio', 'relative_area'].filter(key => overall.histograms[key]).map(key => {
                            const title = { image_aspect_ratio: '图像长宽比', box_aspect_ratio: '框长宽比', relative_area: '框面积占比' }[key];
                            return _createElement(DistributionPlot, { ...scope, key: key, id: key.replaceAll('_', '-'), title: title, spec: view => ({
                                    type: 'distribution', series: view.distributions[key], xLabel: title, unit: key === 'image_aspect_ratio' ? '张' : '个',
                                    format: key === 'relative_area' ? 'percent' : 'decimal'
                                }) });
                        }), overall.box_count !== null && _jsxs(_Fragment, { children: [_jsx(DistributionPlot, { ...scope, id: "instance-counts", title: "\u6BCF\u56FE\u6807\u6CE8\u6846\u6570\u91CF", spec: view => ({ type: 'bar', series: [{ label: '图像', unit: '张' }],
                                        rows: Object.entries(view.instance_counts).map(([count, value]) => ({ id: count, label: `${count} 个框`, values: [value] })) }) }), _jsx(DistributionPlot, { ...scope, id: "box-centers", title: "\u6846\u4E2D\u5FC3\u4F4D\u7F6E\u5206\u5E03", spec: view => ({ type: 'heatmap',
                                        data: view.heatmaps.box_centers, xLabel: '水平位置', yLabel: '垂直位置', format: 'decimal', reverseY: true }) }), _jsx(DistributionPlot, { ...scope, id: "category-area", title: "\u5404\u7C7B\u522B\u6846\u9762\u79EF\u5360\u6BD4", spec: view => ({ type: 'boxplot', format: 'percent', rows: view.area_by_category }) })] }), ['datasets', ...sources.map(([key]) => key)].map(key => _createElement(DistributionPlot, { ...scope, key: key, id: `source-${key}`, title: `${key === 'datasets' ? '子数据集' : auditMetadataLabels[key] || key}分布`, spec: view => {
                                const rows = Object.entries(key === 'datasets' ? view.datasets : view.metadata[key]).map(([name, value]) => ({ id: name,
                                    label: key === 'datasets' ? report.dataset_names[name] || name : auditMetadataValue(key, name), value }));
                                return rows.length <= 5 ? { type: 'donut', unit: '张', rows } : { type: 'bar', series: [{ label: '图像', unit: '张' }],
                                    rows: rows.map(row => ({ id: row.id, label: row.label, values: [row.value] })) };
                            } }))] })] }) });
}
