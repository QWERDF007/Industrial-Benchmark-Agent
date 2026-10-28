import fs from "node:fs/promises";
import {createHash} from 'node:crypto';
import type { Context } from "@deepseek-ai/cordis";
import type { ImageAttachmentRef } from "@deepseek-ai/dsh-attachment";
import type { ContentBlock } from "@deepseek-ai/dsh-llm";
import type { InferValue } from "@deepseek-ai/dsh-tools";
import type { PythonBridge } from "./python-bridge/index.js";

type EvidenceResult = { attachment: { [Key in keyof ImageAttachmentRef]: ImageAttachmentRef[Key] } };

export const evidenceOutput = {
  schema: { type: "json" } as const,
  render(_args: unknown, value: InferValue<{ type: "json" }>): ContentBlock[] {
    const media = value as EvidenceResult;
    return [{ type: "text", text: JSON.stringify(media) }, { type: "image", attachment: media.attachment }];
  },
};

export async function readEvidenceAttachment(bridge: PythonBridge, ctx: Context,
  operation: "knowledge_evidence" | "audit_evidence" | "direction_exploration_evidence" | 'consistency_evidence_media',
  args: { evidence_id: string; run_id?: string; version_id?: string; suggestion_id?: string; media_id?:string }, signal: AbortSignal,
  expected?:{byte_count:number;sha256:string}) {
  const media = await bridge.execute<{ path: string; media_type: "image/png" }>(operation, args, signal);
  signal.throwIfAborted();
  const data = await fs.readFile(media.path, { signal });
  if(expected && (data.length!==expected.byte_count || createHash('sha256').update(data).digest('hex')!==expected.sha256))throw new Error('SOURCE_UNAVAILABLE: 冻结媒体在读取期间变化');
  const attachment = await ctx.attachments.saveImage({ data, mediaType: media.media_type, name: args.evidence_id + ".png" });
  return { ...args, attachment: { ...attachment } };
}
