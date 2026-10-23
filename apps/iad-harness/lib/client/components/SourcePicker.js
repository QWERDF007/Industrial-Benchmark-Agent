import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { mediaUrl } from "../api.js";
import { Modal } from "./Modal.js";
import { Pagination } from "./Pagination.js";
import { ImageViewer } from "./ImageViewer.js";
/** Presentation only: each caller owns candidate qualification, scope and selection. */
export function SourcePicker({ dataset, label, sources, selected, target, disabled, page, onPage, onChange, search, onSearch, onChoose, choosing = false, canChoose = true }) {
    const [open, setOpen] = useState(false), [selectedOnly, setSelectedOnly] = useState(false), [selectedPage, setSelectedPage] = useState(1);
    const [selectedSearch, setSelectedSearch] = useState("");
    const [image, setImage] = useState(null);
    const name = (id) => id.slice(id.indexOf(":") + 1);
    const chosen = selected.filter(id => name(id).toLocaleLowerCase().includes(selectedSearch.toLocaleLowerCase()));
    const current = Math.min(selectedPage, Math.max(1, Math.ceil(chosen.length / 10)));
    const items = selectedOnly ? chosen.slice((current - 1) * 10, current * 10).map(id => ({ sample_id: id, relative_path: name(id) })) : sources?.items || [];
    function show(only) { setSelectedOnly(only); setSelectedPage(1); setSelectedSearch(""); setOpen(true); }
    function thumbnail(id, path) {
        const sample = { task_id: dataset.task_id, sample_id: id };
        return _jsx("button", { type: "button", "aria-label": `放大样例 ${path}`, onClick: () => setImage({ src: mediaUrl(sample, "image"), title: path }), children: _jsx("img", { src: mediaUrl(sample, "thumbnail"), alt: path, loading: "lazy" }) });
    }
    return _jsxs("div", { className: "iad-source-picker", children: [_jsxs("p", { role: "status", children: ["\u5DF2\u9009 ", selected.length, " / ", target || "—", " \u5F20", sources ? ` · 可用 ${sources.total}` : ""] }), _jsx("div", { className: "iad-source-preview", children: selected.slice(0, 4).map(id => _jsxs("div", { children: [thumbnail(id, name(id)), _jsx("span", { title: name(id), children: name(id).split("/").pop() })] }, id)) }), _jsxs("div", { className: "iad-row", children: [_jsxs("button", { type: "button", disabled: disabled, onClick: () => show(false), children: ["\u9009\u62E9", label, "\u56FE\u50CF"] }), _jsxs("button", { type: "button", disabled: !selected.length || disabled, onClick: () => show(true), children: ["\u67E5\u770B\u5168\u90E8\u5DF2\u9009", label] })] }), open && _jsxs(Modal, { title: `选择${label}图像`, onClose: () => setOpen(false), className: "iad-source-dialog", children: [_jsxs("div", { className: "iad-row", children: [_jsxs("label", { className: "iad-field", children: ["\u641C\u7D22\u56FE\u50CF", _jsx("input", { type: "search", "aria-label": `搜索${label}图像`, value: selectedOnly ? selectedSearch : search, onChange: event => {
                                            if (selectedOnly) {
                                                setSelectedSearch(event.target.value);
                                                setSelectedPage(1);
                                            }
                                            else
                                                onSearch(event.target.value);
                                        } })] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: selectedOnly, onChange: event => { setSelectedOnly(event.target.checked); setSelectedPage(1); } }), "\u4EC5\u5DF2\u9009"] }), _jsxs("span", { children: ["\u5DF2\u9009 ", selected.length, " / ", target || "—", " \u5F20"] })] }), _jsxs("div", { className: "iad-row", children: [onChoose && _jsx("button", { type: "button", disabled: disabled || choosing || !canChoose, onClick: onChoose, children: choosing ? "选择中…" : "按数量选择" }), _jsxs("button", { type: "button", disabled: disabled || choosing || !selected.length, onClick: () => onChange([]), children: ["\u6E05\u7A7A", label, "\u9009\u62E9"] })] }), _jsxs("fieldset", { disabled: disabled || choosing, className: "iad-source-candidates", children: [_jsxs("legend", { children: [label, "\u56FE\u50CF"] }), _jsx("div", { className: "iad-source-grid", children: items.map(item => _jsxs("div", { className: "iad-source-option", children: [thumbnail(item.sample_id, item.relative_path), _jsxs("label", { title: item.relative_path, children: [_jsx("input", { type: "checkbox", "aria-label": `选择${label} ${item.relative_path}`, checked: selected.includes(item.sample_id), onChange: event => onChange(event.target.checked ? [...selected, item.sample_id] : selected.filter(id => id !== item.sample_id)) }), _jsx("span", { children: item.relative_path.split("/").pop() })] })] }, item.sample_id)) }), !items.length && _jsx("p", { role: "status", children: selectedOnly ? "没有匹配的已选图像。" : sources ? "没有匹配的合格来源。" : "正在读取来源…" })] }), _jsx(Pagination, { total: selectedOnly ? chosen.length : sources?.total || 0, page: selectedOnly ? current : page, size: 10, unit: "\u5F20", onPage: selectedOnly ? setSelectedPage : onPage }), _jsx("div", { className: "iad-form-actions", children: _jsx("button", { type: "button", disabled: choosing, onClick: () => setOpen(false), children: "\u5B8C\u6210\u9009\u62E9" }) })] }), image && _jsx(ImageViewer, { image: image, onClose: () => setImage(null) })] });
}
