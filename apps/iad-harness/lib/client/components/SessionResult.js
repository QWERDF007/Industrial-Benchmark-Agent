import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { jobStatuses } from "../../shared/job-display.js";
import { useWorkspace } from "../workspace.js";
import { themeStyles } from "../theme.js";
import { controlStyles } from "../controls.js";
export function SessionResult(props) {
    const { workspace } = useWorkspace();
    const meta = props.phase === "result" ? props.block.meta : null;
    const result = meta?.type === "industrial-workbench" ? meta : null;
    return _jsxs("section", { className: "iad-tool-card", "aria-label": props.title, "data-iad-tool": props.toolName, children: [_jsxs("style", { children: [themeStyles, controlStyles, `
      .iad-tool-card{background:var(--iad-surface);color:var(--iad-text);border-radius:var(--iad-radius);padding:12px;margin:8px 0;overflow-wrap:anywhere}
      .iad-tool-card p{margin:4px 0}.iad-tool-card nav{display:flex;flex-wrap:wrap;gap:8px}

    `] }), _jsx("strong", { children: props.title }), props.phase !== "result" ? _jsx("p", { role: "status", children: props.phase === "preparing" ? "准备调用…" : "工具执行中…" }) : props.block.isError ? _jsx("p", { role: "alert", children: "\u8C03\u7528\u5931\u8D25\uFF0C\u8BF7\u67E5\u770B\u8C03\u7528\u8BE6\u60C5\u3002" }) : result?.job && _jsxs("p", { children: ["\u8C03\u7528\u65F6\u72B6\u6001\uFF1A", jobStatuses[result.job.status], " \u00B7 \u5B8C\u6210 ", result.job.completed, " \u00B7 \u5931\u8D25 ", result.job.failed, " \u00B7 \u5171 ", result.job.total_samples, " \u5F20"] }), _jsxs("nav", { "aria-label": "\u67E5\u770B\u5DE5\u5177\u7ED3\u679C", children: [result?.links.map((link, index) => _jsx("button", { "data-iad-page": link.location.pageId, "data-iad-scope-id": link.location.scopeRunId, "data-iad-run-id": link.location.job, "data-iad-version-id": link.location.version, onClick: () => workspace.openLocation(link.location), children: link.label }, index)), props.inspect && _jsx("button", { onClick: props.inspect, children: "\u8C03\u7528\u8BE6\u60C5" })] })] });
}
