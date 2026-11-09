import path from 'node:path';
import type {ImageSessionLocation} from '../../shared/domain.generated.js';

export function imageSessionPath(root:string, location:ImageSessionLocation):string {
  const timestamp=new Date(location.submitted_at).toISOString().replaceAll(':','-');
  const name=path.parse(location.image_name).name.replace(/[<>:"/\\|?*\u0000-\u001f]/g,encodeURIComponent);
  return path.join(root,timestamp,location.job_id,`${name}_${location.image_id}.jsonl`);
}
