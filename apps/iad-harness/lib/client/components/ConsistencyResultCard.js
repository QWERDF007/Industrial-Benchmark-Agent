import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { conflictCategoryLabels } from '../../shared/consistency.parameters.generated.js';
import { ThumbnailCard } from './ThumbnailCard.js';
export function ConsistencyResultCard({ item, action, onOpen }) {
    const [program, model] = [item.type, item.model.modelType].map(value => value in conflictCategoryLabels ? conflictCategoryLabels[value] : value);
    return _jsx(ThumbnailCard, { src: item.url, variant: "comparison", label: item.filename, "data-dc": action, "data-id": item.id, "aria-label": `${item.filename}，程序结论：${program}；模型结论：${model}`, onClick: onOpen, children: _jsxs("span", { className: "iad-thumbnail-values", "aria-label": "\u7A0B\u5E8F\u7ED3\u8BBA\u4E0E\u6A21\u578B\u7ED3\u8BBA", children: [_jsx("span", { title: `程序结论：${program}`, children: program }), _jsx("span", { title: `模型结论：${model}`, children: model })] }) });
}
