import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Modal } from './Modal.js';
import { conflictCategories } from '../../shared/consistency.parameters.generated.js';
function niceAxis(max) {
    const target = max / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(target, 1))));
    const normalized = target / magnitude;
    const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10) * magnitude;
    return Math.max(step * 4, Math.ceil(max / step) * step);
}
function StatisticChart({ title, rows, action, axis, onFilter }) {
    return _jsxs("section", { className: `dc-vchart-panel ${action === 'stat-agreement' ? 'dc-vchart-agreement' : ''}`, "aria-label": `${title}柱状图`, children: [_jsx("h3", { children: title }), _jsxs("div", { className: "dc-vchart-body", children: [_jsx("div", { className: "dc-vchart-axis", "aria-hidden": "true", children: [axis, axis * .75, axis * .5, axis * .25, 0].map((value, index) => _jsx("span", { children: Math.round(value) }, index)) }), _jsxs("div", { className: "dc-vchart-figure", children: [_jsx("div", { className: "dc-vchart-lines", "aria-hidden": "true" }), _jsx("div", { className: "dc-vchart-columns", style: { '--chart-cols': rows.length }, children: rows.map(row => _jsxs("div", { className: "dc-vchart-column", children: [_jsx("div", { className: "dc-vchart-barslot", children: _jsx("button", { type: "button", className: `dc-vchart-bar ${row.count ? '' : 'dc-vchart-zero'}`, style: { height: `${Math.max(.6, 100 * row.count / axis)}%` }, "data-dc": action, "data-id": row.id || row.name, "aria-label": `${row.name} ${row.count} 组，点击查看`, title: `${row.name}：${row.count} 组，点击筛选`, onClick: () => onFilter(action, row.id || row.name), children: _jsx("span", { className: "dc-vchart-value", children: row.count }) }) }), _jsx("span", { className: "dc-vchart-label", title: row.name, children: row.name })] }, row.name)) })] })] })] });
}
export function ConsistencyStatisticsDialog({ items, onFilter, onClose }) {
    const original = conflictCategories.filter(name => items.some(item => item.types.includes(name)))
        .map(name => ({ name, count: items.filter(item => item.types.includes(name)).length }));
    const model = [...new Set(items.map(item => item.model.modelType))].map(name => ({ name, count: items.filter(item => item.model.modelType === name).length }));
    const agreement = [{ name: '一致', id: 'same', count: items.filter(item => item.model.status === 'conflict').length },
        { name: '不一致', id: 'different', count: items.filter(item => item.model.status === 'no_conflict').length }];
    const distributionAxis = niceAxis(Math.max(1, ...original.map(row => row.count), ...model.map(row => row.count)));
    return _jsx(Modal, { title: "\u6807\u6CE8\u51B2\u7A81\u7EDF\u8BA1", size: "form", className: "dc-stats-dialog", onClose: onClose, children: _jsx("div", { className: "dc-stats-content", children: _jsxs("div", { className: "dc-stats-charts", children: [_jsx(StatisticChart, { title: "\u5DEE\u5F02\u7C7B\u578B", rows: original, action: "stat-category", axis: distributionAxis, onFilter: onFilter }), _jsx(StatisticChart, { title: "\u6A21\u578B\u5224\u65AD", rows: model, action: "stat-model", axis: distributionAxis, onFilter: onFilter }), _jsx(StatisticChart, { title: "\u7ED3\u8BBA\u4E00\u81F4\u6027", rows: agreement, action: "stat-agreement", axis: niceAxis(Math.max(1, ...agreement.map(row => row.count))), onFilter: onFilter })] }) }) });
}
