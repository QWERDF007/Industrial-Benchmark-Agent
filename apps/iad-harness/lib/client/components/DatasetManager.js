import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { message, request } from "../api.js";
import { Modal } from "./Modal.js";
import { DatasetName } from "./DatasetName.js";
function DirectoryPicker({ label, value, onChange, disabled = false }) {
    const [listing, setListing] = useState(null);
    const [error, setError] = useState("");
    async function browse(path) {
        try {
            setListing(await request(`/directories?path=${encodeURIComponent(path || "/data1")}`));
            setError("");
        }
        catch (e) {
            setError(message(e));
        }
    }
    return _jsxs("div", { className: "iad-field", children: [_jsx("label", { children: label }), _jsxs("div", { className: "iad-row", children: [_jsx("input", { "aria-label": label, disabled: disabled, value: value, onChange: e => onChange(e.target.value), placeholder: "\u670D\u52A1\u5668\u4E0A\u7684\u76EE\u5F55" }), _jsx("button", { type: "button", disabled: disabled, onClick: () => browse(value), children: "\u6D4F\u89C8" })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), listing && _jsxs("fieldset", { className: "iad-directory", "aria-label": `${label}浏览`, disabled: disabled, children: [_jsxs("div", { className: "iad-row", children: [_jsx("code", { children: listing.path }), _jsx("button", { type: "button", onClick: () => browse(listing.parent), children: "\u4E0A\u7EA7" }), _jsx("button", { type: "button", onClick: () => { onChange(listing.path); setListing(null); }, children: "\u9009\u62E9\u6B64\u76EE\u5F55" }), _jsx("button", { type: "button", onClick: () => setListing(null), children: "\u5173\u95ED" })] }), _jsx("div", { className: "iad-directory-list", children: listing.directories.map(dir => _jsx("button", { type: "button", onClick: () => browse(dir.path), children: dir.name }, dir.path)) })] })] });
}
function DatasetSettings({ dataset, onChanged }) {
    const [imageDir, setImageDir] = useState(dataset.image_dir);
    const [annotationDir, setAnnotationDir] = useState(dataset.annotation_dir || "");
    useEffect(() => { setImageDir(dataset.image_dir); setAnnotationDir(dataset.annotation_dir || ""); }, [dataset.image_dir, dataset.annotation_dir]);
    const directoriesChanged = imageDir !== dataset.image_dir || annotationDir !== (dataset.annotation_dir || "");
    const [scan, setScan] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    async function save(patch) {
        setBusy(true);
        setError("");
        try {
            await request(`/datasets/${dataset.dataset_id}`, patch, "PATCH");
            onChanged();
        }
        catch (error) {
            setError(message(error));
        }
        finally {
            setBusy(false);
        }
    }
    async function rescan() {
        setBusy(true);
        setError("");
        setScan(null);
        try {
            setScan(await request(`/datasets/${dataset.dataset_id}/rescan`, directoriesChanged ? { image_dir: imageDir, annotation_dir: annotationDir } : {}));
            onChanged();
        }
        catch (error) {
            setError(message(error));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs("section", { "aria-label": "\u5F53\u524D\u6570\u636E\u96C6\u8BE6\u60C5", "aria-busy": busy, children: [_jsx("h2", { children: "\u6570\u636E\u96C6\u8BE6\u60C5" }), _jsx(DatasetName, { dataset: dataset, label: "\u65B0\u7684\u6570\u636E\u96C6\u540D\u79F0", onChanged: onChanged }), _jsxs("dl", { children: [_jsx("dt", { children: "\u6570\u636E\u96C6 ID" }), _jsx("dd", { children: _jsx("code", { children: dataset.dataset_id }) })] }), _jsxs("dl", { className: "iad-dataset-counts", children: [_jsxs("div", { children: [_jsx("dt", { children: "\u56FE\u50CF\u6570\u91CF" }), _jsx("dd", { children: dataset.total_samples })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u6807\u6CE8\u6570\u91CF" }), _jsx("dd", { children: dataset.annotation_count })] })] }), _jsxs("div", { className: "iad-field-group", children: [_jsx("h3", { children: "\u670D\u52A1\u5668\u76EE\u5F55" }), _jsx(DirectoryPicker, { label: "\u56FE\u50CF\u76EE\u5F55", value: imageDir, onChange: setImageDir, disabled: busy }), _jsx(DirectoryPicker, { label: "\u6807\u6CE8\u76EE\u5F55", value: annotationDir, onChange: setAnnotationDir, disabled: busy }), _jsx("div", { className: "iad-form-actions", children: _jsx("button", { className: directoriesChanged ? "iad-primary" : "", disabled: busy || (directoriesChanged && (!imageDir.trim() || !annotationDir.trim())), onClick: () => void rescan(), children: busy ? "正在处理…" : directoriesChanged ? "保存目录并重新扫描" : "重新扫描目录" }) })] }), _jsxs("label", { className: "iad-row iad-rule", children: [_jsx("input", { type: "checkbox", checked: dataset.unannotated_is_normal, disabled: busy, onChange: e => save({ unannotated_is_normal: e.target.checked }) }), "\u65E0\u6807\u6CE8\u56FE\u4F5C\u4E3A\u521D\u59CB\u826F\u54C1\u6765\u6E90"] }), scan && _jsxs("p", { role: "status", "aria-label": "\u626B\u63CF\u7ED3\u679C", children: ["\u626B\u63CF\u5B8C\u6210 \u00B7 ", scan.image_count, " \u5F20\u56FE\u50CF \u00B7 ", scan.annotation_count, " \u4E2A\u6807\u6CE8 \u00B7 ", scan.issue_count, " \u9879\u95EE\u9898"] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error })] });
}
export function DatasetManager({ datasets, selected, onChanged }) {
    const [importing, setImporting] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [notice, setNotice] = useState("");
    const addButton = useRef(null);
    const cancelDeleteButton = useRef(null);
    useEffect(() => { if (notice)
        addButton.current?.focus(); }, [notice]);
    const [name, setName] = useState("");
    const [imageDir, setImageDir] = useState("");
    const [annotationDir, setAnnotationDir] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    async function deleteDataset() {
        if (!deleting || busy)
            return;
        setBusy(true);
        setError("");
        try {
            await request(`/datasets/${encodeURIComponent(deleting.dataset_id)}`, undefined, "DELETE");
            setNotice(`已删除数据集“${deleting.name}”`);
            setDeleting(null);
            onChanged();
        }
        catch (e) {
            setError(message(e));
        }
        finally {
            setBusy(false);
        }
    }
    async function importDataset(event) {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
            const dataset = await request("/datasets/import", { name, image_dir: imageDir, annotation_dir: annotationDir, unannotated_is_normal: true });
            onChanged(dataset.dataset_id);
            setName("");
            setImageDir("");
            setAnnotationDir("");
            setImporting(false);
        }
        catch (e) {
            setError(message(e));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs("div", { className: "iad-settings", children: [_jsxs("section", { "aria-label": "\u6570\u636E\u96C6\u5217\u8868", children: [_jsxs("div", { className: "iad-section-header", children: [_jsxs("h2", { children: ["\u6570\u636E\u96C6 \u00B7 ", datasets.length] }), _jsx("button", { ref: addButton, className: "iad-primary", onClick: () => { setError(""); setNotice(""); setImporting(true); }, children: "\u6DFB\u52A0\u6570\u636E\u96C6" })] }), _jsx("div", { className: "iad-dataset-list", children: datasets.map(dataset => _jsxs("article", { className: "iad-dataset-card", "data-selected": selected?.dataset_id === dataset.dataset_id, children: [_jsxs("div", { className: "iad-dataset-card-header", children: [_jsx(DatasetName, { dataset: dataset, label: "\u5361\u7247\u6570\u636E\u96C6\u540D\u79F0", onChanged: () => onChanged() }), _jsx("button", { type: "button", className: "iad-icon-button iad-card-delete", "aria-label": `删除数据集 ${dataset.name}`, title: "\u5220\u9664\u6570\u636E\u96C6", onClick: () => { setError(""); setNotice(""); setDeleting(dataset); }, children: _jsx("svg", { "aria-hidden": "true", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" }) }) })] }), _jsx("button", { type: "button", className: "iad-dataset-select", "aria-label": `选择数据集 ${dataset.name}`, "aria-pressed": selected?.dataset_id === dataset.dataset_id, onClick: () => onChanged(dataset.dataset_id), children: _jsxs("span", { className: "iad-dataset-counts", children: [_jsxs("span", { children: [_jsx("span", { children: "\u56FE\u50CF\u6570\u91CF" }), _jsx("strong", { children: dataset.total_samples })] }), _jsxs("span", { children: [_jsx("span", { children: "\u6807\u6CE8\u6570\u91CF" }), _jsx("strong", { children: dataset.annotation_count })] })] }) })] }, dataset.dataset_id)) }), notice && _jsx("p", { role: "status", children: notice }), !datasets.length && _jsx("p", { className: "iad-muted", children: "\u6DFB\u52A0\u670D\u52A1\u5668\u4E0A\u7684 Labelme \u56FE\u50CF\u76EE\u5F55\u4E0E\u6807\u6CE8\u76EE\u5F55\u3002" })] }), selected ? _jsx(DatasetSettings, { dataset: selected, onChanged: onChanged }, selected.dataset_id) : _jsx("section", { children: _jsx("p", { children: "\u9009\u62E9\u6216\u6DFB\u52A0\u6570\u636E\u96C6\u3002" }) }), deleting && _jsxs(Modal, { title: "\u5220\u9664\u6570\u636E\u96C6", className: "iad-confirm-dialog", initialFocus: cancelDeleteButton, onClose: () => { if (!busy)
                    setDeleting(null); }, children: [_jsxs("p", { children: ["\u786E\u8BA4\u5220\u9664\u6570\u636E\u96C6\u201C", deleting.name, "\u201D\uFF1F"] }), _jsx("p", { className: "iad-muted", children: "\u5220\u9664\u5176\u6837\u672C\u8BB0\u5F55\u3001\u77E5\u8BC6\u3001\u5BA1\u8BA1\u548C\u590D\u6838\u8BB0\u5F55\uFF0C\u4FDD\u7559\u670D\u52A1\u5668\u4E0A\u7684\u539F\u59CB\u56FE\u50CF\u4E0E\u6807\u6CE8\u6587\u4EF6\u3002" }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), _jsxs("div", { className: "iad-form-actions", children: [_jsx("button", { ref: cancelDeleteButton, type: "button", "aria-label": "\u53D6\u6D88\u5220\u9664", disabled: busy, onClick: () => setDeleting(null), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "iad-danger", disabled: busy, onClick: () => void deleteDataset(), children: busy ? "正在删除…" : "确认删除" })] })] }), importing && _jsx(Modal, { title: "\u5BFC\u5165 Labelme \u6570\u636E\u96C6", onClose: () => { if (!busy)
                    setImporting(false); }, children: _jsxs("form", { className: "iad-dataset-import", onSubmit: importDataset, children: [_jsxs("div", { className: "iad-field", children: [_jsx("label", { htmlFor: "dataset-name", children: "\u6570\u636E\u96C6\u540D\u79F0" }), _jsx("input", { id: "dataset-name", value: name, onChange: e => setName(e.target.value), maxLength: 120, autoFocus: true, required: true, disabled: busy })] }), _jsx(DirectoryPicker, { label: "\u56FE\u50CF\u76EE\u5F55", value: imageDir, onChange: setImageDir, disabled: busy }), _jsx(DirectoryPicker, { label: "\u6807\u6CE8\u76EE\u5F55", value: annotationDir, onChange: setAnnotationDir, disabled: busy }), _jsx("p", { className: "iad-muted", children: "\u6309\u76F8\u5BF9\u8DEF\u5F84\u5339\u914D\u540C\u540D JSON\uFF0C\u65E0\u6807\u6CE8\u56FE\u4F5C\u4E3A\u521D\u59CB\u826F\u54C1\u5019\u9009\u3002" }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), _jsxs("div", { className: "iad-form-actions", children: [_jsx("button", { type: "button", disabled: busy, onClick: () => setImporting(false), children: "\u53D6\u6D88" }), _jsx("button", { className: "iad-primary", disabled: busy || !name.trim() || !imageDir || !annotationDir, children: busy ? "正在扫描导入…" : "导入数据集" })] })] }) })] });
}
