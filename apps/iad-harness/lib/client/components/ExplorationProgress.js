import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
const stages = ["准备图像", "容量检查", "模型联合分析", "校验并发布方向"];
export function ExplorationProgress({ job, stale = false, lastSyncedAt, }) {
    const [now, setNow] = useState(Date.now());
    const active = job.status === "RUNNING";
    useEffect(() => {
        if (!active || stale)
            return;
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [active, stale]);
    const stage = job.phase === "CHECKING_CAPACITY"
        ? 1
        : job.phase === "EXPLORING_DIRECTIONS"
            ? 2
            : ["PUBLISHING_DIRECTIONS", "DIRECTIONS_PUBLISHED"].includes(job.phase || "")
                ? 3
                : 0;
    const call = [...job.model_calls].reverse().find((item) => !item.finished_at);
    const start = call?.started_at || job.phase_started_at || job.started_at;
    const clock = stale
        ? lastSyncedAt
        : active
            ? now
            : job.finished_at
                ? Date.parse(job.finished_at)
                : now;
    const elapsed = start && clock
        ? Math.max(0, Math.floor((Number(clock) - Date.parse(start)) / 1000))
        : null;
    return (_jsxs("div", { className: "iad-exploration-progress", children: [_jsxs("p", { children: ["\u8F93\u5165 ", job.total_samples, " \u5F20 \u00B7 \u826F\u54C1", " ", job.exploration_request?.normal_images.length ?? "未记录", " \u00B7 \u5F02\u5E38", " ", job.exploration_request?.defect_images.length ?? "未记录"] }), job.status === "PENDING" ? (_jsxs("p", { children: ["\u6392\u961F\u7B2C ", job.queue_position, " \u9879 \u00B7 \u7B49\u5F85\u524D\u4E00\u4EFB\u52A1\u7ED3\u675F"] })) : (_jsx("ol", { className: "iad-execution-stages", children: stages.map((label, index) => (_jsxs("li", { "data-state": job.status === "COMPLETED" || index < stage
                        ? "done"
                        : index === stage
                            ? "current"
                            : "waiting", children: [_jsx("span", { "aria-hidden": "true", children: index + 1 }), _jsxs("div", { children: [_jsx("strong", { children: label }), index === stage && (_jsx("small", { children: stage === 0
                                        ? `已准备 ${job.prepared_sources} / ${job.total_samples} 张`
                                        : stage === 2
                                            ? call?.operation === "generate"
                                                ? "生成请求尚未记录完整返回"
                                                : "等待生成请求记录"
                                            : stage === 1
                                                ? "校验整组输入容量"
                                                : job.status === "COMPLETED"
                                                    ? "方向已发布"
                                                    : "核验引用与冻结输入" }))] })] }, label))) })), active && (_jsxs(_Fragment, { children: [_jsx("div", { className: `iad-indeterminate ${stale ? "is-stale" : ""}`, role: "progressbar", "aria-label": "\u7B49\u5F85\u8054\u5408\u63A2\u7D22\u7ED3\u679C", children: _jsx("span", {}) }), elapsed !== null && (_jsxs("p", { className: "iad-muted", children: ["\u5F53\u524D", call ? "请求" : "阶段", "\u5DF2\u7528 ", Math.floor(elapsed / 60), " \u5206", " ", elapsed % 60, " \u79D2", stale ? " · 上次同步时" : ""] }))] }))] }));
}
