import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Polyfill Promise.withResolvers for Node.js < 22 (NXM-08 compatibility)
if (!Promise.withResolvers) {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

import { Context } from "@deepseek-ai/cordis";
import { ToolRuntime, defineTool } from "@deepseek-ai/dsh-tools";
import * as mcpClientPlugin from "@deepseek-ai/dsh-mcp-client";
import * as iadPolicy from "../lib/server/policy/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixtureServerPath = path.join(__dirname, "fixtures", "mcp_test_server.js");

function createDshContext() {
  const ctx = new Context();
  ctx.systemPrompt = { tools() {}, section() {}, getSectionOrder() { return 100; } };
  new ToolRuntime(ctx);
  return ctx;
}

function mockTool(name, description, execute) {
  return defineTool({
    name,
    description: description || name,
    parameters: {},
    output: {
      schema: { type: "json" },
      render(args, val) {
        return [{ type: "text", text: JSON.stringify(val) }];
      },
    },
    async execute(args) {
      return execute ? await execute(args) : { status: "OK" };
    },
  });
}

test("NXM-08 / NXM-09: DSH 0.2.0-rc.2 + dsh-mcp-client tool discovery via stdio transport", async (t) => {
  const ctx = createDshContext();

  // Apply mcpClientPlugin with stdio transport connecting to local test fixture
  const fork = await ctx.plugin(mcpClientPlugin, {
    transport: "stdio",
    serverName: "plant_docs",
    command: "node",
    args: [fixtureServerPath],
    failOnStartupError: true,
    toolCallTimeoutMs: 5000,
  });

  // Verify discovered tools registered under mcp__<serverName>__<tool>
  const searchTool = ctx.tools.get("mcp__plant_docs__search");
  assert.ok(searchTool, "Tool mcp__plant_docs__search should be registered");

  const readTool = ctx.tools.get("mcp__plant_docs__read");
  assert.ok(readTool, "Tool mcp__plant_docs__read should be registered");

  const reviewWriteTool = ctx.tools.get("mcp__plant_docs__review_write");
  assert.ok(reviewWriteTool, "Tool mcp__plant_docs__review_write should be registered");

  // Call search tool through ToolRuntime
  const execResult = await ctx.tools.execute({
    name: "mcp__plant_docs__search",
    arguments: { query: "corner glue line" },
    callId: "call_mcp_test_1",
    signal: new AbortController().signal,
  });

  assert.equal(execResult.isError, false);
  assert.ok(execResult.content);
  assert.match(execResult.content[0].text, /corner glue line width tolerance is 1.5mm/);

  // Clean shutdown
  await fork.dispose();
});

test("NXM-10 / NXM-11: iad-policy restricts unauthorized MCP tools and guards authority mutations", async (t) => {
  const ctx = createDshContext();

  // Register an authorized MCP tool, an unauthorized MCP tool, and an authority violation MCP tool
  ctx.tools.register(
    mockTool("mcp__plant_docs__search", "Authorized search tool", async () => ({
      status: "OK",
      text: "Found spec",
    }))
  );

  ctx.tools.register(
    mockTool("mcp__plant_docs__delete_database", "Unauthorized tool", async () => ({
      status: "OK",
    }))
  );

  ctx.tools.register(
    mockTool("mcp__plant_docs__review_write", "Illegal authority mutation tool", async () => ({
      status: "OK",
    }))
  );

  // Native tool
  ctx.tools.register(
    mockTool("dataset_audit", "Native tool", async () => ({
      status: "OK",
      audit: "clean",
    }))
  );

  // Apply iad-policy with explicit authorization for mcp__plant_docs__search
  iadPolicy.apply(ctx, {
    authorizedMcpTools: ["mcp__plant_docs__search"],
  });

  // 1. Native dataset_audit is authorized and executes
  const resNative = await ctx.tools.execute({
    name: "dataset_audit",
    arguments: {},
    callId: "call_native_1",
    signal: new AbortController().signal,
  });
  assert.equal(resNative.isError, false);

  // 2. Explicitly authorized MCP tool executes
  const resMcpAuth = await ctx.tools.execute({
    name: "mcp__plant_docs__search",
    arguments: {},
    callId: "call_mcp_auth_1",
    signal: new AbortController().signal,
  });
  assert.equal(resMcpAuth.isError, false);

  // 3. Unauthorized MCP tool is DENIED by execution guard
  const resMcpUnauth = await ctx.tools.execute({
    name: "mcp__plant_docs__delete_database",
    arguments: {},
    callId: "call_mcp_unauth_1",
    signal: new AbortController().signal,
  });
  assert.equal(resMcpUnauth.isError, true);
  assert.match(resMcpUnauth.content[0].text, /not in the authorized tool surface/);

  // 4. Illegal review_write tool is DENIED by authority invariant guard
  const resMcpIllegal = await ctx.tools.execute({
    name: "mcp__plant_docs__review_write",
    arguments: {},
    callId: "call_mcp_illegal_1",
    signal: new AbortController().signal,
  });
  assert.equal(resMcpIllegal.isError, true);
  assert.match(resMcpIllegal.content[0].text, /attempts unauthorized mutation of authoritative domain quality/);
});

test("NXM-13: Native tools remain functional when external MCP is unconfigured or offline", async (t) => {
  const ctx = createDshContext();

  // Apply policy without any MCP tools
  iadPolicy.apply(ctx, {});

  // Register native benchmark tool
  ctx.tools.register(
    mockTool("benchmark_status", "Native benchmark status tool", async () => ({
      status: "OK",
      readiness: "PARTIAL",
    }))
  );

  const res = await ctx.tools.execute({
    name: "benchmark_status",
    arguments: {},
    callId: "call_native_benchmark_1",
    signal: new AbortController().signal,
  });
  assert.equal(res.isError, false);
});
