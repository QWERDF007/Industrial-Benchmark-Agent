import React from "react";

export function JobSync({
  syncState,
  lastSyncedAt,
  error,
  refresh,
  label = "探索状态同步",
}: {
  syncState: "syncing" | "current" | "stale";
  lastSyncedAt: number | null;
  error: string;
  refresh(): void;
  label?: string;
}) {
  return (
    <div
      className="iad-job-sync"
      data-state={syncState}
      aria-label={label}
    >
      <span role="status">
        {syncState === "stale"
          ? "同步失败，当前为上次快照"
          : syncState === "syncing"
            ? "正在同步状态"
            : "自动同步正常"}
      </span>
      <span className="iad-muted">
        最近成功响应：
        {lastSyncedAt
          ? new Date(lastSyncedAt).toLocaleTimeString()
          : "尚未同步"}
      </span>
      {error && <span>{error}</span>}
      <button onClick={refresh}>
        {syncState === "stale" ? "重试同步" : "刷新状态"}
      </button>
    </div>
  );
}
