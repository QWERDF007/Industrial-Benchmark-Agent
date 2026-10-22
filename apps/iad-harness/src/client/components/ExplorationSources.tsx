import React, { useEffect, useState } from "react";
import type { Dataset, KnowledgeSourcePage } from "../../shared/contracts.js";
import { message, request } from "../api.js";
import { SourcePicker } from "./SourcePicker.js";

export function ExplorationSources({ dataset, kind, count, images, disabled, onCount, onImages, onSelecting }: {
  dataset: Dataset; kind: "normal" | "defect"; count: string; images: string[]; disabled: boolean;
  onCount(value: string): void; onImages(value: string[]): void; onSelecting(value: boolean): void;
}) {
  const label = kind === "normal" ? "良品" : "异常";
  const [page, setPage] = useState(1), [sources, setSources] = useState<KnowledgeSourcePage | null>(null);
  const [error, setError] = useState(""), [selecting, setSelecting] = useState(false), [search, setSearch] = useState("");
  const query = new URLSearchParams({ dataset_id: dataset.dataset_id, kind, search });
  useEffect(() => {
    const controller = new AbortController(); setError("");
    request<KnowledgeSourcePage>(`/knowledge/sources?${query}&page=${page}&page_size=10`, undefined, undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) setSources(result); }).catch(e => { if (!controller.signal.aborted) setError(message(e)); });
    return () => controller.abort();
  }, [dataset.dataset_id, kind, page, search]);
  async function select() {
    setSelecting(true); onSelecting(true); setError("");
    try {
      const selected: string[] = [];
      for (let next = 1; selected.length < Number(count); next++) {
        const result = await request<KnowledgeSourcePage>(`/knowledge/sources?${query}&page=${next}&page_size=100`);
        selected.push(...result.items.slice(0, Number(count) - selected.length).map(item => item.sample_id));
        if (next * 100 >= result.total) break;
      }
      if (selected.length !== Number(count)) throw new Error(`可用${label}不足${count}张，请调整数量`);
      onImages(selected);
    } catch (e) { setError(message(e)); } finally { setSelecting(false); onSelecting(false); }
  }
  return <section className="iad-info-group"><h3>{label}样例</h3>
    <fieldset disabled={disabled || selecting}>
      <div className="iad-row"><label className="iad-field">图像数量<input type="number" min="1" aria-label={`${label}图像数量`} value={count} onChange={e => onCount(e.target.value)} /></label>
        <button disabled={!Number.isInteger(Number(count)) || Number(count) < 1} onClick={() => void select()}>{selecting ? "选取中…" : `选取${label}图像`}</button>
        </div>
      {error && <p role="alert" className="iad-error">{error}</p>}
      <SourcePicker dataset={dataset} label={label} sources={sources} selected={images} target={count} disabled={disabled || selecting} page={page} onPage={setPage} onChange={onImages} search={search} onSearch={value => { setSearch(value); setPage(1); }} />
    </fieldset>
  </section>;
}
