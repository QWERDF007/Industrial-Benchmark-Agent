import { createContext, useContext, useSyncExternalStore } from "react";
import { initialFilters, request } from "./api.js";
import { restoreInspection } from "./inspection.js";
import { pages } from "../shared/navigation.js";
import { knowledgeStatuses } from "../shared/knowledge-presentation.js";
export { pages } from "../shared/navigation.js";
const defaultView = (page) => ({ filters: { ...initialFilters, review_status: page === "industrial-review" ? "pending" : "all" }, page: 1, selected: "", tab: "results", version: "", model: "", normalVersion: "", defectVersion: "", job: "", historyPage: 1, historySearch: "", knowledgeSearch: "", knowledgeStatus: "", inspection: null });
/** One navigation owner per plugin instance; URLs contain identifiers and filters only. */
export class Workspace {
    conversation;
    constructor(conversation) {
        this.conversation = conversation;
    }
    state = { active: false, pageId: "industrial-datasets", datasetId: "", views: {} };
    listeners = new Set();
    layout;
    imageViews = new Map();
    pagePositions = new Map();
    imageView(source) { return this.imageViews.get(source); }
    rememberImageView(source, view) { this.imageViews.set(source, view); }
    pagePosition(source) { return this.pagePositions.get(source) || 0; }
    rememberPagePosition(source, top) { this.pagePositions.set(source, top); }
    defaults = Object.fromEntries(Object.keys(pages).map(id => [id, defaultView(id)]));
    getSnapshot = () => this.state;
    subscribe = (listener) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
    view(page) { return { ...this.defaults[page], ...this.state.views[`${page}:${this.state.datasetId}`] }; }
    connect(layout) {
        this.layout = layout;
        this.restore();
        const unsubscribe = layout.panelInfo.subscribe(() => {
            const id = layout.panelInfo.getSnapshot().activePanelId;
            if (id && id in pages) {
                if (!this.state.active || id !== this.state.pageId)
                    this.navigate(id);
            }
            else if (this.state.active) {
                this.state = { ...this.state, active: false };
                this.commit();
            }
        });
        const restore = () => this.restore(true);
        window.addEventListener("popstate", restore);
        return () => { unsubscribe(); window.removeEventListener("popstate", restore); this.layout = undefined; };
    }
    navigate(pageId, selected) {
        this.state = { ...this.state, active: true, pageId };
        if (selected !== undefined)
            this.state = { ...this.state, views: { ...this.state.views, [`${pageId}:${this.state.datasetId}`]: { ...this.view(pageId), selected, tab: "results" } } };
        this.commit();
        this.layout?.selectPanel(pageId);
    }
    openLocation({ pageId, datasetId, ...view }) {
        this.state = { ...this.state, active: true, pageId, datasetId };
        this.state = { ...this.state, views: { ...this.state.views, [`${pageId}:${datasetId}`]: { ...this.view(pageId), ...view, inspection: null } } };
        this.commit();
        this.layout?.selectPanel(pageId);
    }
    selectDataset(datasetId, replace = false) {
        if (datasetId === this.state.datasetId)
            return;
        this.state = { ...this.state, datasetId };
        this.commit(replace);
    }
    updateView(page, patch, replace = false) {
        this.state = { ...this.state, views: { ...this.state.views, [`${page}:${this.state.datasetId}`]: { ...this.view(page), ...patch } } };
        this.commit(replace);
    }
    async ask(reference, selection, transform, question) {
        const { pageId, datasetId } = this.state;
        const view = this.view(pageId);
        const snapshot = await request("/inspection/context", reference);
        if (!this.state.active || this.state.pageId !== pageId || this.state.datasetId !== datasetId || this.view(pageId).selected !== reference.sample_id)
            throw new Error("检视位置已切换，请在当前图像重新追问");
        await this.conversation.send(snapshot, question, sessionId => {
            if (!this.state.active || this.state.pageId !== pageId || this.state.datasetId !== datasetId || this.view(pageId).selected !== reference.sample_id)
                throw new Error("检视位置已切换，请在当前图像重新追问");
            this.updateView(pageId, { inspection: { reference, selection, transform, sessionId } }, true);
            const route = new URLSearchParams({ iad: JSON.stringify({ pageId, datasetId, ...this.view(pageId) }) });
            return `${location.origin}${location.pathname}?${route}`;
        }, view.inspection?.reference.sample_id === reference.sample_id ? view.inspection.sessionId : undefined);
    }
    openSession(sessionId) { return this.conversation.open(sessionId); }
    commit(replace = false) {
        const { pageId, datasetId } = this.state;
        const url = new URL(location.href);
        if (this.state.active)
            url.searchParams.set("iad", JSON.stringify({ pageId, datasetId, ...this.view(pageId) }));
        else
            url.searchParams.delete("iad");
        history[replace ? "replaceState" : "pushState"](history.state, "", url);
        sessionStorage.setItem("iad.workspace", JSON.stringify(this.state));
        this.listeners.forEach(listener => listener());
    }
    restore(fromHistory = false) {
        const raw = new URL(location.href).searchParams.get("iad");
        try {
            const saved = JSON.parse(sessionStorage.getItem("iad.workspace") || "null");
            if (!fromHistory && saved?.pageId in pages && typeof saved.datasetId === "string" && typeof saved.active === "boolean") {
                this.state = { ...saved, views: Object.fromEntries(Object.entries(saved.views || {}).map(([key, value]) => {
                        const view = value;
                        return [key, { ...view, filters: { ...initialFilters, ...view.filters } }];
                    })) };
            }
            if (fromHistory)
                this.state = { ...this.state, active: false };
            if (raw) {
                const route = JSON.parse(raw);
                if (route.pageId in pages && typeof route.datasetId === "string") {
                    const view = defaultView(route.pageId);
                    for (const key of ["selected", "tab", "version", "model", "normalVersion", "defectVersion", "job", "historySearch", "knowledgeSearch"])
                        if (typeof route[key] === "string")
                            view[key] = route[key];
                    if (typeof route.knowledgeStatus === "string" && (route.knowledgeStatus === "" || Object.hasOwn(knowledgeStatuses, route.knowledgeStatus)))
                        view.knowledgeStatus = route.knowledgeStatus;
                    view.inspection = restoreInspection(route.inspection, route.datasetId, view.selected);
                    if (Number.isInteger(route.page) && route.page > 0)
                        view.page = route.page;
                    if (Number.isInteger(route.historyPage) && route.historyPage > 0)
                        view.historyPage = route.historyPage;
                    if (route.filters) {
                        for (const key of ["search", "model_status", "review_status", "technical", "sort_by", "reference_status"])
                            if (typeof route.filters[key] === "string")
                                view.filters = { ...view.filters, [key]: route.filters[key] };
                        if (Array.isArray(route.filters.annotation_filters) && route.filters.annotation_filters.every((item) => typeof item === "string"))
                            view.filters.annotation_filters = route.filters.annotation_filters;
                    }
                    this.state = { ...this.state, active: true, pageId: route.pageId, datasetId: route.datasetId, views: { ...this.state.views, [`${route.pageId}:${route.datasetId}`]: view } };
                }
            }
        }
        catch {
            sessionStorage.removeItem("iad.workspace");
        }
        if (this.state.active)
            this.layout?.selectPanel(this.state.pageId);
        else if (fromHistory)
            this.layout?.selectPanel(null);
        this.listeners.forEach(listener => listener());
    }
}
export const WorkspaceContext = createContext(null);
export function useWorkspace() {
    const workspace = useContext(WorkspaceContext);
    if (!workspace)
        throw new Error("Workbench requires its workspace owner");
    const state = useSyncExternalStore(workspace.subscribe, workspace.getSnapshot);
    return { workspace, state };
}
