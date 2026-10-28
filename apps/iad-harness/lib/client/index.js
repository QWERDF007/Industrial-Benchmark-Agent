import React from "react";
import { AuditIcon, ReviewIcon, DatasetIcon, ImagesIcon, KnowledgeIcon, ExplorationIcon, ModelSettingsIcon } from "./AuditIcon.js";
import { WorkbenchPage } from "./WorkbenchPage.js";
import { pages, Workspace, WorkspaceContext } from "./workspace.js";
import { WorkbenchSession } from "./workbench-session.js";
import { SessionResult } from "./components/SessionResult.js";
import { workbenchTools } from "../shared/tool-presentation.js";
import { ModelSettingsPage } from './components/ModelSettingsPage.js';
import { WorkbenchModelProvider } from './models.js';
import { IndustrialSidebar } from './host/IndustrialSidebar.js';
import { ConsistencyPage } from './components/ConsistencyPage.js';
export const name = "iad-client";
export const inject = ["slots", "layout", "sessions", "conversation", "uiWorkspace"];
export function apply(ctx) {
    const workspace = new Workspace(new WorkbenchSession(ctx));
    const icons = { "industrial-datasets": DatasetIcon, "industrial-images": ImagesIcon, "industrial-exploration": ExplorationIcon, "industrial-knowledge": KnowledgeIcon, 'industrial-consistency': ImagesIcon, "industrial-audit": AuditIcon, "industrial-review": ReviewIcon, 'industrial-model-settings': ModelSettingsIcon };
    ctx.slots.inject('sidebar.content', () => ctx.slots.register({ name: 'sidebar.content' }, IndustrialSidebar));
    ctx.slots.inject("tool.call.toolview", () => {
        for (const [key, title] of Object.entries(workbenchTools))
            ctx.slots.register({ name: "tool.call.toolview", key }, (props) => React.createElement(WorkspaceContext.Provider, { value: workspace }, React.createElement(SessionResult, { ...props, title })));
    });
    ctx.slots.inject("sidebar.panellist", () => {
        const disposers = Object.entries(pages).map(([id, label], index) => ctx.slots.register({ name: "sidebar.panellist", id, order: index + 1, label }, icons[id]));
        return () => disposers.forEach(dispose => dispose());
    });
    ctx.slots.inject("main", () => {
        for (const id of Object.keys(pages)) {
            ctx.slots.register({ name: "main", key: id }, () => React.createElement(WorkspaceContext.Provider, { value: workspace }, React.createElement(WorkbenchModelProvider, { children: React.createElement('div', { className: 'iad-workspace', onFocusCapture: (event) => {
                        if (event.target instanceof HTMLElement)
                            event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                    }, style: { height: '100%', minWidth: 0, containerType: 'inline-size', containerName: 'workbench' } }, id === 'industrial-model-settings' ? React.createElement(ModelSettingsPage)
                    : id === 'industrial-consistency' ? React.createElement(ConsistencyPage)
                        : React.createElement(WorkbenchPage, { pageId: id })) })));
        }
        return workspace.connect(ctx.layout);
    });
}
