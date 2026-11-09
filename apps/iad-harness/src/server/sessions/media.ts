import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import type {Context} from '@deepseek-ai/cordis';
import {LocalAttachmentStore} from '@deepseek-ai/dsh-attachment-local';
import type {ImageAttachmentRef} from '@deepseek-ai/dsh-attachment';
import type {ContentBlock} from '@deepseek-ai/dsh-llm';
import type {InferValue} from '@deepseek-ai/dsh-tools';
import type {RegistrationMediaPage} from '../../shared/domain.generated.js';

export type NativeMediaPage = Omit<RegistrationMediaPage,'images'> & {
  images:(Omit<RegistrationMediaPage['images'][number],'path'> & {attachment:ImageAttachmentRef})[];
};

export const nativeMediaOutput = {
  schema:{type:'json'} as const,
  render(_args:unknown,value:unknown):ContentBlock[] {
    const page = value as NativeMediaPage;
    return [{type:'text',text:JSON.stringify(page)}, ...page.images.map(image=>({type:'image' as const,attachment:image.attachment}))];
  },
};

export class NativeMediaAttachments {
  constructor(private readonly scope:Context, directory:string) {
    new LocalAttachmentStore(scope,{dshHome:directory,
      maxImageBytes:Number.MAX_SAFE_INTEGER,maxMessageImageBytes:Number.MAX_SAFE_INTEGER,maxImagesPerMessage:Number.MAX_SAFE_INTEGER,
      maxImagePixels:Number.MAX_SAFE_INTEGER,maxImageDimension:Number.MAX_SAFE_INTEGER,normalizedImageMaxPixels:Number.MAX_SAFE_INTEGER,
      normalizedImageMaxDimension:Number.MAX_SAFE_INTEGER,normalizedImageMaxBytes:Number.MAX_SAFE_INTEGER});
  }

  async prepare(page:RegistrationMediaPage, signal:AbortSignal):Promise<InferValue<{type:'json'}>> {
    const images:NativeMediaPage['images'] = [];
    for (const {path:filename,...image} of page.images) {
      const data = await fs.readFile(filename,{signal});
      if (createHash('sha256').update(data).digest('hex') !== image.image.sha256) throw new Error('冻结图像证据内容已变化');
      const attachment = await this.scope.attachments.saveImage({data,mediaType:image.image.media_type,name:image.image.evidence_id+'.png'});
      if (attachment.width !== image.image.sent_size[0] || attachment.height !== image.image.sent_size[1])
        throw new Error('附件存储改变了本场设定的图像尺寸');
      images.push({...image,attachment});
    }
    return {...page,images} as unknown as InferValue<{type:'json'}>;
  }
}
