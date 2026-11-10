/* Generated from Python model settings by scripts/generate-contracts.js. */
import type { ModelLimits } from "./domain.generated.js";
export const defaultModelLimits: ModelLimits = {
  "context_tokens": null,
  "max_output_tokens": null,
  "request_parameters": {},
  "generation_timeout_seconds": null,
  "capacity_mode": null,
  "max_visual_inputs": null,
  "max_request_bytes": null,
  "connect_timeout_seconds": null,
  "write_timeout_seconds": null,
  "pool_timeout_seconds": null
};
export const reasoningEffortLabels = {
  "low": "Low",
  "medium": "Medium",
  "high": "High",
  "xhigh": "XHigh"
} as const;
