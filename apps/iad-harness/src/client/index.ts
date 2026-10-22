import React from "react";
import { AuditIcon, ReviewIcon, DatasetIcon, ImagesIcon, KnowledgeIcon, ExplorationIcon, ModelSettingsIcon } from "./AuditIcon.js";
import { WorkbenchPage } from "./WorkbenchPage.js";
import { pages, Workspace, WorkspaceContext, type PageId } from "./workspace.js";
import { WorkbenchSession } from "./workbench-session.js";
import { SessionResult } from "./components/SessionResult.js";
import { workbenchTools } from "../shared/tool-presentation.js";
import type { ToolCallViewProps } from "@deepseek-ai/dsh-client-ui-tool/client";
import {ModelSettingsPage} from './components/ModelSettingsPage.js';
import {WorkbenchModelProvider} from './models.js';

export const name = "iad-client";
export const inject = ["slots", "layout", "sessions", "conversation", "uiWorkspace"];

export function apply(ctx: any) {
  const workspace = new Workspace(new WorkbenchSession(ctx));
  const icons: Record<PageId, React.ComponentType> = { "industrial-datasets": DatasetIcon, "industrial-images": ImagesIcon, "industrial-exploration": ExplorationIcon, "industrial-knowledge": KnowledgeIcon, "industrial-audit": AuditIcon, "industrial-review": ReviewIcon, 'industrial-model-settings': ModelSettingsIcon };
  ctx.slots.inject("tool.call.toolview", () => {
    for (const [key, title] of Object.entries(workbenchTools)) ctx.slots.register({ name: "tool.call.toolview", key }, (props: ToolCallViewProps) => React.createElement(WorkspaceContext.Provider, { value: workspace }, React.createElement(SessionResult, { ...props, title })));
  });
  ctx.slots.inject("sidebar.panellist", () => {
    const disposers = (Object.entries(pages) as [PageId, string][]).map(([id, label], index) =>
      ctx.slots.register({ name: "sidebar.panellist", id, order: index + 1, label }, icons[id]));
    return () => disposers.forEach(dispose => dispose());
  });
  ctx.slots.inject("main", () => {
    for (const id of Object.keys(pages) as PageId[]) {
      ctx.slots.register({ name: "main", key: id },
        () =>
          React.createElement(WorkspaceContext.Provider, {value: workspace}, React.createElement(WorkbenchModelProvider, {children:
            id === 'industrial-model-settings' ? React.createElement(ModelSettingsPage)
              : React.createElement(WorkbenchPage, {pageId: id})})));
    }
    return workspace.connect(ctx.layout);
  });
}
