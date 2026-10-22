import { createContext, useContext, useSyncExternalStore } from "react";
import type { Filters, InspectionReference, InspectionSnapshot, KnowledgeSnapshot } from "../shared/contracts.js";
import { initialFilters, initialReviewFilters, request } from "./api.js";
import { restoreInspection, type ImageView, type InspectionSelection, type InspectionTransform, type InspectionView } from "./inspection.js";
import type { WorkbenchSession } from "./workbench-session.js";
import { pages, type PageId, type WorkbenchLocation } from "../shared/navigation.js";
import { knowledgeStatuses, type KnowledgeStatusFilter } from "../shared/knowledge-presentation.js";
export { pages, type PageId } from "../shared/navigation.js";

interface ViewState { checkId: string; explorationVersion: string; explorationNormalCount: string; explorationDefectCount: string; explorationNormalImages: string[]; explorationDefectImages: string[]; explorationObjective: string; miningSourceMode: "uncovered" | "all" | "recheck"; scopeRunId: string; scopeSessionId: string; miningContinuous: boolean; conflictId: string; miningCount: string; miningImages: string[]; miningPreset: string; miningSearch: string; miningPage: number; filters: Filters; page: number; selected: string; tab: string; version: string; normalVersion: string; defectVersion: string; job: string; historyPage: number; historySearch: string; knowledgeSearch: string; knowledgeStatus: KnowledgeStatusFilter; inspection: InspectionView | null }
type KnowledgeKind = KnowledgeSnapshot["kind"];
interface WorkspaceState { knowledgeKind: KnowledgeKind; active: boolean; pageId: PageId; datasetId: string; views: Record<string, ViewState> }
interface Layout {
  selectPanel(id: string | null): void;
  panelInfo: { getSnapshot(): { activePanelId: string | null }; subscribe(listener: () => void): () => void };
}
const defaultView = (page: PageId): ViewState => ({ checkId:"", explorationVersion: "", explorationNormalCount: "10", explorationDefectCount: "10", explorationNormalImages: [], explorationDefectImages: [], explorationObjective: "", miningSourceMode: "uncovered", scopeRunId: "", scopeSessionId: "", miningContinuous: false, conflictId: "", miningCount: "10", miningImages: [], miningPreset: "", miningSearch: "", miningPage: 1, filters: { ...(page === "industrial-review" ? initialReviewFilters : initialFilters) }, page: 1, selected: "", tab: "results", version: "", normalVersion: "", defectVersion: "", job: "", historyPage: 1, historySearch: "", knowledgeSearch: "", knowledgeStatus: "", inspection: null });

/** One navigation owner per plugin instance; URLs contain identifiers and filters only. */
export class Workspace {
  constructor(private readonly conversation: WorkbenchSession) {}
  private state: WorkspaceState = { knowledgeKind: "normal", active: false, pageId: "industrial-datasets", datasetId: "", views: {} };
  private listeners = new Set<() => void>();
  private leaveGuards = new Set<() => boolean>();
  registerLeaveGuard(guard: () => boolean) { this.leaveGuards.add(guard); return () => { this.leaveGuards.delete(guard); }; }
  private canLeave() { return [...this.leaveGuards].every(guard => guard()); }
  private layout?: Layout;
  private imageViews = new Map<string, ImageView>();
  private pagePositions = new Map<string, number>();
  imageView(source: string) { return this.imageViews.get(source); }
  rememberImageView(source: string, view: ImageView) { this.imageViews.set(source, view); }
  pagePosition(source: string) { return this.pagePositions.get(source) || 0; }
  rememberPagePosition(source: string, top: number) { this.pagePositions.set(source, top); }
  private defaults = Object.fromEntries(Object.keys(pages).map(id => [id, defaultView(id as PageId)])) as Record<PageId, ViewState>;
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  view(page: PageId, kind = this.state.knowledgeKind) { return { ...this.defaults[page], ...this.state.views[this.viewKey(page, this.state.datasetId, kind)] }; }
  private viewKey(page: PageId, datasetId: string, kind: KnowledgeKind) { return `${page}:${datasetId}${page === "industrial-knowledge" ? `:${kind}` : ""}`; }
  selectKnowledgeKind(knowledgeKind: KnowledgeKind) {
    if (knowledgeKind === this.state.knowledgeKind) return;
    if (!this.canLeave()) return;
    this.state = { ...this.state, knowledgeKind }; this.commit();
  }
  connect(layout: Layout) {
    this.layout = layout;
    this.restore();
    const unsubscribe = layout.panelInfo.subscribe(() => {
      const id = layout.panelInfo.getSnapshot().activePanelId;
      if (id && id in pages) {
        if (!this.state.active || id !== this.state.pageId) this.navigate(id as PageId);
      } else if (this.state.active) {
        if (!this.canLeave()) { this.layout?.selectPanel(this.state.pageId); return; }
        this.state = { ...this.state, active: false }; this.commit();
      }
    });
    const restore = () => { if (this.canLeave()) this.restore(true); else this.commit(true); };
    window.addEventListener("popstate", restore);
    return () => { unsubscribe(); window.removeEventListener("popstate", restore); this.layout = undefined; };
  }
  navigate(pageId: PageId, selected?: string) {
    if (pageId !== this.state.pageId && !this.canLeave()) { this.layout?.selectPanel(this.state.pageId); return; }
    this.state = { ...this.state, active: true, pageId };
    if (selected !== undefined) this.state = { ...this.state, views: { ...this.state.views, [this.viewKey(pageId, this.state.datasetId, this.state.knowledgeKind)]: { ...this.view(pageId), selected, tab: "results" } } };
    this.commit();
    this.layout?.selectPanel(pageId);
  }
  openLocation({ pageId, datasetId, knowledgeKind = this.state.knowledgeKind, ...view }: WorkbenchLocation) {
    if (!this.canLeave()) return;
    this.state = { ...this.state, active: true, pageId, datasetId, knowledgeKind };
    this.state = { ...this.state, views: { ...this.state.views, [this.viewKey(pageId, datasetId, knowledgeKind)]: { ...this.view(pageId), ...view, inspection: null } } };
    this.commit();
    this.layout?.selectPanel(pageId);
  }
  selectDataset(datasetId: string, replace = false) {
    if (datasetId === this.state.datasetId) return;
    if (!this.canLeave()) return;
    this.state = { ...this.state, datasetId }; this.commit(replace);
  }
  updateView(page: PageId, patch: Partial<ViewState>, replace = false) {
    if (patch.tab && patch.tab !== this.view(page).tab && !this.canLeave()) return;
    this.state = { ...this.state, views: { ...this.state.views, [this.viewKey(page, this.state.datasetId, this.state.knowledgeKind)]: { ...this.view(page), ...patch } } };
    this.commit(replace);
  }
  async ask(reference: InspectionReference, selection: InspectionSelection | null, transform: InspectionTransform, question: string) {
    const { pageId, datasetId, knowledgeKind } = this.state;
    const view = this.view(pageId);
    const snapshot = await request<InspectionSnapshot>("/inspection/context", reference);
    if (!this.state.active || this.state.pageId !== pageId || this.state.datasetId !== datasetId || this.view(pageId).selected !== reference.sample_id) throw new Error("检视位置已切换，请在当前图像重新追问");
    await this.conversation.inspect(snapshot, question, sessionId => {
      if (!this.state.active || this.state.pageId !== pageId || this.state.datasetId !== datasetId || this.view(pageId).selected !== reference.sample_id) throw new Error("检视位置已切换，请在当前图像重新追问");
      this.updateView(pageId, { inspection: { reference, selection, transform, sessionId } }, true);
      const route = new URLSearchParams({ iad: JSON.stringify({ pageId, datasetId, knowledgeKind, ...this.view(pageId) }) });
      return `${location.origin}${location.pathname}?${route}`;
    }, view.inspection?.reference.sample_id === reference.sample_id ? view.inspection.sessionId : undefined);
  }
  async mineScope(scopeRunId: string, imageCount: number, images: string[]) {
    const { datasetId, knowledgeKind } = this.state;
    const pageId = "industrial-knowledge", view = this.view(pageId);
    await this.conversation.mine(scopeRunId, knowledgeKind, imageCount, images, sessionId => {
      if (this.state.datasetId !== datasetId || this.state.knowledgeKind !== knowledgeKind) throw new Error("数据集或知识类型已切换，请在当前范围重新发起");
      this.updateView(pageId, { scopeRunId, scopeSessionId: sessionId });
      return `${location.origin}${location.pathname}?${new URLSearchParams({ iad: JSON.stringify({ pageId, datasetId, knowledgeKind, ...this.view(pageId) }) })}`;
    }, view.scopeSessionId || undefined);
  }
  openSession(sessionId: string) { return this.conversation.open(sessionId); }
  private commit(replace = false) {
    const { pageId, datasetId, knowledgeKind } = this.state;
    const url = new URL(location.href);
    if (this.state.active) url.searchParams.set("iad", JSON.stringify({ pageId, datasetId, knowledgeKind, ...this.view(pageId) }));
    else url.searchParams.delete("iad");
    history[replace ? "replaceState" : "pushState"](history.state, "", url);
    sessionStorage.setItem("iad.workspace", JSON.stringify(this.state));
    this.listeners.forEach(listener => listener());
  }
  private restore(fromHistory = false) {
    const raw = new URL(location.href).searchParams.get("iad");
    try {
      const saved = JSON.parse(sessionStorage.getItem("iad.workspace") || "null");
      if (!fromHistory && saved?.pageId in pages && typeof saved.datasetId === "string" && typeof saved.active === "boolean") {
        this.state = { ...saved, knowledgeKind: saved.knowledgeKind === "defect" ? "defect" : "normal", views: Object.fromEntries(Object.entries(saved.views || {}).map(([key, value]) => {
          const view = value as ViewState;
          return [key, { ...view, filters: { ...initialFilters, ...view.filters } }];
        })) };
      }
      if (fromHistory) this.state = { ...this.state, active: false };
      if (raw) {
        const route = JSON.parse(raw);
        if (route.pageId in pages && typeof route.datasetId === "string") {
          const knowledgeKind: KnowledgeKind = route.knowledgeKind === "defect" ? "defect" : "normal";
          const view = defaultView(route.pageId);
          for (const key of ["checkId", "explorationVersion", "explorationNormalCount", "explorationDefectCount", "explorationObjective", "selected", "scopeRunId", "scopeSessionId", "conflictId", "tab", "version", "miningCount", "miningPreset", "miningSearch", "normalVersion", "defectVersion", "job", "historySearch", "knowledgeSearch"] as const) if (typeof route[key] === "string") view[key] = route[key];
          if (["uncovered", "all", "recheck"].includes(route.miningSourceMode)) view.miningSourceMode = route.miningSourceMode;
          if (typeof route.miningContinuous === "boolean") view.miningContinuous = route.miningContinuous;
          if (typeof route.knowledgeStatus === "string" && (route.knowledgeStatus === "" || Object.hasOwn(knowledgeStatuses, route.knowledgeStatus))) view.knowledgeStatus = route.knowledgeStatus;
          if (Number.isInteger(route.miningPage) && route.miningPage > 0) view.miningPage = route.miningPage;
          for (const key of ["miningImages", "explorationNormalImages", "explorationDefectImages"] as const)
            if (Array.isArray(route[key]) && route[key].every((id: unknown) => typeof id === "string")) view[key] = route[key];
          view.inspection = restoreInspection(route.inspection, route.datasetId, view.selected);
          if (Number.isInteger(route.page) && route.page > 0) view.page = route.page;
          if (Number.isInteger(route.historyPage) && route.historyPage > 0) view.historyPage = route.historyPage;
          if (route.filters) {
            for (const key of ["search", "model_status", "review_status", "technical", "sort_by", "reference_status"] as const) if (typeof route.filters[key] === "string") view.filters = { ...view.filters, [key]: route.filters[key] };
            if (Array.isArray(route.filters.raw_label_filters) && route.filters.raw_label_filters.every((item: unknown) => typeof item === "string")) view.filters.raw_label_filters = route.filters.raw_label_filters;
            if (Array.isArray(route.filters.annotation_filters) && route.filters.annotation_filters.every((item: unknown) => typeof item === "string")) view.filters.annotation_filters = route.filters.annotation_filters;
          }
          this.state = { ...this.state, active: true, pageId: route.pageId, datasetId: route.datasetId, knowledgeKind, views: { ...this.state.views, [this.viewKey(route.pageId, route.datasetId, knowledgeKind)]: view } };
        }
      }
    } catch { sessionStorage.removeItem("iad.workspace"); }
    if (this.state.active) this.layout?.selectPanel(this.state.pageId);
    else if (fromHistory) this.layout?.selectPanel(null);
    this.listeners.forEach(listener => listener());
  }
}
export const WorkspaceContext = createContext<Workspace | null>(null);
export function useWorkspace() {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("Workbench requires its workspace owner");
  const state = useSyncExternalStore(workspace.subscribe, workspace.getSnapshot);
  return { workspace, state };
}
