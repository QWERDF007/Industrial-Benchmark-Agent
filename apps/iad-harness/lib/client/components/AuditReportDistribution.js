import { createElement as _createElement } from "react";
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useMemo, useState } from 'react';
import { auditDistributionClassLabel, auditDistributionMetricLabels, auditMetadataLabels, auditMetadataValue } from '../audit-report.js';
import { selectDistribution } from '../distribution-selection.js';
import { Chart } from './charts/Chart.js';
import { imageDimensionsChart } from './charts/image-dimensions.js';
import { AuditReportSection } from './AuditReportSection.js';
import { MultiSelect } from './Select.js';
function DistributionPlot({ id, title, data, names, spec }) {
    const selectorId = useId();
    const [selected, setSelected] = useState(data.datasets);
    const view = useMemo(() => selectDistribution(data, selected, names), [data, selected, names]);
    return _jsx(Chart, { id: id, title: title, spec: view ? spec(view) : null, controls: _jsx(MultiSelect, { id: selectorId, label: "\u5B50\u6570\u636E\u96C6", options: data.datasets.map(value => ({ value, label: names[value] || value })), selected: selected, onToggle: value => setSelected(current => current.includes(value) ? current.filter(id => id !== value) : [...current, value]) }) });
}
export function AuditReportDistribution({ report }) {
    const data = report.data_distribution;
    const overall = data?.slices.find(item => item.dataset_id === null && item.category === null);
    const className = (name) => auditDistributionClassLabel(name, data?.dataset_format === 'folder_classification');
    const sources = Object.entries(overall?.metadata || {}).filter(([, values]) => Object.keys(values).some(value => value && value !== 'UNKNOWN'));
    const scope = data ? { data, names: report.dataset_names } : null;
    return _jsxs(AuditReportSection, { section: "distribution", children: [!!report.distribution_analysis && _jsx("p", { children: report.distribution_analysis }), !data || !overall || !scope ? _jsx("p", { children: "\u672C\u4F5C\u4E1A\u5C1A\u65E0\u6570\u636E\u5206\u5E03\u7EDF\u8BA1\u3002" }) : _jsxs(_Fragment, { children: [_jsxs("div", { className: "iad-chart-pair", children: [_jsx(DistributionPlot, { ...scope, id: "image-counts", title: overall.annotation_count === null ? '图像总数' : '有标注与无标注图像数量', spec: view => ({ type: 'donut', unit: '张',
                                    center: { label: '图像总数', value: view.image_count }, rows: view.annotation_count === null
                                        ? [{ id: 'total', label: '全部图像', value: view.image_count }] : [
                                        { id: 'annotated', label: '有标注', value: view.image_count - view.unannotated_images },
                                        { id: 'unannotated', label: '无标注', value: view.unannotated_images, tone: 'muted' },
                                    ] }) }), overall.annotation_count !== null && _jsx(Chart, { id: "annotation-counts", title: "\u5404\u6570\u636E\u96C6\u6807\u6CE8\u5B9E\u4F8B\u6570\u91CF", spec: { type: 'bar',
                                    series: [{ label: '标注实例', unit: '个' }], rows: data.slices.flatMap(slice => slice.category === null && slice.dataset_id !== null && slice.annotation_count !== null
                                        ? [{ id: slice.dataset_id, label: scope.names[slice.dataset_id] || slice.dataset_id, values: [slice.annotation_count] }] : []) } })] }), _jsxs("div", { className: "iad-chart-grid", children: [_jsx(DistributionPlot, { ...scope, id: "class-distribution", title: "\u7C7B\u522B\u5206\u5E03", spec: view => view.annotation_count === null && view.classes.length <= 5 ? {
                                    type: 'donut', unit: '张', rows: view.classes.map(row => ({ id: row.category, label: className(row.category), value: row.image_count })),
                                } : { type: 'bar', series: [{ label: '图像', unit: '张' }, ...(view.annotation_count === null ? [] : [{ label: '标注实例', unit: '个' }])],
                                    rows: view.classes.map(row => ({ id: row.category, label: className(row.category), values: row.annotation_count === null ? [row.image_count] : [row.image_count, row.annotation_count] })) } }), _jsx(DistributionPlot, { ...scope, id: "image-dimensions", title: "\u56FE\u50CF\u5BBD\u9AD8\u5206\u5E03", spec: view => imageDimensionsChart(view.heatmaps.image_dimensions) }), overall.annotation_count !== null && _jsx(DistributionPlot, { ...scope, id: "box-dimensions", title: "\u5B9E\u4F8B\u5916\u63A5\u77E9\u5F62\u5BBD\u9AD8\u5206\u5E03", spec: view => ({
                                    type: 'heatmap', data: view.heatmaps.box_dimensions, xLabel: '外接矩形宽（像素）', yLabel: '外接矩形高（像素）'
                                }) }), ['image_aspect_ratio', 'box_aspect_ratio', 'relative_area'].filter(key => overall.histograms[key]).map(key => {
                                const label = auditDistributionMetricLabels[key];
                                return _createElement(DistributionPlot, { ...scope, key: key, id: key.replaceAll('_', '-'), title: `${label}分布`, spec: view => ({
                                        type: 'distribution', series: view.distributions[key], xLabel: label, unit: key === 'image_aspect_ratio' ? '张' : '个',
                                        format: key === 'relative_area' ? 'percent' : 'decimal'
                                    }) });
                            }), overall.annotation_count !== null && _jsxs(_Fragment, { children: [_jsx(DistributionPlot, { ...scope, id: "instance-counts", title: "\u6BCF\u5F20\u56FE\u50CF\u7684\u6807\u6CE8\u5B9E\u4F8B\u6570\u5206\u5E03", spec: view => ({ type: 'bar', series: [{ label: '图像', unit: '张' }],
                                            rows: Object.entries(view.instance_counts).map(([count, value]) => ({ id: count, label: `${count} 个实例`, values: [value] })) }) }), _jsx(DistributionPlot, { ...scope, id: "box-centers", title: "\u5B9E\u4F8B\u4E2D\u5FC3\u4F4D\u7F6E\u5206\u5E03", spec: view => ({ type: 'heatmap',
                                            data: view.heatmaps.box_centers, xLabel: '水平位置', yLabel: '垂直位置', format: 'decimal', reverseY: true }) }), _jsx(DistributionPlot, { ...scope, id: "category-area", title: "\u5404\u7C7B\u522B\u5B9E\u4F8B\u9762\u79EF\u5360\u56FE\u50CF\u6BD4\u4F8B\u5206\u5E03", spec: view => ({ type: 'boxplot', format: 'percent', series: view.area_by_category }) })] }), sources.map(([key]) => _createElement(DistributionPlot, { ...scope, key: key, id: `source-${key}`, title: `${auditMetadataLabels[key] || key}分布`, spec: view => {
                                    const rows = Object.entries(view.metadata[key]).map(([name, value]) => ({ id: name, label: auditMetadataValue(key, name), value }));
                                    return rows.length <= 5 ? { type: 'donut', unit: '张', rows } : { type: 'bar', series: [{ label: '图像', unit: '张' }],
                                        rows: rows.map(row => ({ id: row.id, label: row.label, values: [row.value] })) };
                                } }))] })] })] });
}
