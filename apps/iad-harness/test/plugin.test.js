import test from "node:test";
import assert from "node:assert/strict";
import { apply, ALLOWED_TOOL_SURFACE, SYSTEM_POLICIES } from "../lib/server/index.js";

test("Industrial Harness Plugin: policy injection and tool restriction", async (t) => {
  let sectionCalled = false;
  let sectionName = "";
  let sectionContent = "";

  let restrictCalled = false;
  let restrictedTools = [];

  const mockCtx = {
    systemPrompt: {
      section(sec) {
        sectionCalled = true;
        sectionName = sec.name;
        sectionContent = sec.text;
      },
    },
    tools: {
      restrict(options) {
        restrictCalled = true;
        restrictedTools = options.allow;
      },
    },
    logger: {
      info() {},
      warn() {},
      error() {},
    },
  };

  apply(mockCtx);

  assert.equal(sectionCalled, true, "systemPrompt.section must be called");
  assert.equal(sectionName, "industrial_benchmark_policies");
  assert.match(sectionContent, /INDUSTRIAL BENCHMARK SYSTEM POLICY RULES/);

  assert.equal(restrictCalled, true, "tools.restrict must be called");
  assert.equal(restrictedTools.length, 15, "Model-visible surface must be exactly 15 tools");
  assert.deepEqual(restrictedTools, ALLOWED_TOOL_SURFACE);
  assert.ok(restrictedTools.includes("mcp__iad__task_inspect"));
  assert.ok(restrictedTools.includes("mcp__iad__benchmark_build"));
  assert.ok(restrictedTools.includes("mcp__iad__baseline_run"));
  assert.ok(!restrictedTools.includes("mcp__iad__review_write"), "Review write must NEVER be in tool surface");
  assert.ok(!restrictedTools.includes("review_write"));
  assert.ok(!restrictedTools.includes("shell"));
});
