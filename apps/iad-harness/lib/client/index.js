import React from "react";
import { AuditIcon, ReviewIcon, DatasetIcon, ImagesIcon, KnowledgeIcon } from "./AuditIcon.js";
import { WorkbenchPage } from "./WorkbenchPage.js";
import { pages, Workspace, WorkspaceContext } from "./workspace.js";
import { WorkbenchSession } from "./workbench-session.js";
import { SessionResult } from "./components/SessionResult.js";
import { workbenchTools } from "../shared/tool-presentation.js";
export const name = "iad-client";
export const inject = ["slots", "layout", "sessions", "conversation", "uiWorkspace"];
export function apply(ctx) {
    const workspace = new Workspace(new WorkbenchSession(ctx));
    const icons = [DatasetIcon, ImagesIcon, KnowledgeIcon, AuditIcon, ReviewIcon];
    ctx.slots.inject("tool.call.toolview", () => {
        for (const [key, title] of Object.entries(workbenchTools))
            ctx.slots.register({ name: "tool.call.toolview", key }, (props) => React.createElement(WorkspaceContext.Provider, { value: workspace }, React.createElement(SessionResult, { ...props, title })));
    });
    ctx.slots.inject("sidebar.panellist", () => {
        const disposers = Object.entries(pages).map(([id, label], index) => ctx.slots.register({ name: "sidebar.panellist", id, order: index + 1, label }, icons[index]));
        return () => disposers.forEach(dispose => dispose());
    });
    ctx.slots.inject("main", () => {
        for (const id of Object.keys(pages)) {
            ctx.slots.register({ name: "main", key: id }, () => React.createElement(WorkspaceContext.Provider, { value: workspace }, React.createElement(WorkbenchPage, { pageId: id })));
        }
        return workspace.connect(ctx.layout);
    });
}
