/**
 * CoreClient: Direct PythonBridge client communicating with Python domain runtime (DS-S01, DS-S04, DSH-04).
 * Replaces HTTP fetch with in-process stdin/stdout NDJSON CLI bridge (python -m iad_core.entry).
 * No HTTP server or port 8000 required.
 */
import fs from "node:fs/promises";
import { PythonBridge } from "../python-bridge/index.js";
export function detectImageMediaType(bytes, headerType) {
    if (bytes.length >= 8 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47) {
        return "image/png";
    }
    if (bytes.length >= 3 &&
        bytes[0] === 0xff &&
        bytes[1] === 0xd8 &&
        bytes[2] === 0xff) {
        return "image/jpeg";
    }
    if (headerType) {
        if (headerType.includes("image/jpeg") || headerType.includes("image/jpg")) {
            return "image/jpeg";
        }
        if (headerType.includes("image/png")) {
            return "image/png";
        }
    }
    throw new Error("Unsupported or unrecognized image format: only image/png and image/jpeg are supported.");
}
export class CoreClient {
    bridge;
    timeoutMs;
    constructor(config = {}) {
        this.bridge = config.bridge || new PythonBridge(config);
        this.timeoutMs = config.timeoutMs || 60000;
    }
    /**
     * Execute domain tool via PythonBridge CLI invocation.
     */
    async call(toolName, args = {}, signal) {
        try {
            const result = await this.bridge.execute("tool_call", {
                tool_name: toolName,
                arguments: args,
            }, signal);
            return result;
        }
        catch (err) {
            throw new Error(`CoreClient call failed for ${toolName}: ${err.message || err}`);
        }
    }
    /**
     * Fetch image with verified mediaType (PNG or JPEG) and secure endpoint gating (DS-S15).
     * Reads image directly from authorized filesystem path returned by Python domain runtime.
     */
    async fetchImage(params, signal) {
        let sampleId = params.sampleId;
        if (params.endpoint) {
            // Security check: reject external URL schemes and path traversals
            if (params.endpoint.includes("://") ||
                params.endpoint.startsWith("//") ||
                !params.endpoint.startsWith("/internal/sample/")) {
                throw new Error(`Security violation: external or unauthorized image endpoint rejected: ${params.endpoint}`);
            }
            if (params.endpoint.includes("..")) {
                throw new Error(`Security violation: path traversal rejected in endpoint: ${params.endpoint}`);
            }
            const match = params.endpoint.match(/^\/internal\/sample\/([^/?#]+)/);
            if (!match) {
                throw new Error(`Invalid sample endpoint: ${params.endpoint}`);
            }
            sampleId = decodeURIComponent(match[1]);
        }
        if (!sampleId) {
            throw new Error("sampleId or endpoint must be provided to fetchImage");
        }
        if (sampleId.includes("..")) {
            throw new Error(`Security violation: path traversal rejected in sampleId: ${sampleId}`);
        }
        const imageInfo = await this.bridge.execute("sample_image_path", { sample_id: sampleId }, signal);
        const fileBuffer = await fs.readFile(imageInfo.path);
        const bytes = new Uint8Array(fileBuffer.buffer, fileBuffer.byteOffset, fileBuffer.byteLength);
        if (bytes.byteLength === 0) {
            throw new Error(`Corrupted or empty image payload read from ${imageInfo.path}`);
        }
        const mediaType = detectImageMediaType(bytes, imageInfo.media_type);
        return { data: bytes, mediaType };
    }
    /**
     * Fetch raw image bytes from domain server for attachment storage.
     */
    async fetchImageBytes(params, signal) {
        const res = await this.fetchImage(params, signal);
        return res.data;
    }
}
export const name = "iad-core-client";
export function apply(ctx, config = {}) {
    const client = new CoreClient(config);
    if (typeof ctx.provide === "function") {
        ctx.provide("iadCoreClient", client);
    }
    ctx.iadCoreClient = client;
}
