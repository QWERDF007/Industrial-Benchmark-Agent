/**
 * Industrial Benchmark Agent - Audit & Image Tools Plugin (S02, S04, S05, S06, S08, RP-05, RP-08~14)
 */
import { defineTool } from "@deepseek-ai/dsh-tools";
import { CoreClient } from "../core-client/index.js";
function getClient(ctx) {
    return ctx.iadCoreClient || new CoreClient();
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
export function createAuditTools(ctx) {
    const client = getClient(ctx);
    const datasetAuditTool = defineTool({
        name: "dataset_audit",
        description: "Run automated dataset hygiene audit, geometry verification, and readiness checking (S04, RP-05).",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
            dataset_origin: { type: "string", description: "Optional dataset origin filter" },
            inspect_geometry: { type: "boolean", description: "Whether to run deep bounding box geometry verification" },
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
        description: "Query and paginate through specific audit issues (geometry, metadata, labels) (S06, RP-12).",
        parameters: {
            task_id: { type: "string", required: true, description: "Inspection task identifier" },
            issue_type: { type: "string", description: "Filter by issue type (e.g. bbox_geometry, metadata_missing)" },
            data_origin: { type: "string", description: "Filter by data origin" },
            batch_id: { type: "string", description: "Filter by batch ID" },
            limit: { type: "integer", description: "Page size limit (default 20)" },
            cursor: { type: "string", description: "Pagination cursor" },
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
        description: "Execute controlled hypothesis recheck on suspicious samples using deterministic rules (S06, RP-13).",
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
        description: "Persist non-authoritative agent audit suggestion (observations, hypotheses, evidence) (S08, RP-14). Never modifies ground truth or human review.",
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
        description: "Fetch and observe raw inspection sample image or annotation overlay view (S05, RP-09). Returns true ImageBlock when attachment service is available.",
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
                    blocks.push({
                        type: "image",
                        attachment: val._attachment,
                    });
                }
                return blocks;
            },
        },
        async execute(args, exec) {
            const res = await client.call("sample_view", args, exec.signal);
            if (res.status === "OK" && res.metrics?.image_endpoint) {
                if (ctx.attachments && typeof ctx.attachments.saveImage === "function") {
                    try {
                        const bytes = await client.fetchImageBytes({ endpoint: res.metrics.image_endpoint }, exec.signal);
                        const viewType = args.view || "raw";
                        const att = await ctx.attachments.saveImage({
                            data: bytes,
                            mediaType: "image/png",
                            name: `${args.sample_id}_${viewType}.png`,
                        });
                        res._attachment = att;
                    }
                    catch (e) {
                        res.warnings = [...(res.warnings || []), `图片附件抓取失败: ${e.message}`];
                    }
                }
                else {
                    // Model/runtime does not support vision attachments
                    res.warnings = [
                        ...(res.warnings || []),
                        "环境无附件存储服务或模型不支持图像输入：不具有图片视觉观察结论。",
                    ];
                }
            }
            return res;
        },
    });
    const regionViewTool = defineTool({
        name: "region_view",
        description: "Crop and inspect high-resolution subregion from sample with precise pixel coordinates (S05, RP-10). Returns ImageBlock.",
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
                        type: "image",
                        attachment: val._attachment,
                    });
                }
                return blocks;
            },
        },
        async execute(args, exec) {
            const res = await client.call("region_view", args, exec.signal);
            if (res.status === "OK" && res.metrics?.image_endpoint) {
                if (ctx.attachments && typeof ctx.attachments.saveImage === "function") {
                    try {
                        const bytes = await client.fetchImageBytes({ endpoint: res.metrics.image_endpoint }, exec.signal);
                        const att = await ctx.attachments.saveImage({
                            data: bytes,
                            mediaType: "image/png",
                            name: `${args.sample_id}_crop.png`,
                        });
                        res._attachment = att;
                    }
                    catch (e) {
                        res.warnings = [...(res.warnings || []), `局部图片附件抓取失败: ${e.message}`];
                    }
                }
                else {
                    res.warnings = [
                        ...(res.warnings || []),
                        "环境无附件存储服务或模型不支持图像输入：不具有图片视觉观察结论。",
                    ];
                }
            }
            return res;
        },
    });
    const samplesCompareTool = defineTool({
        name: "samples_compare",
        description: "Side-by-side comparative inspection of multiple samples with distinct roles (candidate, normal reference, historical neighbor) (S05, RP-11).",
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
                    for (const att of val._attachments) {
                        blocks.push({
                            type: "image",
                            attachment: att,
                        });
                    }
                }
                return blocks;
            },
        },
        async execute(args, exec) {
            const res = await client.call("samples_compare", args, exec.signal);
            if (res.status === "OK" && Array.isArray(res.metrics?.samples)) {
                if (ctx.attachments && typeof ctx.attachments.saveImage === "function") {
                    const attachments = [];
                    for (const s of res.metrics.samples) {
                        if (s.image_endpoint) {
                            try {
                                const bytes = await client.fetchImageBytes({ endpoint: s.image_endpoint }, exec.signal);
                                const att = await ctx.attachments.saveImage({
                                    data: bytes,
                                    mediaType: "image/png",
                                    name: `${s.sample_id}_${s.role}.png`,
                                });
                                attachments.push(att);
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
                else {
                    res.warnings = [
                        ...(res.warnings || []),
                        "环境无附件存储服务或模型不支持图像输入：不具有图片视觉观察结论。",
                    ];
                }
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
