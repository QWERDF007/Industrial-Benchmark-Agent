import { useCallback, useEffect, useRef, useState } from "react";
import type { SamplePage } from "../shared/contracts.js";
import { message, request } from "./api.js";
import { pageSize } from "./components/Pagination.js";
import type { ImageNavigation } from "./components/ImageViewer.js";
import { useWorkspace, type PageId } from "./workspace.js";

export type SampleWindow = SamplePage & { query: string };
export interface SampleNavigation extends ImageNavigation { open: boolean; opened(): void; cancel(): void }

/** Uses the gallery's actual query and pagination; no second ordering or sample index. */
export function useSampleNavigation(pageId: PageId, taskId: string | undefined, query: string, result: SampleWindow, enabled: boolean): SampleNavigation {
  const { workspace, state } = useWorkspace();
  const view = workspace.view(pageId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [target, setTarget] = useState("");
  const pending = useRef<AbortController>();
  const position = enabled && result.query === query ? result.items.findIndex(item => item.sample_id === view.selected) : -1;
  const previous = position >= 0 && (position > 0 || view.page > 1);
  const next = position >= 0 && (position < result.items.length - 1 || view.page * pageSize < result.total);
  const cancel = useCallback(() => {
    pending.current?.abort(); pending.current = undefined;
    setBusy(false); setError(""); setTarget("");
  }, []);
  const opened = useCallback(() => setTarget(""), []);
  useEffect(() => {
    setBusy(false); setError(""); setTarget(target => state.active && state.pageId === pageId && target === view.selected ? target : "");
    return () => { pending.current?.abort(); pending.current = undefined; };
  }, [query, view.selected, enabled, state.active, state.pageId, state.datasetId, pageId]);

  async function move(offset: -1 | 1) {
    if (pending.current || !taskId || (offset < 0 ? !previous : !next)) return;
    const controller = new AbortController(); pending.current = controller;
    setBusy(true); setError("");
    try {
      let page = view.page;
      let sample = result.items[position + offset];
      if (!sample) {
        page += offset;
        const parameters = new URLSearchParams(query); parameters.set("page", String(page));
        const adjacent = await request<SamplePage>(`/samples/${encodeURIComponent(taskId)}?${parameters}`, undefined, undefined, controller.signal);
        sample = adjacent.items[offset > 0 ? 0 : adjacent.items.length - 1];
      }
      if (controller.signal.aborted) return;
      const current = workspace.getSnapshot(), selected = workspace.view(pageId);
      if (!current.active || current.pageId !== pageId || current.datasetId !== state.datasetId || selected.selected !== view.selected || selected.page !== view.page || selected.filters !== view.filters) return;
      if (!sample) throw new Error("当前筛选范围已变化，请刷新后重试");
      setTarget(sample.sample_id);
      workspace.updateView(pageId, { page, selected: sample.sample_id, inspection: null });
    } catch (error) { if (!controller.signal.aborted) setError(message(error)); }
    finally { if (pending.current === controller) { pending.current = undefined; setBusy(false); } }
  }
  return { previous, next, busy, error, move, open: !!target && target === view.selected, opened, cancel };
}
