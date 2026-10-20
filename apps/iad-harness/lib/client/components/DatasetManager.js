import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { message, request } from "../api.js";
function DirectoryPicker({ label, value, onChange }) {
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
    return _jsxs("div", { className: "iad-field", children: [_jsx("label", { children: label }), _jsxs("div", { className: "iad-row", children: [_jsx("input", { "aria-label": label, value: value, onChange: e => onChange(e.target.value), placeholder: "\u670D\u52A1\u5668\u4E0A\u7684\u76EE\u5F55" }), _jsx("button", { type: "button", onClick: () => browse(value), children: "\u6D4F\u89C8" })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), listing && _jsxs("div", { className: "iad-directory", children: [_jsxs("div", { className: "iad-row", children: [_jsx("code", { children: listing.path }), _jsx("button", { type: "button", onClick: () => browse(listing.parent), children: "\u4E0A\u7EA7" }), _jsx("button", { type: "button", onClick: () => { onChange(listing.path); setListing(null); }, children: "\u9009\u62E9\u6B64\u76EE\u5F55" }), _jsx("button", { type: "button", onClick: () => setListing(null), children: "\u5173\u95ED" })] }), _jsx("div", { className: "iad-directory-list", children: listing.directories.map(dir => _jsx("button", { type: "button", onClick: () => browse(dir.path), children: dir.name }, dir.path)) })] })] });
}
export function DatasetManager({ datasets, selected, onChanged }) {
    const [name, setName] = useState("");
    const [imageDir, setImageDir] = useState("");
    const [annotationDir, setAnnotationDir] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [rename, setRename] = useState("");
    async function importDataset(event) {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
            const dataset = await request("/datasets/import", { name, image_dir: imageDir, annotation_dir: annotationDir, unannotated_is_normal: true });
            onChanged(dataset.dataset_id);
            setName("");
        }
        catch (e) {
            setError(message(e));
        }
        finally {
            setBusy(false);
        }
    }
    async function updateName() {
        if (!selected)
            return;
        setError("");
        try {
            await request(`/datasets/${selected.dataset_id}`, { name: rename }, "PATCH");
            onChanged();
            setRename("");
        }
        catch (e) {
            setError(message(e));
        }
    }
    return _jsxs("div", { className: "iad-settings", children: [_jsxs("form", { onSubmit: importDataset, children: [_jsx("h2", { children: "\u5BFC\u5165 Labelme \u6570\u636E\u96C6" }), _jsxs("div", { className: "iad-field", children: [_jsx("label", { htmlFor: "dataset-name", children: "\u6570\u636E\u96C6\u540D\u79F0" }), _jsx("input", { id: "dataset-name", value: name, onChange: e => setName(e.target.value), maxLength: 120, required: true })] }), _jsx(DirectoryPicker, { label: "\u56FE\u50CF\u76EE\u5F55", value: imageDir, onChange: setImageDir }), _jsx(DirectoryPicker, { label: "\u6807\u6CE8\u76EE\u5F55", value: annotationDir, onChange: setAnnotationDir }), _jsx("p", { className: "iad-muted", children: "\u6807\u6CE8\u76EE\u5F55\u6309\u56FE\u50CF\u76F8\u5BF9\u8DEF\u5F84\u5339\u914D\u540C\u540D JSON\u3002\u521D\u59CB\u4ECE\u65E0\u6807\u6CE8\u56FE\u9009\u53D6\u826F\u54C1\u53C2\u8003\u3002" }), _jsx("button", { className: "iad-primary", disabled: busy || !name.trim() || !imageDir || !annotationDir, children: busy ? "正在扫描导入…" : "导入数据集" })] }), _jsxs("section", { children: [_jsxs("h2", { children: ["\u6570\u636E\u96C6\u7BA1\u7406 \u00B7 ", datasets.length] }), selected ? _jsxs(_Fragment, { children: [_jsxs("dl", { children: [_jsx("dt", { children: "\u540D\u79F0" }), _jsx("dd", { children: selected.name }), _jsx("dt", { children: "\u6570\u636E\u96C6 ID" }), _jsx("dd", { children: _jsx("code", { children: selected.dataset_id }) }), _jsx("dt", { children: "\u56FE\u50CF\u76EE\u5F55" }), _jsx("dd", { children: selected.image_dir }), _jsx("dt", { children: "\u6807\u6CE8\u76EE\u5F55" }), _jsx("dd", { children: selected.annotation_dir || "由原导入配置定位" })] }), _jsxs("div", { className: "iad-row", children: [_jsx("input", { "aria-label": "\u65B0\u7684\u6570\u636E\u96C6\u540D\u79F0", placeholder: "\u65B0\u7684\u6570\u636E\u96C6\u540D\u79F0", value: rename, onChange: e => setRename(e.target.value) }), _jsx("button", { disabled: !rename.trim(), onClick: updateName, children: "\u4FDD\u5B58\u540D\u79F0" })] }), _jsxs("label", { className: "iad-row iad-rule", children: [_jsx("input", { type: "checkbox", checked: selected.unannotated_is_normal, onChange: async (e) => {
                                            try {
                                                await request(`/datasets/${selected.dataset_id}`, { unannotated_is_normal: e.target.checked }, "PATCH");
                                                onChanged();
                                            }
                                            catch (err) {
                                                setError(message(err));
                                            }
                                        } }), "\u65E0\u6807\u6CE8\u56FE\u4F5C\u4E3A\u521D\u59CB\u826F\u54C1\u53C2\u8003"] }), _jsxs("p", { children: ["\u826F\u54C1\u5019\u9009\uFF1A", selected.reference_mode === "selected" ? "人工选定范围" : "自动资格", " \u00B7 ", selected.reference_sample_ids.length, " \u5F20"] }), selected.reference_mode === "selected" && _jsx("button", { onClick: async () => {
                                    try {
                                        await request(`/datasets/${selected.dataset_id}`, { reset_references: true }, "PATCH");
                                        onChanged();
                                    }
                                    catch (error) {
                                        setError(message(error));
                                    }
                                }, children: "\u6062\u590D\u81EA\u52A8\u8D44\u683C" })] }) : _jsx("p", { children: "\u8BF7\u5BFC\u5165\u6570\u636E\u96C6\u3002" })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error })] });
}
