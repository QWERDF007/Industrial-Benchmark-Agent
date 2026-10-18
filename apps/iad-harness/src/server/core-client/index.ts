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

export function detectImageMediaType(
  bytes: Uint8Array,
  headerType?: string | null
): "image/png" | "image/jpeg" {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
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
  return "image/png";
}

export class CoreClient {
  readonly baseUrl: string;
  readonly timeoutMs: number;

  constructor(config: CoreClientConfig = {}) {
    const rawUrl =
      config.domainServerUrl ||
      process.env.IAD_DOMAIN_SERVER_URL ||
      "http://127.0.0.1:8000";
    this.baseUrl = rawUrl.replace(/\/+$/, "");
    this.timeoutMs = config.timeoutMs || 60000;
  }

  /**
   * Execute domain tool via POST /internal/tool/{tool_name}.
   */
  async call<T = any>(
    toolName: string,
    args: Record<string, any> = {},
    signal?: AbortSignal
  ): Promise<T> {
    const url = `${this.baseUrl}/internal/tool/${encodeURIComponent(toolName)}`;

    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | undefined;

    const onAbort = () => controller.abort(signal?.reason);
    if (signal) {
      signal.addEventListener("abort", onAbort);
    }
    if (this.timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        controller.abort(new Error(`CoreClient request timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(args),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorDetail = "";
        try {
          const errJson = await response.json();
          errorDetail = errJson.detail || JSON.stringify(errJson);
        } catch {
          errorDetail = await response.text();
        }
        throw new Error(
          `CoreClient call failed for ${toolName} [HTTP ${response.status}]: ${errorDetail}`
        );
      }

      return (await response.json()) as T;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    }
  }

  /**
   * Fetch image with verified mediaType (PNG or JPEG) and secure endpoint gating (V2-06, V2-07).
   */
  async fetchImage(
    params: {
      endpoint?: string;
      sampleId?: string;
      view?: string;
      bbox?: number[];
      paddingRatio?: number;
    },
    signal?: AbortSignal
  ): Promise<FetchedImage> {
    let url: string;
    if (params.endpoint) {
      // Security check (V2-06, AC-V2-02): reject external URL schemes and path traversals
      if (
        params.endpoint.includes("://") ||
        params.endpoint.startsWith("//") ||
        !params.endpoint.startsWith("/internal/sample/")
      ) {
        throw new Error(`Security violation: external or unauthorized image endpoint rejected: ${params.endpoint}`);
      }
      if (params.endpoint.includes("..")) {
        throw new Error(`Security violation: path traversal rejected in endpoint: ${params.endpoint}`);
      }
      url = `${this.baseUrl}${params.endpoint}`;
    } else {
      if (!params.sampleId) {
        throw new Error("sampleId or endpoint must be provided to fetchImage");
      }
      if (params.sampleId.includes("..")) {
        throw new Error(`Security violation: path traversal rejected in sampleId: ${params.sampleId}`);
      }
      const q = new URLSearchParams();
      if (params.view) q.set("view", params.view);
      if (params.bbox && params.bbox.length === 4) q.set("bbox", params.bbox.join(","));
      if (params.paddingRatio !== undefined) q.set("padding", String(params.paddingRatio));

      const queryStr = q.toString() ? `?${q.toString()}` : "";
      url = `${this.baseUrl}/internal/sample/${encodeURIComponent(params.sampleId)}/image${queryStr}`;
    }

    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | undefined;

    const onAbort = () => controller.abort(signal?.reason);
    if (signal) {
      signal.addEventListener("abort", onAbort);
    }
    if (this.timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        controller.abort(new Error(`CoreClient image fetch timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "image/png, image/jpeg, image/*",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch image bytes from ${url} [HTTP ${response.status}]: ${await response.text()}`
        );
      }

      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      if (bytes.byteLength === 0) {
        throw new Error(`Corrupted or empty image payload received from ${url}`);
      }
      const headerType = response.headers.get("content-type");
      const mediaType = detectImageMediaType(bytes, headerType);

      return { data: bytes, mediaType };
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    }
  }

  /**
   * Fetch raw image bytes from domain server for attachment storage.
   */
  async fetchImageBytes(
    params: {
      endpoint?: string;
      sampleId?: string;
      view?: string;
      bbox?: number[];
      paddingRatio?: number;
    },
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const res = await this.fetchImage(params, signal);
    return res.data;
  }
}

export const name = "iad-core-client";

export function apply(ctx: any, config: CoreClientConfig = {}) {
  if (!ctx.iadCoreClient) {
    if (typeof ctx.provide === "function") {
      ctx.provide("iadCoreClient");
    }
    ctx.iadCoreClient = new CoreClient(config);
  }
}
