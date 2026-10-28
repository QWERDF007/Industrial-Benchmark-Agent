import React, { useEffect, useRef, useState } from "react";
import type { Dataset, DirectoryListing, FolderRule, ScanResult } from "../../shared/contracts.js";
import { message, request } from "../api.js";
import { Modal } from "./Modal.js";
import { DeleteAction } from "./DeleteAction.js";
import { DatasetName } from "./DatasetName.js";
import { FolderMapping } from "./FolderMapping.js";
import { useFolderPreview } from "../useFolderPreview.js";
import { WorkbenchHeader } from "./layout/WorkbenchHeader.js";
import { IconButton } from "./IconButton.js";
import { CopyIcon, ModelSettingsIcon } from "../AuditIcon.js";
import { Pagination } from "./Pagination.js";
import { useUnsavedChanges } from "../useUnsavedChanges.js";
import { useWorkspace } from "../workspace.js";
import { PageTabs } from "./layout/PageTabs.js";

function DirectoryPicker({ label, value, onChange, disabled = false }: { label: string; value: string; onChange(value: string): void; disabled?: boolean }) {
  const [listing, setListing] = useState<DirectoryListing | null>(null);
  const [error, setError] = useState("");
  async function browse(path: string) {
    try { setListing(await request<DirectoryListing>(`/directories?path=${encodeURIComponent(path || "/data1")}`)); setError(""); }
    catch (e) { setError(message(e)); }
  }
  return <div className="iad-field"><label>{label}</label><div className="iad-row">
    <input aria-label={label} disabled={disabled} value={value} onChange={e => onChange(e.target.value)} placeholder="服务器上的目录" />
    <button type="button" disabled={disabled} onClick={() => browse(value)}>浏览</button>
  </div>{error && <p role="alert" className="iad-error">{error}</p>}{listing && <fieldset className="iad-directory" aria-label={`${label}浏览`} disabled={disabled}>
    <div className="iad-row"><code>{listing.path}</code><button type="button" onClick={() => browse(listing.parent)}>上级</button>
      <button type="button" onClick={() => { onChange(listing.path); setListing(null); }}>选择此目录</button><button type="button" onClick={() => setListing(null)}>关闭</button></div>
    <div className="iad-directory-list">{listing.directories.map(dir => <button type="button" key={dir.path} onClick={() => browse(dir.path)}>{dir.name}</button>)}</div>
  </fieldset>}</div>;
}

function DatasetSettings({ dataset, onChanged, sectionRef }: { dataset: Dataset; onChanged(): void; sectionRef: React.Ref<HTMLElement> }) {
  const { workspace } = useWorkspace();
  const tab = workspace.view("industrial-datasets").datasetSettingsTab;
  const isFolder = dataset.format === "folder_classification";
  const [imageDir, setImageDir] = useState(dataset.image_dir);
  const [annotationDir, setAnnotationDir] = useState(dataset.annotation_dir || "");
  const savedRules = JSON.stringify(dataset.folder_rules || []);
  const [folderRules, setFolderRules] = useState<FolderRule[] | undefined>(dataset.folder_rules);
  const { preview, ready, pending, error: previewError } = useFolderPreview(imageDir, folderRules, isFolder);
  useEffect(() => {
    setImageDir(dataset.image_dir); setAnnotationDir(dataset.annotation_dir || "");
    setFolderRules(JSON.parse(savedRules));
  }, [dataset.image_dir, dataset.annotation_dir, savedRules]);
  const rulesChanged = isFolder && JSON.stringify(folderRules) !== savedRules;
  const directoriesChanged = imageDir !== dataset.image_dir || (!isFolder && annotationDir !== (dataset.annotation_dir || ""));
  const modified = directoriesChanged || rulesChanged;
  useUnsavedChanges(modified);

  const [scan, setScan] = useState<ScanResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function save(patch: { unannotated_is_normal: boolean }) {
    setBusy(true); setError("");
    try { await request(`/datasets/${dataset.dataset_id}`, patch, "PATCH"); onChanged(); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }

  async function rescan() {
    setBusy(true); setError(""); setScan(null);
    try {
      const payload = isFolder
        ? (modified ? { image_dir: imageDir, folder_rules: preview?.items.map(({ path, role }) => ({ path, role })), preview_fingerprint: preview?.preview_fingerprint } : {})
        : (directoriesChanged ? { image_dir: imageDir, annotation_dir: annotationDir } : {});
      setScan(await request<ScanResult>(`/datasets/${dataset.dataset_id}/rescan`, payload));
      onChanged();
    } catch (error) { setError(message(error)); } finally { setBusy(false); }
  }


  return <section ref={sectionRef} tabIndex={-1} className="iad-dataset-detail" aria-label="当前数据集详情" aria-busy={busy}><div className="iad-section-header"><h2>{dataset.name}</h2><span className="iad-muted">{dataset.total_samples} 张图像</span></div>
    <PageTabs<typeof tab> label="数据集配置" items={[{id:"directories",label:"目录与映射"},{id:"basic",label:"基本信息"}]} value={tab} onChange={datasetSettingsTab => workspace.updateView("industrial-datasets", {datasetSettingsTab})}>
    {tab === "basic" ? <div className="iad-dataset-basic"><h3>基本信息</h3>
      <dl><dt>数据集名称</dt><dd><DatasetName dataset={dataset} label="新的数据集名称" onChanged={onChanged} /></dd>
        <dt>数据格式</dt><dd>{isFolder ? "异常检测目录" : "Labelme"}</dd>
        <dt>图像总数</dt><dd>{dataset.total_samples} 张</dd>
        <dt>标注 / 标签</dt><dd>{isFolder ? (dataset.labeled_sample_count ?? 0) : dataset.annotation_count}</dd>
        <dt>数据集标识</dt><dd><code>{dataset.dataset_id}</code><IconButton label="复制数据集标识" onClick={async () => { try { await navigator.clipboard.writeText(dataset.dataset_id); setCopied(true); } catch (error) { setError(message(error)); } }}><CopyIcon /></IconButton>{copied && <span className="iad-muted" role="status">已复制</span>}</dd></dl>
    </div> : <>
    <div className="iad-section-layout"><div><h3>服务器目录</h3><p className="iad-muted">图像根目录与标签映射</p></div><div>
      <DirectoryPicker label={isFolder ? "根目录" : "图像目录"} value={imageDir} onChange={p => { setImageDir(p); if (isFolder) setFolderRules(undefined); }} disabled={busy} />
      {!isFolder && <DirectoryPicker label="标注目录" value={annotationDir} onChange={setAnnotationDir} disabled={busy} />}
      {isFolder && <FolderMapping preview={preview} rules={folderRules} pending={pending} disabled={busy} onChange={setFolderRules} />}
      {previewError && <p role="alert" className="iad-error">{previewError}</p>}
      <div className="iad-dataset-footer"><p className="iad-muted" role="status" data-dirty={modified}>{modified ? "有尚未保存的变更" : "可修改路径和角色映射后重新扫描"}</p><div className="iad-form-actions">
        {modified && <button type="button" disabled={busy} onClick={() => { setImageDir(dataset.image_dir); setAnnotationDir(dataset.annotation_dir || ""); setFolderRules(dataset.folder_rules); setError(""); }}>取消更改</button>}
        <button className={modified ? "iad-primary" : ""} disabled={busy || (isFolder && modified && !ready) || (directoriesChanged && (!imageDir.trim() || (!isFolder && !annotationDir.trim())))} onClick={() => void rescan()}>
          {busy ? "正在处理…" : modified ? "保存映射并重新扫描" : "重新扫描目录"}
        </button>
      </div></div>
    </div></div>
    {!isFolder && <label className="iad-row iad-rule"><input type="checkbox" checked={dataset.unannotated_is_normal} disabled={busy} onChange={e => save({ unannotated_is_normal: e.target.checked })} />无标注图作为初始良品来源</label>}
    {scan && <p role="status" aria-label="扫描结果">扫描完成 · {scan.image_count} 张图像 · {scan.annotation_count} 个标注 · {scan.issue_count} 项问题</p>}
    </>}
    {error && <p role="alert" className="iad-error">{error}</p>}
    </PageTabs>
  </section>;
}

export function DatasetManager({ datasets, selected, onChanged }: { datasets: Dataset[]; selected?: Dataset; onChanged(id?: string): void }) {
  const settingsRef = useRef<HTMLElement>(null);
  const [requested, setRequested] = useState<string | null>(null);
  useEffect(() => {
    if (requested && selected?.dataset_id === requested && settingsRef.current) {
      settingsRef.current.scrollIntoView({block: 'start'});
      settingsRef.current.focus({preventScroll: true});
      setRequested(null);
    }
  }, [requested, selected?.dataset_id]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const filtered = datasets.filter(dataset => dataset.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / 10)));
  const [importing, setImporting] = useState(false);
  const [importFormat, setImportFormat] = useState<"labelme" | "folder_classification">("labelme");
  const [notice, setNotice] = useState("");
  const addButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (notice) addButton.current?.focus(); }, [notice]);

  // Form states
  const [name, setName] = useState("");
  const [imageDir, setImageDir] = useState("");
  const [annotationDir, setAnnotationDir] = useState("");
  const [rootDir, setRootDir] = useState("");
  const [userRules, setUserRules] = useState<FolderRule[] | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { preview, ready, pending, error: previewError } = useFolderPreview(rootDir, userRules, importing && importFormat === "folder_classification");
  useEffect(() => { if (preview) setName(current => current.trim() ? current : preview.suggested_name); }, [preview?.root_dir]);

  async function importDataset(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      let dataset: Dataset;
      if (importFormat === "labelme") {
        dataset = await request<Dataset>("/datasets/import", { format: "labelme", name, image_dir: imageDir, annotation_dir: annotationDir, unannotated_is_normal: true });
      } else {
        const rules: FolderRule[] = preview ? preview.items.map(({ path, role }) => ({ path, role })) : [];
        dataset = await request<Dataset>("/datasets/import", {
          format: "folder_classification",
          name,
          root_dir: rootDir,
          rules,
          preview_fingerprint: preview?.preview_fingerprint,
        });
      }
      onChanged(dataset.dataset_id);
      setName(""); setImageDir(""); setAnnotationDir(""); setRootDir(""); setUserRules(undefined); setImporting(false);
    } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }

  return <><WorkbenchHeader pageId="industrial-datasets"><button ref={addButton} className="iad-primary" onClick={() => { setError(""); setNotice(""); setImporting(true); }}>添加数据集</button></WorkbenchHeader><div className="iad-settings">
    <section className="iad-dataset-list" aria-label="数据集列表"><div className="iad-section-header"><h2>数据集 <span className="iad-muted">{datasets.length}</span></h2><input type="search" aria-label="搜索数据集" placeholder="搜索数据集" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></div>
      <div className="iad-table-scroll"><table className="iad-resource-table" aria-label="数据集列表"><colgroup><col style={{width:"33%"}} /><col /><col style={{width:"12%"}} /><col style={{width:"15%"}} /><col style={{width:112}} /></colgroup><thead><tr><th>数据集名称</th><th>格式</th><th className="iad-number">图像</th><th className="iad-number">标注 / 标签</th><th>操作</th></tr></thead><tbody>{filtered.slice((currentPage - 1) * 10, currentPage * 10).map(dataset => <tr className="iad-dataset-row" key={dataset.dataset_id} data-selected={selected?.dataset_id === dataset.dataset_id}>
        <td><DatasetName dataset={dataset} label="列表数据集名称" onChanged={() => onChanged()} /></td>
        <td>{dataset.format === "folder_classification" ? "异常检测目录" : "Labelme"}</td><td className="iad-number">{dataset.total_samples}</td><td className="iad-number">{dataset.format === "folder_classification" ? (dataset.labeled_sample_count ?? 0) : dataset.annotation_count}</td>
        <td><div className="iad-row"><IconButton label={`配置数据集 ${dataset.name}`} title="配置数据集" aria-pressed={selected?.dataset_id === dataset.dataset_id} onClick={() => { setRequested(dataset.dataset_id); onChanged(dataset.dataset_id); }}><ModelSettingsIcon size={16} /></IconButton>
          <DeleteAction title="删除数据集" name={dataset.name}
            description="删除其样本记录、知识、审计和复核记录，保留服务器上的原始图像与标注文件。" restoreFocus={() => addButton.current}
            onDelete={async () => { await request(`/datasets/${encodeURIComponent(dataset.dataset_id)}`, undefined, "DELETE"); setNotice(`已删除数据集“${dataset.name}”`); onChanged(); }} /></div></td>
      </tr>)}</tbody></table></div>{filtered.length > 10 && <Pagination total={filtered.length} page={currentPage} size={10} unit="个数据集" onPage={setPage} />}{notice && <p role="status">{notice}</p>}{!filtered.length && <p className="iad-muted">{datasets.length ? "没有匹配的数据集。" : "添加服务器上的 Labelme 图像目录与标注目录，或异常检测分类目录。"}</p>}
    </section>
    {selected ? <DatasetSettings key={selected.dataset_id} dataset={selected} onChanged={onChanged} sectionRef={settingsRef} /> : <section><p>选择或添加数据集。</p></section>}
    {importing && <Modal title="添加数据集" className="iad-dataset-dialog" onClose={() => { if (!busy) setImporting(false); }}>
      <form className="iad-dataset-import" onSubmit={importDataset}>
        <div className="iad-field">
          <label>数据格式</label>
          <div className="iad-row" role="radiogroup" aria-label="数据格式">
            <label><input type="radio" name="dataset_format" value="labelme" checked={importFormat === "labelme"} onChange={() => { setImportFormat("labelme"); setError(""); }} />Labelme</label>
            <label><input type="radio" name="dataset_format" value="folder_classification" checked={importFormat === "folder_classification"} onChange={() => { setImportFormat("folder_classification"); setError(""); }} />异常检测目录</label>
          </div>
        </div>

        {importFormat === "labelme" ? <>
          <div className="iad-field"><label htmlFor="dataset-name">数据集名称</label><input id="dataset-name" value={name} onChange={e => setName(e.target.value)} maxLength={120} autoFocus required disabled={busy} /></div>
          <DirectoryPicker label="图像目录" value={imageDir} onChange={setImageDir} disabled={busy} />
          <DirectoryPicker label="标注目录" value={annotationDir} onChange={setAnnotationDir} disabled={busy} />
          <p className="iad-muted">按相对路径匹配同名 JSON，无标注图作为初始良品候选。</p>
        </> : <>
          <DirectoryPicker label="父目录" value={rootDir} onChange={path => { setRootDir(path); setUserRules(undefined); }} disabled={busy} />
          <div className="iad-field"><label htmlFor="dataset-name">数据集名称</label><input id="dataset-name" value={name} onChange={e => setName(e.target.value)} maxLength={120} required disabled={busy} /></div>
          <FolderMapping preview={preview} rules={userRules} pending={pending} disabled={busy} onChange={setUserRules} />
          {previewError && <p role="alert" className="iad-error">{previewError}</p>}
        </>}

        {error && <p role="alert" className="iad-error">{error}</p>}
        <div className="iad-form-actions">
          <button type="button" disabled={busy} onClick={() => setImporting(false)}>取消</button>
          <button className="iad-primary" disabled={busy || !name.trim() || (importFormat === "labelme" ? (!imageDir || !annotationDir) : (!rootDir || !ready))}>
            {busy ? "正在扫描导入…" : "导入数据集"}
          </button>
        </div>
      </form>
    </Modal>}
  </div></>;
}
