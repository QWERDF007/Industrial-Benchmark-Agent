import path from 'node:path';
import type {ImageSessionLocation} from '../../shared/domain.generated.js';
import {imageSessionPath} from '../sessions/image-path.js';

export function auditSessionPath(root:string, location:ImageSessionLocation):string {
  return imageSessionPath(path.join(root,'audit-sessions'),location);
}
