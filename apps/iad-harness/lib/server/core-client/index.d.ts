/**
 * CoreClient: Direct PythonBridge client communicating with Python domain runtime (DS-S01, DS-S04, DSH-04).
 * Replaces HTTP fetch with in-process stdin/stdout NDJSON CLI bridge (python -m iad_core.entry).
 * No HTTP server or port 8000 required.
 */
import { PythonBridge, PythonBridgeConfig } from "../python-bridge/index.js";
export interface CoreClientConfig extends PythonBridgeConfig {
    bridge?: PythonBridge;
}
export interface FetchedImage {
    data: Uint8Array;
    mediaType: "image/png" | "image/jpeg";
}
export declare function detectImageMediaType(bytes: Uint8Array, headerType?: string | null): "image/png" | "image/jpeg";
export declare class CoreClient {
    readonly bridge: PythonBridge;
    readonly timeoutMs: number;
    constructor(config?: CoreClientConfig);
    /**
     * Execute domain tool via PythonBridge CLI invocation.
     */
    call<T = any>(toolName: string, args?: Record<string, any>, signal?: AbortSignal): Promise<T>;
    /**
     * Fetch image with verified mediaType (PNG or JPEG) and secure endpoint gating (DS-S15).
     * Reads image directly from authorized filesystem path returned by Python domain runtime.
     */
    fetchImage(params: {
        endpoint?: string;
        sampleId?: string;
        view?: string;
        bbox?: number[];
        paddingRatio?: number;
    }, signal?: AbortSignal): Promise<FetchedImage>;
    /**
     * Fetch raw image bytes from domain server for attachment storage.
     */
    fetchImageBytes(params: {
        endpoint?: string;
        sampleId?: string;
        view?: string;
        bbox?: number[];
        paddingRatio?: number;
    }, signal?: AbortSignal): Promise<Uint8Array>;
}
export declare const name = "iad-core-client";
export declare function apply(ctx: any, config?: CoreClientConfig): void;
//# sourceMappingURL=index.d.ts.map