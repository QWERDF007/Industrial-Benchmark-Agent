import fs from "node:fs/promises";
import { createHash } from 'node:crypto';
export const evidenceOutput = {
    schema: { type: "json" },
    render(_args, value) {
        const media = value;
        return [{ type: "text", text: JSON.stringify(media) }, { type: "image", attachment: media.attachment }];
    },
};
export async function readEvidenceAttachment(bridge, ctx, operation, args, signal, expected) {
    const media = await bridge.execute(operation, args, signal);
    signal.throwIfAborted();
    const data = await fs.readFile(media.path, { signal });
    if (expected && (data.length !== expected.byte_count || createHash('sha256').update(data).digest('hex') !== expected.sha256))
        throw new Error('SOURCE_UNAVAILABLE: 冻结媒体在读取期间变化');
    const attachment = await ctx.attachments.saveImage({ data, mediaType: media.media_type, name: args.evidence_id + ".png" });
    return { ...args, attachment: { ...attachment } };
}
