import React from "react";
import { AuditIcon, ReviewIcon, DatasetIcon, ImagesIcon, KnowledgeIcon } from "./AuditIcon.js";
import { WorkbenchPage } from "./WorkbenchPage.js";
import { pages, Workspace, WorkspaceContext, type PageId } from "./workspace.js";
import { InspectionSession } from "./inspection-session.js";
import { SessionResult } from "./components/SessionResult.js";
import { workbenchTools } from "../shared/tool-presentation.js";
import type { ToolCallViewProps } from "@deepseek-ai/dsh-client-ui-tool/client";
import { SidebarProgress } from "./sidebar-progress.js";

export const name = "iad-client";
export const inject = ["slots", "layout", "sessions", "conversation", "uiWorkspace"];

export function apply(ctx: any) {
  const workspace = new Workspace(new InspectionSession(ctx));
  const icons = [DatasetIcon, ImagesIcon, KnowledgeIcon, KnowledgeIcon, AuditIcon, ReviewIcon];
  ctx.slots.inject("tool.call.toolview", () => {
    for (const [key, title] of Object.entries(workbenchTools)) ctx.slots.register({ name: "tool.call.toolview", key }, (props: ToolCallViewProps) => React.createElement(WorkspaceContext.Provider, { value: workspace }, React.createElement(SessionResult, { ...props, title })));
  });
  ctx.slots.inject("sidebar.panellist", () => {
    const entries = new Map<PageId, { label: string; dispose: () => void }>();
    const disconnect = new SidebarProgress(workspace).connect((id, label) => {
      if (entries.get(id)?.label === label) return;
      entries.get(id)?.dispose();
      const index = Object.keys(pages).indexOf(id);
      entries.set(id, { label, dispose: ctx.slots.register({ name: "sidebar.panellist", id, order: index + 1, label }, icons[index]) });
    });
    return () => { disconnect(); entries.forEach(entry => entry.dispose()); };
  });
  ctx.slots.inject("main", () => {
    for (const id of Object.keys(pages) as PageId[]) {
      ctx.slots.register({ name: "main", key: id }, () => React.createElement(WorkspaceContext.Provider, { value: workspace }, React.createElement(WorkbenchPage, { pageId: id })));
    }
    return workspace.connect(ctx.layout);
  });
}
