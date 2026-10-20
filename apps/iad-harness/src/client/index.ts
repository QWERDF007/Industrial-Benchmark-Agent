import React from "react";
import { AuditIcon, ReviewIcon, DatasetIcon, ImagesIcon, KnowledgeIcon } from "./AuditIcon.js";
import { WorkbenchPage } from "./WorkbenchPage.js";
import { pages, Workspace, WorkspaceContext, type PageId } from "./workspace.js";
import { InspectionSession } from "./inspection-session.js";

export const name = "iad-client";
export const inject = ["slots", "layout", "sessions", "conversation", "uiWorkspace"];

export function apply(ctx: any) {
  const workspace = new Workspace(new InspectionSession(ctx));
  const icons = [DatasetIcon, ImagesIcon, KnowledgeIcon, KnowledgeIcon, AuditIcon, ReviewIcon];
  ctx.slots.inject("sidebar.panellist", () => {
    Object.entries(pages).forEach(([id, label], index) => ctx.slots.register({ name: "sidebar.panellist", id, order: index + 1, label }, icons[index]));
  });
  ctx.slots.inject("main", () => {
    for (const id of Object.keys(pages) as PageId[]) {
      ctx.slots.register({ name: "main", key: id }, () => React.createElement(WorkspaceContext.Provider, { value: workspace }, React.createElement(WorkbenchPage, { pageId: id })));
    }
    return workspace.connect(ctx.layout);
  });
}
