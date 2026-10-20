import React, { useState } from "react";
import type { Dataset, DirectoryListing } from "../../shared/contracts.js";
import { message, request } from "../api.js";

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

export function DatasetManager({ datasets, selected, onChanged }: { datasets: Dataset[]; selected?: Dataset; onChanged(id?: string): void }) {
  const [name, setName] = useState("");
  const [imageDir, setImageDir] = useState("");
  const [annotationDir, setAnnotationDir] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rename, setRename] = useState("");
  async function importDataset(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const dataset = await request<Dataset>("/datasets/import", { name, image_dir: imageDir, annotation_dir: annotationDir, unannotated_is_normal: true });
      onChanged(dataset.dataset_id); setName("");
    } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  async function updateName() {
    if (!selected) return;
    setError("");
    try { await request(`/datasets/${selected.dataset_id}`, { name: rename }, "PATCH"); onChanged(); setRename(""); }
    catch (e) { setError(message(e)); }
  }
  return <div className="iad-settings">
    <form onSubmit={importDataset}><h2>导入 Labelme 数据集</h2>
      <div className="iad-field"><label htmlFor="dataset-name">数据集名称</label><input id="dataset-name" value={name} onChange={e => setName(e.target.value)} maxLength={120} required /></div>
      <DirectoryPicker label="图像目录" value={imageDir} onChange={setImageDir} />
      <DirectoryPicker label="标注目录" value={annotationDir} onChange={setAnnotationDir} />
      <p className="iad-muted">标注目录按图像相对路径匹配同名 JSON。初始从无标注图选取良品参考。</p>
      <button className="iad-primary" disabled={busy || !name.trim() || !imageDir || !annotationDir}>{busy ? "正在扫描导入…" : "导入数据集"}</button>
    </form>
    <section><h2>数据集管理 · {datasets.length}</h2>{selected ? <>
      <dl><dt>名称</dt><dd>{selected.name}</dd><dt>数据集 ID</dt><dd><code>{selected.dataset_id}</code></dd>
        <dt>图像目录</dt><dd>{selected.image_dir}</dd><dt>标注目录</dt><dd>{selected.annotation_dir || "由原导入配置定位"}</dd></dl>
      <div className="iad-row"><input aria-label="新的数据集名称" placeholder="新的数据集名称" value={rename} onChange={e => setRename(e.target.value)} />
        <button disabled={!rename.trim()} onClick={updateName}>保存名称</button></div>
      <label className="iad-row iad-rule"><input type="checkbox" checked={selected.unannotated_is_normal} onChange={async e => {
        try { await request(`/datasets/${selected.dataset_id}`, { unannotated_is_normal: e.target.checked }, "PATCH"); onChanged(); }
        catch (err) { setError(message(err)); }
      }} />无标注图作为初始良品参考</label>
      <p>良品候选：{selected.reference_mode === "selected" ? "人工选定范围" : "自动资格"} · {selected.reference_sample_ids.length} 张</p>
      {selected.reference_mode === "selected" && <button onClick={async () => {
        try { await request(`/datasets/${selected.dataset_id}`, { reset_references: true }, "PATCH"); onChanged(); }
        catch (error) { setError(message(error)); }
      }}>恢复自动资格</button>}
    </> : <p>请导入数据集。</p>}</section>
    {error && <p role="alert" className="iad-error">{error}</p>}
  </div>;
}
