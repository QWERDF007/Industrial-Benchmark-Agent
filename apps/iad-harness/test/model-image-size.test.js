import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {Context} from '@deepseek-ai/cordis';
import {NativeMediaAttachments,nativeMediaOutput} from '../lib/server/sessions/media.js';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';

test('native transport sends the derived image and preserves the source evidence reference',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-model-size-'));
  t.after(()=>fs.rm(root,{recursive:true,force:true}));
  execFileSync(resolvePythonPath(),['-c',"from PIL import Image; import sys; p=Image.new('RGB',(16,8),'red'); p.save(sys.argv[1]); p.resize((4,2)).save(sys.argv[2])",root+'/source.png',root+'/input.png']);
  const digest=async file=>createHash('sha256').update(await fs.readFile(file)).digest('hex');
  const ctx=new Context(),attachments=new NativeMediaAttachments(ctx,root+'/attachments');
  const result=await attachments.prepare({sample_id:'source',evidence_id:'source-image',total:1,offset:0,error:null,images:[{
    sample_id:'source',dataset_id:'dataset',path:root+'/source.png',required:true,
    image:{evidence_id:'source-image',role:'overview',source:'global',original_size:[16,8],crop_bbox:[0,0,16,8],sent_size:[16,8],
      sha256:await digest(root+'/source.png'),source_sha256:await digest(root+'/source.png'),representation:'raw',media_type:'image/png',annotation_ids:[],annotation_sha256:null},
    model_input:{path:root+'/input.png',sha256:await digest(root+'/input.png'),sent_size:[4,2]},model_context:{sent_size:[4,2]},
  }]},new AbortController().signal);
  assert.equal(result.evidence_id,'source-image');
  assert.deepEqual(result.images[0].image.sent_size,[4,2]);
  assert.deepEqual(result.images[0].image.original_size,[16,8]);
  assert.equal(result.images[0].attachment.width,4);assert.equal(result.images[0].attachment.height,2);
  assert.equal(result.images[0].image.sha256,await digest(root+'/input.png'));
  assert.equal('model_input' in result.images[0],false);assert.equal('path' in result.images[0],false);
  const content=nativeMediaOutput.render({},result);
  assert.equal(content.filter(part=>part.type==='image').length,1);
  assert.doesNotMatch(content[0].text,/model_input|\/tmp\//);
});
