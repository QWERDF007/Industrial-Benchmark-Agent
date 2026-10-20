/**
 * DSH Browser Client Plugin for Industrial Benchmark Agent (DS-S00, DS-S01, DS-S02, DSH-01, DSH-02).
 * Registers `sidebar.panellist` and `main` keyed slot ("industrial-audit") into DSH Web Shell.
 */

import { AuditIcon } from "./AuditIcon.js";
import { AuditPage } from "./AuditPage.js";

export const name = "iad-client";
export const inject = ["slots"];

export function apply(ctx: any) {
  // 1. Register left sidebar icon and panel entry
  if (ctx.slots && typeof ctx.slots.inject === "function") {
    ctx.slots.inject("sidebar.panellist", () => {
      return ctx.slots.register(
        {
          name: "sidebar.panellist",
          id: "industrial-audit",
          order: 0,
          label: "工业数据集审计",
        },
        AuditIcon
      );
    });

    // 2. Register main view slot for 'industrial-audit'
    ctx.slots.inject("main", () => {
      return ctx.slots.register(
        {
          name: "main",
          key: "industrial-audit",
        },
        AuditPage
      );
    });
  }
}
