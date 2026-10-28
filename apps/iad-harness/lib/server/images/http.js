import { randomBytes } from 'node:crypto';
import { readQueryImage } from './upload.js';
const COOKIE = 'iad_image_owner';
export class ImageHttpQueries {
    bridge;
    constructor(bridge) {
        this.bridge = bridge;
    }
    owner(req, res, create = false) {
        const cookies = req.headers.cookie?.split(';').map(item => item.trim()) ?? [];
        const token = cookies.find(item => item.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
        if (token && /^[A-Za-z0-9_-]{32}$/.test(token))
            return 'web:' + token;
        if (!create)
            return null;
        const generated = randomBytes(24).toString('base64url');
        res.setHeader('Set-Cookie', `${COOKIE}=${generated}; Path=/api/iad; HttpOnly; SameSite=Strict`);
        return 'web:' + generated;
    }
    async upload(req, res) {
        const data = await readQueryImage(req);
        return await this.bridge.execute('temporary_image_accept', { data_base64: data.toString('base64'),
            owner_id: this.owner(req, res, true) });
    }
    async release(req, res, imageRef) {
        const owner = this.owner(req, res);
        if (!owner)
            throw Object.assign(new Error('临时图像引用不存在'), { statusCode: 404, code: 'REFERENCE_NOT_FOUND' });
        return await this.bridge.execute('temporary_image_release', { image_ref: imageRef, owner_id: owner });
    }
    async retrieve(req, res, request) {
        return await this.bridge.execute('image_retrieve', { request, owner_id: this.owner(req, res) });
    }
}
