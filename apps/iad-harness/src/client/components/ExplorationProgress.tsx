import React, { useEffect, useState } from "react";
import type { JobSnapshot } from "../../shared/contracts.js";

const stages = ["准备图像", "容量检查", "模型联合分析", "校验并发布方向"];

export function ExplorationProgress({
  job,
  stale = false,
  lastSyncedAt,
}: {
  job: JobSnapshot;
  stale?: boolean;
  lastSyncedAt?: number | null;
}) {
  const [now, setNow] = useState(Date.now());
  const active = job.status === "RUNNING";
  useEffect(() => {
    if (!active || stale) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active, stale]);
  const stage =
    job.phase === "CHECKING_CAPACITY"
      ? 1
      : job.phase === "EXPLORING_DIRECTIONS"
        ? 2
        : ["PUBLISHING_DIRECTIONS", "DIRECTIONS_PUBLISHED"].includes(
              job.phase || "",
            )
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
  const elapsed =
    start && clock
      ? Math.max(0, Math.floor((Number(clock) - Date.parse(start)) / 1000))
      : null;
  return (
    <div className="iad-exploration-progress">
      <p>
        输入 {job.total_samples} 张 · 良品{" "}
        {job.exploration_request?.normal_images.length ?? "未记录"} · 异常{" "}
        {job.exploration_request?.defect_images.length ?? "未记录"}
      </p>
      {job.status === "PENDING" ? (
        <p>排队第 {job.queue_position} 项 · 等待前一任务结束</p>
      ) : (
        <ol className="iad-execution-stages">
          {stages.map((label, index) => (
            <li
              key={label}
              data-state={
                job.status === "COMPLETED" || index < stage
                  ? "done"
                  : index === stage
                    ? "current"
                    : "waiting"
              }
            >
              <span aria-hidden="true">{index + 1}</span>
              <div>
                <strong>{label}</strong>
                {index === stage && (
                  <small>
                    {stage === 0
                      ? `已准备 ${job.prepared_sources} / ${job.total_samples} 张`
                      : stage === 2
                        ? call?.operation === "generate"
                          ? "生成请求尚未记录完整返回"
                          : "等待生成请求记录"
                        : stage === 1
                          ? "校验整组输入容量"
                          : job.status === "COMPLETED"
                            ? "方向已发布"
                            : "核验引用与冻结输入"}
                  </small>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      {active && (
        <>
          <div
            className={`iad-indeterminate ${stale ? "is-stale" : ""}`}
            role="progressbar"
            aria-label="等待联合探索结果"
          >
            <span />
          </div>
          {elapsed !== null && (
            <p className="iad-muted">
              当前{call ? "请求" : "阶段"}已用 {Math.floor(elapsed / 60)} 分{" "}
              {elapsed % 60} 秒{stale ? " · 上次同步时" : ""}
            </p>
          )}
        </>
      )}
    </div>
  );
}
