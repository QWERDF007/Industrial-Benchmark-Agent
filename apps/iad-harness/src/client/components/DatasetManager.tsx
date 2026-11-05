import {Select} from './Select.js';
import {Button} from './Button.js';
import {IconButton} from "./IconButton.js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Dataset, DatasetGroup, FolderRule, ScanResult } from "../../shared/contracts.js";
import { message, request } from "../api.js";
import { useFolderPreview } from "../useFolderPreview.js";
import { WorkbenchHeader } from "./layout/WorkbenchHeader.js";
import {DirectoryPickerDialog} from "./DirectoryPickerDialog.js";
import {DatasetCreateDialog} from "./DatasetCreateDialog.js";
import {DeleteAction} from "./DeleteAction.js";

import { ClearFilterButton } from "./CommonFilterControls.js";
import { useWorkspace } from "../workspace.js";
import {buildHierarchyGroups,getDatasetGroupId} from "../dataset-hierarchy.js";

export function DatasetManager({
  datasets: propDatasets,
  groups: propGroups,
  selected,
  onChanged,
}: {
  datasets: Dataset[];
  groups: DatasetGroup[];
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

  const [localGroups, setLocalGroups] = useState<DatasetGroup[]>(propGroups);
  useEffect(() => {setLocalGroups(propGroups);}, [propGroups]);
  const groups = localGroups;
  const hierarchyGroups=useMemo(()=>buildHierarchyGroups(datasets,groups),[datasets,groups]);

  // Initial group expansion
  useEffect(() => {
    setExpandedGroups(prev => {
      const next = { ...prev };
      for (const g of hierarchyGroups) {
        if (next[g.group_id] === undefined) next[g.group_id] = true;
      }
      return next;
    });
  }, [hierarchyGroups]);

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
      announce(`扫描完成，${scan.image_count} 张图像，${scan.annotation_count} 个标注`);
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

  const [addTarget,setAddTarget]=useState<{parentId?:string}|null>(null);
  function openAddModal(parentId:string|null=null) {
    if(canLeaveDetail(null))setAddTarget({parentId:parentId??undefined});
  }

  async function deleteDataset(target:{kind:'group';group:DatasetGroup}|{kind:'child';dataset:Dataset}) {
    let removedIds:string[];
    if(target.kind==='group'){
      const result=await request<{deleted_group_id:string;deleted_dataset_ids:string[]}>(
        `/datasets/groups/${encodeURIComponent(target.group.group_id)}`,undefined,'DELETE');
      removedIds=result.deleted_dataset_ids;
      setLocalGroups(previous=>previous.filter(group=>group.group_id!==target.group.group_id));
    }else{
      await request(`/datasets/${encodeURIComponent(target.dataset.dataset_id)}`,undefined,'DELETE');
      removedIds=[target.dataset.dataset_id];
    }
    for(const id of removedIds)workspace.forgetDataset(id);
    setLocalDatasets(previous=>previous.filter(dataset=>!removedIds.includes(dataset.dataset_id)));
    if(removedIds.includes(selectedId??'')||target.kind==='group'&&selectedId===target.group.group_id){
      setSelectedId(null);setDrawerOpen(false);
    }
    announce(target.kind==='group'?'已删除数据集':'已删除子数据集');onChanged();
  }

  // Filter logic
  const q = search.trim().toLocaleLowerCase();
  const totalGroups = groups.length;
  const totalDatasets = datasets.length;

  return (
    <div className={`iad-dataset-page-wrap ${drawerOpen && (activeDataset || activeGroup) ? "has-drawer" : ""}`}>
      <WorkbenchHeader pageId="industrial-datasets">
        <Button id="addBtn" type="button" variant="primary" onClick={() => openAddModal(null)}>添加数据集</Button>
      </WorkbenchHeader>

      <section aria-label="数据集列表">
        <div className="section-bar">
          <h2>
            数据集
            <span className="count" id="summaryCount">
              {totalGroups} 个数据集，{totalDatasets} 个子数据集
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
              {hierarchyGroups.map(group => {
                const children = datasets.filter(child=>getDatasetGroupId(child)===group.group_id);
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
                      tabIndex={group.kind==='group'?0:undefined}
                      role={group.kind==='group'?'button':undefined}
                      aria-label={group.kind==='group'?`选中 ${group.name}`:undefined}
                      aria-pressed={group.kind==='group'?isGroupSelected:undefined}
                      data-id={group.group_id}
                      data-selected={isGroupSelected}
                      onClick={group.kind==='group'?() => selectRow(group.group_id):undefined}
                      onKeyDown={e => { if (group.kind==='group' && e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); selectRow(group.group_id); } }}
                    >
                      <td>
                        <div className="name-area">
                          <IconButton icon="chevron" type="button" className="expand" data-expand={group.group_id} data-expanded={isOpen} label={`${isOpen ? "收起" : "展开"} ${group.name}`} aria-expanded={isOpen} title={`${isOpen ? "收起" : "展开"}子数据集`} onClick={e => {
                              e.stopPropagation();
                              setExpandedGroups(prev => ({ ...prev, [group.group_id]: !isOpen }));
                            }} />
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
                              {group.kind==='group'&&<IconButton icon="edit" type="button" data-edit={group.group_id} label={`修改数据集名称 ${group.name}`} title="修改数据集名称" onClick={e => startEdit(group.group_id, group.name, e)} />}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="muted">—</td>
                      <td className="num">{sumImages}</td>
                      <td className="num">{sumLabels}</td>
                      <td>
                        {group.kind==='group'&&<div className="actions">
                          <IconButton icon="add" type="button" data-add-parent={group.group_id} label={`为 ${group.name} 添加子数据集`} title="添加子数据集" onClick={e => { e.stopPropagation(); openAddModal(group.group_id); }} />
                          <DeleteAction title="删除大数据集" name={group.name} description={`同时移除 ${children.length} 个子数据集，保留源文件。`}
                            restoreFocus={()=>document.getElementById('search')} onDelete={()=>deleteDataset({kind:'group',group})}/>
                        </div>}
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
                          onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); selectRow(child.dataset_id); } }}
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
                                  <IconButton icon="edit" type="button" data-edit={child.dataset_id} label={`修改数据集名称 ${child.name}`} title="修改数据集名称" onClick={e => startEdit(child.dataset_id, child.name, e)} />
                                </>
                              )}
                            </div>
                          </td>
                          <td>{child.format === "folder_classification" ? "异常检测目录" : "Labelme"}</td>
                          <td className="num">{child.total_samples}</td>
                          <td className="num">{childLabels}</td>
                          <td>
                            <div className="actions">
                              <DeleteAction title="删除数据集" name={child.name} description="保留源文件。"
                                restoreFocus={()=>document.getElementById('search')} onDelete={()=>deleteDataset({kind:'child',dataset:child})}/>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {!hierarchyGroups.length && (
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
              <IconButton icon="close" type="button" onClick={closeDrawer} label="关闭详情抽屉" title="关闭" />
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
                          <Button type="button"  onClick={() => setBrowseField("imageDir")}>浏览</Button>
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
                            <Button type="button"  onClick={() => setBrowseField("imageDir")}>浏览</Button>
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
                            <Button type="button"  onClick={() => setBrowseField("annotationDir")}>浏览</Button>
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
                                <Select
                                  aria-label={`目录 ${r.path} 角色`}
                                  value={r.role}
                                  onChange={e => {
                                    const nextRole = e.target.value as FolderRule["role"];
                                    const nextRules = (curRules.length ? curRules : preview?.items || []).map(({path,role})=>({path,role}));
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
                                </Select>
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
                      <IconButton icon="copy" type="button" label="复制数据集标识" title="复制数据集标识" onClick={() => void copyIdentifier(activeDataset.dataset_id)} />
                    </div>
                  </section>

                  {/* Drawer Footer */}
                  <div className="detail-footer">
                    <p className="help" id="dirtyHelp">{hasDirty ? "有尚未保存的变更" : ""}</p>
                    <div className="buttons">
                      {hasDirty && <Button type="button"  onClick={resetDraft}>取消更改</Button>}
                      <Button
                        type="button"
                        variant={hasDirty ? "primary" : "secondary"}
                        disabled={busy || (isFolder && hasDirty && !ready)}
                        onClick={() => void rescanDirectory()}
                      >
                        {busy ? "正在处理…" : hasDirty ? "保存映射并重新扫描" : "重新扫描目录"}
                      </Button>
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
              <IconButton icon="close" type="button" onClick={closeDrawer} label="关闭详情抽屉" title="关闭" />
            </header>
            <div className="drawer-body">
              <div className="detail-card" id="detailContent">
                <div className="single-section">
                  <div className="group-identifier">
                    <section className="identifier-section" aria-label="数据集标识">
                      <h3>数据集标识</h3>
                      <div className="identifier-value">
                        <span title={activeGroup.group_id}>{activeGroup.group_id}</span>
                        <IconButton icon="copy" type="button" label="复制数据集标识" title="复制数据集标识" onClick={() => void copyIdentifier(activeGroup.group_id)} />
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
        <DirectoryPickerDialog
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

      {addTarget&&<DatasetCreateDialog groups={groups} parentId={addTarget.parentId} onClose={()=>setAddTarget(null)}
        onCreated={value=>{
          if(value.kind==='group'){
            setLocalGroups(previous=>[...previous,value.group]);selectRow(value.group.group_id);onChanged();
          }else{
            setLocalDatasets(previous=>[...previous,value.dataset]);
            setExpandedGroups(previous=>({...previous,[value.groupId]:true}));
            selectRow(value.dataset.dataset_id);onChanged(value.dataset.dataset_id);
          }
          setAddTarget(null);announce(value.kind==='group'?'已创建数据集':'已添加子数据集');
        }}/>}

      {/* Toast Notification */}
      <div id="toast" className={`toast ${toastText ? "" : "hidden"}`} role="status">
        {toastText}
      </div>
    </div>
  );
}
