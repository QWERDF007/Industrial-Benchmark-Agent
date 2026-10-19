import test from "node:test";
import assert from "node:assert/strict";
import { createAuditTools } from "../lib/server/audit/index.js";
import { createVisionTools } from "../lib/server/vision/index.js";
import { createBenchmarkTools } from "../lib/server/benchmark/index.js";
import { createEvaluationTools } from "../lib/server/evaluation/index.js";

test("Audit Tools: sample_view with attachments returns ImageBlock", async () => {
  const savedImages = [];
  const mockAttachments = {
    async saveImage(input) {
      savedImages.push(input);
      return {
        attachmentId: "att_123",
        mediaType: input.mediaType,
        bytes: input.data.byteLength,
        width: 100,
        height: 100,
        name: input.name,
      };
    },
  };

  const mockCoreClient = {
    async call(toolName, args, signal) {
      if (toolName === "sample_view") {
        return {
          status: "OK",
          summary: `Sample view for ${args.sample_id}`,
          metrics: {
            image_endpoint: `/internal/sample/${args.sample_id}/image?view=${args.view || "raw"}`,
          },
        };
      }
      throw new Error(`Unexpected tool: ${toolName}`);
    },
    async fetchImage(params, signal) {
      return {
        data: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
        mediaType: "image/png",
      };
    },
    async fetchImageBytes(params, signal) {
      return new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    },
  };

  const mockCtx = {
    attachments: mockAttachments,
    iadCoreClient: mockCoreClient,
    tools: { register() {} },
  };

  const tools = createAuditTools(mockCtx);
  const sampleViewTool = tools.find((t) => t.name === "sample_view");
  assert.ok(sampleViewTool);

  const result = await sampleViewTool.execute(
    { task_id: "task_01", sample_id: "s_01", view: "raw" },
    {
      signal: new AbortController().signal,
      session: {
        model: {
          inputModalities: ["text", "image"],
        },
      },
    }
  );

  assert.equal(result.status, "OK");
  assert.ok(result._attachment);
  assert.equal(savedImages.length, 1);
  assert.equal(savedImages[0].name, "s_01_raw.png");

  // Verify render outputs ImageBlock
  const rendered = sampleViewTool.output.render(
    { task_id: "task_01", sample_id: "s_01" },
    result
  );
  assert.equal(rendered.length, 3);
  assert.equal(rendered[0].type, "text");
  assert.equal(rendered[1].type, "text");
  assert.match(rendered[1].text, /Image Observation/);
  assert.equal(rendered[2].type, "image");
  assert.equal(rendered[2].attachment.attachmentId, "att_123");
});

test("Audit Tools: sample_view without attachments returns NOT_READY (F-02, V2-08)", async () => {
  const mockCoreClient = {
    async call(toolName, args) {
      return {
        status: "OK",
        summary: `Sample view for ${args.sample_id}`,
        metrics: {
          image_endpoint: `/internal/sample/${args.sample_id}/image?view=raw`,
        },
      };
    },
  };

  // No ctx.attachments
  const mockCtx = {
    iadCoreClient: mockCoreClient,
    tools: { register() {} },
  };

  const tools = createAuditTools(mockCtx);
  const sampleViewTool = tools.find((t) => t.name === "sample_view");

  const result = await sampleViewTool.execute(
    { task_id: "task_01", sample_id: "s_02" },
    { signal: new AbortController().signal }
  );

  assert.equal(result.status, "NOT_READY");
  assert.equal(result._attachment, undefined);
  assert.ok(result.warnings.some((w) => w.includes("拒绝生成视觉观察")));

  const rendered = sampleViewTool.output.render(
    { task_id: "task_01", sample_id: "s_02" },
    result
  );
  assert.equal(rendered.length, 1);
  assert.equal(rendered[0].type, "text");
  assert.match(rendered[0].text, /拒绝生成视觉观察/);
});

test("Audit Tools: sample_view with text-only model returns NOT_READY (F-02, V2-08)", async () => {
  const mockAttachments = { async saveImage() {} };
  const mockCoreClient = { async call() {}, async fetchImage() {} };
  const mockCtx = {
    attachments: mockAttachments,
    iadCoreClient: mockCoreClient,
    tools: { register() {} },
  };
  const tools = createAuditTools(mockCtx);
  const sampleViewTool = tools.find((t) => t.name === "sample_view");

  const result = await sampleViewTool.execute(
    { task_id: "task_01", sample_id: "s_03" },
    {
      signal: new AbortController().signal,
      session: {
        model: {
          inputModalities: ["text"],
        },
      },
    }
  );
  assert.equal(result.status, "NOT_READY");
  assert.ok(result.warnings.some((w) => w.includes("拒绝生成视觉观察")));
});

test("Audit Tools: sample_view with unknown route returns NOT_READY (NXM-04)", async () => {
  const mockAttachments = { async saveImage() {} };
  const mockCoreClient = { async call() {}, async fetchImage() {} };
  const mockCtx = {
    attachments: mockAttachments,
    iadCoreClient: mockCoreClient,
    tools: { register() {} },
  };
  const tools = createAuditTools(mockCtx);
  const sampleViewTool = tools.find((t) => t.name === "sample_view");

  // No session, no provider/model
  const result = await sampleViewTool.execute(
    { task_id: "task_01", sample_id: "s_unknown_route" },
    { signal: new AbortController().signal }
  );
  assert.equal(result.status, "NOT_READY");
  assert.match(result.summary, /Unknown model route/);
});

test("Audit Tools: sample_view with resolveModelInfo throwing returns NOT_READY (NXM-04)", async () => {
  const mockAttachments = { async saveImage() {} };
  const mockCoreClient = { async call() {}, async fetchImage() {} };
  const mockLlm = {
    async resolveModelInfo() {
      throw new Error("Provider connection timed out");
    },
  };
  const mockCtx = {
    attachments: mockAttachments,
    iadCoreClient: mockCoreClient,
    llm: mockLlm,
    tools: { register() {} },
  };
  const tools = createAuditTools(mockCtx);
  const sampleViewTool = tools.find((t) => t.name === "sample_view");

  const result = await sampleViewTool.execute(
    { task_id: "task_01", sample_id: "s_throw" },
    {
      signal: new AbortController().signal,
      agent: { options: { provider: "deepseek", model: "deepseek-chat" } },
    }
  );
  assert.equal(result.status, "NOT_READY");
  assert.match(result.summary, /Failed to resolve model image capability/);
});

test("Audit Tools: sample_view with aborted signal returns NOT_READY (NXM-04)", async () => {
  const mockAttachments = { async saveImage() {} };
  const mockCoreClient = { async call() {}, async fetchImage() {} };
  const mockCtx = {
    attachments: mockAttachments,
    iadCoreClient: mockCoreClient,
    tools: { register() {} },
  };
  const tools = createAuditTools(mockCtx);
  const sampleViewTool = tools.find((t) => t.name === "sample_view");

  const ac = new AbortController();
  ac.abort();

  const result = await sampleViewTool.execute(
    { task_id: "task_01", sample_id: "s_aborted" },
    {
      signal: ac.signal,
      session: { model: { inputModalities: ["text", "image"] } },
    }
  );
  assert.equal(result.status, "NOT_READY");
  assert.match(result.summary, /cancelled/);
});

test("CoreClient: detectImageMediaType rejects unsupported and invalid bytes (NXM-05)", async () => {
  const { detectImageMediaType } = await import("../lib/server/core-client/index.js");
  
  // Valid PNG
  const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(detectImageMediaType(pngBytes), "image/png");

  // Valid JPEG
  const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  assert.equal(detectImageMediaType(jpegBytes), "image/jpeg");

  // Plain text / corrupted bytes
  const textBytes = new TextEncoder().encode("Hello world this is not an image");
  assert.throws(() => detectImageMediaType(textBytes), /Unsupported or unrecognized image format/);

  // Empty bytes
  assert.throws(() => detectImageMediaType(new Uint8Array([])), /Unsupported or unrecognized image format/);
});

test("Vision Tools: candidate_merge executes and formats correctly", async () => {
  const mockCoreClient = {
    async call(toolName, args) {
      assert.equal(toolName, "candidate_merge");
      return {
        status: "OK",
        summary: "Merged 5 candidates across 3 sources",
        metrics: {
          total_merged: 5,
          source_breakdown: { DINO: 2, LLM: 2, AUDIT: 1 },
        },
        mutation: "DERIVED_ARTIFACT",
      };
    },
  };

  const mockCtx = {
    iadCoreClient: mockCoreClient,
    tools: { register() {} },
  };

  const tools = createVisionTools(mockCtx);
  const mergeTool = tools.find((t) => t.name === "candidate_merge");
  assert.ok(mergeTool);

  const result = await mergeTool.execute(
    { task_id: "task_01" },
    { signal: new AbortController().signal }
  );
  assert.equal(result.status, "OK");
  assert.equal(result.metrics.total_merged, 5);

  const rendered = mergeTool.output.render({ task_id: "task_01" }, result);
  assert.equal(rendered.length, 1);
  assert.match(rendered[0].text, /Merged 5 candidates/);
  assert.match(rendered[0].text, /total_merged/);
});

test("Benchmark Tools: verify tool names and fail-fast", async () => {
  assert.throws(() => createBenchmarkTools({ tools: { register() {} } }), /iadCoreClient/);
  const mockCtx = { iadCoreClient: { async call() {} }, tools: { register() {} } };
  const tools = createBenchmarkTools(mockCtx);
  const names = tools.map((t) => t.name);
  assert.deepEqual(names.sort(), [
    "benchmark_build",
    "benchmark_preview",
    "benchmark_status",
    "leakage_check",
    "review_status",
  ].sort());
});

test("Evaluation Tools: verify tool names and fail-fast", async () => {
  assert.throws(() => createEvaluationTools({ tools: { register() {} } }), /iadCoreClient/);
  const mockCtx = { iadCoreClient: { async call() {} }, tools: { register() {} } };
  const tools = createEvaluationTools(mockCtx);
  const names = tools.map((t) => t.name);
  assert.deepEqual(names.sort(), [
    "baseline_run",
    "evaluation_compare",
    "evaluation_plan",
  ].sort());
});
