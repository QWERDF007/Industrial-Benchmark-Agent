import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Select } from './Select.js';
import { Button } from './Button.js';
import { IconButton } from "./IconButton.js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { message, request } from "../api.js";
import { useFolderPreview } from "../useFolderPreview.js";
import { WorkbenchHeader } from "./layout/WorkbenchHeader.js";
import { DirectoryPickerDialog } from "./DirectoryPickerDialog.js";
import { DatasetCreateDialog } from "./DatasetCreateDialog.js";
import { DeleteAction } from "./DeleteAction.js";
import { ClearFilterButton } from "./CommonFilterControls.js";
import { useWorkspace } from "../workspace.js";
import { buildHierarchyGroups, getDatasetGroupId } from "../dataset-hierarchy.js";
export function DatasetManager({ datasets: propDatasets, groups: propGroups, selected, onChanged, }) {
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
    const [localGroups, setLocalGroups] = useState(propGroups);
    useEffect(() => { setLocalGroups(propGroups); }, [propGroups]);
    const groups = localGroups;
    const hierarchyGroups = useMemo(() => buildHierarchyGroups(datasets, groups), [datasets, groups]);
    // Initial group expansion
    useEffect(() => {
        setExpandedGroups(prev => {
            const next = { ...prev };
            for (const g of hierarchyGroups) {
                if (next[g.group_id] === undefined)
                    next[g.group_id] = true;
            }
            return next;
        });
    }, [hierarchyGroups]);
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
    const [addTarget, setAddTarget] = useState(null);
    function openAddModal(parentId = null) {
        if (canLeaveDetail(null))
            setAddTarget({ parentId: parentId ?? undefined });
    }
    async function deleteDataset(target) {
        let removedIds;
        if (target.kind === 'group') {
            const result = await request(`/datasets/groups/${encodeURIComponent(target.group.group_id)}`, undefined, 'DELETE');
            removedIds = result.deleted_dataset_ids;
            setLocalGroups(previous => previous.filter(group => group.group_id !== target.group.group_id));
        }
        else {
            await request(`/datasets/${encodeURIComponent(target.dataset.dataset_id)}`, undefined, 'DELETE');
            removedIds = [target.dataset.dataset_id];
        }
        for (const id of removedIds)
            workspace.forgetDataset(id);
        setLocalDatasets(previous => previous.filter(dataset => !removedIds.includes(dataset.dataset_id)));
        if (removedIds.includes(selectedId ?? '') || target.kind === 'group' && selectedId === target.group.group_id) {
            setSelectedId(null);
            setDrawerOpen(false);
        }
        announce(target.kind === 'group' ? '已删除数据集' : '已删除子数据集');
        onChanged();
    }
    // Filter logic
    const q = search.trim().toLocaleLowerCase();
    return (_jsxs("div", { className: `iad-dataset-page-wrap ${drawerOpen && (activeDataset || activeGroup) ? "has-drawer" : ""}`, children: [_jsx(WorkbenchHeader, { pageId: "industrial-datasets", children: _jsx(Button, { id: "addBtn", type: "button", variant: "primary", onClick: () => openAddModal(null), children: "\u6DFB\u52A0\u6570\u636E\u96C6" }) }), _jsxs("section", { "aria-label": "\u6570\u636E\u96C6\u5217\u8868", children: [_jsxs("div", { className: "iad-manager-search-wrap", children: [_jsx("input", { id: "search", className: "search", type: "search", autoComplete: "off", placeholder: "\u641C\u7D22\u6570\u636E\u96C6", "aria-label": "\u641C\u7D22\u6570\u636E\u96C6", value: search, onChange: e => setSearch(e.target.value) }), _jsx(ClearFilterButton, { id: "manager-clear-search", title: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", ariaLabel: "\u6E05\u9664\u7B5B\u9009\u6761\u4EF6", disabled: !search, onClick: () => setSearch("") })] }), _jsx("div", { className: "table-wrap", children: _jsxs("table", { className: "dataset-table", "aria-label": "\u6570\u636E\u96C6\u5217\u8868", children: [_jsxs("colgroup", { children: [_jsx("col", { className: "name-col" }), _jsx("col", { className: "format-col" }), _jsx("col", { className: "metric-col" }), _jsx("col", { className: "metric-col" }), _jsx("col", { className: "action-col" })] }), _jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u6570\u636E\u96C6\u540D\u79F0" }), _jsx("th", { children: "\u683C\u5F0F" }), _jsx("th", { className: "num", children: "\u56FE\u50CF" }), _jsx("th", { className: "num", children: "\u6807\u6CE8 / \u6807\u7B7E" }), _jsx("th", { style: { textAlign: "right" }, children: "\u64CD\u4F5C" })] }) }), _jsxs("tbody", { id: "tableBody", children: [hierarchyGroups.map(group => {
                                            const children = datasets.filter(child => getDatasetGroupId(child) === group.group_id);
                                            const matchGroup = group.name.toLocaleLowerCase().includes(q);
                                            const matchedChildren = children.filter(c => matchGroup || c.name.toLocaleLowerCase().includes(q));
                                            if (q && !matchGroup && !matchedChildren.length)
                                                return null;
                                            const isOpen = q ? true : (expandedGroups[group.group_id] ?? true);
                                            const sumImages = children.reduce((s, c) => s + (c.total_samples || 0), 0);
                                            const sumLabels = children.reduce((s, c) => s + (c.format === "folder_classification" ? (c.labeled_sample_count ?? 0) : (c.annotation_count || 0)), 0);
                                            const isGroupSelected = selectedId === group.group_id;
                                            const isGroupEditing = editingId === group.group_id;
                                            return (_jsxs(React.Fragment, { children: [_jsxs("tr", { className: "data-row parent-row", tabIndex: group.kind === 'group' ? 0 : undefined, role: group.kind === 'group' ? 'button' : undefined, "aria-label": group.kind === 'group' ? `选中 ${group.name}` : undefined, "aria-pressed": group.kind === 'group' ? isGroupSelected : undefined, "data-id": group.group_id, "data-selected": isGroupSelected, onClick: group.kind === 'group' ? () => selectRow(group.group_id) : undefined, onKeyDown: e => { if (group.kind === 'group' && e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                                                            e.preventDefault();
                                                            selectRow(group.group_id);
                                                        } }, children: [_jsx("td", { children: _jsxs("div", { className: "name-area", children: [_jsx(IconButton, { icon: "chevron", type: "button", className: "expand", "data-expand": group.group_id, "data-expanded": isOpen, label: `${isOpen ? "收起" : "展开"} ${group.name}`, "aria-expanded": isOpen, title: `${isOpen ? "收起" : "展开"}子数据集`, onClick: e => {
                                                                                e.stopPropagation();
                                                                                setExpandedGroups(prev => ({ ...prev, [group.group_id]: !isOpen }));
                                                                            } }), isGroupEditing ? (_jsx("div", { className: "edit-wrap", onClick: e => e.stopPropagation(), children: _jsx("input", { ref: editInputRef, className: "edit-input", maxLength: 120, "data-edit-input": true, "aria-label": "\u65B0\u7684\u6570\u636E\u96C6\u540D\u79F0", value: editValue, onChange: e => setEditValue(e.target.value), onKeyDown: e => {
                                                                                    if (e.key === "Enter") {
                                                                                        e.preventDefault();
                                                                                        void saveEdit("enter");
                                                                                    }
                                                                                    if (e.key === "Escape") {
                                                                                        e.preventDefault();
                                                                                        cancelEdit();
                                                                                    }
                                                                                }, onBlur: () => void saveEdit("blur") }) })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "name-text", title: group.name, children: group.name }), group.kind === 'group' && _jsx(IconButton, { icon: "edit", type: "button", "data-edit": group.group_id, label: `修改数据集名称 ${group.name}`, title: "\u4FEE\u6539\u6570\u636E\u96C6\u540D\u79F0", onClick: e => startEdit(group.group_id, group.name, e) })] }))] }) }), _jsx("td", { className: "muted", children: "\u2014" }), _jsx("td", { className: "num", children: sumImages }), _jsx("td", { className: "num", children: sumLabels }), _jsx("td", { children: group.kind === 'group' && _jsxs("div", { className: "actions", children: [_jsx(IconButton, { icon: "add", type: "button", "data-add-parent": group.group_id, label: `为 ${group.name} 添加子数据集`, title: "\u6DFB\u52A0\u5B50\u6570\u636E\u96C6", onClick: e => { e.stopPropagation(); openAddModal(group.group_id); } }), _jsx(DeleteAction, { title: "\u5220\u9664\u5927\u6570\u636E\u96C6", name: group.name, confirmDisabled: children.length > 0, description: children.length ? `该数据集包含 ${children.length} 个子数据集，请先处理其中的子数据集，再删除父级。` : '该大数据集没有子数据集。', restoreFocus: () => document.getElementById('search'), onDelete: () => deleteDataset({ kind: 'group', group }) })] }) })] }), isOpen && (q ? matchedChildren : children).map(child => {
                                                        const isChildSelected = selectedId === child.dataset_id;
                                                        const isChildEditing = editingId === child.dataset_id;
                                                        const childLabels = child.format === "folder_classification" ? (child.labeled_sample_count ?? 0) : child.annotation_count;
                                                        return (_jsxs("tr", { className: "data-row", tabIndex: 0, role: "button", "aria-label": `选中 ${child.name}`, "aria-pressed": isChildSelected, "data-id": child.dataset_id, "data-selected": isChildSelected, onClick: () => selectRow(child.dataset_id), onKeyDown: e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
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
                                                                                }, onBlur: () => void saveEdit("blur") }) })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "name-text", title: child.name, children: child.name }), _jsx(IconButton, { icon: "edit", type: "button", "data-edit": child.dataset_id, label: `修改数据集名称 ${child.name}`, title: "\u4FEE\u6539\u6570\u636E\u96C6\u540D\u79F0", onClick: e => startEdit(child.dataset_id, child.name, e) })] })) }) }), _jsx("td", { children: child.format === "folder_classification" ? "异常检测目录" : "Labelme" }), _jsx("td", { className: "num", children: child.total_samples }), _jsx("td", { className: "num", children: childLabels }), _jsx("td", { children: _jsx("div", { className: "actions", children: _jsx(DeleteAction, { title: "\u5220\u9664\u6570\u636E\u96C6", name: child.name, description: "\u4FDD\u7559\u6E90\u6587\u4EF6\u3002", restoreFocus: () => document.getElementById('search'), onDelete: () => deleteDataset({ kind: 'child', dataset: child }) }) }) })] }, child.dataset_id));
                                                    })] }, group.group_id));
                                        }), !hierarchyGroups.length && (_jsx("tr", { children: _jsx("td", { colSpan: 5, children: _jsx("div", { className: "blank", children: "\u6CA1\u6709\u5339\u914D\u7684\u6570\u636E\u96C6" }) }) }))] })] }) })] }), _jsxs("div", { id: "drawerRoot", className: `drawer-root ${drawerOpen && (activeDataset || activeGroup) ? "open" : ""}`, "aria-hidden": !drawerOpen, children: [_jsx("div", { className: "drawer-backdrop", onClick: closeDrawer }), activeDataset ? (_jsxs("aside", { className: "dataset-drawer", id: "detailSection", role: "dialog", "aria-modal": "false", "aria-label": "\u6570\u636E\u96C6\u8BE6\u60C5", children: [_jsxs("header", { className: "drawer-top", children: [_jsxs("div", { className: "drawer-heading", children: [_jsx("h2", { id: "detailTitle", children: activeDataset.name }), _jsx("div", { className: "detail-sub", id: "detailSub", children: "\u5B50\u6570\u636E\u96C6" })] }), _jsx(IconButton, { icon: "close", type: "button", onClick: closeDrawer, label: "\u5173\u95ED\u8BE6\u60C5\u62BD\u5C49", title: "\u5173\u95ED" })] }), _jsx("div", { className: "drawer-body", children: _jsx("div", { className: "detail-card", id: "detailContent", children: _jsxs("div", { className: "single-section", children: [_jsx("h3", { children: "\u76EE\u5F55\u4E0E\u6620\u5C04" }), _jsxs("div", { className: "fields", children: [isFolder ? (_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "image-dir", children: "\u6839\u76EE\u5F55" }), _jsxs("div", { className: "control", children: [_jsx("input", { id: "image-dir", "data-field": "imageDir", "aria-label": "\u6839\u76EE\u5F55", value: curImageDir, onChange: e => setDirty(prev => ({ ...prev, [activeDataset.dataset_id]: { ...prev[activeDataset.dataset_id], imageDir: e.target.value } })) }), _jsx(Button, { type: "button", onClick: () => setBrowseField("imageDir"), children: "\u6D4F\u89C8" })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "image-dir", children: "\u56FE\u50CF\u76EE\u5F55" }), _jsxs("div", { className: "control", children: [_jsx("input", { id: "image-dir", "data-field": "imageDir", "aria-label": "\u56FE\u50CF\u76EE\u5F55", value: curImageDir, onChange: e => setDirty(prev => ({ ...prev, [activeDataset.dataset_id]: { ...prev[activeDataset.dataset_id], imageDir: e.target.value } })) }), _jsx(Button, { type: "button", onClick: () => setBrowseField("imageDir"), children: "\u6D4F\u89C8" })] })] }), _jsxs("div", { className: "field", children: [_jsx("label", { htmlFor: "annotation-dir", children: "\u6807\u6CE8\u76EE\u5F55" }), _jsxs("div", { className: "control", children: [_jsx("input", { id: "annotation-dir", "data-field": "annotationDir", "aria-label": "\u6807\u6CE8\u76EE\u5F55", value: curAnnotationDir, onChange: e => setDirty(prev => ({ ...prev, [activeDataset.dataset_id]: { ...prev[activeDataset.dataset_id], annotationDir: e.target.value } })) }), _jsx(Button, { type: "button", onClick: () => setBrowseField("annotationDir"), children: "\u6D4F\u89C8" })] })] })] })), isFolder && (_jsx("div", { className: "mapping-area", children: _jsxs("div", { className: "field", children: [_jsx("label", { children: "\u76EE\u5F55\u89D2\u8272\u6620\u5C04" }), _jsx("div", { className: "mapping-table", children: (preview?.items || curRules || []).map((r, i) => (_jsxs("div", { className: "mapping-row", children: [_jsx("span", { title: r.path, children: r.path }), _jsxs(Select, { "aria-label": `目录 ${r.path} 角色`, value: r.role, onChange: e => {
                                                                                    const nextRole = e.target.value;
                                                                                    const nextRules = (curRules.length ? curRules : preview?.items || []).map(({ path, role }) => ({ path, role }));
                                                                                    const existing = nextRules.find(item => item.path === r.path);
                                                                                    if (existing)
                                                                                        existing.role = nextRole;
                                                                                    else
                                                                                        nextRules.push({ path: r.path, role: nextRole });
                                                                                    setDirty(prev => ({ ...prev, [activeDataset.dataset_id]: { ...prev[activeDataset.dataset_id], rules: nextRules } }));
                                                                                }, children: [_jsx("option", { value: "normal", children: "\u826F\u54C1" }), _jsx("option", { value: "anomaly", children: "\u5F02\u5E38" }), _jsx("option", { value: "unlabeled", children: "\u672A\u6807\u6CE8" }), _jsx("option", { value: "excluded", children: "\u6392\u9664" })] })] }, r.path))) })] }) }))] }), _jsxs("section", { className: "identifier-section", "aria-label": "\u6570\u636E\u96C6\u6807\u8BC6", children: [_jsx("h3", { children: "\u6570\u636E\u96C6\u6807\u8BC6" }), _jsxs("div", { className: "identifier-value", children: [_jsx("span", { title: activeDataset.dataset_id, children: activeDataset.dataset_id }), _jsx(IconButton, { icon: "copy", type: "button", label: "\u590D\u5236\u6570\u636E\u96C6\u6807\u8BC6", title: "\u590D\u5236\u6570\u636E\u96C6\u6807\u8BC6", onClick: () => void copyIdentifier(activeDataset.dataset_id) })] })] }), _jsxs("div", { className: "detail-footer", children: [_jsx("p", { className: "help", id: "dirtyHelp", children: hasDirty ? "有尚未保存的变更" : "" }), _jsxs("div", { className: "buttons", children: [hasDirty && _jsx(Button, { type: "button", onClick: resetDraft, children: "\u53D6\u6D88\u66F4\u6539" }), _jsx(Button, { type: "button", variant: hasDirty ? "primary" : "secondary", disabled: busy || (isFolder && hasDirty && !ready), onClick: () => void rescanDirectory(), children: busy ? "正在处理…" : hasDirty ? "保存映射并重新扫描" : "重新扫描目录" })] })] })] }) }) })] })) : activeGroup ? (_jsxs("aside", { className: "dataset-drawer", id: "detailSection", role: "dialog", "aria-modal": "false", "aria-label": "\u6570\u636E\u96C6\u8BE6\u60C5", children: [_jsxs("header", { className: "drawer-top", children: [_jsxs("div", { className: "drawer-heading", children: [_jsx("h2", { id: "detailTitle", children: activeGroup.name }), _jsx("div", { className: "detail-sub", id: "detailSub", children: "\u6570\u636E\u96C6" })] }), _jsx(IconButton, { icon: "close", type: "button", onClick: closeDrawer, label: "\u5173\u95ED\u8BE6\u60C5\u62BD\u5C49", title: "\u5173\u95ED" })] }), _jsx("div", { className: "drawer-body", children: _jsx("div", { className: "detail-card", id: "detailContent", children: _jsx("div", { className: "single-section", children: _jsx("div", { className: "group-identifier", children: _jsxs("section", { className: "identifier-section", "aria-label": "\u6570\u636E\u96C6\u6807\u8BC6", children: [_jsx("h3", { children: "\u6570\u636E\u96C6\u6807\u8BC6" }), _jsxs("div", { className: "identifier-value", children: [_jsx("span", { title: activeGroup.group_id, children: activeGroup.group_id }), _jsx(IconButton, { icon: "copy", type: "button", label: "\u590D\u5236\u6570\u636E\u96C6\u6807\u8BC6", title: "\u590D\u5236\u6570\u636E\u96C6\u6807\u8BC6", onClick: () => void copyIdentifier(activeGroup.group_id) })] })] }) }) }) }) })] })) : null] }), browseField && activeDataset && (_jsx(DirectoryPickerDialog, { label: browseField === "imageDir" ? (isFolder ? "根目录" : "图像目录") : "标注目录", initialPath: browseField === "imageDir" ? curImageDir : curAnnotationDir, onClose: () => setBrowseField(null), onPick: picked => {
                    setDirty(prev => ({
                        ...prev,
                        [activeDataset.dataset_id]: { ...prev[activeDataset.dataset_id], [browseField]: picked },
                    }));
                } })), addTarget && _jsx(DatasetCreateDialog, { groups: groups, parentId: addTarget.parentId, onClose: () => setAddTarget(null), onCreated: value => {
                    if (value.kind === 'group') {
                        setLocalGroups(previous => [...previous, value.group]);
                        selectRow(value.group.group_id);
                        onChanged();
                    }
                    else {
                        setLocalDatasets(previous => [...previous, value.dataset]);
                        setExpandedGroups(previous => ({ ...previous, [value.groupId]: true }));
                        selectRow(value.dataset.dataset_id);
                        onChanged(value.dataset.dataset_id);
                    }
                    setAddTarget(null);
                    announce(value.kind === 'group' ? '已创建数据集' : '已添加子数据集');
                } }), _jsx("div", { id: "toast", className: `toast ${toastText ? "" : "hidden"}`, role: "status", children: toastText })] }));
}
