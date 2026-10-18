/**
 * Industrial Benchmark Agent - Audit & Image Tools Plugin (S02, S04, S05, S06, S08, RP-05, RP-08~14, V2-S01, V2-S03, V2-S04).
 */
import { defineTool } from "@deepseek-ai/dsh-tools";
function getClient(ctx) {
    if (!ctx.iadCoreClient) {
        throw new Error("iadCoreClient is not initialized in Cordis context. Plugin initialization failed.");
    }
    return ctx.iadCoreClient;
}
function formatToolResultText(val) {
    const parts = [];
    if (val.status && val.status !== "OK") {
        parts.push(`[Status: ${val.status}]`);
    }
    parts.push(val.summary || "Tool execution completed.");
    if (val.metrics && Object.keys(val.metrics).length > 0) {
        parts.push("\nMetrics:\n" + JSON.stringify(val.metrics, null, 2));
    }
    if (Array.isArray(val.warnings) && val.warnings.length > 0) {
        parts.push("\nWarnings: " + val.warnings.join("; "));
    }
    if (Array.isArray(val.next_actions) && val.next_actions.length > 0) {
        parts.push("\nNext Actions: " + val.next_actions.join(", "));
    }
    return parts.join("\n");
}
async function checkImageCapability(ctx, exec) {
    if (!ctx.attachments || typeof ctx.attachments.saveImage !== "function") {
        return {
            capable: false,
            reason: "Attachment storage service is not available in current runtime context",
        };
    }
    const session = exec?.session ?? exec?.agent?.session;
    const sessionModalities = session?.model?.inputModalities ??
        session?.inputModalities ??
        exec?.agent?.options?.inputModalities;
    if (sessionModalities && Array.isArray(sessionModalities)) {
        if (!sessionModalities.includes("image")) {
            return {
                capable: false,
                reason: `Model or session declares inputModalities without 'image': [${sessionModalities.join(", ")}]`,
            };
        }
    }
    const routed = session?.requestHeader?.()?.config;
    const provider = routed?.provider ?? exec?.agent?.options?.provider;
    const model = routed?.model ?? exec?.agent?.options?.model;
    const llm = typeof ctx.get === "function" ? ctx.get("llm") : ctx.llm;
    if (provider && model && llm && typeof llm.resolveModelInfo === "function") {
        try {
            const active = await llm.resolveModelInfo(provider, model, exec?.signal);
            if (active &&
                active.inputModalities !== undefined &&
                !active.inputModalities.includes("image")) {
                return {
                    capable: false,
                    reason: `Model '${model}' does not declare image input capability (inputModalities: [${active.inputModalities.join(", ")}])`,
                };
            }
        }
        catch {
            // Continue
        }
    }
    return { capable: true };
}
export function createAuditTools(ctx) {
    const client = getClient(ctx);
    const datasetAuditTool = defineTool({
        name: "dataset_audit",
        description: "Run automated dataset hygiene audit, geometry verification, and readiness checking (S04, RP-05, V2-S01).",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
            config_path: { type: "string", description: "Optional dataset task configuration file path" },
            output_dir: { type: "string", description: "Optional output directory" },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                return [{ type: "text", text: formatToolResultText(val) }];
            },
        },
        async execute(args, exec) {
            return await client.call("dataset_audit", args, exec.signal);
        },
    });
    const auditIssueQueryTool = defineTool({
        name: "audit_issue_query",
        description: "Query and paginate through specific audit issues (geometry, metadata, labels) (S06, RP-12, V2-S01).",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
            issue_type: { type: "string", description: "Filter by issue type (e.g. bbox_geometry, metadata_missing)" },
            data_origin: { type: "string", description: "Filter by data origin" },
            batch_id: { type: "string", description: "Filter by batch ID" },
            limit: { type: "integer", description: "Page size limit (default 20)" },
            cursor: { type: "integer", description: "Pagination cursor offset (integer)" },
            sampling_seed: { type: "integer", description: "Stable sampling seed" },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                return [{ type: "text", text: formatToolResultText(val) }];
            },
        },
        async execute(args, exec) {
            return await client.call("audit_issue_query", args, exec.signal);
        },
    });
    const auditRecheckTool = defineTool({
        name: "audit_recheck",
        description: "Execute controlled hypothesis recheck on suspicious samples using deterministic rules (S06, RP-13, V2-S01).",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
            kind: {
                type: "string",
                required: true,
                description: "Recheck kind (bbox_source_size, bbox_bounds, quality_path_mapping, label_mapping, metadata_semantics, verified_duplicate_scope)",
            },
            sample_ids: {
                type: "array",
                items: { type: "string" },
                required: true,
                description: "List of sample IDs to recheck",
            },
            options: { type: "json", description: "Additional verification options" },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                return [{ type: "text", text: formatToolResultText(val) }];
            },
        },
        async execute(args, exec) {
            return await client.call("audit_recheck", args, exec.signal);
        },
    });
    const auditSuggestionSaveTool = defineTool({
        name: "audit_suggestion_save",
        description: "Persist non-authoritative agent audit suggestion (observations, hypotheses, evidence) (S08, RP-14, V2-S01, V2-S06). Never modifies ground truth or human review.",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
            suggestion: { type: "json", required: true, description: "Structured audit suggestion payload" },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                return [{ type: "text", text: formatToolResultText(val) }];
            },
        },
        async execute(args, exec) {
            return await client.call("audit_suggestion_save", args, exec.signal);
        },
    });
    const sampleViewTool = defineTool({
        name: "sample_view",
        description: "Fetch and observe raw inspection sample image or annotation overlay view (S05, RP-09, V2-S03, V2-S04). Returns true ImageBlock with verified MIME type.",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
            sample_id: { type: "string", required: true, description: "Target sample identifier" },
            view: { type: "string", description: "View mode: 'raw' (default) or 'annotation_overlay'" },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                const blocks = [
                    { type: "text", text: formatToolResultText(val) },
                ];
                if (val._attachment) {
                    const viewType = args.view || "raw";
                    blocks.push({
                        type: "text",
                        text: `[Image Observation] Sample: ${args.sample_id} | View: ${viewType} | MIME: ${val._attachment.mediaType || "image/png"}`,
                    });
                    blocks.push({
                        type: "image",
                        attachment: val._attachment,
                    });
                }
                return blocks;
            },
        },
        async execute(args, exec) {
            // Capability gate check (V2-08, Spec V2-03)
            const capCheck = await checkImageCapability(ctx, exec);
            if (!capCheck.capable) {
                return {
                    status: "NOT_READY",
                    summary: `Image observation refused: ${capCheck.reason}`,
                    warnings: [
                        `环境无附件存储服务或模型不支持图像输入：拒绝生成视觉观察 (${capCheck.reason})`,
                    ],
                    metrics: { task_id: args.task_id, sample_id: args.sample_id, reason: capCheck.reason },
                    mutation: "NONE",
                };
            }
            const res = await client.call("sample_view", args, exec.signal);
            if (res?.status === "OK" && res?.metrics?.image_endpoint) {
                try {
                    const fetched = await client.fetchImage({ endpoint: res.metrics.image_endpoint }, exec.signal);
                    const viewType = args.view || "raw";
                    const ext = fetched.mediaType === "image/jpeg" ? "jpg" : "png";
                    const att = await ctx.attachments.saveImage({
                        data: fetched.data,
                        mediaType: fetched.mediaType,
                        name: `${args.sample_id}_${viewType}.${ext}`,
                    });
                    res._attachment = att;
                }
                catch (e) {
                    return {
                        status: "ERROR",
                        summary: `Failed to save image attachment: ${e.message}`,
                        warnings: [`图片附件处理失败: ${e.message}`],
                        metrics: { task_id: args.task_id, sample_id: args.sample_id },
                        mutation: "NONE",
                    };
                }
            }
            return res;
        },
    });
    const regionViewTool = defineTool({
        name: "region_view",
        description: "Crop and inspect high-resolution subregion from sample with precise pixel coordinates (S05, RP-10, V2-S03, V2-S04). Returns ImageBlock.",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
            sample_id: { type: "string", required: true, description: "Target sample identifier" },
            bbox_xyxy: {
                type: "array",
                items: { type: "integer" },
                required: true,
                description: "Bounding box coordinates [x1, y1, x2, y2]",
            },
            padding_ratio: { type: "number", description: "Context padding ratio (default 0.1)" },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                const blocks = [
                    { type: "text", text: formatToolResultText(val) },
                ];
                if (val._attachment) {
                    blocks.push({
                        type: "text",
                        text: `[High-Res Region Observation] Sample: ${args.sample_id} | ROI Box: [${(args.bbox_xyxy || []).join(", ")}] | Padding: ${args.padding_ratio ?? 0.1}`,
                    });
                    blocks.push({
                        type: "image",
                        attachment: val._attachment,
                    });
                }
                return blocks;
            },
        },
        async execute(args, exec) {
            // Capability gate check (V2-08, Spec V2-03)
            const capCheck = await checkImageCapability(ctx, exec);
            if (!capCheck.capable) {
                return {
                    status: "NOT_READY",
                    summary: `Region observation refused: ${capCheck.reason}`,
                    warnings: [
                        `环境无附件存储服务或模型不支持图像输入：拒绝生成视觉观察 (${capCheck.reason})`,
                    ],
                    metrics: { task_id: args.task_id, sample_id: args.sample_id, reason: capCheck.reason },
                    mutation: "NONE",
                };
            }
            const res = await client.call("region_view", args, exec.signal);
            if (res?.status === "OK" && res?.metrics?.image_endpoint) {
                try {
                    const fetched = await client.fetchImage({ endpoint: res.metrics.image_endpoint }, exec.signal);
                    const ext = fetched.mediaType === "image/jpeg" ? "jpg" : "png";
                    const att = await ctx.attachments.saveImage({
                        data: fetched.data,
                        mediaType: fetched.mediaType,
                        name: `${args.sample_id}_crop.${ext}`,
                    });
                    res._attachment = att;
                }
                catch (e) {
                    return {
                        status: "ERROR",
                        summary: `Failed to save region image attachment: ${e.message}`,
                        warnings: [`局部图片附件处理失败: ${e.message}`],
                        metrics: { task_id: args.task_id, sample_id: args.sample_id },
                        mutation: "NONE",
                    };
                }
            }
            return res;
        },
    });
    const samplesCompareTool = defineTool({
        name: "samples_compare",
        description: "Side-by-side comparative inspection of multiple samples with distinct roles (candidate, normal reference, historical neighbor) (S05, RP-11, V2-S04).",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
            sample_ids: {
                type: "array",
                items: { type: "string" },
                required: true,
                description: "List of sample IDs to compare",
            },
            roles: {
                type: "array",
                items: { type: "string" },
                description: "Optional list of roles corresponding to each sample",
            },
        },
        output: {
            schema: { type: "json" },
            render(args, val) {
                const blocks = [
                    { type: "text", text: formatToolResultText(val) },
                ];
                if (Array.isArray(val._attachments)) {
                    for (const item of val._attachments) {
                        blocks.push({
                            type: "text",
                            text: `[Comparison Sample] ID: ${item.sample_id} | Role: ${item.role} | MIME: ${item.attachment.mediaType || "image/png"}`,
                        });
                        blocks.push({
                            type: "image",
                            attachment: item.attachment,
                        });
                    }
                }
                return blocks;
            },
        },
        async execute(args, exec) {
            // Capability gate check (V2-08, Spec V2-03)
            const capCheck = await checkImageCapability(ctx, exec);
            if (!capCheck.capable) {
                return {
                    status: "NOT_READY",
                    summary: `Comparison observation refused: ${capCheck.reason}`,
                    warnings: [
                        `环境无附件存储服务或模型不支持图像输入：拒绝生成视觉观察 (${capCheck.reason})`,
                    ],
                    metrics: { task_id: args.task_id, sample_ids: args.sample_ids, reason: capCheck.reason },
                    mutation: "NONE",
                };
            }
            const res = await client.call("samples_compare", args, exec.signal);
            if (res.status === "OK" && Array.isArray(res.metrics?.samples)) {
                const attachments = [];
                for (const s of res.metrics.samples) {
                    if (s.image_endpoint) {
                        try {
                            const fetched = await client.fetchImage({ endpoint: s.image_endpoint }, exec.signal);
                            const ext = fetched.mediaType === "image/jpeg" ? "jpg" : "png";
                            const att = await ctx.attachments.saveImage({
                                data: fetched.data,
                                mediaType: fetched.mediaType,
                                name: `${s.sample_id}_${s.role || "sample"}.${ext}`,
                            });
                            attachments.push({
                                sample_id: s.sample_id,
                                role: s.role || "reference",
                                attachment: att,
                            });
                        }
                        catch (e) {
                            res.warnings = [
                                ...(res.warnings || []),
                                `对比样本 ${s.sample_id} 图片抓取失败: ${e.message}`,
                            ];
                        }
                    }
                }
                res._attachments = attachments;
            }
            return res;
        },
    });
    return [
        datasetAuditTool,
        auditIssueQueryTool,
        auditRecheckTool,
        auditSuggestionSaveTool,
        sampleViewTool,
        regionViewTool,
        samplesCompareTool,
    ];
}
export const name = "iad-audit";
export const inject = ["tools", "attachments?"];
export function apply(ctx) {
    const tools = createAuditTools(ctx);
    if (ctx.tools && typeof ctx.tools.register === "function") {
        for (const tool of tools) {
            ctx.tools.register(tool);
        }
    }
}
