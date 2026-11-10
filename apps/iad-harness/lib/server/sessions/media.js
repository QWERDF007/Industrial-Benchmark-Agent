import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { LocalAttachmentStore } from '@deepseek-ai/dsh-attachment-local';
export const nativeMediaOutput = {
    schema: { type: 'json' },
    render(_args, value) {
        const page = value;
        const images = page.images.map(({ attachment, ...image }) => image);
        return [{ type: 'text', text: JSON.stringify({ ...page, images }) }, ...page.images.map(image => ({ type: 'image', attachment: image.attachment }))];
    },
};
export class NativeMediaAttachments {
    scope;
    constructor(scope, directory) {
        this.scope = scope;
        new LocalAttachmentStore(scope, { dshHome: directory,
            maxImageBytes: Number.MAX_SAFE_INTEGER, maxMessageImageBytes: Number.MAX_SAFE_INTEGER, maxImagesPerMessage: Number.MAX_SAFE_INTEGER,
            maxImagePixels: Number.MAX_SAFE_INTEGER, maxImageDimension: Number.MAX_SAFE_INTEGER, normalizedImageMaxPixels: Number.MAX_SAFE_INTEGER,
            normalizedImageMaxDimension: Number.MAX_SAFE_INTEGER, normalizedImageMaxBytes: Number.MAX_SAFE_INTEGER });
    }
    async prepare(page, signal) {
        if (page.images.length && !page.evidence_id)
            throw new Error('图像资料缺少原图引用');
        const images = [];
        for (const { path: filename, ...image } of page.images) {
            const data = await fs.readFile(filename, { signal });
            if (createHash('sha256').update(data).digest('hex') !== image.image.sha256)
                throw new Error('冻结图像证据内容已变化');
            const attachment = await this.scope.attachments.saveImage({ data, mediaType: image.image.media_type, name: image.image.evidence_id + '.png' });
            if (attachment.width !== image.image.sent_size[0] || attachment.height !== image.image.sent_size[1])
                throw new Error('附件存储改变了本场设定的图像尺寸');
            const { evidence_id: pixelKey, ...view } = image.image;
            const { evidence_id: contextKey, ...model_context } = image.model_context;
            images.push({ ...image, image: view, model_context, attachment });
        }
        return { ...page, images };
    }
}
