import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function JobSync({ syncState, lastSyncedAt, error, refresh, label = "探索状态同步", }) {
    return (_jsxs("div", { className: "iad-job-sync", "data-state": syncState, "aria-label": label, children: [_jsx("span", { role: "status", children: syncState === "stale"
                    ? "同步失败，当前为上次快照"
                    : syncState === "syncing"
                        ? "正在同步状态"
                        : "自动同步正常" }), _jsxs("span", { className: "iad-muted", children: ["\u6700\u8FD1\u6210\u529F\u54CD\u5E94\uFF1A", lastSyncedAt
                        ? new Date(lastSyncedAt).toLocaleTimeString()
                        : "尚未同步"] }), error && _jsx("span", { children: error }), _jsx("button", { onClick: refresh, children: syncState === "stale" ? "重试同步" : "刷新状态" })] }));
}
