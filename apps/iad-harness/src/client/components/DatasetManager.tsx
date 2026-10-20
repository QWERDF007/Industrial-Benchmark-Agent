import React, { useState } from "react";
import type { Dataset, DirectoryListing } from "../../shared/contracts.js";
import { message, request } from "../api.js";
import { Modal } from "./Modal.js";

function DirectoryPicker({ label, value, onChange }: { label: string; value: string; onChange(value: string): void }) {
  const [listing, setListing] = useState<DirectoryListing | null>(null);
  const [error, setError] = useState("");
  async function browse(path: string) {
    try { setListing(await request<DirectoryListing>(`/directories?path=${encodeURIComponent(path || "/data1")}`)); setError(""); }
    catch (e) { setError(message(e)); }
  }
  return <div className="iad-field"><label>{label}</label><div className="iad-row">
    <input aria-label={label} value={value} onChange={e => onChange(e.target.value)} placeholder="服务器上的目录" />
    <button type="button" onClick={() => browse(value)}>浏览</button>
  </div>{error && <p role="alert" className="iad-error">{error}</p>}{listing && <div className="iad-directory">
    <div className="iad-row"><code>{listing.path}</code><button type="button" onClick={() => browse(listing.parent)}>上级</button>
      <button type="button" onClick={() => { onChange(listing.path); setListing(null); }}>选择此目录</button><button type="button" onClick={() => setListing(null)}>关闭</button></div>
    <div className="iad-directory-list">{listing.directories.map(dir => <button type="button" key={dir.path} onClick={() => browse(dir.path)}>{dir.name}</button>)}</div>
  </div>}</div>;
}

function DatasetSettings({ dataset, onChanged }: { dataset: Dataset; onChanged(): void }) {
  const [rename, setRename] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(patch: { name?: string; unannotated_is_normal?: boolean; reset_references?: boolean }) {
    setBusy(true); setError("");
    try { await request(`/datasets/${dataset.dataset_id}`, patch, "PATCH"); onChanged(); setRename(""); }
    catch (error) { setError(message(error)); } finally { setBusy(false); }
  }
  return <section aria-label="当前数据集详情"><h2>{dataset.name}</h2>
    <dl><dt>图像目录</dt><dd>{dataset.image_dir}</dd><dt>标注目录</dt><dd>{dataset.annotation_dir || "由原导入配置定位"}</dd>
      <dt>数据集 ID</dt><dd><code>{dataset.dataset_id}</code></dd></dl>
    <div className="iad-row"><input aria-label="新的数据集名称" placeholder="新的数据集名称" value={rename} onChange={e => setRename(e.target.value)} maxLength={120} disabled={busy} />
      <button disabled={busy || !rename.trim()} onClick={() => save({ name: rename })}>保存名称</button></div>
    <label className="iad-row iad-rule"><input type="checkbox" checked={dataset.unannotated_is_normal} disabled={busy} onChange={e => save({ unannotated_is_normal: e.target.checked })} />无标注图作为初始良品参考</label>
    <p>良品候选：{dataset.reference_mode === "selected" ? "人工选定范围" : "自动资格"} · {dataset.reference_sample_ids.length} 张</p>
    {dataset.reference_mode === "selected" && <button disabled={busy} onClick={() => save({ reset_references: true })}>恢复自动资格</button>}
    <p className="iad-muted">来源资格变更用于后续知识挖掘；已有知识与审计保留原版本。</p>
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
    <section aria-label="数据集列表"><div className="iad-row"><h2>数据集 · {datasets.length}</h2><button className="iad-primary" onClick={() => { setError(""); setImporting(true); }}>添加数据集</button></div>
      <div className="iad-dataset-list">{datasets.map(dataset => <button key={dataset.dataset_id} aria-label={`选择数据集 ${dataset.name}`} aria-pressed={selected?.dataset_id === dataset.dataset_id} onClick={() => onChanged(dataset.dataset_id)}>
        <strong>{dataset.name}</strong><span>{dataset.total_samples} 张 · 人工复核 {dataset.human_reviewed_count} 张</span>
      </button>)}</div>{!datasets.length && <p className="iad-muted">添加服务器上的 Labelme 图像目录与标注目录。</p>}
    </section>
    {selected ? <DatasetSettings key={selected.dataset_id} dataset={selected} onChanged={onChanged} /> : <section><p>选择或添加数据集。</p></section>}
    {importing && <Modal title="导入 Labelme 数据集" onClose={() => { if (!busy) setImporting(false); }}>
      <form className="iad-dataset-import" onSubmit={importDataset}><h2>导入 Labelme 数据集</h2>
        <div className="iad-field"><label htmlFor="dataset-name">数据集名称</label><input id="dataset-name" value={name} onChange={e => setName(e.target.value)} maxLength={120} autoFocus required disabled={busy} /></div>
        <DirectoryPicker label="图像目录" value={imageDir} onChange={setImageDir} />
        <DirectoryPicker label="标注目录" value={annotationDir} onChange={setAnnotationDir} />
        <p className="iad-muted">按相对路径匹配同名 JSON，无标注图作为初始良品候选。</p>
        {error && <p role="alert" className="iad-error">{error}</p>}
        <div className="iad-row"><button className="iad-primary" disabled={busy || !name.trim() || !imageDir || !annotationDir}>{busy ? "正在扫描导入…" : "导入数据集"}</button>
          <button type="button" disabled={busy} onClick={() => setImporting(false)}>取消</button></div>
      </form>
    </Modal>}
  </div>;
}
