import type { KnowledgeCheck } from "./contracts.js";

export type KnowledgeStatusFilter = KnowledgeCheck["status"] | "";
export const knowledgeStatuses: Record<KnowledgeCheck["status"], string> = {
  supported: "有证据支持", provisional: "待验证", conflicted: "存在矛盾",
};
