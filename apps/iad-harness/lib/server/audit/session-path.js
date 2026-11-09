import path from 'node:path';
import { imageSessionPath } from '../sessions/image-path.js';
export function auditSessionPath(root, location) {
    return imageSessionPath(path.join(root, 'audit-sessions'), location);
}
