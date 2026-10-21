import React, { useEffect, useState } from "react";
import type { Dataset, DirectoryListing, ScanResult } from "../../shared/contracts.js";
import { message, request } from "../api.js";
import { Modal } from "./Modal.js";
import { DatasetName } from "./DatasetName.js";

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

function DatasetSettings({ dataset, onChanged }: { dataset: Dataset; onChanged(): void }) {
  const [imageDir, setImageDir] = useState(dataset.image_dir);
  const [annotationDir, setAnnotationDir] = useState(dataset.annotation_dir || "");
  useEffect(() => { setImageDir(dataset.image_dir); setAnnotationDir(dataset.annotation_dir || ""); }, [dataset.image_dir, dataset.annotation_dir]);
  const directoriesChanged = imageDir !== dataset.image_dir || annotationDir !== (dataset.annotation_dir || "");
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(patch: { unannotated_is_normal: boolean }) {
    setBusy(true); setError("");
    try { await request(`/datasets/${dataset.dataset_id}`, patch, "PATCH"); onChanged(); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  async function rescan() {
    setBusy(true); setError(""); setScan(null);
    try { setScan(await request<ScanResult>(`/datasets/${dataset.dataset_id}/rescan`, directoriesChanged ? { image_dir: imageDir, annotation_dir: annotationDir } : {})); onChanged(); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  return <section aria-label="当前数据集详情" aria-busy={busy}><h2>数据集详情</h2>
    <DatasetName dataset={dataset} label="新的数据集名称" onChanged={onChanged} />
    <dl className="iad-dataset-counts"><div><dt>图像数量</dt><dd>{dataset.total_samples}</dd></div><div><dt>标注数量</dt><dd>{dataset.annotation_count}</dd></div></dl>
    <div className="iad-field-group"><h3>服务器目录</h3>
      <DirectoryPicker label="图像目录" value={imageDir} onChange={setImageDir} disabled={busy} />
      <DirectoryPicker label="标注目录" value={annotationDir} onChange={setAnnotationDir} disabled={busy} />
      <div className="iad-form-actions"><button className={directoriesChanged ? "iad-primary" : ""} disabled={busy || (directoriesChanged && (!imageDir.trim() || !annotationDir.trim()))} onClick={() => void rescan()}>{busy ? "正在处理…" : directoriesChanged ? "保存目录并重新扫描" : "重新扫描目录"}</button></div>
    </div>
    <label className="iad-row iad-rule"><input type="checkbox" checked={dataset.unannotated_is_normal} disabled={busy} onChange={e => save({ unannotated_is_normal: e.target.checked })} />无标注图作为初始良品来源</label>
    <dl><dt>数据集 ID</dt><dd><code>{dataset.dataset_id}</code></dd></dl>
    {scan && <p role="status" aria-label="扫描结果">扫描完成 · {scan.image_count} 张图像 · {scan.annotation_count} 个标注 · {scan.issue_count} 项问题</p>}
    {error && <p role="alert" className="iad-error">{error}</p>}
  </section>;
}

export function DatasetManager({ datasets, selected, onChanged }: { datasets: Dataset[]; selected?: Dataset; onChanged(id?: string): void }) {
  const [importing, setImporting] = useState(false);
  const [name, setName] = useState("");
  const [imageDir, setImageDir] = useState("");
  const [annotationDir, setAnnotationDir] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function importDataset(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const dataset = await request<Dataset>("/datasets/import", { name, image_dir: imageDir, annotation_dir: annotationDir, unannotated_is_normal: true });
      onChanged(dataset.dataset_id); setName(""); setImageDir(""); setAnnotationDir(""); setImporting(false);
    } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  return <div className="iad-settings">
    <section aria-label="数据集列表"><div className="iad-section-header"><h2>数据集 · {datasets.length}</h2><button className="iad-primary" onClick={() => { setError(""); setImporting(true); }}>添加数据集</button></div>
      <div className="iad-dataset-list">{datasets.map(dataset => <article className="iad-dataset-card" key={dataset.dataset_id} data-selected={selected?.dataset_id === dataset.dataset_id}>
        <button type="button" className="iad-dataset-select" aria-label={`选择数据集 ${dataset.name}`} aria-pressed={selected?.dataset_id === dataset.dataset_id} onClick={() => onChanged(dataset.dataset_id)} />
        <DatasetName dataset={dataset} label="卡片数据集名称" onChanged={() => onChanged()} />
        <dl className="iad-dataset-counts"><div><dt>图像数量</dt><dd>{dataset.total_samples}</dd></div><div><dt>标注数量</dt><dd>{dataset.annotation_count}</dd></div></dl>
      </article>)}</div>{!datasets.length && <p className="iad-muted">添加服务器上的 Labelme 图像目录与标注目录。</p>}
    </section>
    {selected ? <DatasetSettings key={selected.dataset_id} dataset={selected} onChanged={onChanged} /> : <section><p>选择或添加数据集。</p></section>}
    {importing && <Modal title="导入 Labelme 数据集" onClose={() => { if (!busy) setImporting(false); }}>
      <form className="iad-dataset-import" onSubmit={importDataset}>
        <div className="iad-field"><label htmlFor="dataset-name">数据集名称</label><input id="dataset-name" value={name} onChange={e => setName(e.target.value)} maxLength={120} autoFocus required disabled={busy} /></div>
        <DirectoryPicker label="图像目录" value={imageDir} onChange={setImageDir} disabled={busy} />
        <DirectoryPicker label="标注目录" value={annotationDir} onChange={setAnnotationDir} disabled={busy} />
        <p className="iad-muted">按相对路径匹配同名 JSON，无标注图作为初始良品候选。</p>
        {error && <p role="alert" className="iad-error">{error}</p>}
        <div className="iad-form-actions"><button type="button" disabled={busy} onClick={() => setImporting(false)}>取消</button>
          <button className="iad-primary" disabled={busy || !name.trim() || !imageDir || !annotationDir}>{busy ? "正在扫描导入…" : "导入数据集"}</button></div>
      </form>
    </Modal>}
  </div>;
}
