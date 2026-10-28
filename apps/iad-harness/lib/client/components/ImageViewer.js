import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Modal } from "./Modal.js";
import { ImageCanvas, } from "./ImageCanvas.js";
import { MediaImage, MediaLoad } from "./MediaLoad.js";
export { AnnotatedImage } from "./ImageCanvas.js";
export function ImageViewer({ image, onClose, navigation, collection, }) {
    const [index, setIndex] = useState(collection?.index || 0);
    const current = collection?.images[index];
    const context = collection && (_jsxs("aside", { className: "iad-viewer-context", children: [_jsx("h3", { children: "\u5F53\u524D\u65B9\u5411" }), _jsx("p", { children: collection.title }), _jsx("p", { children: collection.instruction }), _jsxs("section", { children: [_jsxs("h3", { children: ["\u56FE\u50CF\u8BC1\u636E \u00B7 ", collection.images.length] }), [...new Set(collection.images.map((item) => item.group))].map((group) => (_jsxs("div", { className: "iad-viewer-evidence-group", children: [_jsxs("h4", { children: [group, " \u00B7", " ", collection.images.filter((item) => item.group === group)
                                        .length] }), _jsx(MediaLoad, { className: "iad-viewer-thumbnails", children: collection.images
                                    .filter((item) => item.group === group)
                                    .map((item) => {
                                    const position = collection.images.indexOf(item);
                                    return (_jsxs("button", { "aria-label": `切换证据 ${item.label}`, "aria-current": index === position, onClick: () => setIndex(position), children: [_jsx(MediaImage, { src: item.image.src, alt: item.label, loading: "lazy" }), _jsx("span", { children: item.label })] }, item.id));
                                }) })] }, group)))] }), _jsxs("details", { children: [_jsx("summary", { children: "\u56FE\u50CF\u4FE1\u606F" }), _jsxs("dl", { children: [_jsx("dt", { children: "\u6587\u4EF6\u540D" }), _jsx("dd", { children: current?.image.title }), _jsx("dt", { children: "\u8BC1\u636E ID" }), _jsx("dd", { children: current?.id }), _jsx("dt", { children: "\u539F\u59CB\u5C3A\u5BF8" }), _jsxs("dd", { children: [current?.originalSize[0], " \u00D7 ", current?.originalSize[1]] })] })] })] }));
    const scopedNavigation = collection
        ? {
            previous: index > 0,
            next: index < collection.images.length - 1,
            busy: false,
            error: "",
            move: (offset) => setIndex((value) => value + offset),
        }
        : navigation;
    return (_jsx(Modal, { title: "\u539F\u56FE\u68C0\u89C6\u5668", className: "iad-viewer-dialog", header: false, onClose: onClose, children: _jsx(ImageCanvas, { image: current
                ? {
                    ...current.image,
                    caption: `${current.label} · ${index + 1} / ${collection.images.length}`,
                }
                : image, onClose: onClose, navigation: scopedNavigation, context: context, closeLabel: collection ? "返回方向详情" : undefined }) }));
}
