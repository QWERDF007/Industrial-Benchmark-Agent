import React, { useState } from "react";
import type { Dataset, KnowledgeSourcePage } from "../../shared/contracts.js";
import { mediaUrl } from "../api.js";
import { Modal } from "./Modal.js";
import { Pagination } from "./Pagination.js";
import { ImageViewer, type ImageSource } from "./ImageViewer.js";

/** Presentation only: each caller owns candidate qualification, scope and selection. */
export function SourcePicker({ dataset, label, sources, selected, target, disabled, page, onPage, onChange, search, onSearch }: {
  dataset: Dataset; label: string; sources: KnowledgeSourcePage | null; selected: string[]; target: number | string;
  disabled: boolean; page: number; onPage(page: number): void; onChange(ids: string[]): void;
  search: string; onSearch(value: string): void;
}) {
  const [open, setOpen] = useState(false), [selectedOnly, setSelectedOnly] = useState(false), [selectedPage, setSelectedPage] = useState(1);
  const [selectedSearch, setSelectedSearch] = useState("");
  const [image, setImage] = useState<ImageSource | null>(null);
  const name = (id: string) => id.slice(id.indexOf(":") + 1);
  const chosen = selected.filter(id => name(id).toLocaleLowerCase().includes(selectedSearch.toLocaleLowerCase()));
  const current = Math.min(selectedPage, Math.max(1, Math.ceil(chosen.length / 10)));
  const items = selectedOnly ? chosen.slice((current - 1) * 10, current * 10).map(id => ({ sample_id: id, relative_path: name(id) })) : sources?.items || [];
  function show(only: boolean) { setSelectedOnly(only); setSelectedPage(1); setSelectedSearch(""); setOpen(true); }
  function thumbnail(id: string, path: string) {
    const sample = { task_id: dataset.task_id, sample_id: id };
    return <button type="button" aria-label={`放大样例 ${path}`} onClick={() => setImage({ src: mediaUrl(sample, "image"), title: path })}><img src={mediaUrl(sample, "thumbnail")} alt={path} loading="lazy" /></button>;
  }
  return <div className="iad-source-picker">
    <div className="iad-row"><span role="status">已选 {selected.length} / {target || "—"} 张{sources ? ` · 可用 ${sources.total}` : ""}</span>
      <button type="button" disabled={disabled} onClick={() => show(false)}>选择{label}图像</button>
      <button type="button" disabled={!selected.length || disabled} onClick={() => show(true)}>查看全部已选{label}</button>
      <button type="button" disabled={!selected.length || disabled} onClick={() => onChange([])}>清空{label}选择</button></div>
    <div className="iad-source-preview">{selected.slice(0, 4).map(id => <div key={id}>{thumbnail(id, name(id))}<span title={name(id)}>{name(id).split("/").pop()}</span></div>)}</div>
    {open && <Modal title={`选择${label}图像`} onClose={() => setOpen(false)} className="iad-source-dialog">
      <div className="iad-row"><label className="iad-field">搜索图像<input type="search" aria-label={`搜索${label}图像`} value={selectedOnly ? selectedSearch : search} onChange={event => {
        if (selectedOnly) { setSelectedSearch(event.target.value); setSelectedPage(1); } else onSearch(event.target.value);
      }} /></label><label><input type="checkbox" checked={selectedOnly} onChange={event => { setSelectedOnly(event.target.checked); setSelectedPage(1); }} />仅已选</label><span>已选 {selected.length} / {target || "—"} 张</span></div>
      <fieldset disabled={disabled} className="iad-source-candidates"><legend>{label}图像</legend>
        <div className="iad-source-grid">{items.map(item => <div className="iad-source-option" key={item.sample_id}>
          {thumbnail(item.sample_id, item.relative_path)}<label title={item.relative_path}><input type="checkbox" aria-label={`选择${label} ${item.relative_path}`} checked={selected.includes(item.sample_id)} onChange={event => onChange(event.target.checked ? [...selected, item.sample_id] : selected.filter(id => id !== item.sample_id))} /><span>{item.relative_path.split("/").pop()}</span></label>
        </div>)}</div>{!items.length && <p role="status">{selectedOnly ? "没有匹配的已选图像。" : sources ? "没有匹配的合格来源。" : "正在读取来源…"}</p>}
      </fieldset><Pagination total={selectedOnly ? chosen.length : sources?.total || 0} page={selectedOnly ? current : page} size={10} unit="张" onPage={selectedOnly ? setSelectedPage : onPage} />
      <div className="iad-form-actions"><button type="button" onClick={() => setOpen(false)}>完成选择</button></div>
    </Modal>}{image && <ImageViewer image={image} onClose={() => setImage(null)} />}
  </div>;
}
