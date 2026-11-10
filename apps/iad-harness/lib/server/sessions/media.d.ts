import type { Context } from '@deepseek-ai/cordis';
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment';
import type { ContentBlock } from '@deepseek-ai/dsh-llm';
import type { InferValue } from '@deepseek-ai/dsh-tools';
import type { RegistrationMediaPage } from '../../shared/domain.generated.js';
export type NativeMediaPage = Omit<RegistrationMediaPage, 'images'> & {
    images: (Omit<RegistrationMediaPage['images'][number], 'path' | 'image'> & {
        image: Omit<RegistrationMediaPage['images'][number]['image'], 'evidence_id'>;
        attachment: ImageAttachmentRef;
    })[];
};
export declare const nativeMediaOutput: {
    schema: {
        readonly type: 'json';
    };
    render(_args: unknown, value: unknown): ContentBlock[];
};
export declare class NativeMediaAttachments {
    private readonly scope;
    constructor(scope: Context, directory: string);
    prepare(page: RegistrationMediaPage, signal: AbortSignal): Promise<InferValue<{
        type: 'json';
    }>>;
}
//# sourceMappingURL=media.d.ts.map