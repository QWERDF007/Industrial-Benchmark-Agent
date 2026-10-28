import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect, useState } from 'react';
import { ImageCanvas } from './ImageCanvas.js';
export function ConsistencyCanvasPair({ sources, selected, synchronized = true, showDifferences = true, onExpand, anchorSide = 'left', labels = ['查询图像', '候选图像'] }) {
    const [transform, setTransform] = useState({ zoom: 0, x: 0, y: 0 });
    const [rightTransform, setRightTransform] = useState({ zoom: 0, x: 0, y: 0 });
    useLayoutEffect(() => { if (!synchronized)
        setRightTransform(transform); }, [synchronized]);
    const region = showDifferences && selected?.region ? { id: selected.difference_id, bbox: selected.region } : undefined;
    return (_jsx("div", { className: "iad-consistency-canvases", children: sources.map((source, index) => _jsxs("div", { className: "iad-consistency-side", children: [_jsx("p", { children: labels[index] }), source ? _jsx(ImageCanvas, { image: source, embedded: true, control: index === 0 || synchronized ? { transform, onChange: setTransform } : { transform: rightTransform, onChange: setRightTransform }, onExpand: onExpand ? view => onExpand({ ...source, initialSelection: view.selection, initialTransform: view.transform }) : undefined, focusRegion: region, overlay: region && source.width && source.height ? _jsx("svg", { className: "iad-finding-layer iad-consistency-region", viewBox: `0 0 ${source.width} ${source.height}`, children: _jsx("rect", { x: region.bbox[0], y: region.bbox[1], width: region.bbox[2] - region.bbox[0], height: region.bbox[3] - region.bbox[1], strokeDasharray: selected?.reference_from_other === (index ? anchorSide === 'left' ? 'right' : 'left' : anchorSide) ? '6 4' : undefined }) }) : undefined }) : _jsx("p", { role: "status", className: "iad-empty", children: "\u6B63\u5728\u8BFB\u53D6\u56FE\u50CF\u2026" })] }, index)) }));
}
