/**
 * CoreClient: Lightweight HTTP client communicating directly with Python domain server (S03, RP-03, V2-S02).
 * Interacts strictly with POST /internal/tool/{tool_name} and GET /internal/sample/{sample_id}/image.
 */
export interface CoreClientConfig {
    domainServerUrl?: string;
    timeoutMs?: number;
}
export interface FetchedImage {
    data: Uint8Array;
    mediaType: "image/png" | "image/jpeg";
}
export declare function detectImageMediaType(bytes: Uint8Array, headerType?: string | null): "image/png" | "image/jpeg";
export declare class CoreClient {
    readonly baseUrl: string;
    readonly timeoutMs: number;
    constructor(config?: CoreClientConfig);
    /**
     * Execute domain tool via POST /internal/tool/{tool_name}.
     */
    call<T = any>(toolName: string, args?: Record<string, any>, signal?: AbortSignal): Promise<T>;
    /**
     * Fetch image with verified mediaType (PNG or JPEG) and secure endpoint gating (V2-06, V2-07).
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