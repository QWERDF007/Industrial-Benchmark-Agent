import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect, useState } from 'react';
import { ImageCanvas } from './ImageCanvas.js';
export function AnnotatedImagePair({ sources, labels, synchronized = false, focusRegion, overlays, onExpand }) {
    const [transform, setTransform] = useState({ zoom: 0, x: 0, y: 0 });
    const [rightTransform, setRightTransform] = useState({ zoom: 0, x: 0, y: 0 });
    useLayoutEffect(() => { if (!synchronized)
        setRightTransform(transform); }, [synchronized]);
    return _jsx("div", { className: "iad-image-pair", children: sources.map((source, index) => _jsxs("div", { className: "iad-image-pair-side", children: [_jsx("p", { children: labels[index] }), source ? _jsx(ImageCanvas, { image: source, control: index === 0 || synchronized ? { transform, onChange: setTransform } : { transform: rightTransform, onChange: setRightTransform }, onExpand: onExpand ? view => onExpand({ ...source, initialSelection: view.selection, initialTransform: view.transform }) : undefined, focusRegion: focusRegion, overlay: overlays?.[index] }) : _jsx("p", { className: "iad-empty", children: "\u6682\u65E0\u5BF9\u7167\u56FE\u50CF\u3002" })] }, index)) });
}
