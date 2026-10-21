import React from "react";
import type { ToolCallViewProps } from "@deepseek-ai/dsh-client-ui-tool/client";
import type { ToolPresentation } from "../../shared/tool-presentation.js";
import { jobStatuses } from "../../shared/job-display.js";
import { useWorkspace } from "../workspace.js";
import { themeStyles } from "../theme.js";
import { controlStyles } from "../controls.js";

export function SessionResult(props: ToolCallViewProps & { title: string }) {
  const { workspace } = useWorkspace();
  const meta = props.phase === "result" ? props.block.meta as ToolPresentation | null | undefined : null;
  const result = meta?.type === "industrial-workbench" ? meta : null;
  return <section className="iad-tool-card" aria-label={props.title} data-iad-tool={props.toolName}>
    <style>{themeStyles}{controlStyles}{`
      .iad-tool-card{background:var(--iad-surface);color:var(--iad-text);border-radius:var(--iad-radius);padding:12px;margin:8px 0;overflow-wrap:anywhere}
      .iad-tool-card p{margin:4px 0}.iad-tool-card nav{display:flex;flex-wrap:wrap;gap:8px}

    `}</style>
    <strong>{props.title}</strong>
    {props.phase !== "result" ? <p role="status">{props.phase === "preparing" ? "准备调用…" : "工具执行中…"}</p> : props.block.isError ? <p role="alert">调用失败，请查看调用详情。</p> : result?.job && <p>调用时状态：{jobStatuses[result.job.status]} · 完成 {result.job.completed} · 失败 {result.job.failed} · 共 {result.job.total_samples} 张</p>}
    <nav aria-label="查看工具结果">{result?.links.map((link, index) => <button key={index} data-iad-page={link.location.pageId} data-iad-run-id={link.location.job} data-iad-version-id={link.location.version} onClick={() => workspace.openLocation(link.location)}>{link.label}</button>)}
      {props.inspect && <button onClick={props.inspect}>调用详情</button>}
    </nav>
  </section>;
}
