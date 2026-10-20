import type { JobSnapshot } from "./contracts.js";

export const jobStatuses: Record<JobSnapshot["status"], string> = {
  PENDING: "等待执行", RUNNING: "执行中", COMPLETED: "已完成", PARTIAL: "部分成功",
  FAILED: "失败", CANCELLED: "已取消", INTERRUPTED: "已中断",
};
