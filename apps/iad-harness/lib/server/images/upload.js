import { Busboy } from '@fastify/busboy';
import { temporaryImageLimits } from '../../shared/consistency.parameters.generated.js';
export async function readQueryImage(req) {
    const limit = temporaryImageLimits.max_source_bytes;
    if (Number(req.headers['content-length']) > limit + 64 * 1024) {
        throw Object.assign(new Error('上传图像超过大小限制'), { statusCode: 413, code: 'RESOURCE_LIMIT' });
    }
    const contentType = req.headers['content-type'];
    if (!contentType?.startsWith('multipart/form-data;')) {
        throw Object.assign(new Error('请选择一张图像上传'), { statusCode: 400, code: 'UNSUPPORTED_IMAGE' });
    }
    return await new Promise((resolve, reject) => {
        let parser;
        try {
            parser = new Busboy({ headers: { ...req.headers, 'content-type': contentType }, limits: { files: 1, fields: 0, parts: 1, fileSize: limit,
                    headerPairs: 32, headerSize: 16 * 1024 } });
        }
        catch {
            reject(Object.assign(new Error('上传格式无效'), { statusCode: 400, code: 'UNSUPPORTED_IMAGE' }));
            return;
        }
        const chunks = [];
        let bytes = 0;
        let files = 0;
        let failure;
        const invalid = () => { failure ??= Object.assign(new Error('每次只接受一个 image 文件字段'), { statusCode: 400, code: 'UNSUPPORTED_IMAGE' }); };
        parser.on('file', (name, file) => {
            files++;
            if (name !== 'image')
                invalid();
            file.on('data', (chunk) => { if (!failure)
                chunks.push(chunk); });
            file.on('limit', () => {
                failure = Object.assign(new Error('上传图像超过大小限制'), { statusCode: 413, code: 'RESOURCE_LIMIT' });
                chunks.length = 0;
            });
            file.on('error', reject);
        });
        parser.on('filesLimit', invalid).on('fieldsLimit', invalid).on('partsLimit', invalid);
        parser.on('error', () => reject(Object.assign(new Error('上传格式不完整'), { statusCode: 400, code: 'UNSUPPORTED_IMAGE' })));
        parser.on('finish', () => {
            if (files !== 1)
                invalid();
            if (failure)
                reject(failure);
            else
                resolve(Buffer.concat(chunks));
        });
        req.on('aborted', () => reject(Object.assign(new Error('上传已中断'), { statusCode: 400, code: 'SOURCE_UNAVAILABLE' })));
        req.on('error', reject);
        req.on('data', chunk => {
            bytes += chunk.length;
            if (bytes > limit + 64 * 1024) {
                failure = Object.assign(new Error('上传图像超过大小限制'), { statusCode: 413, code: 'RESOURCE_LIMIT' });
                chunks.length = 0;
                req.unpipe(parser);
                parser.destroy();
                req.resume();
                reject(failure);
            }
        });
        req.pipe(parser);
    });
}
