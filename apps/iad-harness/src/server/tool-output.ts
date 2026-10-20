import type { ContentBlock } from "@deepseek-ai/dsh-llm";
import type { InferValue } from "@deepseek-ai/dsh-tools";

export const workbenchJsonOutput = {
  schema: { type: "json" } as const,
  render(_args: unknown, value: InferValue<{ type: "json" }>): ContentBlock[] {
    return [{ type: "text", text: JSON.stringify(value, (key, item) =>
      ["mining_steps", "verification_steps", "joint_steps", "model_calls", "request", "input_sources", "generation_signature"].includes(key) ? undefined : item) }];
  },
};
