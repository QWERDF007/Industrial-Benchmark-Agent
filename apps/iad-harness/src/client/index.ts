import { AuditIcon, ReviewIcon } from "./AuditIcon.js";
import { ModelAuditPage, HumanReviewPage } from "./WorkbenchPage.js";

export const name = "iad-client";
export const inject = ["slots"];

export function apply(ctx: any) {
  for (const [id, label, order, icon, page] of [
    ["industrial-audit", "模型审计", 1, AuditIcon, ModelAuditPage],
    ["industrial-review", "人工复核", 2, ReviewIcon, HumanReviewPage],
  ] as const) {
    ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({ name: "sidebar.panellist", id, order, label }, icon));
    ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: id }, page));
  }
}
