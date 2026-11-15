import fs from "node:fs/promises";
export const evidenceOutput = {
    schema: { type: "json" },
    render(_args, value) {
        const media = value;
        return [{ type: "text", text: JSON.stringify(media) }, { type: "image", attachment: media.attachment }];
    },
};
export async function readEvidenceAttachment(bridge, ctx, operation, args, signal) {
    const media = await bridge.execute(operation, args, signal);
    signal.throwIfAborted();
    const data = await fs.readFile(media.path, { signal });
    const attachment = await ctx.attachments.saveImage({ data, mediaType: media.media_type, name: args.evidence_id + ".png" });
    return { ...args, attachment: { ...attachment } };
}
