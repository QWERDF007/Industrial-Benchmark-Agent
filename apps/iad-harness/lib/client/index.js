import React from "react";
import { AuditIcon, ReviewIcon, DatasetIcon, ImagesIcon, KnowledgeIcon } from "./AuditIcon.js";
import { WorkbenchPage } from "./WorkbenchPage.js";
import { pages, Workspace, WorkspaceContext } from "./workspace.js";
export const name = "iad-client";
export const inject = ["slots", "layout"];
export function apply(ctx) {
    const workspace = new Workspace();
    const icons = [DatasetIcon, ImagesIcon, KnowledgeIcon, KnowledgeIcon, AuditIcon, ReviewIcon];
    ctx.slots.inject("sidebar.panellist", () => {
        Object.entries(pages).forEach(([id, label], index) => ctx.slots.register({ name: "sidebar.panellist", id, order: index + 1, label }, icons[index]));
    });
    ctx.slots.inject("main", () => {
        for (const id of Object.keys(pages)) {
            ctx.slots.register({ name: "main", key: id }, () => React.createElement(WorkspaceContext.Provider, { value: workspace }, React.createElement(WorkbenchPage, { pageId: id })));
        }
        return workspace.connect(ctx.layout);
    });
}
