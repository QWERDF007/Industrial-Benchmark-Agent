import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useRef, useState } from "react";
import { message, request } from "../api.js";
import { useFolderPreview } from "../useFolderPreview.js";
import { WorkbenchHeader } from "./layout/WorkbenchHeader.js";
import { ChevronIcon, CopyIcon, DeleteIcon, EditIcon, PlusIcon } from "../AuditIcon.js";
import { ClearFilterButton } from "./CommonFilterControls.js";
import { useWorkspace } from "../workspace.js";
function DirectoryPickerModal({ label, initialPath, onClose, onPick }) {
    const [currentPath, setCurrentPath] = useState(initialPath || "/data1");
    const [inputVal, setInputVal] = useState(initialPath || "/data1");
    const [listing, setListing] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    async function browse(path) {
        setLoading(true);
        try {
            const res = await request(`/directories?path=${encodeURIComponent(path || "/data1")}`);
            setListing(res);
            setCurrentPath(res.path);
            setInputVal(res.path);
            setError("");
        }
        catch (e) {
            setError(message(e));
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        void browse(currentPath);
    }, []);
    return (_jsx("div", { className: "modal-scrim", onClick: e => { if (e.target === e.currentTarget)
            onClose(); }, children: _jsxs("div", { className: "modal", role: "dialog", "aria-modal": "true", "aria-label": `浏览服务器目录 - ${label}`, children: [_jsxs("div", { className: "modal-top", children: [_jsx("h2", { children: "\u6D4F\u89C8\u670D\u52A1\u5668\u76EE\u5F55" }), _jsx("button", { type: "button", className: "modal-x iad-icon-button", onClick: onClose, "aria-label": "\u5173\u95ED", children: "\u00D7" })] }), _jsx("p", { className: "iad-muted", style: { marginBottom: 12 }, children: "\u9009\u62E9\u670D\u52A1\u5668\u4E0A\u7684\u76EE\u5F55" }), _jsx("div", { className: "path-preview", style: { marginBottom: 14 }, children: currentPath }), _jsxs("div", { className: "modal-field", children: [_jsx("label", { htmlFor: "browse-value", children: "\u76EE\u5F55\u8DEF\u5F84" }), _jsxs("div", { style: { display: "flex", gap: 8 }, children: [_jsx("input", { id: "browse-value", value: inputVal, onChange: e => setInputVal(e.target.value), onKeyDown: e => { if (e.key === "Enter")
                                        void browse(inputVal); } }), _jsx("button", { type: "button", className: "secondary", onClick: () => void browse(inputVal), disabled: loading, children: "\u8DF3\u8F6C" })] })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), listing && (_jsxs("div", { style: { border: "1px solid var(--line)", borderRadius: 5, padding: 10, maxHeight: 220, overflowY: "auto", margin: "14px 0" }, children: [_jsx("div", { style: { display: "flex", gap: 8, marginBottom: 8 }, children: listing.parent && _jsx("button", { type: "button", className: "secondary", style: { padding: "4px 10px", fontSize: 12 }, onClick: () => void browse(listing.parent), children: "\u2191 \u4E0A\u7EA7\u76EE\u5F55" }) }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [listing.directories.map(d => (_jsxs("button", { type: "button", style: { textAlign: "left", background: "none", border: "0", padding: "6px 8px", borderRadius: 4, cursor: "pointer", fontSize: 13 }, className: "dir-item", onClick: () => void browse(d.path), children: ["\uD83D\uDCC1 ", d.name] }, d.path))), !listing.directories.length && _jsx("p", { className: "iad-muted", style: { fontSize: 12, margin: 8 }, children: "\u65E0\u5B50\u76EE\u5F55" })] })] })), _jsxs("div", { className: "modal-actions", children: [_jsx("button", { type: "button", className: "secondary", onClick: onClose, children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "primary", onClick: () => { onPick(inputVal); onClose(); }, children: "\u9009\u62E9\u6B64\u76EE\u5F55" })] })] }) }));
}
export function DatasetManager({ datasets: propDatasets, groups: propGroups = [], selected, onChanged, }) {
    const { workspace } = useWorkspace();
    const [search, setSearch] = useState("");
    const [expandedGroups, setExpandedGroups] = useState({});
    const [selectedId, setSelectedId] = useState(() => selected?.dataset_id || null);
    const [drawerOpen, setDrawerOpen] = useState(() => Boolean(selected?.dataset_id));
    // Local datasets and groups for optimistic updates
    const [localDatasets, setLocalDatasets] = useState(propDatasets);
    useEffect(() => {
        setLocalDatasets(propDatasets);
    }, [propDatasets]);
    const datasets = localDatasets;
    // Group data resolution
    const [localGroups, setLocalGroups] = useState(propGroups);
    useEffect(() => {
        if (propGroups && propGroups.length > 0) {
            setLocalGroups(propGroups);
        }
    }, [propGroups]);
    // Derived groups
    const groups = localGroups.length > 0
        ? localGroups
        : [
            { group_id: "group-1", name: "框胶大数据集" },
            { group_id: "group-2", name: "超节点数据集" },
        ];
    // Helper mapping: which dataset belongs to which group
    function getDatasetGroupId(d) {
        if (d.group_id)
            return d.group_id;
        if (d.name.includes("框胶") || d.image_dir?.includes("框胶"))
            return "group-1";
        if (d.name.includes("超节点") || d.image_dir?.includes("超节点"))
            return "group-2";
        return groups[0]?.group_id || "group-1";
    }
    // Children of group
    function getGroupChildren(groupId) {
        return datasets.filter(d => getDatasetGroupId(d) === groupId);
    }
    // Initial group expansion
    useEffect(() => {
        setExpandedGroups(prev => {
            const next = { ...prev };
            for (const g of groups) {
                if (next[g.group_id] === undefined)
                    next[g.group_id] = true;
            }
            return next;
        });
    }, [groups]);
    // Toast
    const [toastText, setToastText] = useState("");
    const toastTimerRef = useRef(null);
    function announce(msg) {
        setToastText(msg);
        if (toastTimerRef.current)
            clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToastText(""), 3000);
    }
    // Inline rename state
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState("");
    const editInputRef = useRef(null);
    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingId]);
    function startEdit(id, currentName, e) {
        e.stopPropagation();
        setEditingId(id);
        setEditValue(currentName);
    }
    async function saveEdit(reason) {
        if (!editingId)
            return;
        const trimmed = editValue.trim();
        if (!trimmed) {
            if (reason === "blur") {
                setEditingId(null);
                announce("名称不能为空，已取消修改");
            }
            else {
                announce("数据集名称不能为空");
                editInputRef.current?.focus();
            }
            return;
        }
        const currentGroup = groups.find(g => g.group_id === editingId);
        const currentDataset = datasets.find(d => d.dataset_id === editingId);
        const prevName = currentGroup?.name || currentDataset?.name || "";
        if (trimmed === prevName) {
            setEditingId(null);
            return;
        }
        try {
            if (currentGroup) {
                await request(`/datasets/groups/${encodeURIComponent(currentGroup.group_id)}`, { name: trimmed }, "PATCH");
                setLocalGroups(prev => prev.map(g => g.group_id === currentGroup.group_id ? { ...g, name: trimmed } : g));
                announce("名称已修改");
            }
            else if (currentDataset) {
                await request(`/datasets/${encodeURIComponent(currentDataset.dataset_id)}`, { name: trimmed }, "PATCH");
                setLocalDatasets(prev => prev.map(d => d.dataset_id === currentDataset.dataset_id ? { ...d, name: trimmed } : d));
                announce("名称已修改");
            }
            setEditingId(null);
            onChanged();
        }
        catch (err) {
            announce(message(err));
            if (reason === "blur")
                setEditingId(null);
        }
    }
    function cancelEdit() {
        setEditingId(null);
    }
    // Dirty state tracking in drawer for child datasets
    const [dirty, setDirty] = useState({});
    const activeDataset = datasets.find(d => d.dataset_id === selectedId);
    const activeGroup = groups.find(g => g.group_id === selectedId);
    const curImageDir = activeDataset ? (dirty[activeDataset.dataset_id]?.imageDir ?? activeDataset.image_dir) : "";
    const curAnnotationDir = activeDataset ? (dirty[activeDataset.dataset_id]?.annotationDir ?? (activeDataset.annotation_dir || "")) : "";
    const curRules = activeDataset ? (dirty[activeDataset.dataset_id]?.rules ?? activeDataset.folder_rules ?? []) : [];
    const isFolder = activeDataset?.format === "folder_classification";
    const { preview, ready, pending, error: previewError } = useFolderPreview(curImageDir, curRules, !!activeDataset && isFolder);
    const hasDirty = !!activeDataset && ((dirty[activeDataset.dataset_id]?.imageDir !== undefined && dirty[activeDataset.dataset_id]?.imageDir !== activeDataset.image_dir) ||
        (dirty[activeDataset.dataset_id]?.annotationDir !== undefined && dirty[activeDataset.dataset_id]?.annotationDir !== (activeDataset.annotation_dir || "")) ||
        (dirty[activeDataset.dataset_id]?.rules !== undefined && JSON.stringify(dirty[activeDataset.dataset_id]?.rules) !== JSON.stringify(activeDataset.folder_rules || [])));
    function canLeaveDetail(nextId) {
        if (!activeDataset || !hasDirty || nextId === activeDataset.dataset_id)
            return true;
        if (!window.confirm("当前目录有未保存的修改，确定放弃吗？"))
            return false;
        setDirty(prev => {
            const next = { ...prev };
            delete next[activeDataset.dataset_id];
            return next;
        });
        return true;
    }
    function selectRow(id) {
        if (!canLeaveDetail(id))
            return;
        if (editingId && editingId !== id)
            setEditingId(null);
        setSelectedId(id);
        setDrawerOpen(true);
        const ds = datasets.find(d => d.dataset_id === id);
        if (ds)
            workspace.selectDataset(ds.dataset_id, true);
    }
    function closeDrawer() {
        if (!canLeaveDetail(null))
            return;
        setDrawerOpen(false);
        setSelectedId(null);
    }
    // Copy identifier
    async function copyIdentifier(val) {
        try {
            await navigator.clipboard.writeText(val);
            announce("已复制数据集标识");
        }
        catch {
            const ta = document.createElement("textarea");
            ta.value = val;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand("copy");
                announce("已复制数据集标识");
            }
            catch {
                announce("无法复制，请手动选择标识");
            }
            finally {
                ta.remove();
            }
        }
    }
    // Rescan directory in drawer
    const [busy, setBusy] = useState(false);
    const [drawerNotice, setDrawerNotice] = useState("");
    async function rescanDirectory() {
        if (!activeDataset)
            return;
        setBusy(true);
        setDrawerNotice("");
        try {
            const draft = dirty[activeDataset.dataset_id];
            const payload = isFolder
                ? (hasDirty ? { image_dir: curImageDir, folder_rules: preview?.items.map(({ path, role }) => ({ path, role })), preview_fingerprint: preview?.preview_fingerprint } : {})
                : (hasDirty ? { image_dir: curImageDir, annotation_dir: curAnnotationDir } : {});
            const scan = await request(`/datasets/${encodeURIComponent(activeDataset.dataset_id)}/rescan`, payload, "POST");
            setDirty(prev => {
                const next = { ...prev };
                delete next[activeDataset.dataset_id];
                return next;
            });
            announce(`扫描完成，${scan.image_count} 张图像，${scan.annotation_count} 个标注`);
            onChanged(activeDataset.dataset_id);
        }
        catch (err) {
            announce(message(err));
        }
        finally {
            setBusy(false);
        }
    }
    function resetDraft() {
        if (!activeDataset)
            return;
        setDirty(prev => {
            const next = { ...prev };
            delete next[activeDataset.dataset_id];
            return next;
        });
        announce("已取消目录修改");
    }
    // Browse modal state
    const [browseField, setBrowseField] = useState(null);
    // Add dataset modal
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [addParentId, setAddParentId] = useState(null);
    const [addKind, setAddKind] = useState("child");
    const [addFormat, setAddFormat] = useState("Labelme");
    const [addSelectedParent, setAddSelectedParent] = useState("");
    const [addName, setAddName] = useState("");
    const [addImagePath, setAddImagePath] = useState("");
    const [addLabelPath, setAddLabelPath] = useState("");
    const [addBrowseField, setAddBrowseField] = useState(null);
    const [addBusy, setAddBusy] = useState(false);
    const [addError, setAddError] = useState("");
    const { preview: addFolderPreview, ready: addFolderReady, error: addFolderError } = useFolderPreview(addImagePath, undefined, addModalOpen && addKind === "child" && addFormat === "异常检测目录");
    function openAddModal(parentId = null) {
        if (!canLeaveDetail(null))
            return;
        setAddParentId(parentId);
        setAddKind(parentId ? "child" : "group");
        setAddFormat("Labelme");
        setAddSelectedParent(parentId || (groups[0]?.group_id || ""));
        setAddName("");
        setAddImagePath("");
        setAddLabelPath("");
        setAddError("");
        setAddBusy(false);
        setAddModalOpen(true);
    }
    async function handleCreate(e) {
        e.preventDefault();
        setAddBusy(true);
        setAddError("");
        try {
            if (addKind === "group") {
                const name = addName.trim();
                if (!name) {
                    setAddError("请输入数据集名称");
                    setAddBusy(false);
                    return;
                }
                const created = await request("/datasets/groups", { name }, "POST");
                setLocalGroups(prev => [...prev, created]);
                setAddModalOpen(false);
                announce("已创建数据集");
                selectRow(created.group_id);
                onChanged();
            }
            else {
                const name = addName.trim();
                const parent = addParentId || addSelectedParent;
                if (!name || !parent || !addImagePath || (addFormat === "Labelme" && !addLabelPath)) {
                    setAddError("请填写完整的数据集名称及目录路径");
                    setAddBusy(false);
                    return;
                }
                let created;
                if (addFormat === "Labelme") {
                    created = await request("/datasets/import", {
                        format: "labelme",
                        name,
                        image_dir: addImagePath,
                        annotation_dir: addLabelPath,
                        group_id: parent,
                        unannotated_is_normal: true,
                    }, "POST");
                }
                else {
                    const rules = addFolderPreview ? addFolderPreview.items.map(({ path, role }) => ({ path, role })) : [];
                    created = await request("/datasets/import", {
                        format: "folder_classification",
                        name,
                        root_dir: addImagePath,
                        rules,
                        group_id: parent,
                        preview_fingerprint: addFolderPreview?.preview_fingerprint,
                    }, "POST");
                }
                setAddModalOpen(false);
                announce("已添加子数据集");
                // Ensure parent is expanded
                setExpandedGroups(prev => ({ ...prev, [parent]: true }));
                selectRow(created.dataset_id);
                onChanged(created.dataset_id);
            }
        }
        catch (err) {
            setAddError(message(err));
        }
        finally {
            setAddBusy(false);
        }
    }
    // Delete modal
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    function openDeleteModal(target, e) {
        e.stopPropagation();
        setDeleteTarget(target);
    }
    async function confirmDelete() {
        if (!deleteTarget)
            return;
        setDeleteBusy(true);
        try {
            if (deleteTarget.kind === "group") {
                const childDatasets = getGroupChildren(deleteTarget.group.group_id);
                const res = await request(`/datasets/groups/${encodeURIComponent(deleteTarget.group.group_id)}`, undefined, "DELETE");
                const removedChildIds = res.deleted_dataset_ids || childDatasets.map(c => c.dataset_id);
                for (const cid of removedChildIds) {
                    workspace.forgetDataset(cid);
                }
                setLocalGroups(prev => prev.filter(g => g.group_id !== deleteTarget.group.group_id));
                announce(`已删除大数据集「${deleteTarget.group.name}」${removedChildIds.length > 0 ? `及 ${removedChildIds.length} 个子数据集` : ""}`);
            }
            else {
                await request(`/datasets/${encodeURIComponent(deleteTarget.dataset.dataset_id)}`, undefined, "DELETE");
                workspace.forgetDataset(deleteTarget.dataset.dataset_id);
                announce("已删除子数据集");
            }
            setDeleteTarget(null);
            onChanged();
        }
        catch (err) {
            announce(message(err));
        }
        finally {
            setDeleteBusy(false);
        }
    }
    // Filter logic
    const q = search.trim().toLocaleLowerCase();
    const totalGroups = groups.length;
    const totalDatasets = datasets.length;
    return (_jsxs("div", { className: `iad-dataset-page-wrap ${drawerOpen && (activeDataset || activeGroup) ? "has-drawer" : ""}`, children: [_jsx(WorkbenchHeader, { pageId: "industrial-datasets", children: _jsx("button", { id: "addBtn", type: "button", className: "iad-primary", onClick: () => openAddModal(null), children: "\u6DFB\u52A0\u6570\u636E\u96C6" }) }), _jsxs("section", { "aria-label": "\u6570\u636E\u96C6\u5217\u8868", children: [_jsxs("div", { className: "section-bar", children: [_jsxs("h2", { children: ["\u6570\u636E\u96C6", _jsxs("span", { className: "count", id: "summaryCount", children: [totalGroups, " \u4E2A\u6570\u636E\u96C6\uFF0C", totalDatasets, " \u4E2A\u5B50\u6570\u636E\u96C6"] })] }), _jsxs("div", { className: "iad-manager-search-wrap", style: { display: "flex", alignItems: "center", gap: "8px" }, children: [_jsx("input", { id: "search", className: "search", type: "search", autoComplete: "off", placeholder: "\u641C\u7D22\u6570\u636E\u96C6", "aria-label": "\u641C\u7D22\u6570\u636E\u96C6", style: { width: "220px", height: "38px", boxSizing: "border-box" }, value: search, onChange: e => setSearch(e.target.value) }), _jsx(ClearFilterButton, { id: "manager-clear-search", title: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", ariaLabel: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", disabled: !search, onClick: () => setSearch("") })] })] }), _jsx("div", { className: "table-wrap", children: _jsxs("table", { className: "dataset-table", "aria-label": "\u6570\u636E\u96C6\u5217\u8868", children: [_jsxs("colgroup", { children: [_jsx("col", { className: "name-col" }), _jsx("col", { className: "format-col" }), _jsx("col", { className: "metric-col" }), _jsx("col", { className: "metric-col" }), _jsx("col", { className: "action-col" })] }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u6570\u636E\u96C6\u540D\u79F0" }), _jsx("th", { children: "\u683C\u5F0F" }), _jsx("th", { className: "num", children: "\u56FE\u50CF" }), _jsx("th", { className: "num", children: "\u6807\u6CE8 / \u6807\u7B7E" }), _jsx("th", { style: { textAlign: "right" }, children: "\u64CD\u4F5C" })] }) }), _jsxs("tbody", { id: "tableBody", children: [groups.map(group => {
                                            const children = getGroupChildren(group.group_id);
                                            const matchGroup = group.name.toLocaleLowerCase().includes(q);
                                            const matchedChildren = children.filter(c => matchGroup || c.name.toLocaleLowerCase().includes(q));
                                            if (q && !matchGroup && !matchedChildren.length)
                                                return null;
                                            const isOpen = q ? true : (expandedGroups[group.group_id] ?? true);
                                            const sumImages = children.reduce((s, c) => s + (c.total_samples || 0), 0);
                                            const sumLabels = children.reduce((s, c) => s + (c.format === "folder_classification" ? (c.labeled_sample_count ?? 0) : (c.annotation_count || 0)), 0);
                                            const isGroupSelected = selectedId === group.group_id;
                                            const isGroupEditing = editingId === group.group_id;
                                            return (_jsxs(React.Fragment, { children: [_jsxs("tr", { className: "data-row parent-row", tabIndex: 0, role: "button", "aria-label": `选中 ${group.name}`, "aria-pressed": isGroupSelected, "data-id": group.group_id, "data-selected": isGroupSelected, onClick: () => selectRow(group.group_id), onKeyDown: e => { if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            selectRow(group.group_id);
                                                        } }, children: [_jsx("td", { children: _jsxs("div", { className: "name-area", children: [_jsx("button", { type: "button", className: "expand iad-icon-button", "data-expand": group.group_id, "data-expanded": isOpen, "aria-label": `${isOpen ? "收起" : "展开"} ${group.name}`, "aria-expanded": isOpen, title: `${isOpen ? "收起" : "展开"}子数据集`, onClick: e => {
                                                                                e.stopPropagation();
                                                                                setExpandedGroups(prev => ({ ...prev, [group.group_id]: !isOpen }));
                                                                            }, children: _jsx(ChevronIcon, { size: 16 }) }), isGroupEditing ? (_jsx("div", { className: "edit-wrap", onClick: e => e.stopPropagation(), children: _jsx("input", { ref: editInputRef, className: "edit-input", maxLength: 120, "data-edit-input": true, "aria-label": "\u65B0\u7684\u6570\u636E\u96C6\u540D\u79F0", value: editValue, onChange: e => setEditValue(e.target.value), onKeyDown: e => {
                                                                                    if (e.key === "Enter") {
                                                                                        e.preventDefault();
                                                                                        void saveEdit("enter");
                                                                                    }
                                                                                    if (e.key === "Escape") {
                                                                                        e.preventDefault();
                                                                                        cancelEdit();
                                                                                    }
                                                                                }, onBlur: () => void saveEdit("blur") }) })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "name-text", title: group.name, children: group.name }), _jsx("button", { type: "button", className: "pencil iad-icon-button", "data-edit": group.group_id, "aria-label": `修改数据集名称 ${group.name}`, title: "\u4FEE\u6539\u6570\u636E\u96C6\u540D\u79F0", onClick: e => startEdit(group.group_id, group.name, e), children: _jsx(EditIcon, {}) })] }))] }) }), _jsx("td", { className: "muted", children: "\u2014" }), _jsx("td", { className: "num", children: sumImages }), _jsx("td", { className: "num", children: sumLabels }), _jsx("td", { children: _jsxs("div", { className: "actions", children: [_jsx("button", { type: "button", className: "icon-button plus-action iad-icon-button", "data-add-parent": group.group_id, "aria-label": `为 ${group.name} 添加子数据集`, title: "\u6DFB\u52A0\u5B50\u6570\u636E\u96C6", onClick: e => { e.stopPropagation(); openAddModal(group.group_id); }, children: _jsx(PlusIcon, { size: 16 }) }), _jsx("button", { type: "button", className: "icon-button iad-icon-button", "data-delete": group.group_id, "aria-label": `删除数据集 ${group.name}`, title: "\u5220\u9664\u6570\u636E\u96C6", onClick: e => openDeleteModal({ kind: "group", group }, e), children: _jsx(DeleteIcon, {}) })] }) })] }), isOpen && (q ? matchedChildren : children).map(child => {
                                                        const isChildSelected = selectedId === child.dataset_id;
                                                        const isChildEditing = editingId === child.dataset_id;
                                                        const childLabels = child.format === "folder_classification" ? (child.labeled_sample_count ?? 0) : child.annotation_count;
                                                        return (_jsxs("tr", { className: "data-row", tabIndex: 0, role: "button", "aria-label": `选中 ${child.name}`, "aria-pressed": isChildSelected, "data-id": child.dataset_id, "data-selected": isChildSelected, onClick: () => selectRow(child.dataset_id), onKeyDown: e => { if (e.key === "Enter" || e.key === " ") {
                                                                e.preventDefault();
                                                                selectRow(child.dataset_id);
                                                            } }, children: [_jsx("td", { children: _jsx("div", { className: "name-area child", children: isChildEditing ? (_jsx("div", { className: "edit-wrap", onClick: e => e.stopPropagation(), children: _jsx("input", { ref: editInputRef, className: "edit-input", maxLength: 120, "data-edit-input": true, "aria-label": "\u65B0\u7684\u6570\u636E\u96C6\u540D\u79F0", value: editValue, onChange: e => setEditValue(e.target.value), onKeyDown: e => {
                                                                                    if (e.key === "Enter") {
                                                                                        e.preventDefault();
                                                                                        void saveEdit("enter");
                                                                                    }
                                                                                    if (e.key === "Escape") {
                                                                                        e.preventDefault();
                                                                                        cancelEdit();
                                                                                    }
                                                                                }, onBlur: () => void saveEdit("blur") }) })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "name-text", title: child.name, children: child.name }), _jsx("button", { type: "button", className: "pencil iad-icon-button", "data-edit": child.dataset_id, "aria-label": `修改数据集名称 ${child.name}`, title: "\u4FEE\u6539\u6570\u636E\u96C6\u540D\u79F0", onClick: e => startEdit(child.dataset_id, child.name, e), children: _jsx(EditIcon, {}) })] })) }) }), _jsx("td", { children: child.format === "folder_classification" ? "异常检测目录" : "Labelme" }), _jsx("td", { className: "num", children: child.total_samples }), _jsx("td", { className: "num", children: childLabels }), _jsx("td", { children: _jsx("div", { className: "actions", children: _jsx("button", { type: "button", className: "icon-button iad-icon-button", "data-delete": child.dataset_id, "aria-label": `删除子数据集 ${child.name}`, title: "\u5220\u9664\u5B50\u6570\u636E\u96C6", onClick: e => openDeleteModal({ kind: "child", dataset: child }, e), children: _jsx(DeleteIcon, {}) }) }) })] }, child.dataset_id));
                                                    })] }, group.group_id));
                                        }), !groups.length && (_jsx("tr", { children: _jsx("td", { colSpan: 5, children: _jsx("div", { className: "blank", children: "\u6CA1\u6709\u5339\u914D\u7684\u6570\u636E\u96C6" }) }) }))] })] }) })] }), _jsxs("div", { id: "drawerRoot", className: `drawer-root ${drawerOpen && (activeDataset || activeGroup) ? "open" : ""}`, "aria-hidden": !drawerOpen, children: [_jsx("div", { className: "drawer-backdrop", onClick: closeDrawer }), activeDataset ? (_jsxs("aside", { className: "dataset-drawer", id: "detailSection", role: "dialog", "aria-modal": "false", "aria-label": "\u6570\u636E\u96C6\u8BE6\u60C5", children: [_jsxs("header", { className: "drawer-top", children: [_jsxs("div", { className: "drawer-heading", children: [_jsx("h2", { id: "detailTitle", children: activeDataset.name }), _jsx("div", { className: "detail-sub", id: "detailSub", children: "\u5B50\u6570\u636E\u96C6" })] }), _jsx("button", { type: "button", className: "drawer-close iad-icon-button", onClick: closeDrawer, "aria-label": "\u5173\u95ED\u8BE6\u60C5\u62BD\u5C49", title: "\u5173\u95ED", children: "\u00D7" })] }), _jsx("div", { className: "drawer-body", children: _jsx("div", { className: "detail-card", id: "detailContent", children: _jsxs("div", { className: "single-section", children: [_jsx("h3", { children: "\u76EE\u5F55\u4E0E\u6620\u5C04" }), _jsxs("div", { className: "fields", children: [isFolder ? (_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "image-dir", children: "\u6839\u76EE\u5F55" }), _jsxs("div", { className: "control", children: [_jsx("input", { id: "image-dir", "data-field": "imageDir", "aria-label": "\u6839\u76EE\u5F55", value: curImageDir, onChange: e => setDirty(prev => ({ ...prev, [activeDataset.dataset_id]: { ...prev[activeDataset.dataset_id], imageDir: e.target.value } })) }), _jsx("button", { type: "button", className: "secondary", onClick: () => setBrowseField("imageDir"), children: "\u6D4F\u89C8" })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "image-dir", children: "\u56FE\u50CF\u76EE\u5F55" }), _jsxs("div", { className: "control", children: [_jsx("input", { id: "image-dir", "data-field": "imageDir", "aria-label": "\u56FE\u50CF\u76EE\u5F55", value: curImageDir, onChange: e => setDirty(prev => ({ ...prev, [activeDataset.dataset_id]: { ...prev[activeDataset.dataset_id], imageDir: e.target.value } })) }), _jsx("button", { type: "button", className: "secondary", onClick: () => setBrowseField("imageDir"), children: "\u6D4F\u89C8" })] })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "annotation-dir", children: "\u6807\u6CE8\u76EE\u5F55" }), _jsxs("div", { className: "control", children: [_jsx("input", { id: "annotation-dir", "data-field": "annotationDir", "aria-label": "\u6807\u6CE8\u76EE\u5F55", value: curAnnotationDir, onChange: e => setDirty(prev => ({ ...prev, [activeDataset.dataset_id]: { ...prev[activeDataset.dataset_id], annotationDir: e.target.value } })) }), _jsx("button", { type: "button", className: "secondary", onClick: () => setBrowseField("annotationDir"), children: "\u6D4F\u89C8" })] })] })] })), isFolder && (_jsx("div", { className: "mapping-area", children: _jsxs("div", { className: "field", children: [_jsx("label", { children: "\u76EE\u5F55\u89D2\u8272\u6620\u5C04" }), _jsx("div", { className: "mapping-table", children: (preview?.items || curRules || []).map((r, i) => (_jsxs("div", { className: "mapping-row", children: [_jsx("span", { title: r.path, children: r.path }), _jsxs("select", { "aria-label": `目录 ${r.path} 角色`, value: r.role, onChange: e => {
                                                                                    const nextRole = e.target.value;
                                                                                    const nextRules = (curRules.length ? [...curRules] : (preview?.items || []).map(it => ({ path: it.path, role: it.role })));
                                                                                    const existing = nextRules.find(item => item.path === r.path);
                                                                                    if (existing)
                                                                                        existing.role = nextRole;
                                                                                    else
                                                                                        nextRules.push({ path: r.path, role: nextRole });
                                                                                    setDirty(prev => ({ ...prev, [activeDataset.dataset_id]: { ...prev[activeDataset.dataset_id], rules: nextRules } }));
                                                                                }, children: [_jsx("option", { value: "normal", children: "\u826F\u54C1" }), _jsx("option", { value: "anomaly", children: "\u5F02\u5E38" }), _jsx("option", { value: "unlabeled", children: "\u672A\u6807\u6CE8" }), _jsx("option", { value: "excluded", children: "\u6392\u9664" })] })] }, r.path))) })] }) }))] }), _jsxs("section", { className: "identifier-section", "aria-label": "\u6570\u636E\u96C6\u6807\u8BC6", children: [_jsx("h3", { children: "\u6570\u636E\u96C6\u6807\u8BC6" }), _jsxs("div", { className: "identifier-value", children: [_jsx("span", { title: activeDataset.dataset_id, children: activeDataset.dataset_id }), _jsx("button", { className: "copy-id iad-icon-button", type: "button", "aria-label": "\u590D\u5236\u6570\u636E\u96C6\u6807\u8BC6", title: "\u590D\u5236\u6570\u636E\u96C6\u6807\u8BC6", onClick: () => void copyIdentifier(activeDataset.dataset_id), children: _jsx(CopyIcon, {}) })] })] }), _jsxs("div", { className: "detail-footer", children: [_jsx("p", { className: "help", id: "dirtyHelp", children: hasDirty ? "有尚未保存的变更" : "" }), _jsxs("div", { className: "buttons", children: [hasDirty && _jsx("button", { type: "button", className: "secondary", onClick: resetDraft, children: "\u53D6\u6D88\u66F4\u6539" }), _jsx("button", { type: "button", className: hasDirty ? "primary" : "secondary", disabled: busy || (isFolder && hasDirty && !ready), onClick: () => void rescanDirectory(), children: busy ? "正在处理…" : hasDirty ? "保存映射并重新扫描" : "重新扫描目录" })] })] })] }) }) })] })) : activeGroup ? (_jsxs("aside", { className: "dataset-drawer", id: "detailSection", role: "dialog", "aria-modal": "false", "aria-label": "\u6570\u636E\u96C6\u8BE6\u60C5", children: [_jsxs("header", { className: "drawer-top", children: [_jsxs("div", { className: "drawer-heading", children: [_jsx("h2", { id: "detailTitle", children: activeGroup.name }), _jsx("div", { className: "detail-sub", id: "detailSub", children: "\u6570\u636E\u96C6" })] }), _jsx("button", { type: "button", className: "drawer-close iad-icon-button", onClick: closeDrawer, "aria-label": "\u5173\u95ED\u8BE6\u60C5\u62BD\u5C49", title: "\u5173\u95ED", children: "\u00D7" })] }), _jsx("div", { className: "drawer-body", children: _jsx("div", { className: "detail-card", id: "detailContent", children: _jsx("div", { className: "single-section", children: _jsx("div", { className: "group-identifier", children: _jsxs("section", { className: "identifier-section", "aria-label": "\u6570\u636E\u96C6\u6807\u8BC6", children: [_jsx("h3", { children: "\u6570\u636E\u96C6\u6807\u8BC6" }), _jsxs("div", { className: "identifier-value", children: [_jsx("span", { title: activeGroup.group_id, children: activeGroup.group_id }), _jsx("button", { className: "copy-id iad-icon-button", type: "button", "aria-label": "\u590D\u5236\u6570\u636E\u96C6\u6807\u8BC6", title: "\u590D\u5236\u6570\u636E\u96C6\u6807\u8BC6", onClick: () => void copyIdentifier(activeGroup.group_id), children: _jsx(CopyIcon, {}) })] })] }) }) }) }) })] })) : null] }), browseField && activeDataset && (_jsx(DirectoryPickerModal, { label: browseField === "imageDir" ? (isFolder ? "根目录" : "图像目录") : "标注目录", initialPath: browseField === "imageDir" ? curImageDir : curAnnotationDir, onClose: () => setBrowseField(null), onPick: picked => {
                    setDirty(prev => ({
                        ...prev,
                        [activeDataset.dataset_id]: { ...prev[activeDataset.dataset_id], [browseField]: picked },
                    }));
                } })), addModalOpen && (_jsx("div", { className: "modal-scrim", onClick: e => { if (e.target === e.currentTarget && !addBusy)
                    setAddModalOpen(false); }, children: _jsxs("div", { className: "modal", role: "dialog", "aria-modal": "true", "aria-label": "\u6DFB\u52A0\u6570\u636E\u96C6", children: [_jsxs("div", { className: "modal-top", children: [_jsx("h2", { children: "\u6DFB\u52A0\u6570\u636E\u96C6" }), _jsx("button", { type: "button", className: "modal-x iad-icon-button", onClick: () => { if (!addBusy)
                                        setAddModalOpen(false); }, "aria-label": "\u5173\u95ED", children: "\u00D7" })] }), _jsxs("form", { onSubmit: handleCreate, children: [_jsxs("div", { className: "modal-field", children: [_jsx("label", { children: "\u6DFB\u52A0\u7C7B\u578B" }), _jsxs("div", { className: "radio-row", role: "radiogroup", "aria-label": "\u6DFB\u52A0\u7C7B\u578B", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "new-kind", value: "group", checked: addKind === "group", disabled: !!addParentId, onChange: () => setAddKind("group") }), "\u6570\u636E\u96C6"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "new-kind", value: "child", checked: addKind === "child", onChange: () => setAddKind("child") }), "\u5B50\u6570\u636E\u96C6"] })] })] }), addKind === "child" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "modal-field", children: [_jsx("label", { htmlFor: "new-parent", children: "\u6240\u5C5E\u6570\u636E\u96C6" }), _jsx("select", { id: "new-parent", disabled: !!addParentId, value: addSelectedParent, onChange: e => setAddSelectedParent(e.target.value), children: groups.map(g => (_jsx("option", { value: g.group_id, children: g.name }, g.group_id))) })] }), _jsxs("div", { className: "modal-field", children: [_jsx("label", { children: "\u6570\u636E\u683C\u5F0F" }), _jsxs("div", { className: "radio-row", role: "radiogroup", "aria-label": "\u6570\u636E\u683C\u5F0F", children: [_jsxs("label", { children: [_jsx("input", { type: "radio", name: "new-format", value: "Labelme", checked: addFormat === "Labelme", onChange: () => setAddFormat("Labelme") }), "Labelme"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "new-format", value: "\u5F02\u5E38\u68C0\u6D4B\u76EE\u5F55", checked: addFormat === "异常检测目录", onChange: () => setAddFormat("异常检测目录") }), "\u5F02\u5E38\u68C0\u6D4B\u76EE\u5F55"] })] })] })] })), _jsxs("div", { className: "modal-field", children: [_jsx("label", { htmlFor: "new-name", children: addKind === "child" ? "子数据集名称" : "数据集名称" }), _jsx("input", { id: "new-name", maxLength: 120, placeholder: "\u8BF7\u8F93\u5165\u6570\u636E\u96C6\u540D\u79F0", autoComplete: "off", value: addName, onChange: e => setAddName(e.target.value), autoFocus: true, required: true })] }), addKind === "child" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "modal-field", children: [_jsx("label", { htmlFor: "new-path", children: addFormat === "Labelme" ? "图像目录" : "根目录" }), _jsxs("div", { className: "dialog-path", children: [_jsx("input", { id: "new-path", placeholder: "\u670D\u52A1\u5668\u4E0A\u7684\u76EE\u5F55", value: addImagePath, onChange: e => setAddImagePath(e.target.value), required: true }), _jsx("button", { type: "button", className: "secondary", onClick: () => setAddBrowseField("image"), children: "\u6D4F\u89C8" })] })] }), addFormat === "Labelme" && (_jsxs("div", { className: "modal-field", children: [_jsx("label", { htmlFor: "new-label-path", children: "\u6807\u6CE8\u76EE\u5F55" }), _jsxs("div", { className: "dialog-path", children: [_jsx("input", { id: "new-label-path", placeholder: "\u670D\u52A1\u5668\u4E0A\u7684\u76EE\u5F55", value: addLabelPath, onChange: e => setAddLabelPath(e.target.value), required: true }), _jsx("button", { type: "button", className: "secondary", onClick: () => setAddBrowseField("label"), children: "\u6D4F\u89C8" })] })] })), _jsx("p", { className: "modal-hint", children: addFormat === "Labelme"
                                                ? "按相对路径匹配同名 JSON，无标注图作为初始良品候选。"
                                                : "选择包含正常和异常图像子目录的根目录，导入时进行扫描与角色映射。" })] })), addError && _jsx("p", { role: "alert", className: "iad-error", style: { marginTop: 12 }, children: addError }), _jsxs("div", { className: "modal-actions", children: [_jsx("button", { type: "button", className: "secondary", onClick: () => setAddModalOpen(false), disabled: addBusy, children: "\u53D6\u6D88" }), _jsx("button", { type: "submit", className: "primary", disabled: addBusy || (addKind === "child" && addFormat === "异常检测目录" && !addFolderReady), children: addBusy ? "正在添加…" : "添加" })] })] })] }) })), addBrowseField && (_jsx(DirectoryPickerModal, { label: addBrowseField === "image" ? (addFormat === "Labelme" ? "图像目录" : "根目录") : "标注目录", initialPath: addBrowseField === "image" ? addImagePath : addLabelPath, onClose: () => setAddBrowseField(null), onPick: p => {
                    if (addBrowseField === "image")
                        setAddImagePath(p);
                    else
                        setAddLabelPath(p);
                } })), deleteTarget && (_jsx("div", { className: "modal-scrim", onClick: e => { if (e.target === e.currentTarget && !deleteBusy)
                    setDeleteTarget(null); }, children: _jsxs("div", { className: "modal", role: "dialog", "aria-modal": "true", "aria-label": deleteTarget.kind === "group" ? "删除大数据集" : "删除数据集", children: [_jsxs("div", { className: "modal-top", children: [_jsx("h2", { children: deleteTarget.kind === "group" ? "删除大数据集" : "删除数据集" }), _jsx("button", { type: "button", className: "modal-x iad-icon-button", onClick: () => { if (!deleteBusy)
                                        setDeleteTarget(null); }, "aria-label": "\u5173\u95ED", children: "\u00D7" })] }), deleteTarget.kind === "group" ? ((() => {
                            const childCount = getGroupChildren(deleteTarget.group.group_id).length;
                            return (_jsxs(_Fragment, { children: [_jsxs("p", { children: ["\u786E\u8BA4\u5220\u9664\u300C", deleteTarget.group.name, "\u300D\uFF1F"] }), _jsx("p", { children: childCount > 0
                                            ? `该大数据集包含 ${childCount} 个子数据集，确认删除将一并移除其下的所有子数据集及其关联数据（不会删除物理源文件）。此操作不可撤销。`
                                            : "该大数据集没有子数据集。此操作不可撤销。" }), _jsxs("div", { className: "modal-actions", children: [_jsx("button", { type: "button", className: "secondary", onClick: () => setDeleteTarget(null), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "primary", style: { background: "#ba3540", borderColor: "#ba3540" }, disabled: deleteBusy, onClick: () => void confirmDelete(), children: deleteBusy ? "正在删除…" : "确认删除" })] })] }));
                        })()) : (_jsxs(_Fragment, { children: [_jsxs("p", { children: ["\u786E\u8BA4\u5220\u9664\u300C", deleteTarget.dataset.name, "\u300D\uFF1F"] }), _jsx("p", { children: "\u6B64\u64CD\u4F5C\u4F1A\u4ECE\u5217\u8868\u4E2D\u5220\u9664\u8BE5\u6570\u636E\u96C6\uFF1B\u4E0D\u4F1A\u5220\u9664\u771F\u5B9E\u6587\u4EF6\u3002" }), _jsxs("div", { className: "modal-actions", children: [_jsx("button", { type: "button", className: "secondary", onClick: () => setDeleteTarget(null), children: "\u53D6\u6D88" }), _jsx("button", { type: "button", className: "primary", style: { background: "#ba3540", borderColor: "#ba3540" }, disabled: deleteBusy, onClick: () => void confirmDelete(), children: deleteBusy ? "正在删除…" : "确认删除" })] })] }))] }) })), _jsx("div", { id: "toast", className: `toast ${toastText ? "" : "hidden"}`, role: "status", children: toastText })] }));
}
