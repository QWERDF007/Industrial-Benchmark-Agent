import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
export function ConsistencyRegionProposal({ sources, differences, onChange }) {
    const [sampleId, setSampleId] = useState(''), [annotationId, setAnnotationId] = useState(''), [operation, setOperation] = useState('relabel');
    const [category, setCategory] = useState(''), [geometryKind, setGeometryKind] = useState('bbox'), [geometryText, setGeometryText] = useState('');
    const annotations = differences.flatMap(diff => [...diff.left, ...diff.right]).filter((item, index, items) => items.findIndex(other => other.annotation_id === item.annotation_id) === index && item.sample_id === sampleId);
    const value = useMemo(() => {
        if (!sampleId || (operation !== 'add' && !annotationId))
            return null;
        if (operation === 'remove')
            return { kind: 'PROPOSE_REGION_CHANGE', changes: [{ operation, sample_id: sampleId, annotation_id: annotationId }] };
        if (operation === 'relabel')
            return category.trim() ? { kind: 'PROPOSE_REGION_CHANGE', changes: [{ operation, sample_id: sampleId, annotation_id: annotationId, category: category.trim() }] } : null;
        const numbers = geometryText.trim().split(/[\s,，]+/).filter(Boolean).map(Number);
        if (!numbers.every(Number.isFinite))
            return null;
        const points = Array.from({ length: Math.floor(numbers.length / 2) }, (_, index) => [numbers[index * 2], numbers[index * 2 + 1]]);
        const geometry = geometryKind === 'bbox' && numbers.length === 4 ? { kind: 'bbox', coordinates: [numbers[0], numbers[1], numbers[2], numbers[3]] }
            : geometryKind === 'polygon' && numbers.length >= 6 && numbers.length % 2 === 0 ? { kind: 'polygon', points: [points[0], points[1], points[2], ...points.slice(3)] } : null;
        if (!geometry || (operation === 'add' && !category.trim()))
            return null;
        const change = operation === 'add' ? { operation, sample_id: sampleId, category: category.trim(), geometry } : { operation, sample_id: sampleId, annotation_id: annotationId, geometry };
        return { kind: 'PROPOSE_REGION_CHANGE', changes: [change] };
    }, [sampleId, annotationId, operation, category, geometryKind, geometryText]);
    useEffect(() => onChange(value), [value, onChange]);
    return _jsxs("section", { "aria-label": "\u533A\u57DF\u4FEE\u6B63\u5EFA\u8BAE", children: [_jsx("p", { className: "iad-muted", children: "\u5EFA\u8BAE\u4E0D\u4F1A\u6539\u5199\u6E90\u6807\u6CE8\u3002\u5B9E\u9645\u4FEE\u6B63\u5E76\u91CD\u626B\u540E\u518D\u9A8C\u8BC1\u3002" }), _jsxs("div", { className: "iad-config-bar", children: [_jsxs("label", { className: "iad-field", children: ["\u76EE\u6807\u6837\u672C", _jsxs("select", { "aria-label": "\u533A\u57DF\u5EFA\u8BAE\u76EE\u6807", value: sampleId, onChange: event => { setSampleId(event.target.value); setAnnotationId(''); }, children: [_jsx("option", { value: "", children: "\u8BF7\u9009\u62E9" }), sources.map(source => _jsx("option", { value: source.sample.sample_id, children: source.sample.relative_path }, source.sample.sample_id))] })] }), _jsxs("label", { className: "iad-field", children: ["\u4FEE\u6B63\u65B9\u5F0F", _jsxs("select", { "aria-label": "\u533A\u57DF\u4FEE\u6B63\u65B9\u5F0F", value: operation, onChange: event => setOperation(event.target.value), children: [_jsx("option", { value: "relabel", children: "\u4FEE\u6539\u7C7B\u522B" }), _jsx("option", { value: "reshape", children: "\u4FEE\u6539\u5F62\u72B6" }), _jsx("option", { value: "add", children: "\u65B0\u589E\u533A\u57DF" }), _jsx("option", { value: "remove", children: "\u5220\u9664\u533A\u57DF" })] })] })] }), operation !== 'add' && _jsxs("label", { className: "iad-field", children: ["\u6240\u9009\u5DEE\u5F02\u4E2D\u7684\u533A\u57DF", _jsxs("select", { "aria-label": "\u5EFA\u8BAE\u76EE\u6807\u533A\u57DF", value: annotationId, onChange: event => setAnnotationId(event.target.value), children: [_jsx("option", { value: "", children: "\u8BF7\u9009\u62E9" }), annotations.map(annotation => _jsxs("option", { value: annotation.annotation_id, children: [annotation.raw_label, " \u00B7 ", annotation.bbox?.join(', ')] }, annotation.annotation_id))] })] }), (operation === 'add' || operation === 'relabel') && _jsxs("label", { className: "iad-field", children: ["\u5EFA\u8BAE\u7C7B\u522B", _jsx("input", { "aria-label": "\u5EFA\u8BAE\u7C7B\u522B", value: category, onChange: event => setCategory(event.target.value) })] }), (operation === 'add' || operation === 'reshape') && _jsxs(_Fragment, { children: [_jsxs("label", { className: "iad-field", children: ["\u5F62\u72B6", _jsxs("select", { value: geometryKind, onChange: event => setGeometryKind(event.target.value), children: [_jsx("option", { value: "bbox", children: "\u77E9\u5F62" }), _jsx("option", { value: "polygon", children: "\u591A\u8FB9\u5F62" })] })] }), _jsxs("label", { className: "iad-field", children: [geometryKind === 'bbox' ? '原图坐标 x1, y1, x2, y2' : '原图顶点 x1, y1, x2, y2, …', _jsx("input", { "aria-label": "\u5EFA\u8BAE\u533A\u57DF\u5750\u6807", value: geometryText, onChange: event => setGeometryText(event.target.value) })] })] })] });
}
