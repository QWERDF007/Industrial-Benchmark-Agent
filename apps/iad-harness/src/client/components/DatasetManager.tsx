import React, { useEffect, useId, useRef, useState } from "react";
import type { Dataset, DatasetGroup, DirectoryListing, FolderRule, ScanResult } from "../../shared/contracts.js";
import { message, request } from "../api.js";
import { useFolderPreview } from "../useFolderPreview.js";
import { WorkbenchHeader } from "./layout/WorkbenchHeader.js";
import { ChevronIcon, CloseIcon, CopyIcon, DeleteIcon, EditIcon, PlusIcon } from "../AuditIcon.js";
import { ClearFilterButton } from "./CommonFilterControls.js";
import { useWorkspace } from "../workspace.js";

function DirectoryPickerModal({ label, initialPath, onClose, onPick }: {
  label: string;
  initialPath: string;
  onClose(): void;
  onPick(path: string): void;
}) {
  const [currentPath, setCurrentPath] = useState(initialPath || "/data1");
  const [inputVal, setInputVal] = useState(initialPath || "/data1");
  const [listing, setListing] = useState<DirectoryListing | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function browse(path: string) {
    setLoading(true);
    try {
      const res = await request<DirectoryListing>(`/directories?path=${encodeURIComponent(path || "/data1")}`);
      setListing(res);
      setCurrentPath(res.path);
      setInputVal(res.path);
      setError("");
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void browse(currentPath);
  }, []);

  return (
    <div className="modal-scrim" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={`浏览服务器目录 - ${label}`}>
        <div className="modal-top">
          <h2>浏览服务器目录</h2>
          <button type="button" className="modal-x iad-icon-button" onClick={onClose} aria-label="关闭">×</button>
        </div>
        <p className="iad-muted" style={{ marginBottom: 12 }}>选择服务器上的目录</p>
        <div className="path-preview" style={{ marginBottom: 14 }}>{currentPath}</div>
        <div className="modal-field">
          <label htmlFor="browse-value">目录路径</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input id="browse-value" value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") void browse(inputVal); }} />
            <button type="button" className="secondary" onClick={() => void browse(inputVal)} disabled={loading}>跳转</button>
          </div>
        </div>
        {error && <p role="alert" className="iad-error">{error}</p>}
        {listing && (
          <div style={{ border: "1px solid var(--line)", borderRadius: 5, padding: 10, maxHeight: 220, overflowY: "auto", margin: "14px 0" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {listing.parent && <button type="button" className="secondary" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => void browse(listing.parent)}>↑ 上级目录</button>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {listing.directories.map(d => (
                <button
                  type="button"
                  key={d.path}
                  style={{ textAlign: "left", background: "none", border: "0", padding: "6px 8px", borderRadius: 4, cursor: "pointer", fontSize: 13 }}
                  className="dir-item"
                  onClick={() => void browse(d.path)}
                >
                  📁 {d.name}
                </button>
              ))}
              {!listing.directories.length && <p className="iad-muted" style={{ fontSize: 12, margin: 8 }}>无子目录</p>}
            </div>
          </div>
        )}
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>取消</button>
          <button type="button" className="primary" onClick={() => { onPick(inputVal); onClose(); }}>选择此目录</button>
        </div>
      </div>
    </div>
  );
}

export function DatasetManager({
  datasets: propDatasets,
  groups: propGroups = [],
  selected,
  onChanged,
}: {
  datasets: Dataset[];
  groups?: DatasetGroup[];
  selected?: Dataset;
  onChanged(id?: string): void;
}) {
  const { workspace } = useWorkspace();
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(() => selected?.dataset_id || null);
  const [drawerOpen, setDrawerOpen] = useState(() => Boolean(selected?.dataset_id));

  // Local datasets and groups for optimistic updates
  const [localDatasets, setLocalDatasets] = useState<Dataset[]>(propDatasets);
  useEffect(() => {
    setLocalDatasets(propDatasets);
  }, [propDatasets]);
  const datasets = localDatasets;

  // Group data resolution
  const [localGroups, setLocalGroups] = useState<DatasetGroup[]>(propGroups);
  useEffect(() => {
    if (propGroups && propGroups.length > 0) {
      setLocalGroups(propGroups);
    }
  }, [propGroups]);

  // Derived groups
  const groups: DatasetGroup[] = localGroups.length > 0
    ? localGroups
    : [
        { group_id: "group-1", name: "框胶大数据集" },
        { group_id: "group-2", name: "超节点数据集" },
      ];

  // Helper mapping: which dataset belongs to which group
  function getDatasetGroupId(d: Dataset): string {
    if (d.group_id) return d.group_id;
    if (d.name.includes("框胶") || d.image_dir?.includes("框胶")) return "group-1";
    if (d.name.includes("超节点") || d.image_dir?.includes("超节点")) return "group-2";
    return groups[0]?.group_id || "group-1";
  }

  // Children of group
  function getGroupChildren(groupId: string): Dataset[] {
    return datasets.filter(d => getDatasetGroupId(d) === groupId);
  }

  // Initial group expansion
  useEffect(() => {
    setExpandedGroups(prev => {
      const next = { ...prev };
      for (const g of groups) {
        if (next[g.group_id] === undefined) next[g.group_id] = true;
      }
      return next;
    });
  }, [groups]);

  // Toast
  const [toastText, setToastText] = useState("");
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  function announce(msg: string) {
    setToastText(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastText(""), 3000);
  }

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  function startEdit(id: string, currentName: string, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(id);
    setEditValue(currentName);
  }

  async function saveEdit(reason: "enter" | "blur") {
    if (!editingId) return;
    const trimmed = editValue.trim();
    if (!trimmed) {
      if (reason === "blur") {
        setEditingId(null);
        announce("名称不能为空，已取消修改");
      } else {
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
      } else if (currentDataset) {
        await request(`/datasets/${encodeURIComponent(currentDataset.dataset_id)}`, { name: trimmed }, "PATCH");
        setLocalDatasets(prev => prev.map(d => d.dataset_id === currentDataset.dataset_id ? { ...d, name: trimmed } : d));
        announce("名称已修改");
      }
      setEditingId(null);
      onChanged();
    } catch (err) {
      announce(message(err));
      if (reason === "blur") setEditingId(null);
    }
  }

  function cancelEdit() {
    setEditingId(null);
  }

  // Dirty state tracking in drawer for child datasets
  const [dirty, setDirty] = useState<Record<string, { imageDir?: string; annotationDir?: string; rules?: FolderRule[] }>>({});
  const activeDataset = datasets.find(d => d.dataset_id === selectedId);
  const activeGroup = groups.find(g => g.group_id === selectedId);

  const curImageDir = activeDataset ? (dirty[activeDataset.dataset_id]?.imageDir ?? activeDataset.image_dir) : "";
  const curAnnotationDir = activeDataset ? (dirty[activeDataset.dataset_id]?.annotationDir ?? (activeDataset.annotation_dir || "")) : "";
  const curRules = activeDataset ? (dirty[activeDataset.dataset_id]?.rules ?? activeDataset.folder_rules ?? []) : [];

  const isFolder = activeDataset?.format === "folder_classification";
  const { preview, ready, pending, error: previewError } = useFolderPreview(curImageDir, curRules, !!activeDataset && isFolder);

  const hasDirty = !!activeDataset && (
    (dirty[activeDataset.dataset_id]?.imageDir !== undefined && dirty[activeDataset.dataset_id]?.imageDir !== activeDataset.image_dir) ||
    (dirty[activeDataset.dataset_id]?.annotationDir !== undefined && dirty[activeDataset.dataset_id]?.annotationDir !== (activeDataset.annotation_dir || "")) ||
    (dirty[activeDataset.dataset_id]?.rules !== undefined && JSON.stringify(dirty[activeDataset.dataset_id]?.rules) !== JSON.stringify(activeDataset.folder_rules || []))
  );

  function canLeaveDetail(nextId: string | null): boolean {
    if (!activeDataset || !hasDirty || nextId === activeDataset.dataset_id) return true;
    if (!window.confirm("当前目录有未保存的修改，确定放弃吗？")) return false;
    setDirty(prev => {
      const next = { ...prev };
      delete next[activeDataset.dataset_id];
      return next;
    });
    return true;
  }

  function selectRow(id: string) {
    if (!canLeaveDetail(id)) return;
    if (editingId && editingId !== id) setEditingId(null);
    setSelectedId(id);
    setDrawerOpen(true);
    const ds = datasets.find(d => d.dataset_id === id);
    if (ds) workspace.selectDataset(ds.dataset_id, true);
  }

  function closeDrawer() {
    if (!canLeaveDetail(null)) return;
    setDrawerOpen(false);
    setSelectedId(null);
  }

  // Copy identifier
  async function copyIdentifier(val: string) {
    try {
      await navigator.clipboard.writeText(val);
      announce("已复制数据集标识");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = val;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        announce("已复制数据集标识");
      } catch {
        announce("无法复制，请手动选择标识");
      } finally {
        ta.remove();
      }
    }
  }

  // Rescan directory in drawer
  const [busy, setBusy] = useState(false);
  const [drawerNotice, setDrawerNotice] = useState("");
  async function rescanDirectory() {
    if (!activeDataset) return;
    setBusy(true);
    setDrawerNotice("");
    try {
      const draft = dirty[activeDataset.dataset_id];
      const payload = isFolder
        ? (hasDirty ? { image_dir: curImageDir, folder_rules: preview?.items.map(({ path, role }) => ({ path, role })), preview_fingerprint: preview?.preview_fingerprint } : {})
        : (hasDirty ? { image_dir: curImageDir, annotation_dir: curAnnotationDir } : {});
      const scan = await request<ScanResult>(`/datasets/${encodeURIComponent(activeDataset.dataset_id)}/rescan`, payload, "POST");
      setDirty(prev => {
        const next = { ...prev };
        delete next[activeDataset.dataset_id];
        return next;
      });
      announce(`扫描完成 · ${scan.image_count} 张图像 · ${scan.annotation_count} 个标注`);
      onChanged(activeDataset.dataset_id);
    } catch (err) {
      announce(message(err));
    } finally {
      setBusy(false);
    }
  }

  function resetDraft() {
    if (!activeDataset) return;
    setDirty(prev => {
      const next = { ...prev };
      delete next[activeDataset.dataset_id];
      return next;
    });
    announce("已取消目录修改");
  }

  // Browse modal state
  const [browseField, setBrowseField] = useState<"imageDir" | "annotationDir" | null>(null);

  // Add dataset modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [addKind, setAddKind] = useState<"group" | "child">("child");
  const [addFormat, setAddFormat] = useState<"Labelme" | "异常检测目录">("Labelme");
  const [addSelectedParent, setAddSelectedParent] = useState<string>("");
  const [addName, setAddName] = useState("");
  const [addImagePath, setAddImagePath] = useState("");
  const [addLabelPath, setAddLabelPath] = useState("");
  const [addBrowseField, setAddBrowseField] = useState<"image" | "label" | null>(null);
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState("");

  const { preview: addFolderPreview, ready: addFolderReady, error: addFolderError } = useFolderPreview(
    addImagePath,
    undefined,
    addModalOpen && addKind === "child" && addFormat === "异常检测目录"
  );

  function openAddModal(parentId: string | null = null) {
    if (!canLeaveDetail(null)) return;
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

  async function handleCreate(e: React.FormEvent) {
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
        const created = await request<DatasetGroup>("/datasets/groups", { name }, "POST");
        setLocalGroups(prev => [...prev, created]);
        setAddModalOpen(false);
        announce("已创建数据集");
        selectRow(created.group_id);
        onChanged();
      } else {
        const name = addName.trim();
        const parent = addParentId || addSelectedParent;
        if (!name || !parent || !addImagePath || (addFormat === "Labelme" && !addLabelPath)) {
          setAddError("请填写完整的数据集名称及目录路径");
          setAddBusy(false);
          return;
        }
        let created: Dataset;
        if (addFormat === "Labelme") {
          created = await request<Dataset>("/datasets/import", {
            format: "labelme",
            name,
            image_dir: addImagePath,
            annotation_dir: addLabelPath,
            group_id: parent,
            unannotated_is_normal: true,
          }, "POST");
        } else {
          const rules = addFolderPreview ? addFolderPreview.items.map(({ path, role }) => ({ path, role })) : [];
          created = await request<Dataset>("/datasets/import", {
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
    } catch (err) {
      setAddError(message(err));
    } finally {
      setAddBusy(false);
    }
  }

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "group"; group: DatasetGroup } | { kind: "child"; dataset: Dataset } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  function openDeleteModal(target: { kind: "group"; group: DatasetGroup } | { kind: "child"; dataset: Dataset }, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteTarget(target);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      if (deleteTarget.kind === "group") {
        const childDatasets = getGroupChildren(deleteTarget.group.group_id);
        const res = await request<{ deleted_group_id: string; deleted_dataset_ids?: string[] }>(
          `/datasets/groups/${encodeURIComponent(deleteTarget.group.group_id)}`,
          undefined,
          "DELETE"
        );
        const removedChildIds = res.deleted_dataset_ids || childDatasets.map(c => c.dataset_id);
        for (const cid of removedChildIds) {
          workspace.forgetDataset(cid);
        }
        setLocalGroups(prev => prev.filter(g => g.group_id !== deleteTarget.group.group_id));
        announce(`已删除大数据集「${deleteTarget.group.name}」${removedChildIds.length > 0 ? `及 ${removedChildIds.length} 个子数据集` : ""}`);
      } else {
        await request(`/datasets/${encodeURIComponent(deleteTarget.dataset.dataset_id)}`, undefined, "DELETE");
        workspace.forgetDataset(deleteTarget.dataset.dataset_id);
        announce("已删除子数据集");
      }
      setDeleteTarget(null);
      onChanged();
    } catch (err) {
      announce(message(err));
    } finally {
      setDeleteBusy(false);
    }
  }

  // Filter logic
  const q = search.trim().toLocaleLowerCase();
  const totalGroups = groups.length;
  const totalDatasets = datasets.length;

  return (
    <div className={`iad-dataset-page-wrap ${drawerOpen && (activeDataset || activeGroup) ? "has-drawer" : ""}`}>
      <WorkbenchHeader pageId="industrial-datasets">
        <button id="addBtn" type="button" className="iad-primary" onClick={() => openAddModal(null)}>添加数据集</button>
      </WorkbenchHeader>

      <section aria-label="数据集列表">
        <div className="section-bar">
          <h2>
            数据集
            <span className="count" id="summaryCount">
              {totalGroups} 个数据集 · {totalDatasets} 个子数据集
            </span>
          </h2>
          <div className="iad-manager-search-wrap" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              id="search"
              className="search"
              type="search"
              autoComplete="off"
              placeholder="搜索数据集"
              aria-label="搜索数据集"
              style={{ width: "220px", height: "38px", boxSizing: "border-box" }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <ClearFilterButton
              id="manager-clear-search"
              title="清除筛选条件"
              ariaLabel="清除筛选条件"
              disabled={!search}
              onClick={() => setSearch("")}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="dataset-table" aria-label="数据集列表">
            <colgroup>
              <col className="name-col" />
              <col className="format-col" />
              <col className="metric-col" />
              <col className="metric-col" />
              <col className="action-col" />
            </colgroup>
            <thead>
              <tr>
                <th>数据集名称</th>
                <th>格式</th>
                <th className="num">图像</th>
                <th className="num">标注 / 标签</th>
                <th style={{ textAlign: "right" }}>操作</th>
              </tr>
            </thead>
            <tbody id="tableBody">
              {groups.map(group => {
                const children = getGroupChildren(group.group_id);
                const matchGroup = group.name.toLocaleLowerCase().includes(q);
                const matchedChildren = children.filter(c => matchGroup || c.name.toLocaleLowerCase().includes(q));

                if (q && !matchGroup && !matchedChildren.length) return null;

                const isOpen = q ? true : (expandedGroups[group.group_id] ?? true);
                const sumImages = children.reduce((s, c) => s + (c.total_samples || 0), 0);
                const sumLabels = children.reduce((s, c) => s + (c.format === "folder_classification" ? (c.labeled_sample_count ?? 0) : (c.annotation_count || 0)), 0);

                const isGroupSelected = selectedId === group.group_id;
                const isGroupEditing = editingId === group.group_id;

                return (
                  <React.Fragment key={group.group_id}>
                    {/* Parent Row */}
                    <tr
                      className="data-row parent-row"
                      tabIndex={0}
                      role="button"
                      aria-label={`选中 ${group.name}`}
                      aria-pressed={isGroupSelected}
                      data-id={group.group_id}
                      data-selected={isGroupSelected}
                      onClick={() => selectRow(group.group_id)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectRow(group.group_id); } }}
                    >
                      <td>
                        <div className="name-area">
                          <button
                            type="button"
                            className="expand iad-icon-button"
                            data-expand={group.group_id}
                            data-expanded={isOpen}
                            aria-label={`${isOpen ? "收起" : "展开"} ${group.name}`}
                            aria-expanded={isOpen}
                            title={`${isOpen ? "收起" : "展开"}子数据集`}
                            onClick={e => {
                              e.stopPropagation();
                              setExpandedGroups(prev => ({ ...prev, [group.group_id]: !isOpen }));
                            }}
                          >
                            <ChevronIcon size={16} />
                          </button>
                          {isGroupEditing ? (
                            <div className="edit-wrap" onClick={e => e.stopPropagation()}>
                              <input
                                ref={editInputRef}
                                className="edit-input"
                                maxLength={120}
                                data-edit-input
                                aria-label="新的数据集名称"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === "Enter") { e.preventDefault(); void saveEdit("enter"); }
                                  if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
                                }}
                                onBlur={() => void saveEdit("blur")}
                              />
                            </div>
                          ) : (
                            <>
                              <span className="name-text" title={group.name}>{group.name}</span>
                              <button
                                type="button"
                                className="pencil iad-icon-button"
                                data-edit={group.group_id}
                                aria-label={`修改数据集名称 ${group.name}`}
                                title="修改数据集名称"
                                onClick={e => startEdit(group.group_id, group.name, e)}
                              >
                                <EditIcon />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="muted">—</td>
                      <td className="num">{sumImages}</td>
                      <td className="num">{sumLabels}</td>
                      <td>
                        <div className="actions">
                          <button
                            type="button"
                            className="icon-button plus-action iad-icon-button"
                            data-add-parent={group.group_id}
                            aria-label={`为 ${group.name} 添加子数据集`}
                            title="添加子数据集"
                            onClick={e => { e.stopPropagation(); openAddModal(group.group_id); }}
                          >
                            <PlusIcon size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-button iad-icon-button"
                            data-delete={group.group_id}
                            aria-label={`删除数据集 ${group.name}`}
                            title="删除数据集"
                            onClick={e => openDeleteModal({ kind: "group", group }, e)}
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Child Rows */}
                    {isOpen && (q ? matchedChildren : children).map(child => {
                      const isChildSelected = selectedId === child.dataset_id;
                      const isChildEditing = editingId === child.dataset_id;
                      const childLabels = child.format === "folder_classification" ? (child.labeled_sample_count ?? 0) : child.annotation_count;

                      return (
                        <tr
                          key={child.dataset_id}
                          className="data-row"
                          tabIndex={0}
                          role="button"
                          aria-label={`选中 ${child.name}`}
                          aria-pressed={isChildSelected}
                          data-id={child.dataset_id}
                          data-selected={isChildSelected}
                          onClick={() => selectRow(child.dataset_id)}
                          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectRow(child.dataset_id); } }}
                        >
                          <td>
                            <div className="name-area child">
                              {isChildEditing ? (
                                <div className="edit-wrap" onClick={e => e.stopPropagation()}>
                                  <input
                                    ref={editInputRef}
                                    className="edit-input"
                                    maxLength={120}
                                    data-edit-input
                                    aria-label="新的数据集名称"
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === "Enter") { e.preventDefault(); void saveEdit("enter"); }
                                      if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
                                    }}
                                    onBlur={() => void saveEdit("blur")}
                                  />
                                </div>
                              ) : (
                                <>
                                  <span className="name-text" title={child.name}>{child.name}</span>
                                  <button
                                    type="button"
                                    className="pencil iad-icon-button"
                                    data-edit={child.dataset_id}
                                    aria-label={`修改数据集名称 ${child.name}`}
                                    title="修改数据集名称"
                                    onClick={e => startEdit(child.dataset_id, child.name, e)}
                                  >
                                    <EditIcon />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                          <td>{child.format === "folder_classification" ? "异常检测目录" : "Labelme"}</td>
                          <td className="num">{child.total_samples}</td>
                          <td className="num">{childLabels}</td>
                          <td>
                            <div className="actions">
                              <button
                                type="button"
                                className="icon-button iad-icon-button"
                                data-delete={child.dataset_id}
                                aria-label={`删除子数据集 ${child.name}`}
                                title="删除子数据集"
                                onClick={e => openDeleteModal({ kind: "child", dataset: child }, e)}
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {!groups.length && (
                <tr>
                  <td colSpan={5}><div className="blank">没有匹配的数据集</div></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Right Drawer */}
      <div id="drawerRoot" className={`drawer-root ${drawerOpen && (activeDataset || activeGroup) ? "open" : ""}`} aria-hidden={!drawerOpen}>
        <div className="drawer-backdrop" onClick={closeDrawer} />
        {activeDataset ? (
          <aside className="dataset-drawer" id="detailSection" role="dialog" aria-modal="false" aria-label="数据集详情">
            <header className="drawer-top">
              <div className="drawer-heading">
                <h2 id="detailTitle">{activeDataset.name}</h2>
                <div className="detail-sub" id="detailSub">子数据集</div>
              </div>
              <button type="button" className="drawer-close iad-icon-button" onClick={closeDrawer} aria-label="关闭详情抽屉" title="关闭">×</button>
            </header>
            <div className="drawer-body">
              <div className="detail-card" id="detailContent">
                <div className="single-section">
                  <h3>目录与映射</h3>
                  <div className="fields">
                    {isFolder ? (
                      <div className="field">
                        <label htmlFor="image-dir">根目录</label>
                        <div className="control">
                          <input
                            id="image-dir"
                            data-field="imageDir"
                            aria-label="根目录"
                            value={curImageDir}
                            onChange={e => setDirty(prev => ({ ...prev, [activeDataset.dataset_id]: { ...prev[activeDataset.dataset_id], imageDir: e.target.value } }))}
                          />
                          <button type="button" className="secondary" onClick={() => setBrowseField("imageDir")}>浏览</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="field">
                          <label htmlFor="image-dir">图像目录</label>
                          <div className="control">
                            <input
                              id="image-dir"
                              data-field="imageDir"
                              aria-label="图像目录"
                              value={curImageDir}
                              onChange={e => setDirty(prev => ({ ...prev, [activeDataset.dataset_id]: { ...prev[activeDataset.dataset_id], imageDir: e.target.value } }))}
                            />
                            <button type="button" className="secondary" onClick={() => setBrowseField("imageDir")}>浏览</button>
                          </div>
                        </div>
                        <div className="field">
                          <label htmlFor="annotation-dir">标注目录</label>
                          <div className="control">
                            <input
                              id="annotation-dir"
                              data-field="annotationDir"
                              aria-label="标注目录"
                              value={curAnnotationDir}
                              onChange={e => setDirty(prev => ({ ...prev, [activeDataset.dataset_id]: { ...prev[activeDataset.dataset_id], annotationDir: e.target.value } }))}
                            />
                            <button type="button" className="secondary" onClick={() => setBrowseField("annotationDir")}>浏览</button>
                          </div>
                        </div>
                      </>
                    )}

                    {isFolder && (
                      <div className="mapping-area">
                        <div className="field">
                          <label>目录角色映射</label>
                          <div className="mapping-table">
                            {(preview?.items || curRules || []).map((r, i) => (
                              <div className="mapping-row" key={r.path}>
                                <span title={r.path}>{r.path}</span>
                                <select
                                  aria-label={`目录 ${r.path} 角色`}
                                  value={r.role}
                                  onChange={e => {
                                    const nextRole = e.target.value as FolderRule["role"];
                                    const nextRules = (curRules.length ? [...curRules] : (preview?.items || []).map(it => ({ path: it.path, role: it.role })));
                                    const existing = nextRules.find(item => item.path === r.path);
                                    if (existing) existing.role = nextRole;
                                    else nextRules.push({ path: r.path, role: nextRole });
                                    setDirty(prev => ({ ...prev, [activeDataset.dataset_id]: { ...prev[activeDataset.dataset_id], rules: nextRules } }));
                                  }}
                                >
                                  <option value="normal">良品</option>
                                  <option value="anomaly">异常</option>
                                  <option value="unlabeled">未标注</option>
                                  <option value="excluded">排除</option>
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dataset Identifier Section */}
                  <section className="identifier-section" aria-label="数据集标识">
                    <h3>数据集标识</h3>
                    <div className="identifier-value">
                      <span title={activeDataset.dataset_id}>{activeDataset.dataset_id}</span>
                      <button
                        className="copy-id iad-icon-button"
                        type="button"
                        aria-label="复制数据集标识"
                        title="复制数据集标识"
                        onClick={() => void copyIdentifier(activeDataset.dataset_id)}
                      >
                        <CopyIcon />
                      </button>
                    </div>
                  </section>

                  {/* Drawer Footer */}
                  <div className="detail-footer">
                    <p className="help" id="dirtyHelp">{hasDirty ? "有尚未保存的变更" : ""}</p>
                    <div className="buttons">
                      {hasDirty && <button type="button" className="secondary" onClick={resetDraft}>取消更改</button>}
                      <button
                        type="button"
                        className={hasDirty ? "primary" : "secondary"}
                        disabled={busy || (isFolder && hasDirty && !ready)}
                        onClick={() => void rescanDirectory()}
                      >
                        {busy ? "正在处理…" : hasDirty ? "保存映射并重新扫描" : "重新扫描目录"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        ) : activeGroup ? (
          <aside className="dataset-drawer" id="detailSection" role="dialog" aria-modal="false" aria-label="数据集详情">
            <header className="drawer-top">
              <div className="drawer-heading">
                <h2 id="detailTitle">{activeGroup.name}</h2>
                <div className="detail-sub" id="detailSub">数据集</div>
              </div>
              <button type="button" className="drawer-close iad-icon-button" onClick={closeDrawer} aria-label="关闭详情抽屉" title="关闭">×</button>
            </header>
            <div className="drawer-body">
              <div className="detail-card" id="detailContent">
                <div className="single-section">
                  <div className="group-identifier">
                    <section className="identifier-section" aria-label="数据集标识">
                      <h3>数据集标识</h3>
                      <div className="identifier-value">
                        <span title={activeGroup.group_id}>{activeGroup.group_id}</span>
                        <button
                          className="copy-id iad-icon-button"
                          type="button"
                          aria-label="复制数据集标识"
                          title="复制数据集标识"
                          onClick={() => void copyIdentifier(activeGroup.group_id)}
                        >
                          <CopyIcon />
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        ) : null}
      </div>

      {/* Directory Browser Modal */}
      {browseField && activeDataset && (
        <DirectoryPickerModal
          label={browseField === "imageDir" ? (isFolder ? "根目录" : "图像目录") : "标注目录"}
          initialPath={browseField === "imageDir" ? curImageDir : curAnnotationDir}
          onClose={() => setBrowseField(null)}
          onPick={picked => {
            setDirty(prev => ({
              ...prev,
              [activeDataset.dataset_id]: { ...prev[activeDataset.dataset_id], [browseField]: picked },
            }));
          }}
        />
      )}

      {/* Add Dataset Modal */}
      {addModalOpen && (
        <div className="modal-scrim" onClick={e => { if (e.target === e.currentTarget && !addBusy) setAddModalOpen(false); }}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="添加数据集">
            <div className="modal-top">
              <h2>添加数据集</h2>
              <button type="button" className="modal-x iad-icon-button" onClick={() => { if (!addBusy) setAddModalOpen(false); }} aria-label="关闭">×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-field">
                <label>添加类型</label>
                <div className="radio-row" role="radiogroup" aria-label="添加类型">
                  <label>
                    <input
                      type="radio"
                      name="new-kind"
                      value="group"
                      checked={addKind === "group"}
                      disabled={!!addParentId}
                      onChange={() => setAddKind("group")}
                    />
                    数据集
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="new-kind"
                      value="child"
                      checked={addKind === "child"}
                      onChange={() => setAddKind("child")}
                    />
                    子数据集
                  </label>
                </div>
              </div>

              {addKind === "child" && (
                <>
                  <div className="modal-field">
                    <label htmlFor="new-parent">所属数据集</label>
                    <select
                      id="new-parent"
                      disabled={!!addParentId}
                      value={addSelectedParent}
                      onChange={e => setAddSelectedParent(e.target.value)}
                    >
                      {groups.map(g => (
                        <option key={g.group_id} value={g.group_id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="modal-field">
                    <label>数据格式</label>
                    <div className="radio-row" role="radiogroup" aria-label="数据格式">
                      <label>
                        <input
                          type="radio"
                          name="new-format"
                          value="Labelme"
                          checked={addFormat === "Labelme"}
                          onChange={() => setAddFormat("Labelme")}
                        />
                        Labelme
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="new-format"
                          value="异常检测目录"
                          checked={addFormat === "异常检测目录"}
                          onChange={() => setAddFormat("异常检测目录")}
                        />
                        异常检测目录
                      </label>
                    </div>
                  </div>
                </>
              )}

              <div className="modal-field">
                <label htmlFor="new-name">{addKind === "child" ? "子数据集名称" : "数据集名称"}</label>
                <input
                  id="new-name"
                  maxLength={120}
                  placeholder="请输入数据集名称"
                  autoComplete="off"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {addKind === "child" && (
                <>
                  <div className="modal-field">
                    <label htmlFor="new-path">{addFormat === "Labelme" ? "图像目录" : "根目录"}</label>
                    <div className="dialog-path">
                      <input
                        id="new-path"
                        placeholder="服务器上的目录"
                        value={addImagePath}
                        onChange={e => setAddImagePath(e.target.value)}
                        required
                      />
                      <button type="button" className="secondary" onClick={() => setAddBrowseField("image")}>浏览</button>
                    </div>
                  </div>

                  {addFormat === "Labelme" && (
                    <div className="modal-field">
                      <label htmlFor="new-label-path">标注目录</label>
                      <div className="dialog-path">
                        <input
                          id="new-label-path"
                          placeholder="服务器上的目录"
                          value={addLabelPath}
                          onChange={e => setAddLabelPath(e.target.value)}
                          required
                        />
                        <button type="button" className="secondary" onClick={() => setAddBrowseField("label")}>浏览</button>
                      </div>
                    </div>
                  )}

                  <p className="modal-hint">
                    {addFormat === "Labelme"
                      ? "按相对路径匹配同名 JSON，无标注图作为初始良品候选。"
                      : "选择包含正常和异常图像子目录的根目录，导入时进行扫描与角色映射。"}
                  </p>
                </>
              )}

              {addError && <p role="alert" className="iad-error" style={{ marginTop: 12 }}>{addError}</p>}

              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setAddModalOpen(false)} disabled={addBusy}>取消</button>
                <button type="submit" className="primary" disabled={addBusy || (addKind === "child" && addFormat === "异常检测目录" && !addFolderReady)}>
                  {addBusy ? "正在添加…" : "添加"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Directory Browser Modal inside Add Modal */}
      {addBrowseField && (
        <DirectoryPickerModal
          label={addBrowseField === "image" ? (addFormat === "Labelme" ? "图像目录" : "根目录") : "标注目录"}
          initialPath={addBrowseField === "image" ? addImagePath : addLabelPath}
          onClose={() => setAddBrowseField(null)}
          onPick={p => {
            if (addBrowseField === "image") setAddImagePath(p);
            else setAddLabelPath(p);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-scrim" onClick={e => { if (e.target === e.currentTarget && !deleteBusy) setDeleteTarget(null); }}>
          <div className="modal" role="dialog" aria-modal="true" aria-label={deleteTarget.kind === "group" ? "删除大数据集" : "删除数据集"}>
            <div className="modal-top">
              <h2>{deleteTarget.kind === "group" ? "删除大数据集" : "删除数据集"}</h2>
              <button type="button" className="modal-x iad-icon-button" onClick={() => { if (!deleteBusy) setDeleteTarget(null); }} aria-label="关闭">×</button>
            </div>
            {deleteTarget.kind === "group" ? (
              (() => {
                const childCount = getGroupChildren(deleteTarget.group.group_id).length;
                return (
                  <>
                    <p>确认删除「{deleteTarget.group.name}」？</p>
                    <p>
                      {childCount > 0
                        ? `该大数据集包含 ${childCount} 个子数据集，确认删除将一并移除其下的所有子数据集及其关联数据（不会删除物理源文件）。此操作不可撤销。`
                        : "该大数据集没有子数据集。此操作不可撤销。"}
                    </p>
                    <div className="modal-actions">
                      <button type="button" className="secondary" onClick={() => setDeleteTarget(null)}>取消</button>
                      <button
                        type="button"
                        className="primary"
                        style={{ background: "#ba3540", borderColor: "#ba3540" }}
                        disabled={deleteBusy}
                        onClick={() => void confirmDelete()}
                      >
                        {deleteBusy ? "正在删除…" : "确认删除"}
                      </button>
                    </div>
                  </>
                );
              })()
            ) : (
              <>
                <p>确认删除「{deleteTarget.dataset.name}」？</p>
                <p>此操作会从列表中删除该数据集；不会删除真实文件。</p>
                <div className="modal-actions">
                  <button type="button" className="secondary" onClick={() => setDeleteTarget(null)}>取消</button>
                  <button
                    type="button"
                    className="primary"
                    style={{ background: "#ba3540", borderColor: "#ba3540" }}
                    disabled={deleteBusy}
                    onClick={() => void confirmDelete()}
                  >
                    {deleteBusy ? "正在删除…" : "确认删除"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div id="toast" className={`toast ${toastText ? "" : "hidden"}`} role="status">
        {toastText}
      </div>
    </div>
  );
}
