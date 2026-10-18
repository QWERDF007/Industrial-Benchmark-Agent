import test from "node:test";
import assert from "node:assert/strict";
import { apply, ALLOWED_TOOL_SURFACE, SYSTEM_POLICIES } from "../lib/server/index.js";

test("Industrial Harness Plugin: policy injection and tool restriction", async (t) => {
  let sectionCalled = false;
  let sectionName = "";
  let sectionContent = "";

  let restrictCalled = false;
  let restrictedTools = [];

  const registeredTools = [];

  const mockCtx = {
    systemPrompt: {
      section(sec) {
        sectionCalled = true;
        sectionName = sec.name;
        sectionContent = sec.text;
      },
    },
    tools: {
      register(toolDef) {
        registeredTools.push(toolDef.name);
      },
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
  assert.equal(restrictedTools.length, 22, "Model-visible surface must be exactly 22 native tools");
  assert.deepEqual(restrictedTools, ALLOWED_TOOL_SURFACE);

  // Assert native tool names
  assert.ok(restrictedTools.includes("task_inspect"));
  assert.ok(restrictedTools.includes("dataset_audit"));
  assert.ok(restrictedTools.includes("audit_issue_query"));
  assert.ok(restrictedTools.includes("audit_recheck"));
  assert.ok(restrictedTools.includes("audit_suggestion_save"));
  assert.ok(restrictedTools.includes("sample_view"));
  assert.ok(restrictedTools.includes("region_view"));
  assert.ok(restrictedTools.includes("samples_compare"));
  assert.ok(restrictedTools.includes("feature_prepare"));
  assert.ok(restrictedTools.includes("visual_search"));
  assert.ok(restrictedTools.includes("duplicate_audit"));
  assert.ok(restrictedTools.includes("candidate_mine"));
  assert.ok(restrictedTools.includes("candidate_merge"));
  assert.ok(restrictedTools.includes("evidence_get"));
  assert.ok(restrictedTools.includes("review_status"));
  assert.ok(restrictedTools.includes("benchmark_preview"));
  assert.ok(restrictedTools.includes("benchmark_build"));
  assert.ok(restrictedTools.includes("benchmark_status"));
  assert.ok(restrictedTools.includes("leakage_check"));
  assert.ok(restrictedTools.includes("evaluation_plan"));
  assert.ok(restrictedTools.includes("baseline_run"));
  assert.ok(restrictedTools.includes("evaluation_compare"));

  // Assert all 22 were registered
  assert.equal(registeredTools.length, 22, "All 22 tools must be registered via ctx.tools.register");
  assert.deepEqual(registeredTools.sort(), restrictedTools.slice().sort());

  // Invariant assertions: NO review write tools, NO mcp prefix, NO shell
  assert.ok(!restrictedTools.includes("review_write"), "Review write must NEVER be in tool surface");
  assert.ok(!restrictedTools.includes("review_submit"), "Review submit must NEVER be in tool surface");
  assert.ok(!restrictedTools.includes("mcp__iad__task_inspect"), "No MCP prefix in native surface");
  assert.ok(!restrictedTools.includes("shell"), "No shell in tool surface");
});
