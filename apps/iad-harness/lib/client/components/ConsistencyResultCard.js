import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { modelConclusionLabels } from '../../shared/consistency.parameters.generated.js';
import { ThumbnailCard } from './ThumbnailCard.js';
export function ConsistencyResultCard({ item, action, onOpen }) {
    const program = item.model.identityConclusion ? '' : item.type;
    const model = item.model.modelType ? modelConclusionLabels[item.model.modelType] : item.model.identityConclusion || '';
    return _jsx(ThumbnailCard, { src: item.url, imageLoading: "eager", variant: "comparison", label: item.filename, "data-dc": action, "data-id": item.id, "aria-label": `${item.filename}${program ? '，程序结论：' + program : ''}${model ? '；模型结论：' + model : ''}`, onClick: onOpen, children: _jsxs("span", { className: "iad-thumbnail-values", "aria-label": "\u7A0B\u5E8F\u7ED3\u8BBA\u4E0E\u6A21\u578B\u7ED3\u8BBA", children: [_jsx("span", { title: program ? `程序结论：${program}` : undefined, children: program }), _jsx("span", { title: `模型结论：${model}`, children: model })] }) });
}
