import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { conflictCategories, conflictCategoryLabels, modelConclusionLabels } from '../../shared/consistency.parameters.generated.js';
import { StatisticsDrawer } from './StatisticsDrawer.js';
import { Chart } from './charts/Chart.js';
export function ConsistencyStatisticsDrawer({ statistics, onClose, loading = false, error }) {
    const original = conflictCategories.map(name => ({ id: name, label: conflictCategoryLabels[name] || name,
        values: [statistics?.original_categories[name] ?? 0] }));
    const model = Object.entries(modelConclusionLabels).map(([name, label]) => ({ id: name, label, values: [statistics?.model_categories[name] ?? 0] }));
    const agreement = statistics ? [
        { id: 'same', label: '一致', values: [statistics.agreement.same] },
        { id: 'different', label: '不一致', values: [statistics.agreement.different] },
    ] : [];
    const maximum = Math.max(1, ...[...original, ...model, ...agreement].map(row => row.values[0]));
    return _jsx(StatisticsDrawer, { title: "\u6807\u6CE8\u51B2\u7A81\u7EDF\u8BA1", loading: loading, error: error, onClose: onClose, children: statistics && _jsxs(_Fragment, { children: [_jsx(Chart, { id: "stat-category", title: "\u7A0B\u5E8F\u5224\u65AD", spec: { type: 'bar', rows: original, series: [{ label: '图组', unit: '组' }], maximum, legendSelectable: false, labelRotation: 45 } }), _jsx(Chart, { id: "stat-model", title: "\u6A21\u578B\u5224\u65AD", spec: { type: 'bar', rows: model, series: [{ label: '图组', unit: '组' }], maximum, legendSelectable: false, labelRotation: 45 } }), _jsx(Chart, { id: "stat-agreement", title: "\u7ED3\u8BBA\u4E00\u81F4\u6027", description: statistics.unjudged ? `另有 ${statistics.unjudged} 组尚无可比较的模型结论。` : undefined, spec: { type: 'bar', rows: agreement, series: [{ label: '图组', unit: '组' }], maximum, legendSelectable: false, labelRotation: 45 } })] }) });
}
