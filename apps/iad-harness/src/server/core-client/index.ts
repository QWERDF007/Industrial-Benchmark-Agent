/**
 * CoreClient: Lightweight HTTP client communicating directly with Python domain server (S03, RP-03).
 * Interacts with POST /internal/tool/{tool_name} and GET /internal/sample/{sample_id}/image.
 */

export interface CoreClientConfig {
  domainServerUrl?: string;
  timeoutMs?: number;
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

    if (signal) {
      signal.addEventListener("abort", () => controller.abort(signal.reason));
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
    let url: string;
    if (params.endpoint) {
      if (params.endpoint.startsWith("http")) {
        url = params.endpoint;
      } else {
        const path = params.endpoint.startsWith("/") ? params.endpoint : `/${params.endpoint}`;
        url = `${this.baseUrl}${path}`;
      }
    } else {
      if (!params.sampleId) {
        throw new Error("sampleId or endpoint must be provided to fetchImageBytes");
      }
      const q = new URLSearchParams();
      if (params.view) q.set("view", params.view);
      if (params.bbox && params.bbox.length === 4) q.set("bbox", params.bbox.join(","));
      if (params.paddingRatio !== undefined) q.set("padding", String(params.paddingRatio));

      const queryStr = q.toString() ? `?${q.toString()}` : "";
      url = `${this.baseUrl}/internal/sample/${encodeURIComponent(params.sampleId)}/image${queryStr}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "image/*",
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch image bytes from ${url} [HTTP ${response.status}]: ${await response.text()}`
      );
    }

    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
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
