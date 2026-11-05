import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useRef, useState } from "react";
import { FullscreenViewer } from "./FullscreenViewer.js";
import { ThumbnailCard } from "./ThumbnailCard.js";
import { InspectionOverlay, InspectionPanel } from "./InspectionEvidence.js";
import { resolveInspection } from "../inspection.js";
export { AnnotatedImage } from "./ImageCanvas.js";
export function ImageViewer({ image, onClose, navigation, collection }) {
    const [index, setIndex] = useState(collection?.index || 0);
    const [selection, setSelection] = useState(image.initialSelection || null);
    const transform = useRef(image.initialTransform || { zoom: 0, x: 0, y: 0 });
    const remember = useCallback((value) => { transform.current = value; }, []);
    const current = collection?.images[index]?.image || image;
    const inspection = current.inspection;
    const { finding, region } = resolveInspection(inspection?.analysis, selection);
    const context = collection ? _jsxs("div", { children: [_jsx("h3", { children: collection.title }), _jsx("p", { children: collection.instruction }), _jsx("div", { className: "iad-thumbnail-grid", children: collection.images.map((item, position) => _jsx(ThumbnailCard, { src: item.image.src, label: item.label, "aria-current": position === index, onClick: () => setIndex(position) }, item.id)) })] })
        : inspection ? _jsx(InspectionPanel, { inspection: inspection, selection: selection, choices: [], onSelect: setSelection, transform: () => transform.current }) : undefined;
    const items = collection?.images.map(item => ({ id: item.id, title: item.image.title, imageUrl: item.image.src,
        width: item.image.width, height: item.image.height, annotationLayer: item.image.annotationLayer, sampleId: item.image.sampleId, evidence: item.image.evidence }));
    return _jsx(FullscreenViewer, { open: true, item: { id: current.src, title: current.title, imageUrl: current.src, width: current.width,
            height: current.height, annotationLayer: current.annotationLayer, sampleId: current.sampleId, evidence: current.evidence }, items: items, currentIndex: index, onNavigate: collection ? setIndex : undefined, navigation: navigation, context: context, initialTransform: current.initialTransform, onTransform: remember, onClose: onClose, overlay: inspection && _jsx(InspectionOverlay, { inspection: inspection, selectedId: region?.image.evidence_id || '', hoveredIds: [], regions: inspection.analysis.regions, finding: finding }), onImageClick: inspection ? point => {
            const found = inspection.analysis.regions.find(item => point[0] >= item.crop_bbox[0] && point[0] <= item.crop_bbox[2]
                && point[1] >= item.crop_bbox[1] && point[1] <= item.crop_bbox[3]);
            if (found)
                setSelection({ kind: 'evidence', id: found.image.evidence_id });
        } : undefined });
}
