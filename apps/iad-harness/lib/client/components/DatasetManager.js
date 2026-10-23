import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { message, request } from "../api.js";
import { Modal } from "./Modal.js";
import { DeleteAction } from "./DeleteAction.js";
import { DatasetName } from "./DatasetName.js";
import { FolderMapping } from "./FolderMapping.js";
import { useFolderPreview } from "../useFolderPreview.js";
import { WorkbenchHeader } from "./layout/WorkbenchHeader.js";
import { FloatingMenu } from "./FloatingMenu.js";
import { Pagination } from "./Pagination.js";
import { useUnsavedChanges } from "../useUnsavedChanges.js";
import { useWorkspace } from "../workspace.js";
import { PageTabs } from "./layout/PageTabs.js";
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
    const { workspace } = useWorkspace();
    const tab = workspace.view("industrial-datasets").datasetSettingsTab;
    const isFolder = dataset.format === "folder_classification";
    const [imageDir, setImageDir] = useState(dataset.image_dir);
    const [annotationDir, setAnnotationDir] = useState(dataset.annotation_dir || "");
    const savedRules = JSON.stringify(dataset.folder_rules || []);
    const [folderRules, setFolderRules] = useState(dataset.folder_rules);
    const { preview, ready, pending, error: previewError } = useFolderPreview(imageDir, folderRules, isFolder);
    useEffect(() => {
        setImageDir(dataset.image_dir);
        setAnnotationDir(dataset.annotation_dir || "");
        setFolderRules(JSON.parse(savedRules));
    }, [dataset.image_dir, dataset.annotation_dir, savedRules]);
    const rulesChanged = isFolder && JSON.stringify(folderRules) !== savedRules;
    const directoriesChanged = imageDir !== dataset.image_dir || (!isFolder && annotationDir !== (dataset.annotation_dir || ""));
    const modified = directoriesChanged || rulesChanged;
    useUnsavedChanges(modified);
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
            const payload = isFolder
                ? (modified ? { image_dir: imageDir, folder_rules: preview?.items.map(({ path, role }) => ({ path, role })), preview_fingerprint: preview?.preview_fingerprint } : {})
                : (directoriesChanged ? { image_dir: imageDir, annotation_dir: annotationDir } : {});
            setScan(await request(`/datasets/${dataset.dataset_id}/rescan`, payload));
            onChanged();
        }
        catch (error) {
            setError(message(error));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs("section", { className: "iad-dataset-detail", "aria-label": "\u5F53\u524D\u6570\u636E\u96C6\u8BE6\u60C5", "aria-busy": busy, children: [_jsx("h2", { children: dataset.name }), _jsxs(PageTabs, { label: "\u6570\u636E\u96C6\u914D\u7F6E", items: [{ id: "directories", label: "目录与映射" }, { id: "basic", label: "基本信息" }], value: tab, onChange: datasetSettingsTab => workspace.updateView("industrial-datasets", { datasetSettingsTab }), children: [tab === "basic" ? _jsxs("div", { className: "iad-section-layout", children: [_jsx("div", { children: _jsx("h3", { children: "\u57FA\u672C\u4FE1\u606F" }) }), _jsxs("div", { children: [_jsx(DatasetName, { dataset: dataset, label: "\u65B0\u7684\u6570\u636E\u96C6\u540D\u79F0", onChanged: onChanged }), _jsxs("dl", { children: [_jsx("dt", { children: "\u683C\u5F0F" }), _jsx("dd", { children: isFolder ? "异常检测目录" : "Labelme" })] }), _jsxs("details", { children: [_jsx("summary", { children: "\u6570\u636E\u96C6\u6807\u8BC6" }), _jsx("code", { children: dataset.dataset_id })] })] })] }) : _jsxs(_Fragment, { children: [_jsxs("div", { className: "iad-section-layout", children: [_jsx("div", { children: _jsx("h3", { children: "\u670D\u52A1\u5668\u76EE\u5F55" }) }), _jsxs("div", { children: [_jsx(DirectoryPicker, { label: isFolder ? "根目录" : "图像目录", value: imageDir, onChange: p => { setImageDir(p); if (isFolder)
                                                    setFolderRules(undefined); }, disabled: busy }), !isFolder && _jsx(DirectoryPicker, { label: "\u6807\u6CE8\u76EE\u5F55", value: annotationDir, onChange: setAnnotationDir, disabled: busy }), isFolder && _jsx(FolderMapping, { preview: preview, rules: folderRules, pending: pending, disabled: busy, onChange: setFolderRules }), previewError && _jsx("p", { role: "alert", className: "iad-error", children: previewError }), _jsx("div", { className: "iad-form-actions", children: _jsx("button", { className: modified ? "iad-primary" : "", disabled: busy || (isFolder && modified && !ready) || (directoriesChanged && (!imageDir.trim() || (!isFolder && !annotationDir.trim()))), onClick: () => void rescan(), children: busy ? "正在处理…" : modified ? "保存映射并重新扫描" : "重新扫描目录" }) })] })] }), !isFolder && _jsxs("label", { className: "iad-row iad-rule", children: [_jsx("input", { type: "checkbox", checked: dataset.unannotated_is_normal, disabled: busy, onChange: e => save({ unannotated_is_normal: e.target.checked }) }), "\u65E0\u6807\u6CE8\u56FE\u4F5C\u4E3A\u521D\u59CB\u826F\u54C1\u6765\u6E90"] }), scan && _jsxs("p", { role: "status", "aria-label": "\u626B\u63CF\u7ED3\u679C", children: ["\u626B\u63CF\u5B8C\u6210 \u00B7 ", scan.image_count, " \u5F20\u56FE\u50CF \u00B7 ", scan.annotation_count, " \u4E2A\u6807\u6CE8 \u00B7 ", scan.issue_count, " \u9879\u95EE\u9898"] })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error })] })] });
}
export function DatasetManager({ datasets, selected, onChanged }) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const filtered = datasets.filter(dataset => dataset.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
    const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
    const [importing, setImporting] = useState(false);
    const [importFormat, setImportFormat] = useState("labelme");
    const [notice, setNotice] = useState("");
    const addButton = useRef(null);
    useEffect(() => { if (notice)
        addButton.current?.focus(); }, [notice]);
    // Form states
    const [name, setName] = useState("");
    const [imageDir, setImageDir] = useState("");
    const [annotationDir, setAnnotationDir] = useState("");
    const [rootDir, setRootDir] = useState("");
    const [userRules, setUserRules] = useState();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const { preview, ready, pending, error: previewError } = useFolderPreview(rootDir, userRules, importing && importFormat === "folder_classification");
    useEffect(() => { if (preview)
        setName(current => current.trim() ? current : preview.suggested_name); }, [preview?.root_dir]);
    async function importDataset(event) {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
            let dataset;
            if (importFormat === "labelme") {
                dataset = await request("/datasets/import", { format: "labelme", name, image_dir: imageDir, annotation_dir: annotationDir, unannotated_is_normal: true });
            }
            else {
                const rules = preview ? preview.items.map(({ path, role }) => ({ path, role })) : [];
                dataset = await request("/datasets/import", {
                    format: "folder_classification",
                    name,
                    root_dir: rootDir,
                    rules,
                    preview_fingerprint: preview?.preview_fingerprint,
                });
            }
            onChanged(dataset.dataset_id);
            setName("");
            setImageDir("");
            setAnnotationDir("");
            setRootDir("");
            setUserRules(undefined);
            setImporting(false);
        }
        catch (e) {
            setError(message(e));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs(_Fragment, { children: [_jsx(WorkbenchHeader, { pageId: "industrial-datasets", children: _jsx("button", { ref: addButton, className: "iad-primary", onClick: () => { setError(""); setNotice(""); setImporting(true); }, children: "\u6DFB\u52A0\u6570\u636E\u96C6" }) }), _jsxs("div", { className: "iad-settings", children: [_jsxs("section", { className: "iad-dataset-list", "aria-label": "\u6570\u636E\u96C6\u5217\u8868", children: [_jsxs("div", { className: "iad-section-header", children: [_jsxs("h2", { children: ["\u6570\u636E\u96C6 ", _jsx("span", { className: "iad-muted", children: datasets.length })] }), _jsx("input", { type: "search", "aria-label": "\u641C\u7D22\u6570\u636E\u96C6", placeholder: "\u641C\u7D22\u6570\u636E\u96C6", value: search, onChange: event => { setSearch(event.target.value); setPage(1); } })] }), _jsx("div", { className: "iad-table-scroll", children: _jsxs("table", { className: "iad-resource-table", "aria-label": "\u6570\u636E\u96C6\u5217\u8868", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u6570\u636E\u96C6\u540D\u79F0" }), _jsx("th", { children: "\u683C\u5F0F" }), _jsx("th", { className: "iad-number", children: "\u56FE\u50CF" }), _jsx("th", { className: "iad-number", children: "\u6807\u6CE8 / \u6807\u7B7E" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: filtered.slice((currentPage - 1) * 10, currentPage * 10).map(dataset => _jsxs("tr", { className: "iad-dataset-row", "data-selected": selected?.dataset_id === dataset.dataset_id, children: [_jsx("td", { children: _jsx(DatasetName, { dataset: dataset, label: "\u5217\u8868\u6570\u636E\u96C6\u540D\u79F0", onChanged: () => onChanged() }) }), _jsx("td", { children: dataset.format === "folder_classification" ? "异常检测目录" : "Labelme" }), _jsx("td", { className: "iad-number", children: dataset.total_samples }), _jsx("td", { className: "iad-number", children: dataset.format === "folder_classification" ? (dataset.labeled_sample_count ?? 0) : dataset.annotation_count }), _jsx("td", { children: _jsxs("div", { className: "iad-row", children: [_jsx("button", { type: "button", "aria-label": `选择数据集 ${dataset.name}`, "aria-pressed": selected?.dataset_id === dataset.dataset_id, onClick: () => onChanged(dataset.dataset_id), children: "\u914D\u7F6E" }), _jsx(FloatingMenu, { label: `更多操作 ${dataset.name}`, summary: "\u66F4\u591A", className: "iad-row-menu", children: _jsx(DeleteAction, { title: "\u5220\u9664\u6570\u636E\u96C6", name: dataset.name, description: "\u5220\u9664\u5176\u6837\u672C\u8BB0\u5F55\u3001\u77E5\u8BC6\u3001\u5BA1\u8BA1\u548C\u590D\u6838\u8BB0\u5F55\uFF0C\u4FDD\u7559\u670D\u52A1\u5668\u4E0A\u7684\u539F\u59CB\u56FE\u50CF\u4E0E\u6807\u6CE8\u6587\u4EF6\u3002", restoreFocus: () => addButton.current, onDelete: async () => { await request(`/datasets/${encodeURIComponent(dataset.dataset_id)}`, undefined, "DELETE"); setNotice(`已删除数据集“${dataset.name}”`); onChanged(); } }) })] }) })] }, dataset.dataset_id)) })] }) }), filtered.length > 10 && _jsx(Pagination, { total: filtered.length, page: currentPage, size: 10, unit: "\u4E2A\u6570\u636E\u96C6", onPage: setPage }), notice && _jsx("p", { role: "status", children: notice }), !filtered.length && _jsx("p", { className: "iad-muted", children: datasets.length ? "没有匹配的数据集。" : "添加服务器上的 Labelme 图像目录与标注目录，或异常检测分类目录。" })] }), selected ? _jsx(DatasetSettings, { dataset: selected, onChanged: onChanged }, selected.dataset_id) : _jsx("section", { children: _jsx("p", { children: "\u9009\u62E9\u6216\u6DFB\u52A0\u6570\u636E\u96C6\u3002" }) }), importing && _jsx(Modal, { title: "\u6DFB\u52A0\u6570\u636E\u96C6", onClose: () => { if (!busy)
                            setImporting(false); }, children: _jsxs("form", { className: "iad-dataset-import", onSubmit: importDataset, children: [_jsxs("div", { className: "iad-field", children: [_jsx("label", { children: "\u6570\u636E\u683C\u5F0F" }), _jsxs("div", { className: "iad-row", role: "radiogroup", "aria-label": "\u6570\u636E\u683C\u5F0F", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "dataset_format", value: "labelme", checked: importFormat === "labelme", onChange: () => { setImportFormat("labelme"); setError(""); } }), "Labelme"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "dataset_format", value: "folder_classification", checked: importFormat === "folder_classification", onChange: () => { setImportFormat("folder_classification"); setError(""); } }), "\u5F02\u5E38\u68C0\u6D4B\u76EE\u5F55"] })] })] }), importFormat === "labelme" ? _jsxs(_Fragment, { children: [_jsxs("div", { className: "iad-field", children: [_jsx("label", { htmlFor: "dataset-name", children: "\u6570\u636E\u96C6\u540D\u79F0" }), _jsx("input", { id: "dataset-name", value: name, onChange: e => setName(e.target.value), maxLength: 120, autoFocus: true, required: true, disabled: busy })] }), _jsx(DirectoryPicker, { label: "\u56FE\u50CF\u76EE\u5F55", value: imageDir, onChange: setImageDir, disabled: busy }), _jsx(DirectoryPicker, { label: "\u6807\u6CE8\u76EE\u5F55", value: annotationDir, onChange: setAnnotationDir, disabled: busy }), _jsx("p", { className: "iad-muted", children: "\u6309\u76F8\u5BF9\u8DEF\u5F84\u5339\u914D\u540C\u540D JSON\uFF0C\u65E0\u6807\u6CE8\u56FE\u4F5C\u4E3A\u521D\u59CB\u826F\u54C1\u5019\u9009\u3002" })] }) : _jsxs(_Fragment, { children: [_jsx(DirectoryPicker, { label: "\u7236\u76EE\u5F55", value: rootDir, onChange: path => { setRootDir(path); setUserRules(undefined); }, disabled: busy }), _jsxs("div", { className: "iad-field", children: [_jsx("label", { htmlFor: "dataset-name", children: "\u6570\u636E\u96C6\u540D\u79F0" }), _jsx("input", { id: "dataset-name", value: name, onChange: e => setName(e.target.value), maxLength: 120, required: true, disabled: busy })] }), _jsx(FolderMapping, { preview: preview, rules: userRules, pending: pending, disabled: busy, onChange: setUserRules }), previewError && _jsx("p", { role: "alert", className: "iad-error", children: previewError })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), _jsxs("div", { className: "iad-form-actions", children: [_jsx("button", { type: "button", disabled: busy, onClick: () => setImporting(false), children: "\u53D6\u6D88" }), _jsx("button", { className: "iad-primary", disabled: busy || !name.trim() || (importFormat === "labelme" ? (!imageDir || !annotationDir) : (!rootDir || !ready)), children: busy ? "正在扫描导入…" : "导入数据集" })] })] }) })] })] });
}
