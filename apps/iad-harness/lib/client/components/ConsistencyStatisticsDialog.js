import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { conflictCategories, conflictCategoryLabels, modelConclusionLabels } from '../../shared/consistency.parameters.generated.js';
import { Modal } from './Modal.js';
import { Chart } from './charts/Chart.js';
import { Select } from './Select.js';
export function ConsistencyStatisticsDialog({ statistics, onFilter, onClose, loading = false, error }) {
    const original = conflictCategories.filter(name => statistics?.original_categories[name] !== undefined)
        .map(name => ({ id: name, label: conflictCategoryLabels[name] || name, values: [statistics.original_categories[name]] }));
    const model = Object.entries(statistics?.model_categories || {}).map(([name, count]) => ({ id: name,
        label: modelConclusionLabels[name] || name, values: [count] }));
    const maximum = Math.max(1, ...original.map(row => row.values[0]), ...model.map(row => row.values[0]));
    const agreement = statistics ? [
        { id: 'same', label: '一致', value: statistics.agreement.same, tone: 'success' },
        { id: 'different', label: '不一致', value: statistics.agreement.different, tone: 'warning' },
    ] : [];
    const choices = [
        ...original.map(row => ({ action: 'stat-category', id: row.id, label: `差异类型：${row.label}（${row.values[0].toLocaleString('zh-CN')} 组）` })),
        ...model.map(row => ({ action: 'stat-model', id: row.id, label: `模型判断：${row.label}（${row.values[0].toLocaleString('zh-CN')} 组）` })),
        ...agreement.map(row => ({ action: 'stat-agreement', id: row.id, label: `结论一致性：${row.label}（${row.value.toLocaleString('zh-CN')} 组）` })),
    ];
    return _jsx(Modal, { title: "\u6807\u6CE8\u51B2\u7A81\u7EDF\u8BA1", size: "form", className: "dc-stats-dialog", onClose: onClose, children: _jsx("div", { className: "dc-stats-content", children: error ? _jsx("p", { role: "alert", children: error }) : loading ? _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u7EDF\u8BA1\u2026" }) : statistics ? _jsxs(_Fragment, { children: [onFilter && _jsxs("label", { className: "dc-stats-filter", children: ["\u6309\u7EDF\u8BA1\u7ED3\u679C\u7B5B\u9009", _jsxs(Select, { "aria-label": "\u6309\u7EDF\u8BA1\u7ED3\u679C\u7B5B\u9009", value: "", onChange: event => {
                                    const choice = choices[Number(event.target.value)];
                                    onFilter(choice.action, choice.id);
                                }, children: [_jsx("option", { value: "", disabled: true, children: "\u9009\u62E9\u7B5B\u9009\u6761\u4EF6" }), choices.map((choice, index) => _jsx("option", { value: index, children: choice.label }, `${choice.action}:${choice.id}`))] })] }), _jsxs("div", { className: "dc-stats-charts", children: [_jsx(Chart, { id: "stat-category", title: "\u5DEE\u5F02\u7C7B\u578B", spec: { type: 'bar', rows: original, series: [{ label: '图组', unit: '组' }], maximum }, onSelect: onFilter ? id => onFilter('stat-category', id) : undefined }), _jsx(Chart, { id: "stat-model", title: "\u6A21\u578B\u5224\u65AD", spec: { type: 'bar', rows: model, series: [{ label: '图组', unit: '组' }], maximum }, onSelect: onFilter ? id => onFilter('stat-model', id) : undefined }), _jsx(Chart, { id: "stat-agreement", title: "\u7ED3\u8BBA\u4E00\u81F4\u6027", description: statistics.unjudged ? `另有 ${statistics.unjudged} 组尚无可比较的模型结论。` : undefined, spec: { type: 'donut', unit: '组', rows: agreement }, onSelect: onFilter ? id => onFilter('stat-agreement', id) : undefined })] })] }) : _jsx("p", { role: "status", children: "\u6682\u65E0\u7EDF\u8BA1\u6570\u636E\u3002" }) }) });
}
